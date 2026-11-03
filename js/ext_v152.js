/* v152 戰鬥擴充：神之騎士團（軍子、夏姆洛克）。載入順序：ext_v121.js 之後。
   fixedDot { turns, range:[a,b], label }：對手每回合受到 a～b 點（固定數值）的持續傷害；
   sureHit：這招必中，不會被閃避（battle.js 判定閃避時檢查）；
   lowHpBonus：對手體力越低傷害越高，最多 lowHpBonus 倍；
   gunkoAfter { wait, dr, turns, chance, mult:[a,b] }：wait 回合（無敵）結束後，turns 回合受到的傷害 -dr，而且受到傷害時 chance 機率以 a～b 倍反彈；
   bgCutin { image, ms, title, sub }：全畫面「霸氣」進場演出，接著那張圖當戰鬥背景停留約 ms 毫秒；
   cerberus { turns, regen, statUp, dmg:[a,b], fear, image, scale }：身後出現召喚獸（立繪後方的圖層，跟著角色的面向，鏡射），在場的每回合全能力 +statUp、
     恢復 regen 體力、對手受到 a～b 點傷害、fear 機率恐懼。 */
(function () {
  if (typeof computeSkillOutcome !== 'function') return;
  const R = (a, b) => a + Math.random() * (b - a), sideOf = f => (battle && f === battle.player) ? 'L' : 'R', other = f => (battle && f === battle.enemy) ? battle.player : battle.enemy;
  const isBossFoe = t => battle && battle.isBoss && t === battle.enemy, capOf = t => isBossFoe(t) ? Math.floor(t.maxHp * ((typeof GAME_SETTINGS !== 'undefined' && GAME_SETTINGS.bossPctCap) ?? .15)) : Infinity;
  const blocked = t => t.status.immune > 0 || t.status.immunePermanent;

  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, b) {
    const r = _cso.apply(this, arguments), ef = (skill && skill.effect) || {}; if (!r || !target) return r;
    if (ef.lowHpBonus && r.damage > 0 && !(r.meta && r.meta.execute)) { const k = 1 + (1 - Math.max(0, target.hp) / target.maxHp) * (ef.lowHpBonus - 1); if (k > 1.01) { r.damage = Math.floor(r.damage * k); log(`⚔ ${target.name} 越虛弱，斬擊越重！傷害 ×${k.toFixed(2)}`); } }
    return r;
  };
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    _ase.apply(this, arguments); const ef = (skill && skill.effect) || {}; if (!actor || skill.__voidFx) return;
    if (ef.fixedDot && target && target.hp > 0 && !blocked(target)) { const F = ef.fixedDot, seq = [], k = actor.__rs || 1, a = Math.round(F.range[0] * k), b = Math.round(F.range[1] * k); for (let i = 0; i < F.turns; i++) seq.push([a / target.maxHp, b / target.maxHp]); /* v156：玩家角色依體質倍率縮放（BOSS 不變） */
      target.status.dots.push({ turns: F.turns, sequence: seq, label: F.label || '持續傷害', index: 0 }); log(`🏹 ${target.name} 被${F.label || '箭矢'}纏住了！接下來 ${F.turns} 回合每回合受到 ${a}～${b} 點傷害`); }
    if (ef.gunkoAfter) { actor.status.gunkoAfter = Object.assign({}, ef.gunkoAfter, { left: ef.gunkoAfter.wait || 0 }); }
    if (ef.cerberus) { const C = ef.cerberus; actor.status.cerberus = Object.assign({}, C, { left: C.turns || 3 }); setSummon(actor, C.image, C.scale); log(`🐺 地獄三頭犬「塞博拉斯」出現在 ${actor.name} 身後！`); try { if (typeof banner === 'function') banner('地獄三頭犬', actor === battle.player ? 'me' : 'boss'); } catch (e) { } }
    if (ef.bgCutin && !ef.__cutDone) cutin(ef.bgCutin);
  };
  /* 回合結束：無敵結束後的減傷＋反彈、三頭犬每回合的效果 */
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    const r = _ets.apply(this, arguments); if (!c || !battle) return r; const st = c.status;
    const GA = st.gunkoAfter; if (GA && c.hp > 0) {
      if (GA.left > 0) { GA.left--; if (GA.left <= 0) { st.damageReductionTurns = Math.max(st.damageReductionTurns || 0, GA.turns); st.damageReductionValue = Math.max(st.damageReductionValue || 0, GA.dr); st.gunkoRef = GA.turns; log(`🛡️ 黑轉支配的無敵結束了——接下來 ${GA.turns} 回合受到的傷害 -${Math.round(GA.dr * 100)}%，受到攻擊時有 ${Math.round(GA.chance * 100)}% 機率反彈 ${GA.mult[0]}～${GA.mult[1]} 倍！`); } }
      else if (st.gunkoRef > 0) { st.gunkoRef--; if (st.gunkoRef <= 0) { st.gunkoAfter = null; log(`${c.name} 的黑轉支配餘威消散了。`); } }
    }
    const CB = st.cerberus; if (CB && CB.left > 0) {
      if (c.hp <= 0) { st.cerberus = null; setSummon(c, null); }
      else { const foe = other(c);
        if (CB.statUp && st.buffBlock <= 0) ['atk', 'def', 'spd'].forEach(k => { c.buffs[k] = clamp(c.buffs[k] + CB.statUp, -6, 6); });
        if (CB.atkUp && st.buffBlock <= 0) c.buffs.atk = clamp(c.buffs.atk + CB.atkUp, -6, 6);
        if (CB.regen && (typeof healOk !== 'function' || healOk(c))) { const h = Math.floor(c.maxHp * CB.regen); c.hp = Math.min(c.maxHp, c.hp + h); showHeal(sideOf(c), h); }
        if (foe && foe.hp > 0) { const d = Math.min(capOf(foe), Math.round(R(CB.dmg[0], CB.dmg[1]) * (c.__rs || 1))); foe.hp = Math.max(0, foe.hp - d); showDamage(sideOf(foe), d, '#ff5a3a'); if (CB.fear && Math.random() < CB.fear && typeof inflict === 'function') inflict(foe, 'fear', 1);
          log(`🐺 地獄三頭犬撲向 ${foe.name}，造成 ${d} 點傷害！${CB.atkUp ? `${c.name} 攻擊 +${CB.atkUp}` : CB.statUp ? `${c.name} 全能力 +${CB.statUp}` : ''}${CB.regen ? '、恢復體力' : ''}`); }
        CB.left--; if (CB.left <= 0) { st.cerberus = null; setSummon(c, null); log(`🐺 地獄三頭犬回到了黑暗之中。`); } }
    }
    return r;
  };
  /* 受到傷害時的機率反彈（黑轉支配後） */
  const _ad = applyDamage; let inRef = false;
  applyDamage = function (target, amount, side, opts) {
    const before = target ? target.hp : 0, r = _ad.apply(this, arguments);
    try { const st = target && target.status, GA = st && st.gunkoAfter;
      if (!inRef && GA && st.gunkoRef > 0 && target.hp > 0 && before > target.hp && Math.random() < GA.chance) { const foe = other(target); if (foe && foe.hp > 0) { const d = Math.min(capOf(foe), Math.round((before - target.hp) * R(GA.mult[0], GA.mult[1])));
        inRef = true; try { _ad(foe, d, sideOf(foe), { noRef: true }); } finally { inRef = false; } log(`↩️ ${target.name} 把 ${d} 點傷害反彈給 ${foe.name}！`); if (typeof floatText === 'function') floatText(sideOf(foe), '反彈', 'status'); } } } catch (e) { }
    return r;
  };

  /* ---------- 立繪後方的召喚圖層 ---------- */
  function setSummon(f, image, scale) {
    const el = document.getElementById('bF' + sideOf(f)); if (!el) return; let im = el.querySelector('.f-summon');
    if (!image) { if (im) { im.classList.add('out'); setTimeout(() => im.remove(), 700); } return; }
    if (!im) { im = document.createElement('img'); im.className = 'f-summon'; im.alt = ''; el.insertBefore(im, el.firstChild); }
    im.classList.remove('out'); im.src = image; el.style.setProperty('--ssr', (scale || 1.2) / (f.battleScale || 1) * .6); /* 和 11/03 確認的示意圖一樣：三頭犬約是本人高度的 1.1 倍 */
    im.classList.remove('in'); void im.offsetWidth; im.classList.add('in');
  }
  window.setSummon = setSummon;
  /* ---------- 黑轉支配：全畫面進場演出，接著當背景停留 ---------- */
  let lastCut = 0;
  function cutin(C) {
    if (Date.now() - lastCut < 3000) return; lastCut = Date.now(); /* v154：變身前播過就不再重播（技能效果拿到的 skill 物件是複本，__cutDone 標記不可靠） */
    const scr = document.getElementById('battleScreen'), bg = document.getElementById('bBg'); if (!scr || !bg) return;
    scr.querySelectorAll('.cut-bg,.cut-fx').forEach(e => e.remove());
    const fx = document.createElement('div'); fx.className = 'cut-fx'; fx.innerHTML = `<i class="cut-black"></i><svg class="cut-bolts" viewBox="0 0 100 56" preserveAspectRatio="none">${[[50, 0, 44, 14, 52, 22, 46, 34], [50, 0, 58, 12, 50, 20, 60, 30], [0, 20, 16, 24, 22, 18, 36, 26], [100, 18, 84, 26, 78, 20, 64, 28], [20, 56, 28, 44, 24, 38, 38, 34], [80, 56, 72, 44, 78, 38, 62, 34]].map(p => `<polyline points="${p.join(' ')}"/>`).join('')}</svg><i class="cut-flash"></i>`; /* v154：標題只用遊戲本來的奧義標題（fx_v111 ultTitle），不再自己疊一層，也先收掉技能名橫幅 */
    const bn = document.getElementById('bBanner'); if (bn) bn.classList.remove('show');
    const back = document.createElement('div'); back.className = 'cut-bg'; back.style.setProperty('--img', `url("${new URL(C.image, location.href).href}")`); /* 絕對網址：CSS 變數裡的相對路徑會以 css/ 為基準 */ back.innerHTML = '<i class="cut-img"></i><i class="cut-rgb"></i><i class="cut-vig"></i>';
    (document.getElementById('bGL') || bg).after(back); /* 3D 背景畫布在 #bBg 後面，要蓋在它上面 */ scr.appendChild(fx); scr.classList.add('cut-shake', 'cut-on');
    try { if (typeof AUDIO !== 'undefined' && AUDIO.sfx) AUDIO.sfx('boom'); } catch (e) { }
    setTimeout(() => scr.classList.remove('cut-shake'), 900); setTimeout(() => fx.remove(), 2100);
    const ms = C.ms || 4200; setTimeout(() => { back.classList.add('out'); scr.classList.remove('cut-on'); setTimeout(() => back.remove(), 800); }, ms);
  }
  window.gunkoCutin = cutin;
  /* 變身招式：在變身演出之前先播進場演出（等 1.2 秒讓標題打完） */
  const hookTF = () => { if (typeof window.transformFx !== 'function' || window.transformFx.__v152) return; const _tf = window.transformFx; window.transformFx = async function (side, actor, skill, stage) {
    const C = skill && skill.effect && skill.effect.bgCutin; if (C && stage === 'before') { cutin(C); skill.effect.__cutDone = true; await new Promise(r => setTimeout(r, 1200)); }
    if (C && stage !== 'before') skill.effect.__cutDone = false; return _tf.apply(this, arguments); }; window.transformFx.__v152 = true; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hookTF); else hookTF();
  /* 新戰鬥開始時清掉上一場留下的圖層 */
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { document.querySelectorAll('.f-summon,.cut-bg,.cut-fx').forEach(e => e.remove()); const sc = document.getElementById('battleScreen'); if (sc) sc.classList.remove('cut-on'); return _sb.apply(this, arguments); }; }
})();
