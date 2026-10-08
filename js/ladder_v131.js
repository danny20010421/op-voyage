/* v131 第二階段：海賊天梯（PvP 賽季，每月一季）。
   - 非同步對戰：挑戰其他玩家的「防守陣容」（players/{uid}.team，由電腦操作，三位依序上場、體力與技能次數延續），與好友對戰相同的規則（pvp：雙方套用稀有度體質，不計算覺醒與技能等級）。
   - 積分：每季從 1000 分開始；贏了 +10～40（對手分數越高加越多），輸了 −5～25。每天 5 次免費挑戰，可用寶藏幣再買 5 次（LADDER.extraPrice）。
   - 段位：青銅 1000、白銀 1150、黃金 1300、白金 1450、鑽石 1600、四皇 1800、海賊王 2000。賽季結束後，依「本季最高段位」領一次賽季獎勵（下個月打開天梯時領）。
   - 對手：讀取本季積分前 100 名（players 依 `lp_YYYYMM` 排序），挑積分最接近的 3 位；人數不夠時補上「賞金獵人」電腦對手（等級接近自己的陣容）。
   - 排行榜：本季前 50 名（也加進好友面板的「排行榜」）。
   Firestore：只寫入自己的 players/{uid}（欄位 lp_YYYYMM、lpS、lpTier、team），不需要新集合與規則。
   注意：存檔在玩家瀏覽器，積分目前可被修改；正式營運需要改成伺服器計分（第三階段）。
   存檔：SAVE.data.ladder＝{ season, pts, best, w, l, day, used, bought, opp:[...], claimed:{ season: true } }。 */
const LADDER = {
  start: 1000, daily: 5, extra: 5, extraPrice: 20,
  tiers: [['青銅', 1000, '#c08a5a'], ['白銀', 1150, '#c8d2dc'], ['黃金', 1300, '#ffcf5a'], ['白金', 1450, '#8fe8e0'], ['鑽石', 1600, '#8fb8ff'], ['四皇', 1800, '#ff6a7a'], ['海賊王', 2000, '#ffe9a0']],
  /* 賽季獎勵（依本季最高段位） */
  season: [
    { berry: 10000 }, { berry: 15000, items: { awaken_gem: 20 } }, { tokens: 10, items: { awaken_gem: 30, skill_book: 2 } }, { tokens: 20, items: { awaken_gem: 40, skill_book: 3 } },
    { tokens: 30, items: { awaken_gem: 60, skill_book: 4 } }, { tokens: 50, items: { awaken_gem: 80, skill_book: 5, skin_ticket: 1 } }, { tokens: 80, items: { awaken_gem: 120, skill_book: 8, skin_ticket: 1 } }
  ],
  bg: 'assets/chapters/marineford.webp?v=44'
};
(function () {
  const $ = id => document.getElementById(id), fmt = n => (+n || 0).toLocaleString();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const tw = () => new Date(Date.now() + 8 * 3600e3);
  const seasonKey = (t) => { const d = t ? new Date(t + 8 * 3600e3) : tw(); return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
  const twDay = () => tw().toISOString().slice(0, 10);
  const FIELD = () => 'lp_' + seasonKey();
  const tierIx = p => { let i = 0; LADDER.tiers.forEach((t, k) => { if (p >= t[1]) i = k; }); return i; };
  const tierOf = p => LADDER.tiers[tierIx(p)];
  const avatarOf = t => { const S = t.skin && typeof SKINS !== 'undefined' && SKINS[t.skin]; return S && S.avatar ? S.avatar : (CHARACTERS[t.id] ? CHARACTERS[t.id].avatar : ''); };
  const C = () => (typeof CLOUD !== 'undefined' ? CLOUD : null), logged = () => !!(C() && C().ready && C().ready());

  function st() {
    const d = SAVE.data, k = seasonKey();
    if (!d.ladder) d.ladder = { season: k, pts: LADDER.start, best: LADDER.start, w: 0, l: 0, day: '', used: 0, bought: 0, opp: [], claimed: {} };
    const L = d.ladder; L.claimed = L.claimed || {};
    if (L.season !== k) { L.prev = { season: L.season, best: L.best, w: L.w, l: L.l }; Object.assign(L, { season: k, pts: LADDER.start, best: LADDER.start, w: 0, l: 0, opp: [] }); SAVE.save(); }
    if (L.day !== twDay()) { L.day = twDay(); L.used = 0; L.bought = 0; SAVE.save(); }
    return L;
  }
  const triesLeft = () => { const L = st(); return LADDER.daily + L.bought * LADDER.extra - L.used; };
  const prevReward = () => { const L = st(); return L.prev && !L.claimed[L.prev.season] ? { season: L.prev.season, tier: tierIx(L.prev.best) } : null; };
  function claimPrev() { const P = prevReward(); if (!P) return; const L = st(); L.claimed[P.season] = true; SAVE.save(); const list = window.PROG ? PROG.give(LADDER.season[P.tier]) : []; if (window.PROG) PROG.celebrate(`${P.season.slice(4) | 0} 月天梯賽季獎勵`, list, `本季最高段位：${LADDER.tiers[P.tier][0]}`); render(); }

  /* ---------- 雲端 ---------- */
  const myTeam = () => { const d = SAVE.data, sk = (d.skins && d.skins.equip) || {}; return (d.lineup || []).filter(id => CHARACTERS[id]).slice(0, 3).map(id => ({ id, lv: crewLv(id), skin: sk[id] || null })); };
  async function push() { if (!logged()) return; try { const L = st(), u = C().user(), nm = await C().myName().catch(() => null); const doc = { [FIELD()]: L.pts, lpS: L.season, lpTier: tierOf(L.pts)[0], team: myTeam(), uid: u.uid }; if (nm) doc.username = nm;
    await C().fb().db.collection('players').doc(u.uid).set(doc, { merge: true }); } catch (e) { console.warn(e); } }
  let board = null, boardMsg = '';
  async function loadBoard() { if (!logged()) return; try { await C().sdk(); const q = await C().fb().db.collection('players').orderBy(FIELD(), 'desc').limit(100).get();
    board = q.docs.map(d => ({ uid: d.id, ...d.data() })).filter(x => typeof x[FIELD()] === 'number'); boardMsg = ''; } catch (e) { board = []; boardMsg = '排行榜讀取失敗：' + ((C().errText && C().errText(e)) || e.message); } }
  /* 電腦對手：賞金獵人（等級接近自己的隨機陣容） */
  const BOT_NAMES = ['賞金獵人・黑爪', '賞金獵人・紅砂', '賞金獵人・鐵鎖', '賞金獵人・霧刃', '賞金獵人・雷角', '賞金獵人・海狼'];
  function bot(k, pts) { const lv = Math.max(10, Math.round(myTeam().reduce((a, t) => a + t.lv, 0) / Math.max(1, myTeam().length)) + Math.round((Math.random() - .5) * 8));
    const pool = CHARACTER_ORDER.filter(id => { const r = CHAR_RARITY[id]; return ['SR', 'SSR', 'UR'].includes(r) && !CHARACTERS[id].mystery && !(CHAR_OBTAIN[id] || {}).npcOnly; });
    const team = []; while (team.length < 3 && pool.length) { const id = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; team.push({ id, lv: Math.min(MAX_LV, lv), skin: null }); }
    return { uid: 'bot' + k + Date.now(), bot: true, username: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)], pts: Math.max(800, pts + Math.round((Math.random() - .5) * 120)), team }; }
  async function pickOpp() { const L = st(); let list = [];
    if (logged()) { await loadBoard(); const me = C().user().uid; list = (board || []).filter(x => x.uid !== me && Array.isArray(x.team) && x.team.length && x.team.every(t => CHARACTERS[t.id])).map(x => ({ uid: x.uid, username: x.username || x.name || '海賊', pts: x[FIELD()], team: x.team.slice(0, 3), tier: x.lpTier })); }
    list.sort((a, b) => Math.abs(a.pts - L.pts) - Math.abs(b.pts - L.pts)); const out = list.slice(0, 3); let k = 0; while (out.length < 3) out.push(bot(k++, L.pts));
    L.opp = out; SAVE.save(); render(); }

  /* ---------- 對戰 ---------- */
  let RUN = null;
  function begin(i) {
    const L = st(), o = L.opp[i]; if (!o) return; if (triesLeft() <= 0) { toast('今天的挑戰次數用完了', 'warn'); return; }
    const team = myTeam(); if (!team.length) { toast('請先設定出戰陣容', 'warn'); return; }
    if (team.some(t => typeof isTraining === 'function' && isTraining(t.id))) { toast('出戰陣容中有船員正在訓練營', 'warn'); return; }
    L.used++; SAVE.save(); RUN = { o, i: 0, team: team.map(t => ({ id: t.id, lv: t.lv })), rounds: 0 }; close(); fight();
  }
  function fight() { const R = RUN, f = R.o.team[R.i];
    startBattle({ team: R.team, enemyId: f.id, enemyLv: f.lv, enemySkin: f.skin || null, pvp: true, bg: LADDER.bg, chapterId: 'pvp', isBoss: false, revives: 0,
      enemyMod: { title: `${R.o.username} 的船員（${R.i + 1}/${R.o.team.length}）` }, onEnd: r => end(r), onLeave: () => open() });
    log(`海賊天梯：挑戰 ${R.o.username}（${R.o.pts} 分）第 ${R.i + 1}/${R.o.team.length} 位`); }
  function delta(win, me, op) { return win ? Math.max(10, Math.min(40, Math.round(25 + (op - me) / 20))) : -Math.max(5, Math.min(25, Math.round(15 + (me - op) / 25))); }
  function end(r) {
    const R = RUN; if (!R) return {}; R.rounds += r.rounds || 0;
    if (r.win && R.i < R.o.team.length - 1) { R.team = teamSnapshot().map((t, k) => ({ ...t, lv: R.team[k].lv })); R.i++; const nx = R.o.team[R.i];
      return { message: `擊敗第 ${R.i} 位！體力與技能次數會延續。<br>下一位：<b>${CHARACTERS[nx.id].name}</b>（LV ${nx.lv}）`, next: { label: '迎戰下一位', fn: () => fight() } }; }
    RUN = null; const L = st(), win = !!r.win, d = delta(win, L.pts, R.o.pts), t0 = tierIx(L.pts);
    L.pts = Math.max(0, L.pts + d); L.best = Math.max(L.best, L.pts); if (win) L.w++; else L.l++; L.opp = L.opp.filter(x => x.uid !== R.o.uid); SAVE.save();
    if (typeof track === 'function') track('pvp'); if (window.passAddXp) passAddXp(win ? 20 : 10, '天梯');
    const t1 = tierIx(L.pts), up = t1 > t0 ? `<br>🎉 晉升到 <b>${LADDER.tiers[t1][0]}</b>！` : t1 < t0 ? `<br>降到 ${LADDER.tiers[t1][0]}` : '';
    push();
    return { message: `${win ? `🏆 擊敗了 ${esc(R.o.username)}！` : `敗給了 ${esc(R.o.username)}……`}<br>天梯積分 ${d > 0 ? '+' : ''}${d}（目前 ${L.pts} 分・${tierOf(L.pts)[0]}）${up}<br><small>通行證經驗 +${win ? 20 : 10}</small>`, next: { label: '返回天梯', fn: () => open() } };
  }

  /* ---------- 畫面 ---------- */
  let el = null;
  function render() {
    if (!el) return; const L = st(), T = tierOf(L.pts), ti = tierIx(L.pts), nx = LADDER.tiers[ti + 1], P = prevReward(), left = triesLeft();
    const days = (() => { const d = tw(); return Math.ceil((Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - d.getTime()) / 864e5); })();
    const rank = board ? board.findIndex(x => logged() && x.uid === C().user().uid) : -1;
    el.innerHTML = `<div class="ld-bg" aria-hidden="true"></div>
      <header class="ld-top"><button class="icon-btn" data-x aria-label="返回">‹</button><div><h2>海賊天梯</h2><small>${L.season.slice(0, 4)} 年 ${+L.season.slice(4)} 月賽季・剩 ${days} 天</small></div></header>
      <div class="ld-body">
        ${P ? `<section class="ld-card ld-prev"><div><b>上季（${+P.season.slice(4)} 月）賽季獎勵</b><small>最高段位：${LADDER.tiers[P.tier][0]}　${esc(window.PROG ? window.PROG.rewText(LADDER.season[P.tier]) : '')}</small></div><button class="btn-gold" data-prev>領取</button></section>` : ''}
        <section class="ld-card ld-me" style="--tc:${T[2]}">
          <div class="ld-badge"><span>${T[0]}</span></div>
          <div class="ld-mi"><b class="ld-pts">${L.pts}<small> 分</small></b><span class="ld-tb"><i style="width:${nx ? Math.min(100, (L.pts - T[1]) / (nx[1] - T[1]) * 100) : 100}%"></i></span><small>${nx ? `距離 ${nx[0]} 還差 ${nx[1] - L.pts} 分` : '已經是最高段位！'}・本季最高 ${L.best}・${L.w} 勝 ${L.l} 敗${rank >= 0 ? `・第 ${rank + 1} 名` : ''}</small></div>
          <div class="ld-tries"><b>${Math.max(0, left)}</b><small>今日剩餘</small>${left <= 0 && L.bought < 1 ? `<button class="btn-ghost sm" data-buy>再買 ${LADDER.extra} 次<small>${LADDER.extraPrice} 寶藏幣</small></button>` : ''}</div>
        </section>
        ${logged() ? '' : `<section class="ld-card ld-login"><p>登入帳號後，就能和其他玩家的防守陣容對戰、登上排行榜。沒有登入時只會遇到電腦對手「賞金獵人」。</p><button class="btn-gold sm" data-login>登入帳號</button></section>`}
        <section class="ld-card"><header class="ld-h"><h3>選擇對手</h3><button class="btn-ghost sm" data-refresh>換一批</button></header>
          <ol class="ld-opps">${(L.opp || []).map((o, i) => { const ot = tierOf(o.pts); return `<li><div class="ld-oa"><img src="${avatarOf(o.team[0])}" alt=""></div><div class="ld-oi"><b><span class="ld-on">${esc(o.username)}</span>${o.bot ? '<em>電腦</em>' : ''}</b><small style="--tc:${ot[2]}"><i>${ot[0]}</i>${o.pts} 分</small><span class="ld-ot">${o.team.map(t => `<img src="${avatarOf(t)}" alt="${CHARACTERS[t.id] ? CHARACTERS[t.id].name : ''}" title="${CHARACTERS[t.id] ? CHARACTERS[t.id].name : ''}・LV ${t.lv}">`).join('')}</span></div><button class="btn-gold sm" data-fight="${i}" ${left > 0 ? '' : 'disabled'}><span>挑戰</span><small>勝 +${delta(true, L.pts, o.pts)}／敗 ${delta(false, L.pts, o.pts)}</small></button></li>`; }).join('') || '<li class="ld-empty">讀取對手中……</li>'}</ol>
          <p class="ld-note">對手由電腦操作；PvP 雙方都套用稀有度體質，不計算覺醒與技能等級。出戰的是目前陣容的前 3 位。</p></section>
        <section class="ld-card"><h3>段位與賽季獎勵</h3><ol class="ld-tiers">${LADDER.tiers.map((t, k) => `<li class="${k === ti ? 'on' : ''}" style="--tc:${t[2]}"><span class="ld-tn">${t[0]}</span><small>${t[1]} 分</small><em>${esc(window.PROG ? window.PROG.rewText(LADDER.season[k]) : '')}</em></li>`).join('')}</ol>
          <p class="ld-note">賽季在每月月底結束，依本季最高段位發放；下個月打開天梯時領取。</p></section>
        <section class="ld-card"><h3>本季排行榜</h3>${!logged() ? '<p class="ld-note">登入後才看得到全球排行榜。</p>' : board == null ? '<p class="ld-note">讀取中……</p>' : board.length ? `<ol class="ld-rank">${board.slice(0, 50).map((x, k) => { const t = tierOf(x[FIELD()]); return `<li class="${logged() && x.uid === C().user().uid ? 'me' : ''}"><span class="ld-rn">${k + 1}</span><img src="${avatarOf((x.team || [])[0] || { id: 'luffy0' })}" alt=""><b>${esc(x.username || x.name || '海賊')}</b><small style="--tc:${t[2]}">${t[0]}</small><em>${x[FIELD()]}</em></li>`; }).join('')}</ol>` : `<p class="ld-note">${boardMsg || '本季還沒有人上榜，打一場就能登上排行榜！'}</p>`}</section>
      </div>`;
    if (window.fixIcons) fixIcons(el);
    el.querySelector('[data-x]').onclick = () => { close(); if (typeof openModes === 'function') openModes(); };
    el.querySelectorAll('[data-fight]').forEach(b => b.onclick = () => begin(+b.dataset.fight));
    const rf = el.querySelector('[data-refresh]'); if (rf) rf.onclick = () => { st().opp = []; render(); pickOpp(); };
    const by = el.querySelector('[data-buy]'); if (by) by.onclick = () => { const L = st(); if ((SAVE.data.tokens || 0) < LADDER.extraPrice) { toast('寶藏幣不足', 'warn'); return; } SAVE.data.tokens -= LADDER.extraPrice; L.bought++; SAVE.save(); if (typeof coins === 'function') coins(); render(); };
    const pv = el.querySelector('[data-prev]'); if (pv) pv.onclick = claimPrev;
    const lg = el.querySelector('[data-login]'); if (lg) lg.onclick = () => { close(); if (C() && C().open) C().open(); };
  }
  function open() {
    if (typeof currentScreen !== 'undefined' && currentScreen === 'battleScreen' && typeof openModes === 'function') openModes();
    const sh = $('lbModes'); if (sh) { sh.classList.remove('show'); sh.setAttribute('aria-hidden', 'true'); }
    if (!el) { el = document.createElement('div'); el.className = 'ld-wrap'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '海賊天梯'); }
    st(); render(); document.body.appendChild(el);
    if (!(st().opp || []).length) pickOpp(); else if (logged()) loadBoard().then(render);
    if (logged()) push();
  }
  function close() { if (el) el.remove(); }
  window.openLadder = open;
  window.ladderField = FIELD;
  window.ladderTier = p => tierOf(p)[0];
  window.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#lbModes .mode-grid');
    if (grid && !grid.querySelector('[data-mode=ladder]')) { const b = document.createElement('button'); b.className = 'mode-card m-ladder'; b.dataset.mode = 'ladder';
      b.innerHTML = '<span class="mc-art" aria-hidden="true"></span><span class="mc-body"><b>海賊天梯</b><small>每月賽季：挑戰其他玩家的防守陣容，爬上海賊王段位領賽季獎勵</small><em id="mdLadder"></em></span>'; grid.appendChild(b);
      b.addEventListener('click', e => { e.stopImmediatePropagation(); open(); }, true); }
    const upd = () => { const e = $('mdLadder'); if (e && SAVE.data && SAVE.data.roster) { const L = st(); e.textContent = `${tierOf(L.pts)[0]}・${L.pts} 分`; } };
    setTimeout(upd, 1500); const om = window.openModes; if (om) window.openModes = function () { const r = om.apply(this, arguments); setTimeout(upd, 200); return r; };
  });
})();
