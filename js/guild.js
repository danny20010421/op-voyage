/* 船團（公會）：和好友組隊、一起挑戰每週的船團 BOSS、在留言板聊天。
   Firestore：guilds/{gid}：name、nameKey、leader、leaderName、members（uid 陣列，最多 20 人）、names（uid → 帳號名稱）、notice、createdAt、
             week、boss（id、hp、maxHp、dead、killer）、dmg（uid → 本週傷害）、chat（最近 40 則留言）。
   船團 BOSS：每週一 05:00 換一位；共用一條血量（依人數調整），每人每天可以挑戰 3 次，每次對 BOSS 造成的傷害都會扣在共用血量上。
   BOSS 被擊敗後，本週每位成員都能領一次獎勵；每次挑戰也有少量貝里。 */
const GUILD_CFG = {
  maxMembers: 20,
  dailyTries: 3,
  bossRotation: ['kaido', 'bigmom', 'blackbeard', 'akainu', 'doflamingo', 'loki', 'whitebeard', 'shanks'],
  poolBase: 300000, poolPerMember: 120000,   /* 共用血量 = 基本 + 每位成員 */
  fightHp: 60000,                           /* 每場戰鬥中 BOSS 的體力上限 */
  tryBerry: 3000,                           /* 每次挑戰的貝里 */
  killReward: { tokens: 15, berry: 20000 }, /* 擊敗後每位成員可領 */
  bg: 'assets/ui/emperor_bg.webp?v=63'
};
const GUILD = (function () {
  const G = GUILD_CFG, F = () => CLOUD.fb(), U = () => CLOUD.user();
  const esc3 = s => (typeof esc === 'function' ? esc(s) : String(s));
  const twWeek = () => { const d = new Date(Date.now() + 3 * 3600e3), day = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString().slice(0, 10); };
  const twDay = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
  const weekNo = w => Math.floor(Date.parse(w) / (7 * 864e5));
  const bossOf = w => G.bossRotation[((weekNo(w) % G.bossRotation.length) + G.bossRotation.length) % G.bossRotation.length];
  const poolOf = n => G.poolBase + G.poolPerMember * Math.max(1, n);
  const fmtD = t => { const d = new Date(t || 0); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  let panel = null, gid = null, g = null, unsub = null, sub = 'boss', list = null, msg = '', myName = '', RUN = null;
  const me = () => (SAVE.data.gld = SAVE.data.gld || {});
  const ref = id => F().db.collection('guilds').doc(id || gid);
  const tries = () => { const M = me(); if (M.day !== twDay()) { M.day = twDay(); M.tries = 0; } return G.dailyTries - (M.tries || 0); };

  /* ---------- 讀取與每週重置 ---------- */
  async function findMine() {
    const q = await F().db.collection('guilds').where('members', 'array-contains', U().uid).limit(1).get();
    return q.empty ? null : q.docs[0].id;
  }
  function watch(id) { if (unsub) unsub(); gid = id; g = null; if (!id) { render(); return; } unsub = ref(id).onSnapshot(s => { g = s.exists ? s.data() : null; if (!g || !g.members.includes(U().uid)) { gid = null; g = null; me().id = null; SAVE.save(); } else { me().id = gid; me().name = g.name; weekly(); } render(); }, e => { msg = CLOUD.errText(e); render(); }); }
  async function weekly() { const w = twWeek(); if (!g || g.week === w) return; try { await F().db.runTransaction(async t => { const d = await t.get(ref()); const x = d.data(); if (x.week === w) return; const id = bossOf(w), hp = poolOf(x.members.length); t.update(ref(), { week: w, boss: { id, hp, maxHp: hp, dead: false, killer: '' }, dmg: {} }); }); } catch (e) { } }

  /* ---------- 建立、加入、離開 ---------- */
  async function create(name, notice) {
    name = String(name || '').trim(); if (!/^.{2,12}$/.test(name)) { msg = '船團名稱需要 2～12 個字'; render(); return; }
    try { const w = twWeek(), uid = U().uid, hp = poolOf(1);
      const d = await F().db.collection('guilds').add({ name, nameKey: name.toLowerCase(), leader: uid, leaderName: myName, members: [uid], names: { [uid]: myName }, notice: String(notice || '').slice(0, 80), createdAt: Date.now(), week: w, boss: { id: bossOf(w), hp, maxHp: hp, dead: false, killer: '' }, dmg: {}, chat: [] });
      toast(`船團「${name}」成立！`, 'gold'); watch(d.id);
    } catch (e) { msg = CLOUD.errText(e); render(); }
  }
  async function join(id) {
    try { await F().db.runTransaction(async t => { const d = await t.get(ref(id)); const x = d.data(); if (!x) throw new Error('找不到這個船團'); if (x.members.includes(U().uid)) return; if (x.members.length >= G.maxMembers) throw new Error('這個船團已經滿員了'); t.update(ref(id), { members: [...x.members, U().uid], names: { ...x.names, [U().uid]: myName } }); });
      toast('已加入船團！', 'gold'); watch(id); post('（加入了船團）', true);
    } catch (e) { msg = CLOUD.errText(e); render(); }
  }
  async function leave() {
    const go = async () => { try { const uid = U().uid; await post('（離開了船團）', true); await F().db.runTransaction(async t => { const d = await t.get(ref()); const x = d.data(); const ms = x.members.filter(m => m !== uid); if (!ms.length) { t.delete(ref()); return; } const names = { ...x.names }; delete names[uid]; const up = { members: ms, names }; if (x.leader === uid) { up.leader = ms[0]; up.leaderName = names[ms[0]] || ''; } t.update(ref(), up); }); if (unsub) unsub(); unsub = null; gid = null; g = null; me().id = null; SAVE.save(); list = null; render(); browse(); } catch (e) { msg = CLOUD.errText(e); render(); } };
    if (typeof confirmBox === 'function') confirmBox('離開船團？', g && g.leader === U().uid && g.members.length > 1 ? '你是團長，離開後團長會交給下一位成員。' : '離開後本週的傷害紀錄會留在船團裡。', '離開', go); else go();
  }
  async function kick(uid) { if (!g || g.leader !== U().uid || uid === U().uid) return; confirmBox('請離船團？', `把 ${g.names[uid] || '這位成員'} 請離船團。`, '確定', async () => { try { const names = { ...g.names }; delete names[uid]; await ref().update({ members: g.members.filter(m => m !== uid), names }); } catch (e) { msg = CLOUD.errText(e); render(); } }); }
  async function saveNotice(v) { try { await ref().update({ notice: String(v || '').slice(0, 80) }); toast('公告已更新', 'gold'); } catch (e) { msg = CLOUD.errText(e); render(); } }
  async function browse(q) {
    list = null; render();
    try { const db = F().db; let r; if (q && q.trim()) r = await db.collection('guilds').where('nameKey', '==', q.trim().toLowerCase()).limit(10).get(); else r = await db.collection('guilds').orderBy('createdAt', 'desc').limit(20).get();
      list = r.docs.map(d => ({ id: d.id, ...d.data() })); } catch (e) { list = []; msg = CLOUD.errText(e); }
    render();
  }

  /* ---------- 留言板 ---------- */
  async function post(text, sys) { text = String(text || '').trim().slice(0, 100); if (!text || !gid) return; try { await F().db.runTransaction(async t => { const d = await t.get(ref()); const x = d.data(); if (!x) return; const chat = [...(x.chat || []), { from: U().uid, name: myName, text, at: Date.now(), sys: !!sys, vip: typeof vipLevel === 'function' ? vipLevel() : 0 }].slice(-40); t.update(ref(), { chat }); }); } catch (e) { msg = CLOUD.errText(e); render(); } }

  /* ---------- 船團 BOSS ---------- */
  function fight() {
    if (!g || !g.boss || g.boss.dead) return; if (tries() <= 0) { toast(`今天的 ${G.dailyTries} 次挑戰已用完，明天再來！`); return; }
    if (SAVE.data.lineup.some(id => typeof isTraining === 'function' && isTraining(id))) { toast('出戰陣容中有船員正在訓練營'); return; }
    const M = me(); M.tries = (M.tries || 0) + 1; SAVE.save(); const B = CHARACTERS[g.boss.id], hp = Math.min(G.fightHp, g.boss.hp);
    RUN = { gid, hp, boss: g.boss.id }; close();
    startBattle({ team: SAVE.data.lineup.map(id => ({ id, lv: crewLv(id) })), enemyId: g.boss.id, enemyLv: MAX_LV, bg: G.bg, chapterId: 'emperor', isBoss: true, revives: 0,
      enemyMod: { hpFixed: hp, allUp: 1, infPP: true, ultCap: 2, name: `${B.name}（船團 BOSS）`, title: `${g.name}・本週 BOSS` }, onEnd: r => end(r), onLeave: () => { openModes(); open('boss'); } });
    log(`船團 BOSS：對 ${B.name} 造成的傷害會扣在全船團共用的血量上`);
  }
  function end(r) {
    const R = RUN; RUN = null; if (!R) return {}; const left = battle && battle.enemy ? Math.max(0, battle.enemy.hp) : R.hp, dmg = Math.max(0, Math.round(R.hp - (r.win ? 0 : left)));
    addBerry(G.tryBerry); SAVE.save(); coins();
    if (dmg > 0) F().db.runTransaction(async t => { const d = await t.get(ref(R.gid)); const x = d.data(); if (!x || !x.boss || x.boss.dead) return; const hp = Math.max(0, x.boss.hp - dmg), dead = hp <= 0; const dm = { ...(x.dmg || {}) }; dm[U().uid] = (dm[U().uid] || 0) + dmg;
      t.update(ref(R.gid), { 'boss.hp': hp, 'boss.dead': dead, 'boss.killer': dead ? myName : (x.boss.killer || ''), dmg: dm }); }).then(() => post(`對 BOSS 造成 ${dmg.toLocaleString()} 點傷害！`, true)).catch(() => { });
    return { message: `對船團 BOSS 造成 <b>${dmg.toLocaleString()}</b> 點傷害！<br>貝里 +${G.tryBerry.toLocaleString()}・今天還能挑戰 ${tries()} 次`, next: { label: '返回船團', fn: () => { openModes(); open('boss'); } } };
  }
  function claim() { const M = me(); if (!g || !g.boss || !g.boss.dead || M.claimed === gid + g.week) return; M.claimed = gid + g.week; const K = G.killReward; addTokens(K.tokens, '船團 BOSS'); addBerry(K.berry); SAVE.save(); coins(); toast(`船團 BOSS 擊破獎勵：寶藏幣 ×${K.tokens}、貝里 ${K.berry.toLocaleString()}`, 'gold'); render(); }

  /* ---------- 介面 ---------- */
  function body() {
    if (!U()) return `<div class="sc-empty"><p>船團需要先登入帳號並設定帳號名稱。</p><button class="btn-gold big" data-a="login">登入／註冊</button></div>`;
    if (!myName) return `<div class="sc-empty"><p>請先打開「好友」設定帳號名稱，才能建立或加入船團。</p><button class="btn-gold" data-a="social">前往好友</button></div>`;
    if (!gid) return `<div class="gd-none"><h4 class="sc-h">建立船團</h4><div class="cl-form"><label>船團名稱<small>2～12 個字</small><input id="gdName" maxlength="12"></label><label>公告<small>最多 80 字</small><input id="gdNotice" maxlength="80" placeholder="例如：每天一起打 BOSS！"></label><button class="btn-gold" data-a="create">建立船團</button></div>
      <h4 class="sc-h">加入船團</h4><div class="sc-search"><input id="gdQ" placeholder="輸入船團名稱搜尋"><button class="btn-ghost" data-a="search">搜尋</button></div>
      ${list === null ? '<p class="sc-hint">讀取中…</p>' : list.length ? `<ul class="sc-list">${list.map(x => `<li class="sc-p"><span class="sc-who"><b>⚓ ${esc3(x.name)}</b><small>團長 ${esc3(x.leaderName || '')}・${x.members.length}/${G.maxMembers} 人</small>${x.notice ? `<small class="sc-bio">「${esc3(x.notice)}」</small>` : ''}</span><span class="sc-act"><button class="btn-gold sm" data-join="${x.id}" ${x.members.length >= G.maxMembers ? 'disabled' : ''}>加入</button></span></li>`).join('')}</ul>` : '<p class="sc-hint">找不到船團。自己建立一個，邀請好友加入吧！</p>'}</div>`;
    if (!g) return '<p class="sc-hint">讀取中…</p>';
    /* v116 版面：左側船團資訊、右側公告＋內容，內容分頁在右緣（手機在上方） */
    const B = g.boss || {}, BC = CHARACTERS[B.id] || CHARACTERS.kaido, lead = g.leader === U().uid, M = me(), dmg = g.dmg || {};
    const tot = Object.values(dmg).reduce((a, b) => a + b, 0), mine = dmg[U().uid] || 0, pct = B.maxHp ? Math.max(0, Math.min(100, B.hp / B.maxHp * 100)) : 0;
    const no = String(gid || '').replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase() || '—', made = g.createdAt ? new Date(g.createdAt) : null;
    const IC = p => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
    const rows = [[IC('<path d="M4 7h16M4 12h16M4 17h10"/>'), '船團編號', no], [IC('<circle cx="9" cy="8" r="3"/><path d="M3 20c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5"/><path d="M16 4.5a3 3 0 0 1 0 6M18 14.8c1.8.8 2.8 2.6 3 5.2"/>'), '船團人數', `${g.members.length}/${G.maxMembers}`],
      [IC('<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>'), '團長', esc3(g.leaderName || '')], [IC('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>'), '建立日期', made ? `${made.getFullYear()}/${made.getMonth() + 1}/${made.getDate()}` : '—'],
      [IC('<path d="M5 19L19 5M14 5h5v5"/><path d="M5 9V5h4"/>'), '本週總傷害', tot.toLocaleString()], [IC('<path d="M12 3l2.5 5.5L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.5-.8z"/>'), '我的本週傷害', mine.toLocaleString()]];
    const crest = `<svg class="gl-crest" viewBox="0 0 64 72" aria-hidden="true"><defs><linearGradient id="glc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#b8862c"/></linearGradient><linearGradient id="glc2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3a6a"/><stop offset="1" stop-color="#0a1630"/></linearGradient></defs><path d="M32 3l26 9v20c0 18-11 30-26 37C17 62 6 50 6 32V12z" fill="url(#glc1)"/><path d="M32 9l20 7v16c0 14.5-8.5 24.5-20 30.5C20.5 56.5 12 46.5 12 32V16z" fill="url(#glc2)"/><g fill="none" stroke="#ffe7a8" stroke-width="3" stroke-linecap="round"><circle cx="32" cy="22" r="4"/><path d="M32 26v24M24 32h16M20 42c2 6 7 9 12 9s10-3 12-9"/></g></svg>`;
    const info = `<section class="gl-info"><div class="gl-id">${crest}<div class="gl-nm"><b>${esc3(g.name)}</b><small>${g.notice ? '「' + esc3(g.notice) + '」' : '還沒有船團口號'}</small></div></div>
      <h4 class="gl-h">船團資訊</h4><dl class="gl-rows">${rows.map(([ic, k, v]) => `<div><dt><span class="gl-ri">${ic}</span>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <div class="gl-ibtn"><button class="btn-ghost" data-a="invite">邀請好友</button><button class="btn-ghost" data-sub="set">${lead ? '船團管理' : '船團設定'}</button></div></section>`;
    const TABS = [['boss', '設施'], ['mem', '成員'], ['chat', '留言'], ['set', '設定']];
    const tabs = `<nav class="gl-tabs" role="tablist">${TABS.map(([k, n]) => `<button role="tab" aria-selected="${sub === k}" class="${sub === k ? 'on' : ''} ${k === 'boss' && (B.dead ? M.claimed !== gid + g.week : tries() > 0) ? 'dot' : ''}" data-sub="${k}"><span>${n}</span></button>`).join('')}</nav>`;
    const notice = `<div class="gl-notice"><div><h4>船團公告</h4><p>${g.notice ? esc3(g.notice) : '無'}</p></div>${lead ? `<button class="gl-pen" data-sub="set" aria-label="編輯公告">${IC('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>')}</button>` : ''}</div>`;
    let main = '';
    if (sub === 'boss') { const rank = Object.entries(dmg).sort((a, b) => b[1] - a[1]), claimed = M.claimed === gid + g.week;
      main = `<div class="gl-fac">
        <article class="gl-card boss ${B.dead ? 'dead' : ''}"><div class="gl-cimg"><img src="${BC.image}" alt="${esc3(BC.name)}"><span class="gl-ctag">本週 BOSS・每週一更換</span>
          <div class="gl-hp"><div class="gl-hpb"><i style="width:${pct}%"></i></div><small>${(B.hp || 0).toLocaleString()} / ${(B.maxHp || 0).toLocaleString()}</small></div></div>
          <footer><div><b>${esc3(BC.name)}</b><small>${B.dead ? `已被擊敗・最後一擊 ${esc3(B.killer || '')}` : `今天剩 ${tries()} / ${G.dailyTries} 次挑戰`}</small></div>
          ${B.dead ? `<button class="btn-gold" data-a="claim" ${claimed ? 'disabled' : ''}>${claimed ? '已領取' : '領取獎勵'}</button>` : `<button class="btn-gold" data-a="fight" ${tries() > 0 ? '' : 'disabled'}>挑戰</button>`}</footer></article>
        <article class="gl-card"><div class="gl-cbody"><ol class="gl-rank">${rank.length ? rank.slice(0, 6).map(([u, d], i) => `<li class="${u === U().uid ? 'me' : ''}"><b class="n${i < 3 ? i + 1 : ''}">${i + 1}</b><span>${esc3(g.names[u] || '前成員')}</span><em>${d.toLocaleString()}</em></li>`).join('') : '<li class="none">本週還沒有人挑戰</li>'}</ol></div>
          <footer><div><b>傷害排行</b><small>本週・前 6 名</small></div></footer></article>
        <article class="gl-card"><div class="gl-cbody gl-rew"><div><i class="coin-ico"></i><b>×${G.killReward.tokens}</b><small>寶藏幣</small></div><div><i class="berry-ico">B</i><b>${(G.killReward.berry / 1e4).toLocaleString()}萬</b><small>貝里</small></div><p>每次挑戰另得貝里 ${G.tryBerry.toLocaleString()}</p></div>
          <footer><div><b>擊破獎勵</b><small>BOSS 被擊敗後每位成員可領</small></div></footer></article></div>
        <p class="gl-tip">每場戰鬥 BOSS 最多 ${G.fightHp.toLocaleString()} 體力、開場全能力 +1、技能次數無限（奧義最多 2 次）。打出的傷害會扣在全船團共用的血量上；出戰的是你的一般出戰陣容。</p>`; }
    else if (sub === 'mem') main = `<ul class="gl-mem">${g.members.map(u => `<li class="${u === U().uid ? 'me' : ''}"><span class="gl-mav">${u === g.leader ? IC('<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>') : esc3((g.names[u] || '?').slice(0, 1))}</span><div><b>${esc3(g.names[u] || '')}</b><small>${u === g.leader ? '團長' : '船員'}・本週傷害 ${(dmg[u] || 0).toLocaleString()}</small></div>${lead && u !== U().uid ? `<button class="btn-ghost sm" data-kick="${u}">請離</button>` : ''}</li>`).join('')}</ul><p class="gl-tip">邀請好友：請對方在「船團」搜尋船團名稱「${esc3(g.name)}」加入。</p>`;
    else if (sub === 'chat') main = `<ul class="gd-chat gl-chat" id="gdChat">${(g.chat || []).map(c => `<li class="${c.sys ? 'sys' : ''} ${c.from === U().uid ? 'mine' : ''} ${!c.sys && c.vip >= 2 ? 'vipb v' + c.vip : ''}"><b>${esc3(c.name || '')}${!c.sys && window.vipTag ? vipTag(c.vip) : ''}</b><p>${esc3(c.text)}</p><small>${fmtD(c.at)}</small></li>`).join('') || '<li class="sys"><p>還沒有留言，打聲招呼吧！</p></li>'}</ul><div class="gl-send"><input id="gdMsg" maxlength="100" placeholder="說點什麼…（最多 100 字）" aria-label="留言"><button class="btn-gold" data-a="post">送出</button></div>`;
    else main = `<div class="gl-set">${lead ? `<label><span>船團公告</span><div class="gl-send"><input id="gdN2" maxlength="80" value="${esc3(g.notice || '')}" aria-label="船團公告"><button class="btn-gold" data-a="notice">儲存</button></div></label>` : '<p class="gl-tip">只有團長可以修改公告與請離成員。</p>'}<button class="btn-ghost gl-leave" data-a="leave">離開船團</button></div>`;
    return `<div class="gl">${info}<section class="gl-main">${notice}<div class="gl-panel sub-${sub}"><div class="gl-pin">${main}</div>${tabs}</div></section></div>`;
  }
  function render() {
    if (!panel || !panel.isConnected) return;
    panel.innerHTML = `<div class="gl-shell ${gid && g ? 'in' : 'out'}"><header class="gl-head"><h3>船團</h3><button class="gl-x" data-x aria-label="關閉">×</button></header><div class="gl-body sc-body">${body()}</div>${msg ? `<p class="cl-status">${esc3(msg)}</p>` : ''}</div>`;
    const q = s => panel.querySelector(s), on = (s, f) => panel.querySelectorAll(s).forEach(b => b.onclick = () => f(b));
    q('[data-x]').onclick = close; on('[data-sub]', b => { sub = b.dataset.sub; msg = ''; render(); });
    on('[data-a=login]', () => { close(); openCloud(); }); on('[data-a=social]', () => { close(); openSocial('me'); });
    on('[data-a=create]', () => create((q('#gdName') || {}).value, (q('#gdNotice') || {}).value)); on('[data-a=search]', () => browse((q('#gdQ') || {}).value)); on('[data-join]', b => join(b.dataset.join));
    on('[data-a=fight]', fight); on('[data-a=claim]', claim); on('[data-kick]', b => kick(b.dataset.kick)); on('[data-a=leave]', leave); on('[data-a=notice]', () => saveNotice((q('#gdN2') || {}).value));
    const send = () => { const i = q('#gdMsg'); if (i && i.value.trim()) { post(i.value); i.value = ''; } }; on('[data-a=post]', send); on('[data-a=invite]', () => { const t = `一起加入我的船團「${g ? g.name : ''}」！在遊戲的「船團」搜尋這個名稱就能加入。`; try { navigator.clipboard.writeText(t); toast('已複製邀請訊息'); } catch (e) { toast(t); } }); const mi = q('#gdMsg'); if (mi) mi.onkeydown = e => { if (e.key === 'Enter') send(); };
    const ch = q('#gdChat'); if (ch) ch.scrollTop = ch.scrollHeight;
  }
  async function open(s) {
    if (s) sub = s; if (!panel) { panel = document.createElement('div'); panel.className = 'gl-wrap'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '船團'); panel.onclick = e => { if (e.target === panel) close(); }; }
    document.body.appendChild(panel); msg = ''; render();
    try { await CLOUD.sdk(); } catch (e) { msg = CLOUD.errText(e); render(); return; }
    if (!U()) { render(); return; }
    myName = (await CLOUD.myName()) || ''; if (!myName) { render(); return; }
    if (!gid) { try { const id = me().id || await findMine(); if (id) watch(id); else browse(); } catch (e) { msg = CLOUD.errText(e); render(); } } else render();
  }
  function close() { if (panel) panel.remove(); }
  window.openGuild = open;
  return { open, info: () => (g ? { id: gid, name: g.name } : null) };
})();
