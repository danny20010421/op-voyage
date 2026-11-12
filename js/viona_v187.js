/* v187 原創角色「賽博亞齊·維歐娜」（使用者 11/09 14:00）
   UR・初代女帝・攻擊控制型，只能從限定抽獎池「初代女帝」抽取（集滿碎片合成）。
   人人果實·幻獸種·維納斯型態，手持無上大快刀「神妃」，亞馬遜百合·九蛇島初代女帝，空白一百年中少數被記錄下來的傳說人物。
   立繪：原始 0.65（viona）；第 4 招「維納斯降臨」2 回合變成維納斯型態 0.95（viona_venus）；限定皮膚「無名女郎」0.55（viona_bunny，暫時無法獲得）。

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
  const V = 200, img = n => `assets/chars/${n}.webp?v=${V}`, ui = n => `assets/ui/${n}.webp?v=${V}`;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const R = (a, b) => a + Math.random() * (b - a), pct = x => Math.round(x * 100);
  const onScreen = f => { const b = B(); return !!(b && f && (f === b.player || f === b.enemy)); };
  const sideOf = f => { const b = B(); return b && f === b.enemy ? 'R' : 'L'; };
  const say = (f, t) => { try { if (onScreen(f)) floatText(sideOf(f), t, 'status'); } catch (e) { } };
  const isBossT = t => { const b = B(); return !!(t && (t.voidImmune || (b && b.isBoss && t === b.enemy))); };
  const SZ0 = .65, SZV = .95; /* v192 使用者 11/09 18:42：維納斯型態立繪 0.95；無名女郎 0.45（v200b） */

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
    desc: '本遊戲原創角色。亞馬遜百合·九蛇島的初代女帝，空白一百年中少數被記錄下來的傳說人物，擁有極高的智謀與強大的實力。吃下人人果實·幻獸種·維納斯型態，手持無上大快刀「神妃」。【定位】攻擊控制型：用「女神之印」削弱對手的傷害並讓對手臣服，魅惑與臣服控場，維納斯型態下以終焉·黃昏一擊定勝負。',
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
      S({ name: '終焉·黃昏', type: 'attack', power: 100, pp: 2, ultimate: true, anima: 'slash', desc: '奧義（無法用道具恢復次數）。【範圍】敵方全體。對手體力直接降到最大體力的 10%（BOSS 無效），再造成 520～1314% 傷害、無視 20～50% 防禦；每層女神之印最終傷害 +15%（最多 +45%）。45% 機率使對手「臣服」1 回合；隨機降低對手的技能共 5 次（BOSS 無效）。【維納斯型態下施放】追加一次 160% 的神罰傷害（無視 20% 減傷），並進入「自由」2 回合：不受任何控制與限制。施放後恢復自身最大體力 20%。',
        tags: [['奧義', 'gold'], ['斬殺', 'red'], ['全體', 'red'], ['臣服', 'red'], ['削次數', 'blue']], effect: { randomMultiplierRange: [5.2, 13.14], healRatio: .2, splash: 1, vioFinal: { sub: .45, pp: 5, venusMul: 1.6 }, noRestore: true } })
    ] };
  if (typeof CHARACTER_ORDER !== 'undefined' && !CHARACTER_ORDER.includes('viona')) CHARACTER_ORDER.push('viona');
  if (typeof CHAR_RARITY !== 'undefined') CHAR_RARITY.viona = 'UR+'; /* v189 使用者 11/09 改為 UR+ */
  if (typeof CHAR_OBTAIN !== 'undefined') CHAR_OBTAIN.viona = { boss: 0, bossFirst: 0, bossRepeat: 0, eventOnly: true, npc: '本遊戲原創角色・限定抽獎池「初代女帝」：集滿 300 碎片合成；碎片 100 片可兌換皮膚「無名女郎」（無法從一般召喚取得）' };
  if (typeof SKINS !== 'undefined') SKINS.viona_bunny = { char: 'viona', name: '無名女郎', image: img('viona_bunny'), avatar: img('viona_bunny_face'), battleScale: .45 /* v200b 使用者 11/12 17:01 指定 0.45 */, how: '限定召喚「初代女帝」：碎片 100 片兌換' };

  /* 限定抽獎池＋檔期 */
  if (typeof EVENT_POOLS !== 'undefined' && !EVENT_POOLS.some(p => p.id === 'venus_viona'))
    EVENT_POOLS.push({ id: 'venus_viona', tab: '初代女帝', series: '原創系列', name: '原創系列 初代女帝 限定活動', banner: ui('event_banner_viona'), need: 300,
      amount: [[20, .6], [30, .3], [50, .1]], pity: 120, newbieFree: 10, dailyFree: 3, bountyBonus: 2, tokenCost: 1,
      shards: [{ char: 'viona', rate: .02, icon: ui('shard_viona'), color: '#e04cff', skin: { key: 'viona_bunny', need: 100 } }] });
  if (typeof EVENT_CALENDAR !== 'undefined' && !EVENT_CALENDAR.some(c => c.id === 'venus_viona'))
    EVENT_CALENDAR.push({ id: 'venus_viona', start: '2026-11-11 00:00', end: '2026-12-13 00:00', label: '11～12 月限定', preview: '2026-11-09 00:00' }); /* v188：11/11～12/12，開放前顯示預告 */

  /* 結算畫面臉部位置 */
  window.addEventListener('DOMContentLoaded', () => { if (window.CHAR_FACE) Object.assign(CHAR_FACE, { 'assets/chars/viona.webp': [0.457, 0.085, 0.096], 'assets/chars/viona_venus.webp': [0.452, 0.272, 0.052], 'assets/chars/viona_bunny.webp': [0.579, 0.128, 0.118] }); });

  /* ---------- 戰鬥狀態 ---------- */
  const isV = f => !!(f && f.id === 'viona');
  const st = f => (f.__vio = f.__vio || { marks: 0, venus: 0, base: null });
  function chips(f) { const I = st(f); return `${I.marks ? `<span class="chip up" title="每層使對手對自己的傷害 -10%；滿 3 層觸發臣服後歸零">女神之印 ${'◆'.repeat(I.marks)}</span>` : ''}${I.venus > 0 ? `<span class="chip up" title="維納斯型態：終焉·黃昏追加神罰並進入自由">維納斯型態 ${I.venus}</span>` : ''}`; }
  function refresh(f) { try { if (onScreen(f) && typeof renderHUD === 'function') renderHUD(); } catch (e) { } }
  function setVenus(f, on) {
    const I = st(f);
    if (on) { if (!I.base) I.base = { image: f.image, avatar: f.avatar, title: f.title, visMul: f.visMul || 1 }; f.image = img('viona_venus'); f.avatar = img('viona_venus_face'); f.title = '維納斯型態'; f.visMul = SZV / (f.battleScale || SZ0); } /* 不論穿哪套皮膚，維納斯型態都是 8.5 */
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
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { const r = _sb.apply(this, arguments); try { const b = B(); if (b) [b.enemy, ...(b.team || [])].forEach(f => { if (isV(f)) { f.__vio = null; warm(); } }); } catch (e) { } return r; }; }

  /* ---------- 特效：紫紅色系漸層 ---------- */
  const X = () => FXE.P, sl = ms => (typeof sleep === 'function' ? sleep(ms) : new Promise(res => setTimeout(res, ms)));
  /* v192 使用者 11/09 18:42：用使用者提供的素材（翅膀、白蛇、能量球、神妃、光暈螺旋）重做五招動畫。
     畫在戰場畫布（FXE）上：素材圖片 drawImage＋位移／旋轉／縮放／透明度曲線，搭配既有的爆炸、斬擊、光環。能量球是黑底圖，用加亮混合（lighter）去掉黑底。
     圖片尺寸都在 1000px 以下，畫布繪製不會產生大型圖層（iPhone 安全）。 */
  const PK = ['#ff4fd8', '#e04cff', '#a63cff', '#ffd1f5', '#ffffff'];
  const IMG = {}; ['wings', 'snake', 'orb', 'sword', 'aura'].forEach(k => { const i = new Image(); i.decoding = 'async'; i.src = `assets/fx/viona/${k}.webp?v=199`; IMG[k] = i; });
  const ready = i => i && i.complete && i.naturalWidth > 0;
  const PI = Math.PI, lerp = (a, b, q) => a + (b - a) * q, cl = q => Math.max(0, Math.min(1, q));
  const eOut = q => 1 - Math.pow(1 - cl(q), 3), eIn = q => Math.pow(cl(q), 2.2), fd = (q, a, b) => q < a ? q / a : q > b ? Math.max(0, (1 - q) / (1 - b)) : 1;
  const SWORD_ANG = Math.atan2(1238, -58); /* v199 新素材（直立的刀，303×1400）：握柄（.683,.114）指向刀尖（.492,.999），約 93° */
  const BLADE = 4.09; /* 刀身長度（握柄到刀尖）＝圖寬 × 4.09 */
  /* v193 使用者 11/09 18:59「很醜也很不符合邏輯，請重新設計」：
     ・尺寸一律以角色在畫面上的身高為單位（u），不再寫死像素：手機上不會整片糊住畫面。
     ・翅膀、白蛇「從背後長出來」：畫在角色圖的後面（插在角色 img 之前的 div），不再用加亮混合蓋在人身上。
     ・有實體的素材（翅膀、白蛇、神妃）用一般透明度；只有能量球、光暈螺旋用加亮。
     ・每招只講一件事：垂憐＝白蛇咬人；神妃＝刀現形→飛到對手頭上→一刀劈下；萬王俯首＝展翼→光螺旋從天壓下把對手壓跪；
       維納斯降臨＝光螺旋包住全身→展翼、白蛇盤上背→胸前能量球爆開；終焉·黃昏＝展翼→頭上集氣→能量球砸下→神妃從天插進地面。 */
  /* sp(圖, 參數)：x、y、w（寬）、s（縮放）、sy（垂直縮放）、a（透明度）、r（旋轉）可以是數字或 (進度q, 秒t) => 值；ax/ay＝錨點；fx＝水平鏡像；add＝加亮混合 */
  function sp(k, o) { const img = IMG[k]; if (typeof FXE === 'undefined') return;
    return FXE.add({ add: !!o.add, life: o.life || .8, draw(c, q, dt, t) { if (!ready(img)) return; const v = f => typeof f === 'function' ? f(q, t) : f;
      const s = v(o.s == null ? 1 : o.s), w = (o.w || 300) * s, h = w * img.naturalHeight / img.naturalWidth, a = v(o.a == null ? 1 : o.a);
      if (a <= 0 || w <= 1) return; c.globalAlpha = Math.min(1, a); c.translate(v(o.x), v(o.y)); c.rotate(v(o.r || 0)); if (o.fx) c.scale(-1, 1); if (o.sy != null) c.scale(1, v(o.sy));
      c.drawImage(img, -w * (o.ax == null ? .5 : o.ax), -h * (o.ay == null ? .5 : o.ay), w, h); } }); }
  const wait = ms => sl(ms / (window.BSPEED || 1));
  /* v194：維歐娜上場時先把五張特效素材解碼好（實測第一次放「萬王俯首」時，翅膀圖在出招當下才解碼，卡了約 0.3 秒） */
  let warmed = false; function warm() { if (warmed) return; warmed = true; Object.values(IMG).forEach(i => { try { if (i.decode) i.decode().catch(() => { }); } catch (e) { } }); }
  /* fw：用特效畫布的時間等待（不是牆上時鐘）。手機掉幀時畫布時間會變慢，用它排程才不會「刀還沒劈下、刀光先出來」。分頁在背景（畫布停止）時，最多等到原本時間的 3 倍再加 1 秒就放行。 */
  const fw = ms => typeof FXE === 'undefined' ? wait(ms) : new Promise(res => { let done = false; const ok = () => { if (!done) { done = true; res(); } };
    const e = FXE.add({ life: 99, draw(c, q, dt, t) { if (t * 1000 >= ms) { e.t = 99; ok(); } } }); setTimeout(ok, ms * 3 / (window.BSPEED || 1) + 1000); });
  const $$ = id => document.getElementById(id);
  /* 角色在戰場上的實際範圍（戰場座標）：x 中線、top 頭頂、bot 腳底、h 身高、y 身體中心 */
  function pt(side) { const f = $$('bF' + side), img = $$('bImg' + side);
    const sc = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1, h = Math.max(60, img.offsetHeight * sc), bot = f.offsetTop + img.offsetTop + img.offsetHeight;
    return { x: f.offsetLeft + img.offsetLeft + img.offsetWidth / 2 + (window.__camTx ? __camTx(side) : 0), bot, top: bot - h, h, y: bot - h * .5 }; } /* v195：加上鏡頭取景的左右位移（js/cam_v173.js） */
  /* back(角色, 圖, 參數)：畫在角色「身後」的素材（DOM，插在角色圖之前），跟著角色一起移動。kf＝Web Animations 關鍵影格 */
  function back(side, k, o) { const f = $$('bF' + side), img = $$('bImg' + side), I = IMG[k]; if (!f || !img || !ready(I)) return;
    const w = o.w, h = w * I.naturalHeight / I.naturalWidth, ax = o.ax == null ? .5 : o.ax, ay = o.ay == null ? .5 : o.ay, el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${o.x - (window.__camTx ? __camTx(side) : 0) - f.offsetLeft - w * ax}px;top:${o.y - f.offsetTop - h * ay}px;width:${w}px;height:${h}px;background:url("${I.src}") center/100% 100% no-repeat;pointer-events:none;transform-origin:${ax * 100}% ${ay * 100}%;opacity:0`;
    f.insertBefore(el, img); const dur = o.dur / (window.BSPEED || 1);
    try { el.animate(o.kf, { duration: dur, easing: o.ease || 'linear', fill: 'forwards' }); } catch (e) { }
    setTimeout(() => el.remove(), dur + 60); return el; }
  const M = d => d < 0 ? ' scaleX(-1)' : '';
  /* 翅膀從背後展開：先收攏（窄、矮）→ 一口氣張開略過頭 → 回到原尺寸停住 → 淡出 */
  const wingsKF = (hold) => [{ opacity: 0, transform: 'scale(.12,.55)', easing: 'cubic-bezier(.2,.9,.3,1.2)' }, { opacity: 1, transform: 'scale(1.06,1.03)', offset: .22 }, { opacity: 1, transform: 'scale(1,1)', offset: .3 },
    { opacity: 1, transform: 'scale(1.02,1.02)', offset: hold }, { opacity: 0, transform: 'scale(1.1,1.06)' }];
  const boom = (x, y, r) => { X().burst(x, y, { r, color: '#e04cff', n: 22 }); X().ring(x, y, { r1: r * 1.6, color: '#ff4fd8', w: 8, life: .4 }); X().particles({ x, y, n: 24, spd: [r * 1.5, r * 4], life: [.35, .7], size: [2, 6], colors: PK, shape: 'spark', add: true, g: 140 }); };
  const orbBurst = (x, y, w) => sp('orb', { add: true, x, y, w, life: .45, s: q => .4 + 1.1 * eOut(q), a: q => (1 - q) * .9, r: (q, t) => t * 3 });
  /* 地面上的紫色封印圈（壓跪用）：扁橢圓，從中心張開後停住、淡出 */
  const seal = (x, y, r, life) => FXE.add({ add: true, life, draw(c, q) { const k = eOut(q * 3), a = fd(q, .1, .7); c.globalAlpha = a; c.translate(x, y); c.scale(1, .28);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r * k); g.addColorStop(0, 'rgba(166,60,255,.55)'); g.addColorStop(.75, 'rgba(224,76,255,.25)'); g.addColorStop(1, 'rgba(255,79,216,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * k, 0, TAU2); c.fill();
    c.strokeStyle = '#ff9cf5'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, r * k, 0, TAU2); c.stroke(); c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r * k * .72, 0, TAU2); c.stroke(); } });
  const TAU2 = PI * 2;
  /* 神妃：以握柄為支點畫刀；ang＝刀尖指向的角度 */
  const sword = (L, o) => sp('sword', Object.assign({ w: L / BLADE, ax: .683, ay: .114 }, o, { r: (q, t) => o.ang(q, t) - SWORD_ANG }));
  const VFX = {
    /* ① 垂憐：白蛇從女帝背後探出頭 → 張口竄向對手 → 一口咬住（魅惑的粉紅光炸開） */
    '垂憐': async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h; SFX.play('dark'); X().tint('#2a0530', 1.1, .28);
      X().ring(f.x, f.bot - 4, { r1: u * .45, flat: .25, color: '#e04cff', w: 6, life: .5 });
      back(A.S, 'snake', { x: f.x - d * u * .12, y: f.top + u * .3, w: u * 1.05, dur: 520,
        kf: [{ opacity: 0, transform: 'translate(0,35%) scale(.55)' + M(d) }, { opacity: 1, transform: 'translate(0,0) scale(1)' + M(d), offset: .65 }, { opacity: 0, transform: `translate(${d * 12}%,-4%) scale(1.04)` + M(d) }] });
      await fw(430); SFX.play('whoosh');
      const x0 = f.x + d * u * .25, y0 = f.top + u * .3, x1 = e.x - d * E * .08, y1 = e.y - E * .12, ang = Math.atan2(y1 - y0, x1 - x0);
      sp('snake', { life: .62, w: u * 1.25, fx: d < 0, ax: .93, ay: .2, x: (q, t) => lerp(x0, x1, eIn(t / .34)), y: (q, t) => lerp(y0, y1, eIn(t / .34)) - Math.sin(cl(t / .34) * PI) * u * .12,
        r: (q, t) => (d < 0 ? ang - PI : ang) + (t > .34 ? Math.sin(t * 60) * .04 : 0), a: (q, t) => t < .06 ? t / .06 : t > .5 ? Math.max(0, (.62 - t) / .12) : 1 });
      await fw(340); SFX.play('explode');
      X().slash(e.x, e.y - E * .12, { a: -2.2, span: 1.2, r: E * .3, w: E * .05, color: '#ffd1f5', life: .22 }); X().slash(e.x, e.y - E * .12, { a: .9, span: 1.2, r: E * .3, w: E * .05, color: '#ffd1f5', life: .22 });
      orbBurst(e.x, e.y - E * .1, E * .9); X().ring(e.x, e.y, { r1: E * .6, color: '#ff4fd8', w: 8, life: .45 });
      X().particles({ x: e.x, y: e.y - E * .1, n: 18, spd: [E * .6, E * 1.6], life: [.4, .8], size: [3, 7], colors: PK, shape: 'spark', add: true, g: -60 });
      moveFighter(A.T, 'recoil'); shake(); await fw(200); },
    /* ② 神妃：無上大快刀在女帝身前現形（刀尖朝上）→ 飛到對手頭頂舉刀 → 一刀斜劈而下 → 刀光爆開 */
    '神妃': async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h; SFX.play('whoosh');
      const L = E * 1.2, P0 = { x: f.x + d * u * .32, y: f.top + u * .05 }, Pv = { x: e.x - d * E * .4, y: e.y - E * .6 };
      const mir = a => d > 0 ? a : PI - a, th0 = -PI / 2 - .75, th1 = .5;
      const ang = (q, t) => mir(t < .3 ? -PI / 2 : t < .5 ? lerp(-PI / 2, th0, eOut((t - .3) / .2)) : lerp(th0, th1, eIn((t - .5) / .15)));
      sword(L, { life: 1, x: (q, t) => t < .3 ? P0.x : lerp(P0.x, Pv.x, eOut((t - .3) / .2)), y: (q, t) => t < .3 ? P0.y - u * .05 * t / .3 : lerp(P0.y - u * .05, Pv.y, eOut((t - .3) / .2)),
        s: (q, t) => t < .3 ? .6 + .4 * eOut(t / .3) : 1, a: (q, t) => t < .12 ? t / .12 : t > .82 ? Math.max(0, (1 - t) / .18) : 1, ang });
      X().burst(P0.x, P0.y, { r: u * .25, color: '#e04cff', n: 14 }); X().ring(P0.x, P0.y, { r1: u * .4, color: '#ffd1f5', w: 6, life: .4 });
      await fw(500); SFX.play('whoosh');
      X().slash(Pv.x, Pv.y, { a: mir(th0), span: th1 - th0, ccw: d < 0, r: L * .95, w: E * .14, color: '#a63cff', life: .32 });
      X().slash(Pv.x, Pv.y, { a: mir(th0), span: th1 - th0, ccw: d < 0, r: L * .95, w: E * .06, color: '#ffd1f5', life: .26 });
      await fw(160); SFX.play('explode'); boom(e.x, e.y, E * .35); X().rays(e.x, e.y, { r: E * .8, n: 12, wid: 10, c1: 'rgba(255,79,216,.6)', life: .5 }); X().flash('#ffd1f5', .2, .12);
      moveFighter(A.T, 'recoil'); shake(); await fw(260); },
    /* ③ 萬王俯首：背後展開光翼、腳下升起紫光 → 光螺旋從對手頭頂壓下、地面浮出封印圈 → 對手被壓得一沉 */
    '萬王俯首': async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h; SFX.play('buff'); X().tint('#1a0422', 1.5, .45);
      back(A.S, 'wings', { x: f.x, y: f.top + u * .34, w: u * 2.1, dur: 1450, kf: wingsKF(.82) });
      sp('aura', { add: true, life: .9, x: f.x, y: f.bot, ay: 1, w: u * .7, sy: q => .3 + .8 * eOut(q * 1.6), a: q => .5 * fd(q, .2, .6) });
      await fw(480); seal(e.x, e.bot, E * .8, 1);
      sp('aura', { add: true, life: .7, x: e.x, ay: 1, w: E * .85, y: (q, t) => lerp(e.top - E * .35, e.bot, eIn(t / .32)), sy: (q, t) => t < .32 ? 1 : lerp(1, .22, eOut((t - .32) / .2)),
        a: (q, t) => t < .08 ? t / .08 : t > .45 ? Math.max(0, (.7 - t) / .25) : .85 });
      X().particles({ x: e.x, y: e.top - E * .4, jx: E * .4, n: 16, ang: [PI / 2 - .05, PI / 2 + .05], spd: [E * 3, E * 4.5], life: [.2, .3], size: [2, 4], colors: PK, shape: 'spark', add: true });
      await fw(320); SFX.play('explode');
      X().ring(e.x, e.bot, { r1: E * 1.2, flat: .25, color: '#ff4fd8', w: 10, life: .5 }); X().ring(e.x, e.bot, { r1: E * .8, flat: .25, color: '#ffd1f5', w: 6, life: .4 });
      X().particles({ x: e.x, y: e.bot, jx: E * .3, n: 22, ang: [PI + .15, TAU2 - .15], spd: [E * .8, E * 2], life: [.3, .6], size: [2, 6], colors: ['#a63cff', '#e04cff', '#ffd1f5'], shape: 'spark', add: true, g: 300 });
      moveFighter(A.T, 'stomp'); shake(); await fw(380); },
    /* ④ 維納斯降臨：腳下光螺旋升起包住全身 → 背後雙翼展開、白蛇盤上背 → 胸前能量球凝聚後爆開 → 化身維納斯 */
    '維納斯降臨': async A => { const f = A.f, d = A.d, u = f.h; SFX.play('ult'); X().tint('#2a0530', 2, .5);
      X().ring(f.x, f.bot - 4, { r1: u * .6, flat: .25, color: '#e04cff', w: 8, life: .7 });
      sp('aura', { add: true, life: 1.5, x: f.x, y: f.bot + u * .04, ay: 1, w: u * .95, sy: q => .15 + 1.05 * eOut(q * 1.6), a: q => .6 * fd(q, .15, .75), r: (q, t) => Math.sin(t * 3) * .03 });
      await fw(220);
      back(A.S, 'wings', { x: f.x, y: f.top + u * .32, w: u * 2.4, dur: 1500, kf: wingsKF(.85) });
      back(A.S, 'snake', { x: f.x - d * u * .2, y: f.top + u * .38, w: u * 1.1, dur: 1400, ease: 'ease-out',
        kf: [{ opacity: 0, transform: 'translate(0,45%) scale(.6) rotate(-8deg)' + M(d) }, { opacity: 1, transform: 'translate(0,0) scale(1) rotate(0)' + M(d), offset: .4 }, { opacity: 1, transform: 'translate(0,-3%) scale(1.02) rotate(2deg)' + M(d), offset: .85 }, { opacity: 0, transform: 'translate(0,-6%) scale(1.04)' + M(d) }] });
      moveFighter(A.S, 'float');
      await fw(560);
      sp('orb', { add: true, life: .5, x: f.x, y: f.top + u * .38, w: u * .7, s: q => .15 + .85 * eOut(q), a: q => fd(q, .2, .9), r: (q, t) => t * 4 });
      await fw(480); SFX.play('explode');
      orbBurst(f.x, f.top + u * .38, u * 1.2); X().pillar(f.x, f.bot, { w: u * .1, color: '#ff4fd8', life: .6 });
      X().rays(f.x, f.top + u * .38, { r: u * .8, n: 12, wid: 10, c1: 'rgba(255,209,245,.6)', life: .6 }); X().flash('#ffd1f5', .2, .18); shake(); await fw(300); },
    /* ⑤ 終焉·黃昏：天色轉暗、背後雙翼張開 → 頭頂凝聚能量球 → 擲向對手爆炸 → 神妃從天而降插進對手腳下 → 光柱、衝擊波、十字斬 */
    '終焉·黃昏': async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h; SFX.play('ult'); X().tint('#100014', 2.6, .6);
      back(A.S, 'wings', { x: f.x, y: f.top + u * .32, w: u * 2.5, dur: 2300, kf: wingsKF(.85) });
      const O = { x: f.x + d * u * .05, y: f.top - u * .22 };
      sp('orb', { add: true, life: .95, x: O.x, y: O.y, w: u * .95, s: q => .12 + .88 * eOut(q * 1.2), a: q => Math.min(1, q * 4), r: (q, t) => t * 4 });
      X().particles({ x: O.x, y: O.y, jx: u * .6, jy: u * .4, n: 20, spd: [10, 40], life: [.5, .8], size: [2, 5], colors: PK, shape: 'spark', add: true, g: -40 });
      await fw(900); SFX.play('whoosh');
      sp('orb', { add: true, life: .3, x: q => lerp(O.x, e.x, eIn(q)), y: q => lerp(O.y, e.y, eIn(q)), w: u * .95, s: q => lerp(1, E / u, q), r: (q, t) => t * 8 });
      await fw(300); SFX.play('explode'); orbBurst(e.x, e.y, E * 1.6); boom(e.x, e.y, E * .4); moveFighter(A.T, 'recoil'); shake();
      await fw(180);
      const L = E * 1.55, yEnd = e.bot + E * .04 - L, yStart = -L * .2 - 40;
      sword(L, { life: 1.05, x: e.x, y: (q, t) => lerp(yStart, yEnd, eIn(t / .22)), ang: () => PI / 2, a: (q, t) => t > .8 ? Math.max(0, (1.05 - t) / .25) : 1 });
      await fw(220); SFX.play('explode');
      X().pillar(e.x, e.bot, { w: E * .14, color: '#ff4fd8', life: .7 }); X().ring(e.x, e.bot, { r1: E * 1.6, flat: .25, color: '#ffd1f5', w: 12, life: .6 });
      X().particles({ x: e.x, y: e.bot, jx: E * .2, n: 26, ang: [PI + .2, TAU2 - .2], spd: [E * 1, E * 2.6], life: [.4, .8], size: [3, 7], colors: PK, shape: 'spark', add: true, g: 420 });
      X().flash('#ffd1f5', .2, .2); shake();
      await fw(160);
      X().slash(e.x, e.y, { a: -2.4, span: 1.6, r: E * .55, w: E * .08, color: '#ff4fd8', life: .28 });
      await fw(90); X().slash(e.x, e.y, { a: -.7, span: 1.6, r: E * .55, w: E * .08, color: '#a63cff', life: .28, ccw: true });
      await fw(380); }
  };
  if (typeof playChoreo === 'function') { const _pc = playChoreo;
    window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      const fn = isV(actor) && skill && VFX[skill.name];
      if (!fn || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') return _pc.apply(this, arguments);
      try { FXE.ensure(); const S2 = side === 'P' ? 'L' : 'R', T = S2 === 'L' ? 'R' : 'L'; await fn({ S: S2, T, f: pt(S2), t: pt(T), d: S2 === 'L' ? 1 : -1 }); } catch (e) { console.warn(e); return _pc.apply(this, arguments); }
    }; }
  /* ---------- 專屬武器「神妃」（v192 使用者 11/09 18:42：抽中維歐娜免費送；裝備後攻擊 +5%、體力 +5%、受到的傷害 -5%） ----------
     存檔 SAVE.data.sigw[角色] = { eq: true/false }；開戰時（天梯即時對戰除外）套用。角色卡「技能一覽」上方顯示武器卡，可以裝備／卸下。 */
  const SIGW = { viona: { name: '無上大快刀「神妃」', img: 'assets/fx/viona/sword.webp?v=199', atk: .05, hp: .05, dr: .05, desc: '初代女帝的佩刀，刀身纏繞著紫紅色的妖光。' } };
  CHARACTERS.viona.sigWeapon = 'viona';
  const sw = () => (SAVE.data.sigw = SAVE.data.sigw || {});
  function giveSig(id) { if (!SIGW[id] || sw()[id]) return; sw()[id] = { eq: true }; SAVE.save(); setTimeout(() => { try { toast(`獲得專屬武器 ${SIGW[id].name}，已自動裝備！`, 'gold'); } catch (e) { } }, 1200); }
  window.sigWeaponCard = function (c) { const W = SIGW[c.sigWeapon]; if (!W) return ''; const S2 = sw()[c.id], has = !!S2, eq = has && S2.eq;
    return `<li class="sk sigw" data-sigw-card="${c.id}"><div class="sk-top"><span class="sk-no sigw-ic"><img src="${W.img}" alt=""></span><b>${W.name}</b><em class="sk-type sigw">專屬武器</em></div>
      <p>${W.desc}裝備後：攻擊 +${pct(W.atk)}%、體力 +${pct(W.hp)}%、受到的傷害 -${pct(W.dr)}%。${has ? '' : '<br>取得方式：獲得此角色時免費贈送。'}</p>
      ${has ? `<button class="${eq ? 'btn-ghost' : 'btn-gold'} sm sigw-btn" data-sigw="${c.id}">${eq ? '卸下' : '裝備'}</button>` : '<span class="sigw-lock">尚未獲得</span>'}</li>`; };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-sigw]'); if (!b) return; const id = b.dataset.sigw, S2 = sw()[id]; if (!S2) return;
    S2.eq = !S2.eq; SAVE.save(); toast(S2.eq ? `已裝備 ${SIGW[id].name}` : `已卸下 ${SIGW[id].name}`); const card = b.closest('[data-sigw-card]'); if (card) card.outerHTML = sigWeaponCard(CHARACTERS[id]); });
  if (typeof addCrew === 'function') { const _ac = addCrew; addCrew = function (id) { const r = _ac.apply(this, arguments); try { if (SIGW[id]) giveSig(id); } catch (e) { } return r; }; }
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => { try { Object.keys(SIGW).forEach(id => { if (typeof owned === 'function' && owned(id)) giveSig(id); }); } catch (e) { } }, 1500));
  if (typeof startBattle === 'function') { const _sb2 = startBattle; startBattle = function (opts) { const r = _sb2.apply(this, arguments);
    try { const b = B(); if (b && !(opts && opts.live)) (b.team || []).forEach(f => { const W = f && SIGW[f.id], S2 = W && sw()[f.id]; if (!S2 || !S2.eq || f.__sigw) return; f.__sigw = W;
      const full = f.hp >= f.maxHp; f.maxHp = Math.round(f.maxHp * (1 + W.hp)); if (full) f.hp = f.maxHp; f.__dmgB = (f.__dmgB || 1) * (1 + W.atk); L(`⚔️ ${f.name} 裝備專屬武器 ${W.name}：攻擊 +${pct(W.atk)}%、體力 +${pct(W.hp)}%、受到的傷害 -${pct(W.dr)}%`); }); } catch (e) { } return r; }; }
  if (typeof computeSkillOutcome === 'function') { const _c2 = computeSkillOutcome; computeSkillOutcome = function (a, t) { const r = _c2.apply(this, arguments); try { if (r && r.damage > 0 && t && t.__sigw && t.__sigw.dr) r.damage = Math.max(1, Math.floor(r.damage * (1 - t.__sigw.dr))); } catch (e) { } return r; }; }

  window.VIONA187 = { st, setVenus, addMark, subdue };
})();
