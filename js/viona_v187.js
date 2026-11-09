/* v187 原創角色「賽博亞齊·維歐娜」（使用者 11/09 14:00）
   UR・初代女帝・攻擊控制型，只能從限定抽獎池「初代女帝」抽取（集滿碎片合成）。
   人人果實·幻獸種·維納斯型態，手持無上大快刀「神妃」，亞馬遜百合·九蛇島初代女帝，空白一百年中少數被記錄下來的傳說人物。
   立繪：原始 0.65（viona）；第 4 招「維納斯降臨」2 回合變成維納斯型態 0.7（viona_venus）；限定皮膚「無名女郎」0.55（viona_bunny，暫時無法獲得）。

   被動「女神之印」（存在維歐娜身上，最多 3 層）：
     ・每施放一招 +1 層（第 1～3 招說明裡的「附加一層」就是這一層，不會重複疊）。
     ・每層讓對手對維歐娜造成的傷害 -10%。
     ・v188 使用者 11/09：最多 3 層；滿 3 層必定觸發被動「臣服」→ 對手隨機一招的次數歸 0（BOSS 改為失去目前體力 20%），效果結束後印記歸零重新累積。
   狀態：
     魅惑（ABN.charm，2 回合）：施加時攻擊 -1、速度 -1；神妃對魅惑中的對手傷害 +40%。
     臣服（ABN.subdue，CC）：無法行動，施加時解除對手的能力提升與強化效果。
   技能自訂效果鍵：vioCharm、vioIgnoreDef、vioCharmBonus、vioSubdueStack、vioVenus、vioDot、vioFinal（下方實作）。
   特效：紫紅色系漸層（VFX 表）。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const V = 188, img = n => `assets/chars/${n}.webp?v=${V}`, ui = n => `assets/ui/${n}.webp?v=${V}`;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const R = (a, b) => a + Math.random() * (b - a), pct = x => Math.round(x * 100);
  const onScreen = f => { const b = B(); return !!(b && f && (f === b.player || f === b.enemy)); };
  const sideOf = f => { const b = B(); return b && f === b.enemy ? 'R' : 'L'; };
  const say = (f, t) => { try { if (onScreen(f)) floatText(sideOf(f), t, 'status'); } catch (e) { } };
  const isBossT = t => { const b = B(); return !!(t && (t.voidImmune || (b && b.isBoss && t === b.enemy))); };
  const SZ0 = .65, SZV = .7;

  /* ---------- 狀態 ---------- */
  if (typeof ABN !== 'undefined') {
    ABN.charm = { name: '魅惑', icon: '💗', desc: '被女帝的美貌迷住：攻擊 -1、速度 -1，受到「神妃」的傷害 +40%' };
    ABN.subdue = { name: '臣服', icon: '🙇', desc: '向女帝臣服：無法行動，強化效果被解除' };
    if (typeof CC_KEYS !== 'undefined' && !CC_KEYS.includes('subdue')) CC_KEYS.push('subdue');
  }

  /* ---------- 角色資料 ---------- */
  const S = (o) => Object.assign({ accuracy: 100, maxPP: o.pp, tags: [] }, o);
  const PASSIVE = '【被動・女神之印】每施放一招累積 1 層（最多 3 層），每層使對手對自己的傷害 -10%；不論疊幾次最多 3 層；滿 3 層時立刻觸發「臣服」：對手隨機一招的次數歸 0（BOSS 改為失去目前體力 20%），效果結束後印記歸零、重新累積。';
  CHARACTERS.viona = { id: 'viona', name: '賽博亞齊·維歐娜', title: '初代女帝', types: ['超能'], scale: 1, worldScale: 1, battleScale: SZ0, ai: 'control',
    image: img('viona'), avatar: img('viona_face'), ultimateBg: img('viona_venus'), cardPos: '50% 8%', cardFocus: '52% 10%',
    maxHp: 2150, baseSpeed: 124, statScale: 1.2, role: '攻擊控制型',
    desc: '本遊戲原創角色。亞馬遜百合·九蛇島的初代女帝，空白一百年中少數被記錄下來的傳說人物，擁有極高的智謀與強大的實力。吃下人人果實·幻獸種·維納斯型態，手持無上大快刀「神妃」。【定位】攻擊控制型：用「女神之印」削弱對手的傷害並讓對手臣服，魅惑與臣服控場，維納斯型態下以終焉·黃昏一擊定勝負。' + PASSIVE,
    passive: PASSIVE,
    skills: [
      S({ name: '垂憐', type: 'attack', power: 100, pp: 10, anima: 'snake', desc: '【範圍】敵方全體（後排同樣受到傷害）。造成 180% 攻擊傷害，附加 1 層女神之印。45% 機率使對手「魅惑」2 回合：攻擊 -1、速度 -1。',
        tags: [['全體', 'red'], ['魅惑', 'gold'], ['女神之印', 'gold']], effect: { randomMultiplierRange: [1.8, 1.8], splash: 1, vioCharm: .45 } }),
      S({ name: '神妃', type: 'attack', power: 100, pp: 8, anima: 'slash', desc: '【範圍】單體。無上大快刀「神妃」斬擊，造成 100～500% 傷害，無視 30% 防禦；對「魅惑」中的對手傷害再 +40%。附加 1 層女神之印。',
        tags: [['斬擊', 'red'], ['破防', 'red'], ['魅惑增傷', 'gold']], effect: { randomMultiplierRange: [1, 5], vioIgnoreDef: .3, vioCharmBonus: .4 } }),
      S({ name: '萬王俯首', type: 'support', power: 0, pp: 5, anima: 'awaken', desc: '【範圍】自身＋對手。全能力 +1，附加 1 層女神之印；每 1 層印記使對手有 25% 機率「臣服」1 回合（3 層＝75%）：無法行動，且能力提升與強化效果全部解除。',
        tags: [['強化', 'gold'], ['臣服', 'red'], ['女神之印', 'gold']], effect: { statUpAll: 1, vioSubdueStack: .25 } }),
      S({ name: '維納斯降臨', type: 'support', power: 0, pp: 3, anima: 'awaken', desc: '【範圍】自身＋對手。進入「維納斯型態」2 回合，女神之印直接疊滿 3 層（立刻觸發被動臣服，之後歸零重新累積）；下回合攻擊 +30%、2 回合受到的傷害 -10%；對手 2 回合每回合受到 100～1000 固定傷害；清除自身的負面狀態與能力下降。這一回合對手的攻擊無效，並 100% 反彈。',
        tags: [['變身', 'gold'], ['反彈', 'green'], ['淨化', 'green'], ['固定傷害', 'red']],
        effect: { vioVenus: { turns: 2 }, nextAttackMult: 1.3, nextAttackMultTurns: 1, damageReductionTurns: 2, damageReductionValue: .1, clearSelfDebuffs: true, reflectTurns: 1, reflectMultiplier: 1, vioDot: [100, 1000, 2] } }),
      S({ name: '終焉·黃昏', type: 'attack', power: 100, pp: 2, ultimate: true, anima: 'slash', desc: '奧義（無法用道具恢復次數）。【範圍】敵方全體。對手體力直接降到最大體力的 10%（BOSS 無效），再造成 520～1314% 傷害、無視 20～50% 防禦；每層女神之印最終傷害 +15%（最多 +45%）。45% 機率使對手「臣服」1 回合；隨機降低對手的技能共 5 次（BOSS 無效）。【維納斯型態下施放】追加一次 160% 的神罰傷害（無視 20% 減傷），並進入「自由」2 回合：不受任何控制與限制。',
        tags: [['奧義', 'gold'], ['斬殺', 'red'], ['全體', 'red'], ['臣服', 'red'], ['削次數', 'blue']], effect: { randomMultiplierRange: [5.2, 13.14], splash: 1, vioFinal: { sub: .45, pp: 5, venusMul: 1.6 }, noRestore: true } })
    ] };
  if (typeof CHARACTER_ORDER !== 'undefined' && !CHARACTER_ORDER.includes('viona')) CHARACTER_ORDER.push('viona');
  if (typeof CHAR_RARITY !== 'undefined') CHAR_RARITY.viona = 'UR';
  if (typeof CHAR_OBTAIN !== 'undefined') CHAR_OBTAIN.viona = { boss: 0, bossFirst: 0, bossRepeat: 0, eventOnly: true, npc: '本遊戲原創角色・限定抽獎池「初代女帝」：集滿 300 碎片合成；碎片 100 片可兌換皮膚「無名女郎」（無法從一般召喚取得）' };
  if (typeof SKINS !== 'undefined') SKINS.viona_bunny = { char: 'viona', name: '無名女郎', image: img('viona_bunny'), avatar: img('viona_bunny_face'), battleScale: .55, how: '限定召喚「初代女帝」：碎片 100 片兌換' };

  /* 限定抽獎池＋檔期 */
  if (typeof EVENT_POOLS !== 'undefined' && !EVENT_POOLS.some(p => p.id === 'venus_viona'))
    EVENT_POOLS.push({ id: 'venus_viona', tab: '初代女帝', series: '原創系列', name: '原創系列 初代女帝 限定活動', banner: ui('event_banner_viona'), need: 300,
      amount: [[20, .6], [30, .3], [50, .1]], pity: 120, newbieFree: 10, dailyFree: 3, bountyBonus: 2, tokenCost: 1,
      shards: [{ char: 'viona', rate: .02, icon: ui('shard_viona'), color: '#e04cff', skin: { key: 'viona_bunny', need: 100 } }] });
  if (typeof EVENT_CALENDAR !== 'undefined' && !EVENT_CALENDAR.some(c => c.id === 'venus_viona'))
    EVENT_CALENDAR.push({ id: 'venus_viona', start: '2026-11-11 00:00', end: '2026-12-13 00:00', label: '11～12 月限定', preview: '2026-11-09 00:00' }); /* v188：11/11～12/12，開放前顯示預告 */

  /* 結算畫面臉部位置 */
  window.addEventListener('DOMContentLoaded', () => { if (window.CHAR_FACE) Object.assign(CHAR_FACE, { 'assets/chars/viona.webp': [.515, .107, .093], 'assets/chars/viona_venus.webp': [.5, .171, .077], 'assets/chars/viona_bunny.webp': [.497, .196, .126] }); });

  /* ---------- 戰鬥狀態 ---------- */
  const isV = f => !!(f && f.id === 'viona');
  const st = f => (f.__vio = f.__vio || { marks: 0, venus: 0, base: null });
  function chips(f) { const I = st(f); return `${I.marks ? `<span class="chip up" title="每層使對手對自己的傷害 -10%；滿 3 層觸發臣服後歸零">女神之印 ${'◆'.repeat(I.marks)}</span>` : ''}${I.venus > 0 ? `<span class="chip up" title="維納斯型態：終焉·黃昏追加神罰並進入自由">維納斯型態 ${I.venus}</span>` : ''}`; }
  function refresh(f) { try { if (onScreen(f) && typeof renderHUD === 'function') renderHUD(); } catch (e) { } }
  function setVenus(f, on) {
    const I = st(f);
    if (on) { if (!I.base) I.base = { image: f.image, avatar: f.avatar, title: f.title, visMul: f.visMul || 1 }; f.image = img('viona_venus'); f.avatar = img('viona_venus_face'); f.title = '維納斯型態'; f.visMul = (SZV / SZ0) * (I.base.visMul || 1); }
    else if (I.base) { f.image = I.base.image; f.avatar = I.base.avatar; f.title = I.base.title; f.visMul = I.base.visMul; I.base = null; }
    if (!onScreen(f)) return; const S2 = sideOf(f), $$ = id => document.getElementById(id);
    try { if (typeof refreshFighterImage === 'function') refreshFighterImage(f); else { if ($$('bImg' + S2)) $$('bImg' + S2).src = f.image; if (typeof applyVisual === 'function') applyVisual(f); } } catch (e) { }
    try { if ($$('bTitle' + S2)) $$('bTitle' + S2).textContent = f.title; if ($$('bAv' + S2)) $$('bAv' + S2).src = f.avatar; if (S2 === 'L' && typeof renderTeam === 'function') renderTeam(); } catch (e) { }
  }
  function subdue(f, t, why) {
    if (!t || t.hp <= 0) return false;
    if (typeof inflict === 'function' && !inflict(t, 'subdue', 1)) return false;
    let n = 0; ['atk', 'def', 'spd'].forEach(k => { if (t.buffs[k] > 0) { n += t.buffs[k]; t.buffs[k] = 0; } });
    const T = t.status, gone = []; [['shield', '護盾'], ['damageReductionTurns', '減傷'], ['invuln', '無敵'], ['dodge', '閃避'], ['reflect', '反彈'], ['regen', '持續回復'], ['thornTurns', '荊棘'], ['nextAttackMultTurns', '增傷']].forEach(([k, nm]) => { if (T[k] > 0) { T[k] = 0; gone.push(nm); } });
    L(`🙇 ${t.name} 向女帝臣服${why ? `（${why}）` : ''}！${n || gone.length ? `能力提升與強化被解除：${[n ? `能力提升 ${n} 階` : '', ...gone].filter(Boolean).join('、')}` : ''}`); say(t, '臣服');
    return true;
  }
  function addMark(f, t) {
    const I = st(f); if (I.marks < 3) { I.marks++; L(`💜 女神之印 ${I.marks}/3（對手對 ${f.name} 的傷害 -${I.marks * 10}%）`); }
    if (I.marks >= 3) {
      if (t && t.hp > 0 && t !== f) {
        if (isBossT(t)) { const d = Math.max(1, Math.floor(t.hp * .2)); t.hp = Math.max(1, t.hp - d); try { showDamage(sideOf(t), d, '#e04cff'); } catch (e) { } L(`👑 女神之印滿 3 層・臣服：${t.name} 失去目前體力的 20%（${d}）`); }
        else { const K = (t.skills || []).filter(s => s && s.pp > 0); if (K.length) { const s = K[Math.floor(Math.random() * K.length)]; s.pp = 0; L(`👑 女神之印滿 3 層・臣服：${t.name} 的「${s.name}」次數歸 0`); } else L(`👑 女神之印滿 3 層・臣服：${t.name} 已經沒有可用的招式了`); }
        say(t, '臣服'); try { if (onScreen(t) && t === B().player && typeof renderSkills === 'function') renderSkills(); } catch (e) { }
      }
      I.marks = 0; L('💜 女神之印歸零，重新累積');
    }
    refresh(f);
  }
  /* 「無視防禦 x」：把對手防禦的減傷效果拿掉 x 比例 */
  function ignoreDef(t, x) { const f0 = (typeof defTake === 'function' ? defTake(t.buffs.def) : 1) * (1 - Math.min(.25, (t.def || 0) / 6000)); if (f0 >= 1) return 1; return (f0 + (1 - f0) * x) / f0; }

  /* ---------- 傷害 ---------- */
  if (typeof computeSkillOutcome === 'function') { const _cso = computeSkillOutcome;
    computeSkillOutcome = function (actor, target, skill) {
      const r = _cso.apply(this, arguments);
      try {
        const ef = (skill && skill.effect) || {};
        if (r && r.damage > 0 && isV(actor) && skill.type === 'attack' && !(r.meta && r.meta.execute)) {
          let m = 1;
          if (ef.vioIgnoreDef) m *= ignoreDef(target, ef.vioIgnoreDef);
          if (ef.vioCharmBonus && target.status && target.status.charm > 0) { m *= 1 + ef.vioCharmBonus; L(`💗 對魅惑中的 ${target.name} 傷害 +${pct(ef.vioCharmBonus)}%`); }
          if (ef.vioFinal && !isBossT(target) && !(target.status && target.status.reflect > 0)) { const cap = Math.max(1, Math.floor(target.maxHp * .1)); if (target.hp > cap) { r.meta = r.meta || {}; r.meta.__vioCut = target.hp - cap; L(`🌅 黃昏降臨：${target.name} 的體力先被壓到最大體力的 10%`); } }
          if (ef.vioFinal) { const ig = R(.2, .5), mk = st(actor).marks, mb = 1 + Math.min(.45, .15 * mk); m *= ignoreDef(target, ig) * mb; L(`🌅 終焉·黃昏：無視 ${pct(ig)}% 防禦${mk ? `，女神之印 ${mk} 層最終傷害 +${pct(mb - 1)}%` : ''}`);
            if (st(actor).venus > 0) { const ex = Math.floor(calcAttackDamage(actor, target, { type: 'attack', power: 100, effect: { forceMultiplier: ef.vioFinal.venusMul || 1.6 } }) * 1.2); r.damage += ex; r.meta = r.meta || {}; r.meta.__vioJudg = ex; } }
          if (m !== 1) r.damage = Math.floor(r.damage * m);
          if (r.meta && r.meta.__vioCut) r.damage += r.meta.__vioCut; /* 先壓到 10% 再打傷害：壓掉的體力併進這一擊 */
          if (r.meta && r.meta.__vioJudg) L(`⚖️ 維納斯的神罰：追加 ${r.meta.__vioJudg} 點傷害（無視 20% 減傷）`);
        }
        if (r && r.damage > 0 && isV(target) && target.__vio && target.__vio.marks > 0) r.damage = Math.max(1, Math.floor(r.damage * (1 - .1 * target.__vio.marks)));
      } catch (e) { console.warn('維歐娜傷害', e); }
      return r; }; }

  /* ---------- 技能效果 ---------- */
  if (typeof applySkillEffects === 'function') { const _ase = applySkillEffects;
    applySkillEffects = function (actor, target, skill, result) {
      const r = _ase.apply(this, arguments);
      try { if (isV(actor) && skill) { const ef = skill.effect || {}, I = st(actor), foe = target && target !== actor ? target : null;
        if (ef.vioCharm && foe && foe.hp > 0 && Math.random() < ef.vioCharm && typeof inflict === 'function' && inflict(foe, 'charm', 2)) { foe.buffs.atk = Math.max(-6, (foe.buffs.atk || 0) - 1); foe.buffs.spd = Math.max(-6, (foe.buffs.spd || 0) - 1); say(foe, '魅惑'); }
        if (ef.vioSubdueStack && foe) { const p = Math.min(1, ef.vioSubdueStack * (I.marks + 1)); if (Math.random() < p) subdue(actor, foe, `機率 ${pct(p)}%`); else L(`🙇 臣服沒有成功（機率 ${pct(p)}%）`); }
        if (ef.vioVenus) { if (typeof clearNegativeStages === 'function') clearNegativeStages(actor); I.venus = ef.vioVenus.turns; I.fresh = 1; if (!I.base) setVenus(actor, true); I.marks = 2; L(`🌸 ${actor.name} 化身維納斯型態（${I.venus} 回合）！女神之印直接疊到 3 層`); say(actor, '維納斯降臨'); }
        if (ef.vioDot && foe && foe.hp > 0) { foe.status.__vioDot = { t: ef.vioDot[2], a: ef.vioDot[0], b: ef.vioDot[1] }; L(`💜 ${foe.name} 接下來 ${ef.vioDot[2]} 回合每回合受到 ${ef.vioDot[0]}～${ef.vioDot[1]} 固定傷害`); }
        if (ef.vioFinal && foe) { const F = ef.vioFinal;
          if (foe.hp > 0 && Math.random() < F.sub) subdue(actor, foe, '終焉·黃昏');
          if (foe.hp > 0 && !isBossT(foe)) { let n = F.pp, cut = 0; for (let k = 0; k < 40 && n > 0; k++) { const K = foe.skills.filter(s => s && s.pp > 0); if (!K.length) break; const s = K[Math.floor(Math.random() * K.length)]; s.pp--; n--; cut++; } if (cut) L(`⏳ ${foe.name} 的技能次數共減少 ${cut} 次`); }
          if (I.venus > 0) { actor.status.__free = Math.max(actor.status.__free || 0, 2); actor.status.immune = Math.max(actor.status.immune || 0, 2); if (typeof clearAbnormal === 'function') clearAbnormal(actor); L(`🕊️ ${actor.name} 進入「自由」2 回合：不受任何控制與限制`); }
        }
        addMark(actor, foe);
      } } catch (e) { console.warn('維歐娜效果', e); }
      return r; }; }

  /* ---------- 回合結束：維納斯型態、魅惑、固定傷害 ---------- */
  if (typeof endTurnStatus === 'function') { const _ets = endTurnStatus;
    endTurnStatus = function (c) {
      const r = _ets.apply(this, arguments);
      try {
        if (c && c.status && c.status.charm > 0) { c.status.charm--; if (!c.status.charm) L(`💗 ${c.name} 從魅惑中清醒了`); }
        const D = c && c.status && c.status.__vioDot; if (D && D.t > 0 && c.hp > 0) { const d = Math.round(R(D.a, D.b)); c.hp = Math.max(0, c.hp - d); D.t--; try { showDamage(sideOf(c), d, '#e04cff'); } catch (e) { } L(`💜 女神的刻印灼燒 ${c.name}：${d} 點固定傷害`); if (!D.t) c.status.__vioDot = null; }
        if (isV(c) && c.__vio && c.__vio.fresh) c.__vio.fresh = 0; /* 施放當回合不扣，維持之後完整 2 回合 */
        else if (isV(c) && c.__vio && c.__vio.venus > 0) { c.__vio.venus--; if (!c.__vio.venus) { setVenus(c, false); L(`🌸 ${c.name} 的維納斯型態結束了`); } }
      } catch (e) { console.warn('維歐娜回合', e); }
      return r; }; }
  if (typeof statusChips === 'function') { const _sc = statusChips; statusChips = function (c) { const h = _sc.apply(this, arguments); return isV(c) && c.__vio ? chips(c) + h : h; }; }
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { const r = _sb.apply(this, arguments); try { const b = B(); if (b) [b.enemy, ...(b.team || [])].forEach(f => { if (isV(f)) f.__vio = null; }); } catch (e) { } return r; }; }

  /* ---------- 特效：紫紅色系漸層 ---------- */
  const X = () => FXE.P, sl = ms => (typeof sleep === 'function' ? sleep(ms) : new Promise(res => setTimeout(res, ms)));
  /* v188 使用者 11/09：不要花瓣，以蛇、斬擊、羽翼、光柱與爆炸為主，紫紅色漸層 */
  const PK = ['#ff4fd8', '#e04cff', '#a63cff', '#ffd1f5', '#ffffff'];
  const SNAKE = { body: '#efe2f4', belly: '#ffd1f5', eye: '#ff2a6a', w: 52, len: 480 };
  const boom = (x, y, r) => { X().burst(x, y, { r, color: '#e04cff', n: 26 }); X().ring(x, y, { r1: r * 1.8, color: '#ff4fd8', w: 10, life: .45 }); X().particles({ x, y, n: 30, spd: [200, 520], life: [.4, .8], size: [3, 8], colors: PK, shape: 'spark', add: true, g: 140 }); };
  const VFX = {
    '垂憐': async A => { SFX.play('dark'); X().tint('#2a0530', .9, .4);
      X().serpent(A.f.x - A.d * 160, A.f.y + 50, A.t.x + A.d * 160, A.t.y - 40, Object.assign({}, SNAKE, { life: 1 })); await sl(520);
      SFX.play('explode'); boom(A.t.x, A.t.y, 120); await sl(140); X().rays(A.t.x, A.t.y, { r: 300, n: 14, c1: 'rgba(224,76,255,.85)' }); shake(); },
    '神妃': async A => { moveFighter(A.S, 'dash'); SFX.play('whoosh'); await sl(200);
      X().slash(A.t.x, A.t.y, { a: -2.4, span: 1.7, r: 230, w: 30, color: '#a63cff', life: .32 }); await sl(60); X().slash(A.t.x, A.t.y, { a: -2.4, span: 1.7, r: 230, w: 14, color: '#ffd1f5', life: .26 });
      await sl(90); X().slash(A.t.x, A.t.y, { a: .8, span: 1.5, r: 210, w: 24, color: '#ff4fd8', life: .3 }); await sl(80);
      SFX.play('explode'); boom(A.t.x, A.t.y, 130); X().rays(A.t.x, A.t.y, { r: 280, n: 16, c1: 'rgba(255,79,216,.85)' }); X().flash('#ffd1f5', .25, .14); shake(); },
    '萬王俯首': async A => { SFX.play('buff'); X().tint('#24062e', 1, .45); X().wings(A.f.x, A.f.y - 40, { color: '#a63cff', life: .8 });
      X().serpent(A.f.x + A.d * 40, A.f.y + 80, A.t.x, A.t.y + 60, Object.assign({}, SNAKE, { life: .9, w: 40, len: 380 })); await sl(420);
      X().pillar(A.t.x, A.t.y, { w: 130, color: '#a63cff', life: .65 }); X().ring(A.f.x, A.f.y, { r1: 220, color: '#ffd1f5', w: 8, life: .5 }); await sl(160); boom(A.t.x, A.t.y + 30, 90); },
    '維納斯降臨': async A => { SFX.play('ult'); X().tint('#2a0530', 1.6, .6); X().wings(A.f.x, A.f.y - 40, { color: '#a63cff', life: 1.3 });
      X().serpent(A.f.x - A.d * 200, A.f.y + 80, A.f.x + A.d * 120, A.f.y - 180, Object.assign({}, SNAKE, { life: 1.2 })); await sl(420);
      X().pillar(A.f.x, A.f.y, { w: 190, color: '#ff4fd8', life: .9 }); await sl(320);
      X().rays(A.f.x, A.f.y - 80, { r: 360, n: 18, c1: 'rgba(255,209,245,.9)' }); boom(A.f.x, A.f.y - 40, 140); X().flash('#ffffff', .4, .22); shake(); },
    '終焉·黃昏': async A => { moveFighter(A.S, 'leap'); SFX.play('ult'); X().tint('#120016', 1.8, .7); X().wings(A.f.x, A.f.y - 40, { color: '#e04cff', life: 1.1 });
      X().serpent(A.f.x - A.d * 240, A.f.y + 70, A.t.x + A.d * 140, A.t.y - 70, Object.assign({}, SNAKE, { life: 1.3, w: 64, len: 560 })); await sl(420);
      X().beam(A.f.x, A.f.y - 40, A.t.x, A.t.y, { w: 70, c1: '#ffffff', c2: '#e04cff', life: .55 }); await sl(160);
      for (let i = 0; i < 6; i++) setTimeout(() => X().slash(A.t.x + R(-60, 60), A.t.y + R(-40, 40), { a: R(-3, 1), span: 1.6, r: 200 + i * 15, w: 20, color: PK[i % 3], life: .3 }), i * 70);
      await sl(460); SFX.play('explode'); X().pillar(A.t.x, A.t.y, { w: 230, color: '#ff4fd8', life: .85 }); for (let i = 0; i < 3; i++) setTimeout(() => boom(A.t.x + R(-80, 80), A.t.y + R(-60, 40), 120 + i * 30), i * 120);
      await sl(300); X().flash('#ffffff', .45, .25); shake(); }
  };
  if (typeof playChoreo === 'function') { const _pc = playChoreo;
    window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      const fn = isV(actor) && skill && VFX[skill.name];
      if (!fn || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') return _pc.apply(this, arguments);
      try { FXE.ensure(); const S2 = side === 'P' ? 'L' : 'R', T = S2 === 'L' ? 'R' : 'L'; await fn({ S: S2, T, f: fighterPoint(S2), t: fighterPoint(T), d: S2 === 'L' ? 1 : -1 }); } catch (e) { console.warn(e); return _pc.apply(this, arguments); }
    }; }
  window.VIONA187 = { st, setVenus, addMark, subdue };
})();
