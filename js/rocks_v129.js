/* v129 洛克斯挑戰：集齊皇帝領海全部 6 位四皇（白鬍子、BIG MOM、凱多、紅髮、黑鬍子、尼卡魯夫）後開放。
   第一關：六皇連戰 → 第二關：羅傑、卡普 → 第三關：洛克斯的兩個分身（強攻、強守）→ 第四關：洛克斯真身。通過第四關，洛克斯直接加入船隊。
   每一關都是連戰：體力與技能次數延續，中途撤退或戰敗要從這一關的第一場重來（與皇帝領海相同）。出戰陣容沿用皇帝領海陣容（最多 5 位）。
   入口：皇帝領海展示頁（emperor_hall.js）下方的「洛克斯挑戰」橫條；存檔 SAVE.data.rocks = { phase, clears }。 */
const ROCKS_TRIAL = {
  joinLv: 50,
  bg: 'assets/ui/emperor_bg.webp?v=63',
  phaseReward: { tokens: 10, berry: 10000 },  /* 首次通過第一～三關 */
  firstReward: { tokens: 50, berry: 50000 },  /* 首次擊敗真身 */
  replayReward: { berry: 10000 },
  phases: [
    { name: '第一關・六皇連戰', desc: '連續擊敗 6 位四皇（體力 70%，技能次數有限）。', stages: () => ['whitebeard', 'bigmom', 'kaido', 'shanks', 'blackbeard', 'luffy_nika'].map(id => ({ id, lv: 92, mod: { hp: .7, dmg: .85, title: '洛克斯的試煉・四皇' } })) },
    { name: '第二關・羅傑與卡普', desc: '神之谷的兩位傳說：海賊王哥爾·D·羅傑、海軍英雄卡普。', stages: () => [
      { id: 'roger', lv: 95, mod: { hp: 1.1, title: '神之谷・海賊王' } },
      { id: 'garp_hc', lv: 95, mod: { hp: 1.5, dmg: 1.15, allUp: 1, name: '卡普', title: '神之谷・海軍英雄' } }] },
    { name: '第三關・洛克斯的分身', desc: '強攻分身（傷害 ×1.25、攻擊 +2）與強守分身（體力 ×1.15、防禦 +3）。', stages: () => [
      { id: 'rocks', lv: 95, mod: { hp: .75, dmg: 1.25, atk: 2, name: '洛克斯（強攻分身）', title: '戴維的分身', image: 'assets/chars/rocks_atk.webp?v=130', avatar: 'assets/chars/rocks_atk_face.webp?v=129' } },
      { id: 'rocks', lv: 95, mod: { hp: 1.15, dmg: .75, def: 3, name: '洛克斯（強守分身）', title: '戴維的分身', image: 'assets/chars/rocks_def.webp?v=130', avatar: 'assets/chars/rocks_def_face.webp?v=129' } }] },
    { name: '第四關・洛克斯真身', desc: '體力 14,000、開場全能力 +1，倒下後會復活一次。擊敗後洛克斯直接加入船隊。', stages: () => [
      { id: 'rocks', lv: 100, boss: true, mod: { hpFixed: 14000, allUp: 1, name: '洛克斯', title: '戴維・真身' } }] }
  ]
};
(function () {
  const T = ROCKS_TRIAL, N = T.phases.length, EMPS = () => (typeof EMPEROR_DOMAIN !== 'undefined' ? EMPEROR_DOMAIN.list.map(e => e.id) : []);
  const $q = (s, r) => (r || document).querySelector(s);
  const state = () => { const d = SAVE.data; d.rocks = d.rocks || { phase: 1, clears: 0 }; return d.rocks; };
  const ownN = () => EMPS().filter(id => owned(id)).length;
  const unlocked = () => EMPS().length > 0 && ownN() === EMPS().length;
  const avatarOf = s => (s.mod && s.mod.avatar) || CHARACTERS[s.id].avatar;
  const nameOf = s => (s.mod && s.mod.name) || CHARACTERS[s.id].name;
  const team = () => { const d = SAVE.data; let t = (d.emperorTeam || []).filter(id => owned(id)); if (!t.length) t = (d.lineup || []).slice(); return t.slice(0, (typeof EMPEROR_DOMAIN !== 'undefined' && EMPEROR_DOMAIN.teamSize) || 5); };
  const art = (id, k) => typeof charArt === 'function' ? charArt(id, k) : CHARACTERS[id][k === 'avatar' ? 'avatar' : 'image'];
  let el = null, picking = null, RUN = null;

  /* ---------- 皇帝領海展示頁：下方入口橫條 ---------- */
  function strip(host) {
    if (!host || host.querySelector('.rk-strip')) return; const C = CHARACTERS.rocks; if (!C) return;
    const ok = unlocked(), st = state(), done = st.phase > N, own = owned('rocks');
    const b = document.createElement('button'); b.className = `rk-strip ${ok ? '' : 'lock'} ${done ? 'done' : ''}`; b.type = 'button';
    b.innerHTML = `<img src="${C.avatar}" alt=""><span class="rk-strip-t"><b>洛克斯挑戰<em class="rar c-rar r-UR++">UR++</em></b><small>${ok ? (done ? (own ? '洛克斯已加入船隊・可以重複挑戰真身' : '已通過') : `${T.phases[Math.min(N, st.phase) - 1].name}`) : `集齊 ${EMPS().length} 位四皇才能挑戰（${ownN()}/${EMPS().length}）`}</small></span><span class="rk-strip-go">${ok ? '挑戰' : '🔒'}</span>`;
    b.onclick = () => { if (!ok) { toast(`還差 ${EMPS().length - ownN()} 位四皇：在皇帝領海擊敗四皇真身，讓他們加入船隊`); return; } if (window.SFX) SFX.play('rare'); const w = document.querySelector('.eh-wrap'); if (w) w.remove(); open(); };
    const foot = host.querySelector('.eh-foot'); host.insertBefore(b, foot || null);
  }
  window.addEventListener('DOMContentLoaded', () => {
    const oh = window.openEmperorHall; if (oh) window.openEmperorHall = function () { const r = oh.apply(this, arguments); strip(document.querySelector('.eh-wrap')); return r; };
    /* 展示頁也可能從其他入口（冒險的「皇帝領海」按鈕）打開：DOM 出現時補上橫條 */
    new MutationObserver(() => { const w = document.querySelector('.eh-wrap'); if (w && !w.querySelector('.rk-strip')) strip(w); }).observe(document.body, { childList: true });
  });

  /* ---------- 洛克斯挑戰頁 ---------- */
  function render() {
    if (!el) return; const st = state(), C = CHARACTERS.rocks, done = st.phase > N, ph = Math.min(N, st.phase), t = team();
    if (picking) return renderPick();
    el.innerHTML = `<div class="rk-bg" aria-hidden="true"></div>
      <header class="rk-head"><button class="icon-btn" data-x aria-label="回到皇帝領海">‹</button><div><h2>洛克斯挑戰</h2><small>神之谷的傳說・四道關卡</small></div></header>
      <div class="rk-body">
        <section class="rk-hero"><img src="${C.image}" alt="${C.name}"><div class="rk-hero-t"><small>洛克斯海賊團船長</small><b>${C.name}<em class="rar c-rar r-UR++">UR++</em></b><span>「${C.title}」・${C.role}</span></div></section>
        <section class="rk-side">
          <div class="rk-scroll"><ol class="rk-phases">${T.phases.map((p, i) => { const k = i + 1, cls = st.phase > k ? 'ok' : st.phase === k ? 'now' : 'lock';
            return `<li class="${cls}"><i class="rk-no">${st.phase > k ? '✓' : k}</i><div class="rk-ph-t"><b>${p.name}</b><small>${p.desc}</small></div><span class="rk-foes">${p.stages().map(s => `<img src="${avatarOf(s)}" alt="" title="${nameOf(s)}・LV ${s.lv}">`).join('')}</span></li>`; }).join('')}</ol>
          <p class="rk-note">${done ? `🏆 已擊敗洛克斯真身 ${st.clears} 次。可以重複挑戰真身（貝里 ${T.replayReward.berry.toLocaleString()}）。` : `目前：<b>${T.phases[ph - 1].name}</b>（${T.phases[ph - 1].stages().length} 場連戰）・體力與技能次數會延續，撤退或戰敗要從這一關第一場重來。`}</p>
          </div>
          <div class="rk-team"><span class="rk-team-l">出戰（${t.length}/5）</span><span class="rk-team-a">${t.map(id => `<img src="${art(id, 'avatar')}" alt="${CHARACTERS[id].name}" title="${CHARACTERS[id].name}・LV ${crewLv(id)}">`).join('')}</span><button class="btn-ghost sm" data-crew>選擇</button></div>
          <button class="btn-gold big rk-go" data-go>${done ? '重複挑戰真身' : `開始${T.phases[ph - 1].name}`}</button>
        </section>
      </div>`;
    if (window.fixIcons) fixIcons(el);
    el.querySelector('[data-x]').onclick = () => { close(); if (typeof openModes === 'function') openModes(); if (window.openEmperorHall) openEmperorHall(); };
    el.querySelector('[data-crew]').onclick = () => { picking = team(); render(); };
    el.querySelector('[data-go]').onclick = () => begin(done ? N : ph);
  }
  function renderPick() {
    const sel = picking, max = 5;
    el.innerHTML = `<div class="rk-bg" aria-hidden="true"></div>
      <header class="rk-head"><button class="icon-btn" data-c aria-label="取消">‹</button><div><h2>選擇出戰船員</h2><small>最多 ${max} 位，依點選順序出場（與皇帝領海共用）</small></div></header>
      <div class="rk-pick">${CHARACTER_ORDER.filter(id => owned(id)).map(id => { const k = sel.indexOf(id); return `<button data-p="${id}" class="${k >= 0 ? 'on' : ''}"><img src="${art(id, 'avatar')}" alt="">${k >= 0 ? `<i>${k + 1}</i>` : ''}<em>LV ${crewLv(id)}</em><span>${CHARACTERS[id].name}</span></button>`; }).join('')}</div>
      <div class="rk-pick-btns"><button class="btn-ghost" data-c>取消</button><button class="btn-gold" data-ok ${sel.length ? '' : 'disabled'}>確定（${sel.length}/${max}）</button></div>`;
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const id = b.dataset.p, k = sel.indexOf(id); if (k >= 0) sel.splice(k, 1); else if (sel.length < max) sel.push(id); else toast(`最多 ${max} 位`); renderPick(); });
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { picking = null; render(); });
    el.querySelector('[data-ok]').onclick = () => { SAVE.data.emperorTeam = sel.slice(); SAVE.save(); picking = null; render(); };
  }
  function open() {
    if (!unlocked()) { toast('集齊皇帝領海全部四皇才能挑戰洛克斯'); return; }
    if (typeof currentScreen !== 'undefined' && currentScreen === 'battleScreen' && typeof openModes === 'function') openModes();
    const sh = document.getElementById('lbModes'); if (sh) { sh.classList.remove('show'); sh.setAttribute('aria-hidden', 'true'); }
    if (!el) { el = document.createElement('div'); el.className = 'rk-wrap'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '洛克斯挑戰'); }
    picking = null; state(); render(); document.body.appendChild(el);
    if (window.AUDIO && AUDIO.playSong) AUDIO.playSong('boss');
  }
  function close() { if (el) el.remove(); }

  /* ---------- 連戰 ---------- */
  function begin(ph) {
    const t = team(); if (!t.length) { toast('請先選擇出戰船員'); return; }
    if (t.some(id => typeof isTraining === 'function' && isTraining(id))) { toast('出戰陣容中有船員正在訓練營'); return; }
    RUN = { ph, stages: T.phases[ph - 1].stages(), i: 0, team: t.map(id => ({ id, lv: crewLv(id) })) }; close(); fight();
  }
  function fight() {
    const R = RUN, s = R.stages[R.i];
    startBattle({ team: R.team, enemyId: s.id, enemyLv: s.lv, enemyMod: s.mod, bg: T.bg, chapterId: 'emperor', isBoss: !!s.boss, revives: s.boss ? 1 : 0, onEnd: r => end(r), onLeave: () => open() });
    const e = battle && battle.enemy;
    if (e && s.mod && s.mod.image) { e.image = s.mod.image; e.baseImage = s.mod.image; if (s.mod.avatar) { e.avatar = s.mod.avatar; const av = document.getElementById('bAvR'); if (av) av.src = e.avatar; } if (typeof refreshFighterImage === 'function') refreshFighterImage(e); if (typeof renderHUD === 'function') renderHUD(true); }
    log(`洛克斯挑戰：${T.phases[R.ph - 1].name} 第 ${R.i + 1}/${R.stages.length} 場`);
  }
  function end(r) {
    const R = RUN; if (!R) return {}; const st = state(), C = CHARACTERS.rocks;
    if (!r.win) { RUN = null; return { message: `${r.fled ? '撤退' : '戰敗'}了……${T.phases[R.ph - 1].name}要從第一場重新開始。`, alt: { label: '返回洛克斯挑戰', fn: () => open() } }; }
    track('wins'); if (r.isBoss) track('bossWins');
    if (R.i < R.stages.length - 1) {
      R.team = teamSnapshot().map((x, k) => ({ ...x, lv: R.team[k].lv })); if (battle && battle.__nextFoeStun === 'R') window.__carryStun = true;
      R.i++; const nx = R.stages[R.i];
      return { message: `第 ${R.i}/${R.stages.length} 場勝利！體力與技能次數會延續。<br>下一位：<b>${nameOf(nx)}</b>（LV ${nx.lv}）`, next: { label: '迎戰下一位', fn: () => { if (window.rocksFearCarry) rocksFearCarry(); fight(); } } };
    }
    RUN = null; const msgs = [`🏆 ${T.phases[R.ph - 1].name} 突破！`];
    team().forEach(id => gainExp(id, 800 + R.ph * 400, true));
    if (R.ph < N) { if (st.phase === R.ph) { st.phase++; addTokens(T.phaseReward.tokens, '洛克斯挑戰'); addBerry(T.phaseReward.berry); msgs.push(`獲得 寶藏幣 ×${T.phaseReward.tokens}、貝里 ${T.phaseReward.berry.toLocaleString()}`); } msgs.push(`下一關：${T.phases[R.ph].name}`); }
    else {
      const first = !st.clears; st.clears = (st.clears || 0) + 1; st.phase = N + 1;
      if (first) { addTokens(T.firstReward.tokens, '洛克斯挑戰'); addBerry(T.firstReward.berry); msgs.push(`首次擊敗洛克斯真身：寶藏幣 ×${T.firstReward.tokens}、貝里 ${T.firstReward.berry.toLocaleString()}`); }
      else { addBerry(T.replayReward.berry); msgs.push(`貝里 +${T.replayReward.berry.toLocaleString()}`); }
      if (!owned('rocks')) { addCrew('rocks', T.joinLv); msgs.push(`🏴‍☠️ <b>${C.name}</b> 加入船隊！（UR++・LV ${T.joinLv}）`); setTimeout(() => window.showRewards && showRewards({ title: '洛克斯加入！', sub: '「戴維」認同了你的實力' }, [{ char: 'rocks' }]), 900); }
    }
    SAVE.save(); if (typeof coins === 'function') coins(); if (window.checkTitles) checkTitles(false);
    return { message: msgs.join('<br>'), next: { label: '返回洛克斯挑戰', fn: () => open() } };
  }
  window.openRocksTrial = open;
  window.rocksTrialUnlocked = unlocked;
})();
