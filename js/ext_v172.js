/* v172 洛基三型態（使用者 11/07 19:34）：設定跟伊姆類似，施放第 5 招「尼德霍格覺醒」就晉升型態、技能欄換新、效果強化；技能設計用來克制伊姆。
   型態：0 第一型態「詛咒王子・洛基」（原立繪，尺寸 2.5）→ 1 第二型態「尼德霍格・洛基」（loki_form2，尺寸 5）→ 2 第三型態「諸神黃昏・洛基」（loki_form3，尺寸 4.5）。
   尺寸以伊姆初始型態＝1 為單位（見下方 UNIT 換算）。
   第 5 招（4 次、不能用道具恢復）：第一次晉升第二型態、第二次晉升第三型態，第 1～4 招換成新型態的技能、次數全滿；第三型態再施放＝「諸神黃昏」。
   克制伊姆的做法（都是通用效果，對所有對手都有效）：
     sureHit 必中（無視閃避、看穿、虛空威壓與世界之王的迴避，也無視領域降低的命中）｜pierceDR／breakInvuln 穿透減傷與無敵
     lokiDispel { block }：打散對手全部強化（能力提升、護盾、減傷、無敵、閃避、反彈、荊棘、不死之身、永劫不滅、虛空威壓、看穿、對手展開的領域），並封鎖強化 block 回合
     godSlayer：對「變身／晉升／覺醒中」的對手傷害 ×godSlayer｜voidGuard／guardBreak 讓保命失效｜healSeal 壓制回復｜ultSeal 壓制奧義（含晉升）
     freeTurns 自由（不受契約、支配、封印、奪血、秒殺）｜mirror 反彈轉回｜drainForm 吸走型態加成
   既有的「巨人的意志」（ext_v109／ext_v110）保留：伊姆的支配與秒殺對洛基無效、受到伊姆的傷害減半、覺醒後受到傷害 -20%。
   載入順序：ext_v169.js、fx_imu_v170.js 之後（最外層包裝 applySkillEffects、computeSkillOutcome、playChoreo）。 */
(function () {
  const C = typeof CHARACTERS !== 'undefined' && CHARACTERS.loki; if (!C) return;
  const V = 172, img = n => `assets/chars/${n}.webp?v=${V}`;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const pct = x => Math.round(x * 100), R = (a, b) => a + Math.random() * (b - a);
  const STAGES = ['atk', 'def', 'spd'];
  const onScreen = f => { const b = B(); return !!(b && f && (f === b.player || f === b.enemy)); };
  const sideOf = f => { const b = B(); return b && f === b.enemy ? 'R' : 'L'; };
  const say = (f, t) => { try { if (onScreen(f)) floatText(sideOf(f), t, 'status'); } catch (e) { } };
  const act = o => !!(o && (o.t > 0 || o.left > 0));

  /* ---------- 資料 ---------- */
  /* 尺寸換算：使用者說的「立繪尺寸」以伊姆初始型態為 1（伊姆深淵聖靈 5.5 也是同一個單位）。洛基的立繪本身是伊姆的 1.5÷0.65 倍大，
     所以第一型態 2.5 → 對戰大小 2.5×0.65÷1.5≈1.08；第二型態 5、第三型態 4.5 → 型態倍率 5÷2.5＝2、4.5÷2.5＝1.8（視覺設定頁可再微調）。 */
  const UNIT = ((CHARACTERS.imu && CHARACTERS.imu.scale) || .65) / (C.scale || 1.5), SZ = [2.5, 5, 4.5];
  C.battleScale = Math.round(SZ[0] * UNIT * 100) / 100;
  C.forms = [
    { key: 'form1', label: '第一型態', name: '詛咒王子・洛基', title: '巨人族王子', image: C.image, avatar: C.avatar, scale: 1 },
    { key: 'form2', label: '第二型態', name: '尼德霍格・洛基', title: '第二型態', image: img('loki_form2'), avatar: img('loki_form2_face'), scale: SZ[1] / SZ[0] },
    { key: 'form3', label: '第三型態', name: '諸神黃昏・洛基', title: '第三型態', image: img('loki_form3'), avatar: img('loki_form3_face'), scale: SZ[2] / SZ[0] }
  ];
  const sk = o => Object.assign({ accuracy: 100, maxPP: o.pp, tags: [] }, o);
  const ANTI = '這招必中：無視閃避、看穿、迴避與降低命中的效果；出招前打破對手的無敵，並無視對手的減傷。';
  C.form2Skills = [
    sk({ name: '冥龍雷息', type: 'attack', power: 95, pp: 10, anima: 'bolt',
      desc: `尼德霍格噴出黑雷吐息：連續攻擊 3～6 次；命中後 3 回合內對手的回復量 -60%。${ANTI}`,
      tags: [['連擊', 'blue'], ['必中', 'red'], ['回復壓制', 'red']],
      effect: { multiHitNormal: [3, 6], perHitPower: 95, sureHit: true, pierceDR: 1, breakInvuln: true, healSeal: { turns: 3, cut: .6 } } }),
    sk({ name: '啃噬世界樹', type: 'attack', power: 230, pp: 6, anima: 'chomp',
      desc: `咬碎支撐世界的根：打散對手身上全部的強化（能力提升、護盾、減傷、無敵、閃避、反彈、不死、永劫、看穿，以及對手展開的領域），2 回合內無法獲得強化；吸走對手一半的型態與傷害加成，並追加對手最大體力 8% 的真實傷害。${ANTI}`,
      tags: [['驅散', 'red'], ['封鎖強化', 'red'], ['吸收加成', 'gold'], ['必中', 'red']],
      effect: { sureHit: true, pierceDR: 1, breakInvuln: true, lokiDispel: { block: 2 }, drainForm: .5, trueBurst: { pct: .08, label: '世界樹之根的真實傷害' } } }),
    sk({ name: '冥龍鱗甲', type: 'support', pp: 5, anima: 'awaken',
      desc: '漆黑龍鱗覆蓋全身：獲得最大體力 35% 的護盾並回復 20% 體力，清除自身負面狀態；解除身上的契約、支配、封印、存在抹除等效果（契約類反轉給對手）；接下來 4 回合是「自由」的（不受契約、支配、封印、壓制、奪取體力與秒殺），反彈到自己身上的傷害全部轉回去。',
      tags: [['護盾', 'green'], ['自由', 'gold'], ['淨化', 'green'], ['反轉反彈', 'gold']],
      effect: { selfShieldMaxHpRatio: .35, healRatio: .2, clearSelfDebuffs: true, cleanseMarks: true, freeTurns: 4, mirror: 4 } }),
    sk({ name: '黑雷裂空', type: 'attack', power: 280, pp: 5, anima: 'thunder',
      desc: `撕裂天空的黑雷：80% 機率讓對手的保命效果（撐住致命傷、不死、永劫、瀕死回滿、命數）全部失效，這一擊足以擊倒對手時 80% 機率貫穿保命；命中後 2 回合內對手無法使用奧義（含變身與晉升）；55% 使對手無法攻擊或下一招失效。${ANTI}`,
      tags: [['破保命', 'red'], ['奧義壓制', 'red'], ['麻痺', 'blue'], ['必中', 'red']],
      effect: { sureHit: true, pierceDR: 1, breakInvuln: true, voidGuard: .8, guardBreak: .8, ultSeal: 2, lokiStun: .55 } })
  ];
  C.form3Skills = [
    sk({ name: '諸神黃昏之雷', type: 'attack', power: 115, pp: 10, anima: 'bolt',
      desc: `終末之雷連續落下 5～8 次，造成傷害的 20% 回復到自己身上；命中後 4 回合內對手的回復量 -80%。${ANTI}`,
      tags: [['連擊', 'blue'], ['吸血', 'green'], ['回復壓制', 'red'], ['必中', 'red']],
      effect: { multiHitNormal: [5, 8], perHitPower: 115, sureHit: true, pierceDR: 1, breakInvuln: true, lifesteal: .2, healSeal: { turns: 4, cut: .8 } } }),
    sk({ name: '弒神之爪', type: 'attack', power: 320, pp: 6, anima: 'claw',
      desc: `專殺神明的巨爪：打散對手全部的強化與領域，3 回合內無法獲得強化，對手的保命效果全部失效，並吸走對手全部的型態與傷害加成；對「變身、晉升、覺醒中」的對手傷害 ×2。${ANTI}`,
      tags: [['弒神', 'red'], ['驅散', 'red'], ['破保命', 'red'], ['吸收加成', 'gold'], ['必中', 'red']],
      effect: { sureHit: true, pierceDR: 1, breakInvuln: true, lokiDispel: { block: 3 }, voidGuard: 1, drainForm: 1, godSlayer: 2 } }),
    sk({ name: '芬布爾之冬', type: 'support', pp: 4, anima: 'ice',
      desc: '降下終末的永冬：打散對手全部的強化與展開的領域，4 回合內對手無法獲得強化、回復量 -80%，3 回合內無法使用奧義（含變身與晉升）；自身獲得最大體力 30% 的護盾，接下來 4 回合是「自由」的，反彈到自己身上的傷害全部轉回去。',
      tags: [['驅散', 'red'], ['封鎖強化', 'red'], ['奧義壓制', 'red'], ['回復壓制', 'red'], ['自由', 'gold']],
      effect: { lokiDispel: { block: 4 }, healSeal: { turns: 4, cut: .8 }, ultSeal: 3, selfShieldMaxHpRatio: .3, freeTurns: 4, mirror: 4 } }),
    sk({ name: '拉格納洛克', type: 'attack', power: 420, pp: 4, anima: 'ragnarok',
      desc: `諸神的黃昏：這一擊足以擊倒對手時必定貫穿保命，並讓對手的保命效果全部失效；追加對手最大體力 10% 的真實傷害，後排還沒上場的角色受到這次傷害 40% 的波及；對「變身、晉升、覺醒中」的對手傷害 ×1.5。${ANTI}`,
      tags: [['終焉', 'gold'], ['破保命', 'red'], ['波及後排', 'red'], ['弒神', 'red'], ['必中', 'red']],
      effect: { sureHit: true, pierceDR: 1, breakInvuln: true, guardBreak: 1, voidGuard: 1, splash: .4, godSlayer: 1.5, trueBurst: { pct: .1, label: '拉格納洛克的真實傷害' } } })
  ];
  /* 第 5 招：換成晉升（取代原本的「尼德霍格覺醒」覺醒效果與變身立繪） */
  { const U = C.skills[4]; if (U) {
    Object.assign(U, { name: '尼德霍格覺醒', type: 'support', pp: 4, maxPP: 4, ultimate: true, power: 0, accuracy: 100,
      desc: '奧義（4 次，無法用道具恢復）。第一次施放晉升為第二型態「尼德霍格・洛基」，第二次施放晉升為第三型態「諸神黃昏・洛基」；每次晉升技能欄都換成新型態的技能，第 1～4 招次數全部恢復，全部傷害再提高（第二型態 ×1.4、第三型態 ×1.8）。每次施放：全能力 +2、清除自身負面狀態、獲得最大體力 30% 的護盾並回復 35% 體力、接下來 3 回合是「自由」的（不受契約、支配、封印、壓制、奪取體力與秒殺）、反彈到自己身上的傷害轉回去；覺醒後直到倒下前受到的傷害 -20%，每 5 回合清除對手的能力提升。第三型態時再次施放改為「諸神黃昏」：打散對手全部的強化與領域、3 回合內無法獲得強化與使用奧義，對手失去最大體力 25% 的體力（BOSS 為 8%），自身 2 回合無敵。',
      tags: [['奧義', 'gold'], ['變身', 'gold'], ['自由', 'gold'], ['護盾', 'green'], ['驅散', 'red']],
      effect: { lokiAscend: { mul: [1.4, 1.8], final: { strike: .25, bossStrike: .08, block: 3, ult: 3, inv: 2 } }, statUpAll: 2, clearSelfDebuffs: true, selfShieldMaxHpRatio: .3, healRatio: .35, freeTurns: 3, mirror: 3, immunePermanent: true, lokiEternal: true, noRestore: true } });
  } }
  if (C.desc && !C.desc.includes('三種型態')) C.desc = '艾爾巴夫的王子「詛咒王子」。吃下幻獸種尼德霍格的果實，施放「尼德霍格覺醒」晉升為尼德霍格・洛基、再晉升為諸神黃昏・洛基。招式必中、穿透無敵與減傷、打散強化、讓保命失效，是專門對抗世界之王的力量。';

  /* ---------- 型態 ---------- */
  const isLoki = f => !!(f && f.__loki);
  function init(f) { if (!f || f.id !== 'loki' || f.__loki) return f; f.__loki = { form: 0, pow: 1, base: { image: f.image, avatar: f.avatar, name: f.name, title: f.title } }; return f; }
  function setForm(f, form) {
    const I = f.__loki, F = C.forms[form] || C.forms[0], src = form === 0 ? I.base : F;
    f.image = src.image; f.avatar = src.avatar; f.name = src.name; f.title = src.title;
    const VO = form && typeof visualOverride === 'function' ? visualOverride('form:loki_form' + form) : null;
    f.visMul = form === 0 ? 1 : (VO && VO.battleScale) || F.scale || 1; f.mirror = VO && VO.faceLeft !== undefined ? VO.faceLeft : false;
    if (!onScreen(f)) return;
    try { if (typeof refreshFighterImage === 'function') refreshFighterImage(f); } catch (e) { }
    const S = sideOf(f), $$ = id => document.getElementById(id);
    try { if ($$('bName' + S)) $$('bName' + S).textContent = f.name; if ($$('bTitle' + S)) $$('bTitle' + S).textContent = f.title; if ($$('bAv' + S)) $$('bAv' + S).src = f.avatar; if (S === 'L' && typeof renderTeam === 'function') renderTeam(); } catch (e) { }
  }
  function swap(f, form) {
    const K = C['form' + (form + 1) + 'Skills'] || []; const lv = f.level || (typeof MAX_LV !== 'undefined' ? MAX_LV : 100), adj = (typeof lvStats === 'function' ? lvStats(C, lv).ppAdj : 0) || 0;
    K.forEach((src, i) => { const s = JSON.parse(JSON.stringify(src)); const n = typeof skillPP === 'function' ? skillPP(s, lv, adj) : s.maxPP; s.pp = s.maxPP = n; f.skills[i] = s; });
    L(`🐉 技能欄換成${form === 2 ? '第三' : '第二'}型態：${K.map(x => `「${x.name}」`).join('')}，第 1～4 招次數全滿！`);
  }
  const transformed = t => !!(t && ((t.__imu && t.__imu.form > 0) || (t.__loki && t.__loki.form > 0) || (t.status && (t.status.formTurns > 0 || t.status.awakened || (t.status.__dragon && t.status.__dragon.t > 0))) || (t.baseImage && t.image !== t.baseImage)));

  function dispel(f, t, D) {
    if (!t || t === f || t.hp <= 0 || t.voidImmune) return;
    const T = t.status, gone = []; let n = 0;
    STAGES.forEach(k => { if (t.buffs[k] > 0) { n += t.buffs[k]; t.buffs[k] = 0; } }); if (n) gone.push(`能力提升 ${n} 階`);
    const z = (k, name) => { if (T[k] && (T[k] > 0 || T[k].t > 0)) { T[k] = typeof T[k] === 'object' ? null : 0; gone.push(name); } };
    z('shield', '護盾'); z('damageReductionTurns', '減傷'); if (T.invuln > 0 || T.__imuInv > 0) { T.invuln = 0; T.__imuInv = 0; gone.push('無敵'); }
    z('dodge', '閃避'); z('reflect', '反彈'); z('thornTurns', '荊棘'); z('regen', '持續回復'); z('__imuUnd', '不死之身'); z('__imuEt', '永劫不滅'); z('__imuEv', '虛空威壓'); z('__foresee', '看穿');
    const b = B(); if (b && b.__imuDom && b.__imuDom.t > 0) { const own = b.__imuDom.owner || (b.__imuDom.side === 'E' ? b.enemy : null); if (!own || own === t || (b.__imuDom.side === 'E') === (t === b.enemy)) { gone.push(b.__imuDom.name || '世界之王領域'); b.__imuDom = null; } }
    if (b && b.eruption && b.eruption.owner === t) { b.eruption = null; gone.push('火山噴發'); } if (b && b.iceAge && b.iceAge.owner === t) { b.iceAge = null; gone.push('冰河時期'); }
    if (D.block) T.buffBlock = Math.max(T.buffBlock || 0, D.block);
    L(gone.length ? `🐉 ${f.name} 打散了 ${t.name} 的強化：${gone.join('、')}${D.block ? `；${D.block} 回合內無法獲得強化` : ''}` : `🐉 ${t.name} 身上沒有可以打散的強化${D.block ? `；${D.block} 回合內無法獲得強化` : ''}`);
    if (gone.length) say(t, '驅散');
  }
  function ragnarok(f, t, J) {
    if (!t || t.hp <= 0) return; dispel(f, t, { block: J.block });
    if (t.voidImmune) { L(`🐉 ${t.name} 不受諸神黃昏的比例傷害影響！`); }
    else { const b = B(), boss = !!(b && b.isBoss && t === b.enemy); const d = Math.max(1, Math.floor(t.maxHp * (boss ? J.bossStrike : J.strike))); const h0 = t.hp; t.hp = Math.max(0, t.hp - d);
      try { if (onScreen(t)) showDamage(sideOf(t), h0 - t.hp, '#b06bff'); } catch (e) { } L(`🌑 諸神黃昏！${t.name} 失去 ${h0 - t.hp} 點體力（最大體力的 ${pct(boss ? J.bossStrike : J.strike)}%）`); }
    if (J.ult) { t.status.__ultSeal = Math.max(t.status.__ultSeal || 0, J.ult); L(`⛓️ ${t.name} ${J.ult} 回合內無法使用奧義（含變身與晉升）`); }
    if (J.inv) { f.status.invuln = Math.max(f.status.invuln || 0, J.inv); L(`🛡️ ${f.name} 無敵 ${J.inv} 回合`); }
  }
  function ascend(f, t, A) {
    const I = f.__loki;
    if (I.form < C.forms.length - 1) {
      I.form++; I.pow = A.mul[I.form - 1] || I.pow; const F = C.forms[I.form];
      L(`🐉 ${f.__loki.base.name} 晉升為${F.label}「${F.name}」！全部傷害 ×${I.pow}`);
      swap(f, I.form); setForm(f, I.form); say(f, F.label);
    } else { L(`🌑 ${f.name} 施放「諸神黃昏」！`); ragnarok(f, t, A.final); }
    if (onScreen(f) && f === B().player && typeof renderSkills === 'function') try { renderSkills(); } catch (e) { }
  }

  /* ---------- 技能效果 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    const r = _ase.apply(this, arguments);
    try { const ef = (skill && skill.effect) || {};
      if (ef.lokiDispel && actor && target && target !== actor && (skill.type !== 'attack' || (result && result.damage > 0))) dispel(actor, target, ef.lokiDispel);
      if (ef.lokiAscend && isLoki(actor)) ascend(actor, target, ef.lokiAscend);
    } catch (e) { console.warn('洛基型態效果錯誤', e); }
    return r;
  };
  if (typeof computeSkillOutcome === 'function') { const _cso = computeSkillOutcome;
    computeSkillOutcome = function (actor, target, skill) {
      const r = _cso.apply(this, arguments);
      try { if (r && r.damage > 0 && actor && skill && skill.type === 'attack') { let m = isLoki(actor) ? actor.__loki.pow || 1 : 1; const g = skill.effect && skill.effect.godSlayer; if (g && transformed(target)) { m *= g; r.__god = 1; }
        if (m !== 1) r.damage = Math.floor(r.damage * m); if (r.__god) L(`⚔️ 弒神！對變身中的 ${target.name} 傷害 ×${g}`); } } catch (e) { }
      return r; }; }
  /* 必中也無視「降低命中」（世界之王領域把命中降 50～60%）：在 IMU165.preAct 之後把命中改回 100 */
  if (window.IMU165) { const I = window.IMU165, _pre = I.preAct;
    I.preAct = function (actor, target, idx) { const out = _pre.apply(this, arguments);
      try { const s = out && !out.skip && out.idx >= 0 && actor && actor.skills ? actor.skills[out.idx] : null; if (s && s.effect && s.effect.sureHit && s.accuracy < 100) { if (!out.acc) out.acc = [s, s.accuracy]; s.accuracy = 100; } } catch (e) { }
      return out; }; }

  /* ---------- 建立角色、開戰、狀態標籤 ---------- */
  if (typeof buildFighter === 'function') { const _bf = buildFighter; buildFighter = function (id) { const f = _bf.apply(this, arguments); if (id === 'loki') init(f); return f; }; }
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { const r = _sb.apply(this, arguments); const b = B(); if (b) [b.enemy, ...(b.team || [])].forEach(f => { if (f && f.id === 'loki') init(f); }); return r; }; }
  if (typeof statusChips === 'function') { const _sc = statusChips; statusChips = function (c) { const h0 = _sc.apply(this, arguments); if (!isLoki(c) || !c.__loki.form) return h0;
    const F = C.forms[c.__loki.form]; return `<span class="chip up" title="尼德霍格覺醒晉升的型態，全部傷害 ×${c.__loki.pow}">${F.label}</span><span class="chip up" title="型態傷害加成">傷害 ×${c.__loki.pow}</span>` + h0; }; }

  /* ---------- 特效：第二、第三型態的招式與晉升 ---------- */
  const X = () => FXE.P, sl = ms => (typeof sleep === 'function' ? sleep(ms) : new Promise(r => setTimeout(r, ms)));
  const LFX = {
    '冥龍雷息': async A => { moveFighter(A.S, 'recoil'); SFX.play('zap'); for (let i = 0; i < 4; i++) { X().beam(A.f.x + A.d * 60, A.f.y - 40, A.t.x + R(-30, 30), A.t.y + R(-40, 30), { w: 30 - i * 4, c1: '#ffffff', c2: i % 2 ? '#7a5cff' : '#5fb8ff', life: .3 }); await sl(90); } X().burst(A.t.x, A.t.y, { r: 120, color: '#8a6bff' }); X().bolt(A.t.x, -20, A.t.x, A.t.y, { w: 10, color: '#b9a8ff' }); },
    '啃噬世界樹': async A => { moveFighter(A.S, 'lunge'); SFX.play('whoosh'); await sl(160); X().cracks(A.t.x, A.t.y + 70, { n: 12, len: 260, color: '#6b3cff' }); X().slash(A.t.x, A.t.y, { a: -2.3, span: 1.6, r: 170, w: 26, color: '#2a0f4a', life: .3 }); X().slash(A.t.x, A.t.y, { a: .9, span: 1.6, r: 170, w: 26, color: '#2a0f4a', life: .3 }); await sl(120); SFX.play('explode'); X().particles({ x: A.t.x, y: A.t.y, n: 26, spd: [160, 420], life: [.4, .8], size: [4, 9], colors: ['#ffe27a', '#ffffff', '#b9a8ff'], shape: 'spark', add: true, g: 120 }); X().ring(A.t.x, A.t.y, { r1: 260, color: '#ffe27a', w: 8, life: .4 }); shake(); },
    '冥龍鱗甲': async A => { SFX.play('buff'); X().vortex(A.f.x, A.f.y, { r: 150, color: '#2a0f4a', core: '#000000', rim: '#8a6bff', arms: 6, spin: 6, life: .7 }); await sl(220); X().ring(A.f.x, A.f.y, { r1: 190, color: '#b9a8ff', w: 10, life: .5 }); X().particles({ x: A.f.x, y: A.f.y, n: 30, spd: [60, 200], life: [.5, 1], size: [4, 8], colors: ['#b9a8ff', '#ffffff'], shape: 'spark', add: true, g: 0 }); },
    '黑雷裂空': async A => { moveFighter(A.S, 'float'); SFX.play('thunder'); X().tint('#1a0b33', .9, .4); for (let i = 0; i < 5; i++) setTimeout(() => X().bolt(A.t.x + R(-90, 90), -30, A.t.x + R(-20, 20), A.t.y, { w: 12, color: i % 2 ? '#ffffff' : '#7a5cff' }), i * 70); await sl(380); X().cracks(A.t.x, A.t.y + 70, { n: 10, len: 220, color: '#b9a8ff' }); X().flash('#ffffff', .25, .15); shake(); },
    '諸神黃昏之雷': async A => { SFX.play('thunder'); X().tint('#2a0a3a', .9, .45); for (let i = 0; i < 8; i++) setTimeout(() => { X().bolt(A.t.x + R(-120, 120), -30, A.t.x + R(-30, 30), A.t.y + R(-20, 30), { w: 9, color: i % 2 ? '#ff9cf5' : '#c86bff' }); if (i % 3 === 0) SFX.play('zap'); }, i * 55); await sl(460); X().burst(A.t.x, A.t.y, { r: 150, color: '#ff7ae6' }); },
    '弒神之爪': async A => { moveFighter(A.S, 'dash'); SFX.play('whoosh'); await sl(200); for (let i = 0; i < 3; i++) X().slash(A.t.x + (i - 1) * 26, A.t.y, { a: -2.2, span: 1.5, r: 210, w: 18, color: i === 1 ? '#ffffff' : '#c86bff', life: .32 }); await sl(120); SFX.play('explode'); X().particles({ x: A.t.x, y: A.t.y, n: 30, spd: [160, 420], life: [.4, .8], size: [4, 9], colors: ['#ffe27a', '#ffffff', '#ff9cf5'], shape: 'spark', add: true, g: 120 }); X().rays(A.t.x, A.t.y, { r: 260, n: 14, c1: 'rgba(255,170,250,.9)' }); X().flash('#ffffff', .25, .15); shake(); },
    '芬布爾之冬': async A => { SFX.play('ice'); X().tint('#bfe6ff', 1.2, .4); X().particles({ x: FXE.W / 2, y: -20, n: 70, spd: [60, 200], ang: [1.3, 1.9], life: [1, 1.6], size: [3, 7], colors: ['#ffffff', '#dff6ff', '#c86bff'], g: 40 }); await sl(260); X().spikes(A.t.x, A.t.y + 100, { n: 14, w: 220, life: 1.1, color: '#e8f6ff' }); X().ring(A.f.x, A.f.y, { r1: 180, color: '#dff6ff', w: 8, life: .5 }); },
    '拉格納洛克': async A => { moveFighter(A.S, 'leap'); SFX.play('ult'); X().tint('#120018', 1.4, .55); X().wings(A.f.x, A.f.y - 40, { color: '#c86bff', life: .9 }); await sl(420); for (let i = 0; i < 6; i++) setTimeout(() => X().bolt(A.t.x + R(-140, 140), -30, A.t.x + R(-40, 40), A.t.y, { w: 14, color: i % 2 ? '#ffffff' : '#ff7ae6' }), i * 60); X().beam(A.f.x, A.f.y - 40, A.t.x, A.t.y, { w: 60, c1: '#ffffff', c2: '#c86bff', life: .5 }); await sl(380); SFX.play('explode'); X().pillar(A.t.x, A.t.y, { w: 160, color: '#c86bff', life: .7 }); X().cracks(A.t.x, A.t.y + 70, { n: 16, len: 320, color: '#ff9cf5' }); X().flash('#ffffff', .35, .2); shake(); }
  };
  async function ascendFx(A, form) {
    if (form === 1) { SFX.play('ult'); X().tint('#0d0620', 1.6, .55); X().vortex(A.f.x, A.f.y, { r: 220, color: '#2a0f4a', core: '#000000', rim: '#5fb8ff', arms: 7, spin: 7, life: 1.1 }); for (let i = 0; i < 6; i++) setTimeout(() => X().bolt(A.f.x + R(-160, 160), -30, A.f.x + R(-40, 40), A.f.y, { w: 12, color: i % 2 ? '#ffffff' : '#5fb8ff' }), 200 + i * 90); await sl(800); X().flash('#ffffff', .4, .25); shake(); }
    else { SFX.play('ult'); X().tint('#1a0024', 1.8, .6); X().wings(A.f.x, A.f.y - 40, { color: '#c86bff', life: 1.3 }); X().particles({ x: A.f.x, y: A.f.y - 40, n: 60, spd: [120, 360], life: [.8, 1.4], size: [6, 12], colors: ['#c86bff', '#ff9cf5', '#2a0f4a'], shape: 'petal', g: 60 }); for (let i = 0; i < 8; i++) setTimeout(() => X().bolt(A.f.x + R(-200, 200), -30, A.f.x + R(-50, 50), A.f.y, { w: 10, color: i % 2 ? '#ffffff' : '#ff7ae6' }), 150 + i * 80); await sl(900); X().flash('#ffffff', .45, .25); shake(); }
  }
  async function finalFx(A) { SFX.play('ult'); X().tint('#000000', 1.6, .65); X().rays(A.t.x, A.t.y, { r: 420, n: 20, c1: 'rgba(200,107,255,.9)' }); await sl(300); for (let i = 0; i < 10; i++) setTimeout(() => X().bolt(A.t.x + R(-180, 180), -30, A.t.x + R(-30, 30), A.t.y, { w: 14, color: i % 2 ? '#ffffff' : '#c86bff' }), i * 50); await sl(520); X().pillar(A.t.x, A.t.y, { w: 200, color: '#ffffff', life: .8 }); X().flash('#ffffff', .4, .25); shake(); }
  if (typeof playChoreo === 'function') { const _pc = playChoreo;
    window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      if (!isLoki(actor) || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') return _pc.apply(this, arguments);
      const I = actor.__loki, S = side === 'P' ? 'L' : 'R', T = S === 'L' ? 'R' : 'L';
      const fn = idx === 4 ? (I.form >= 2 ? finalFx : (A => ascendFx(A, I.form + 1))) : (I.form > 0 ? LFX[skill && skill.name] : null);
      if (!fn) return _pc.apply(this, arguments);
      try { FXE.ensure(); const A = { S, T, f: fighterPoint(S), t: fighterPoint(T), d: S === 'L' ? 1 : -1 }; await fn(A); } catch (e) { console.warn(e); return _pc.apply(this, arguments); }
    }; }
  window.LOKI172 = { init, setForm, ascend, dispel, transformed };
})();
