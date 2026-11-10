/* 勇者之塔：250 層，每 10 層一位 BOSS，每層都有獎勵；第 100 層以後敵人等級封頂，改以體力與傷害倍率持續變強 */
(function () {
  const TIER = ['east', 'alabasta', 'skypiea', 'enies', 'fishman', 'wano', 'dark', 'giant'];
  const state = () => { SAVE.data.tower = SAVE.data.tower || { floor: 1, best: 0 }; return SAVE.data.tower; };
  const isBoss = f => f % 10 === 0;
  /* 一般樓層：把全部角色打亂成一輪輪出場，相鄰兩層不重複，同一位角色約隔一整輪才會再出現 */
  let SEQ = null;
  /* v198 使用者 11/10 15:11「維歐娜不能出現在勇者之塔裡面」：不當對手，也不能編進塔的出戰陣容（陣容裡有她時自動略過） */
  const NO_CREW = ['viona'];
  const crew = () => (SAVE.data.lineup || []).filter(id => !NO_CREW.includes(id) && CHARACTERS[id]);
  window.towerCrew = crew;
  function buildSeq() {
    const pool = CHARACTER_ORDER.filter(id => !TOWER.bosses.includes(id) || !['imu'].includes(id)).filter(id => id !== 'imu' && !NO_CREW.includes(id) && !((CHAR_OBTAIN[id] || {}).npcOnly && id !== 'marine' && id !== 'mayor')); /* NPC 專屬角色（如摩甘茲）不會出現在勇者之塔 */ 
    const okR = ['RRR', 'SR', 'SSR', 'UR', 'UR+']; for (let i = pool.length - 1; i >= 0; i--) if (!okR.includes((typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[pool[i]]) || 'SR')) pool.splice(i, 1); /* v97：稀有度低於 RRR 的角色不會出現在勇者之塔 */
    let seed = 20260928; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const seq = []; while (seq.length < TOWER.floors) { const a = pool.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } if (seq.length && a[0] === seq[seq.length - 1]) a.push(a.shift()); seq.push(...a); }
    return seq;
  }
  /* v168 使用者 11/06：勇者之塔不出現四皇（白鬍子、BIG MOM、凱多、紅髮、黑鬍子、尼卡魯夫、巴基）、洛克斯（含分身）、洛基。
     出場順序照舊（同一個亂數表），輪到這些角色的樓層改成下面的強敵，並乘上 k 倍體力與傷害，讓那一層的難度跟原本差不多。
     七武海版黑鬍子（blackbeard_w）不是四皇，照常出現；伊姆照舊在 200／250 層。
     k 用 /root/promo/v168/emp 的 tsim.js 量測（LV 同樓層的和之國三人隊、三大將隊，各 20 場）：換人前後平均勝率差在 5 個百分點內。 */
  const NO_TOWER = { whitebeard: ['garp_hc', 1.5], shanks: ['mihawk', 1.4], kaido: ['yamato', 1.9], bigmom: ['rayleigh', 1.15], luffy_nika: ['kuma_eh', 1.5],
    blackbeard: ['blackbeard_w', 1.5], buggy: ['mihawk_w', .85], loki: ['gaban', 2.2], rocks: ['roger', 1] };
  /* BOSS 層：230 層洛基 → 鷹眼、240 層黑鬍子 → 賈巴（四皇隊、三大將隊、洛克斯隊勝率都在 0～15%，和原本相同） */
  const BOSS_SUB = { loki: ['mihawk', 1.6], blackbeard: ['gaban', 1.5] };
  const RAW_BOSSES = TOWER.bosses.slice();
  for (let i = 0; i < TOWER.bosses.length; i++) { const X = BOSS_SUB[TOWER.bosses[i]] || NO_TOWER[TOWER.bosses[i]]; if (X) TOWER.bosses[i] = X[0]; }
  window.towerFoe = f => foeOf(f); /* 測試用 */
  /* 原本的出場角色（換人之前） */
  function rawFoe(f) {
    if (isBoss(f)) return RAW_BOSSES[(f / 10 - 1) % RAW_BOSSES.length];
    SEQ = SEQ || buildSeq(); let k = 0; for (let x = 1; x < f; x++) if (!isBoss(x)) k++;
    let id = SEQ[k % SEQ.length]; const prevBoss = isBoss(f - 1) ? RAW_BOSSES[(f - 1) / 10 - 1] : null, nextBoss = isBoss(f + 1) ? RAW_BOSSES[(f + 1) / 10 - 1] : null;
    if (id === prevBoss || id === nextBoss) id = SEQ[(k + 1) % SEQ.length];
    return id;
  }
  /* 換上的角色跟上一層／下一層撞名時，改用備選（ALT，同樣量過倍率） */
  const ALT = { whitebeard: ['mihawk', 1.4], kaido: ['kuma_eh', 1.5], shanks: ['garp_hc', 1.5], bigmom: ['kuma_eh', 1.5], luffy_nika: ['garp_hc', 1.5], blackbeard: ['garp_hc', 1.5], buggy: ['blackbeard_w', 1.5], loki: ['yamato', 1.9], rocks: ['mihawk', 1.4] };
  const sub0 = f => { const id = rawFoe(f); return (isBoss(f) && BOSS_SUB[id]) || NO_TOWER[id] || null; };
  const plain = f => f < 1 || f > TOWER.floors ? null : (sub0(f) || [rawFoe(f)])[0];
  const subOf = f => { const X = sub0(f); if (!X || isBoss(f)) return X; const id = rawFoe(f); return (X[0] === plain(f - 1) || X[0] === plain(f + 1)) && ALT[id] ? ALT[id] : X; };
  function foeOf(f) { const X = subOf(f); return X ? X[0] : rawFoe(f); }
  const boostOf = f => { const X = subOf(f); return X ? X[1] : 1; };
  const skinOf = f => (TOWER.bossSkin || {})[f] || null;
  /* 第 1 層 LV25，每層 +0.75，BOSS 層再 +4，上限 LV100 */
  const lvOf = f => Math.min(MAX_LV, Math.round(25 + (f - 1) * .75 + (isBoss(f) ? 4 : 0)));
  /* 第 100 層以上：每層體力 +1.2%、傷害 +0.4%，每 50 層攻防各 +1（250 層約體力 2.8 倍、傷害 1.6 倍） */
  /* v165 伊姆三型態（js/ext_v165.js）：第 200、250 層的伊姆技能數值照使用者規格不動，改調塔的層設定讓強隊打得過（使用者 11/06：「還是要讓人家打得過」）。
     hp／dmg 取代原本塔頂強化的體力與傷害倍率；imuPace＝伊姆第幾回合起才施放「最初20人」晉升（imuPaceHp 0＝體力再低也不提早）；revives＝BOSS 復活次數。
     tests/imu-sim.js 量測（LV100 三人隊）：200 層 洛基／洛克斯／尼卡 100%、四皇隊約 70%、SSR 頂尖隊 0～95%（依隊伍爆發力）；250 層更難。 */
  /* v169 使用者 11/07：第 200 層的伊姆停在第二型態（imuMaxForm 2），第 250 層會晉升到第三型態「深淵聖靈・伊姆」 */
  const FLOOR_FIX = { 200: { hp: .15, dmg: .7, imuPace: 8, imuPaceHp: 0, imuMaxForm: 2, revives: 1 }, 250: { hp: .2, dmg: .7, imuPace: 6, imuPaceNext: 3, imuPaceHp: 0, imuMaxForm: 3, revives: 1 } }; /* imuPaceNext：第一次晉升後每 3 回合可再晉升 */
  const modOf = f => { const k = Math.max(0, f - 100), st = Math.min(3, Math.floor(k / 50)); const m = { hp: 1 + k * .012, dmg: 1 + k * .004, atk: st, def: st }; const X = FLOOR_FIX[f]; if (X) { m.hp = X.hp; m.dmg = X.dmg; m.imuPace = X.imuPace; m.imuPaceHp = X.imuPaceHp; if (X.imuMaxForm != null) m.imuMaxForm = X.imuMaxForm; if (X.imuPaceNext) m.imuPaceNext = X.imuPaceNext; } const b = boostOf(f); if (b !== 1) { m.hp *= b; m.dmg *= b; } return m; };
  const hasMod = f => f > 100 || boostOf(f) !== 1; /* v168：換人的樓層在 100 層以內也有強敵加成 */
  window.towerSpec = f => ({ foe: foeOf(f), raw: rawFoe(f), lv: lvOf(f), mod: hasMod(f) ? modOf(f) : null, boss: isBoss(f), revives: isBoss(f) ? ((FLOOR_FIX[f] && FLOOR_FIX[f].revives != null) ? FLOOR_FIX[f].revives : (f > 150 ? 2 : 1)) : 0, ch: chapterOf(f) }); /* 測試用（v168 難度量測） */
  let sel = null;
  const replayOf = r => ({ berry: Math.round(r.berry * .3), items: {}, tokens: 0 });
  const chapterOf = f => TIER[Math.min(TIER.length - 1, Math.floor((f - 1) / 15))];
  function rewardOf(f) {
    const r = { berry: 60 + f * 15, items: {}, tokens: 0 };
    if (f % 5 === 0) r.items.exp_s = 1;
    if (isBoss(f)) { r.tokens = 10; r.items.exp_m = 1; }
    if (f === 50 || f === 100) { r.items.exp_l = 1; r.tokens += 50; }
    if (f === 120) { r.items.exp_l = 3; r.tokens = 2000; }
    if (f % 50 === 0 && f > 100) { r.items.exp_l = (r.items.exp_l || 0) + 2; r.tokens += 100; }
    if (f === 200) { r.items.exp_l = 3; r.tokens = 500; }
    if (f === 250) { r.items.exp_l = 5; r.tokens = 3000; }
    return r;
  }
  const rewardText = r => [`貝里 ${r.berry.toLocaleString()}`, r.tokens ? `寶藏幣 ×${r.tokens}` : '', ...Object.entries(r.items).map(([k, n]) => `${ITEMS[k].name} ×${n}`)].filter(Boolean).join('、');

  function render() {
    const s = state(), cur = Math.min(TOWER.floors, s.floor), done = s.floor > TOWER.floors;
    $('twSub').textContent = done ? `已登頂 ${TOWER.floors} 層！` : `目前第 ${cur} 層・最高紀錄 ${s.best} 層`;
    if (sel == null || sel > cur || (done && sel > TOWER.floors)) sel = done ? TOWER.floors : cur;
    const rows = [];
    for (let f = Math.min(TOWER.floors, cur + 2); f >= 1; f--) {
      const st = f < s.floor ? 'clear' : f === cur && !done ? 'now' : 'lock', c = { ...CHARACTERS[foeOf(f)], ...(skinOf(f) ? { avatar: SKINS[skinOf(f)].avatar, name: SKINS[skinOf(f)].name } : {}) };
      rows.push(`<li class="tw-f ${st} ${isBoss(f) ? 'boss' : ''} ${f === sel ? 'sel' : ''}" data-f="${f}" ${st !== 'lock' ? 'role="button" tabindex="0"' : ''}><span class="tw-no">${f}</span><img src="${c.avatar}" alt=""><span class="tw-n"><b>${isBoss(f) ? 'BOSS・' : ''}${c.name}</b><small>LV ${lvOf(f)}${hasMod(f) && !FLOOR_FIX[f] ? ` ＋${Math.round((modOf(f).hp - 1) * 100)}%` : ''}</small></span><i class="tw-st">${st === 'clear' ? (f === sel ? '重複挑戰' : '✓ 可重打') : st === 'now' ? '挑戰中' : '🔒'}</i></li>`);
    }
    $('twFloors').innerHTML = rows.join('');
    $('twFloors').querySelectorAll('.tw-f.clear,.tw-f.now').forEach(li => { const pick = () => { sel = +li.dataset.f; render(); }; li.onclick = pick; li.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }; });
    requestAnimationFrame(() => { const L = $('twFloors'), el = L.querySelector('.tw-f.sel'); if (!el) return; /* v130：只捲動樓層清單本身，不要把整頁捲走（小螢幕上方的挑戰卡會被切掉） */ if (L.scrollHeight > L.clientHeight + 2) L.scrollTop = el.offsetTop - L.offsetTop - (L.clientHeight - el.offsetHeight) / 2; const W = L.closest('.tw-wrap'); if (W) W.scrollTop = 0; });
    const f = sel, replay = f < s.floor, c = { ...CHARACTERS[foeOf(f)], ...(skinOf(f) ? { image: SKINS[skinOf(f)].image, name: SKINS[skinOf(f)].name } : {}) }, r = rewardOf(f), L = lvStats(CHARACTERS[foeOf(f)], lvOf(f));
    $('twPanel').innerHTML = (done ? `<p class="tw-top">🏆 已登頂 ${TOWER.floors} 層！點左側任一層可以重複挑戰。</p>` : '') +
      `<div class="tw-foe ${isBoss(f) ? 'boss' : ''}"><div class="tw-art"><img src="${c.image}" alt=""></div>
        <div class="tw-info"><small>第 ${f} 層${isBoss(f) ? '・BOSS 層' : ''}</small><h3>${c.name}</h3><p class="tw-lv">LV ${lvOf(f)}・${c.title}${hasMod(f) ? `<br><small>${f > 100 ? '塔頂強化' : '強敵加成'}：體力 ×${modOf(f).hp.toFixed(2)}、傷害 ×${modOf(f).dmg.toFixed(2)}${modOf(f).atk ? `、攻防 +${modOf(f).atk}` : ''}</small>` : ''}</p>
        <div class="tw-stats"><span>體力 <b>${Math.round(L.hp * modOf(f).hp)}</b></span><span>攻擊 <b>${L.atk}</b></span><span>防禦 <b>${L.def}</b></span><span>速度 <b>${L.spd}</b></span></div>
        <p class="tw-rew">${replay ? `重複挑戰獎勵：<b>${rewardText(replayOf(r))}・陣容經驗 ${Math.round((40 + f * 12) / 2)}</b><br><small>首次通關獎勵已領取，重複挑戰不影響目前樓層</small>` : `過關獎勵：<b>${rewardText(r)}</b>`}</p>
        <p class="tw-team">出戰陣容：${crew().map(id => `<img src="${CHARACTERS[id].avatar}" alt="${CHARACTERS[id].name}" title="${CHARACTERS[id].name}">`).join('')}${(SAVE.data.lineup || []).some(id => NO_CREW.includes(id)) ? '<br><small>維歐娜無法在勇者之塔出戰，這一層不會派她上場</small>' : ''}</p>
        <button class="btn-primary big" id="twGo">${replay ? '重複挑戰' : '挑戰'}第 ${f} 層</button></div></div>`;
    const go = $('twGo'); if (go) go.onclick = () => fight(f);
  }
  function fight(f) {
    const s = state();
    const team = crew(); if (!team.length) { if (typeof toast === 'function') toast('維歐娜無法在勇者之塔出戰，請先在船員裡換上其他角色'); return; }
    startBattle({ tower: f, team: team.map(id => ({ id, lv: crewLv(id) })), enemyId: foeOf(f), enemySkin: skinOf(f), enemyLv: lvOf(f), bg: 'assets/ui/tower_bg.webp?v=23', chapterId: chapterOf(f), isBoss: isBoss(f), revives: isBoss(f) ? ((FLOOR_FIX[f] && FLOOR_FIX[f].revives != null) ? FLOOR_FIX[f].revives : (f > 150 ? 2 : 1)) : 0, enemyMod: hasMod(f) ? modOf(f) : null,
      onEnd: r => {
        if (!r.win) return { message: `第 ${f} 層挑戰失敗。調整陣容、升級船員後再來挑戰吧！` };
        track('wins'); track('towerWins'); if (isBoss(f)) track('bossWins');
        if (f < s.floor) { const rr = replayOf(rewardOf(f)), ex = Math.round((40 + f * 12) / 2); addBerry(rr.berry); team.forEach(id => gainExp(id, ex, true)); SAVE.save(); if (window.checkTitles) checkTitles(false);
          return { message: `重複挑戰第 ${f} 層成功！<br>獲得 貝里 ${rr.berry.toLocaleString()}・陣容經驗 ${ex}`, next: { label: '再挑戰一次', fn: () => fight(f) }, alt: { label: '返回勇者之塔', fn: () => openTower(true) } }; }
        const first = f > (s.best || 0), rw = rewardOf(f);
        s.floor = f + 1; s.best = Math.max(s.best || 0, f); sel = null; SAVE.save();
        const lines = [`突破第 ${f} 層！`];
        if (first) { addBerry(rw.berry); if (rw.tokens) addTokens(rw.tokens, '勇者之塔'); Object.entries(rw.items).forEach(([k, n]) => { SAVE.data.inventory[k] = (SAVE.data.inventory[k] || 0) + n; }); team.forEach(id => gainExp(id, 40 + f * 12, true)); SAVE.save(); lines.push(`獲得 ${rewardText(rw)}`); }
        if (window.checkTitles) checkTitles(false);
        return { message: lines.join('<br>'), next: f < TOWER.floors ? { label: `繼續挑戰（第 ${f + 1} 層）`, fn: () => fight(f + 1) } : { label: '返回船上', fn: () => openModes() }, alt: f < TOWER.floors ? { label: '返回船上', fn: () => openModes() } : null };
      },
      onLeave: () => openTower() });
  }
  window.openTower = function (keepSel) { if (keepSel !== true) sel = null; if (typeof coins === 'function') coins(); render(); showScreen('towerScreen'); };
  window.addEventListener('DOMContentLoaded', () => { $('twBack').onclick = () => openModes(); $('twCrew').onclick = () => openCrew(); });
})();
