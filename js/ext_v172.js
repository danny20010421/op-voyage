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
    { key: 'form2', label: '第二型態', name: '尼德霍格・洛基', title: '第二型態', image: img('loki_form2'), avatar: img('loki_form2_face'), scale: 5 } /* v172b 使用者 11/07 22:05：第二型態立繪尺寸 5（型態倍率 5）；v173 起由自動取景（cam_v173.js）處理超出畫面 */,
    { key: 'form3', label: '第三型態', name: '諸神黃昏・洛基', title: '第三型態', image: img('loki_form3'), avatar: img('loki_form3_face'), scale: SZ[2] / SZ[0] }
  ];
  const sk = o => Object.assign({ accuracy: 100, maxPP: o.pp, tags: [] }, o);
  /* v173b 使用者 11/08「洛基的技能太亂了……不要每一個技能既能攻擊也能有效果」：攻擊招只打傷害，效果集中在輔助招。
     克制伊姆的「必中、打破無敵、無視減傷」改成第二、三型態攻擊的被動（寫在第 5 招說明），不在每招重複。 */
  const P2 = { sureHit: true, pierceDR: 1, breakInvuln: true }, P3 = Object.assign({ guardBreak: 1 }, P2);
  const atk = (name, power, pp, anima, desc, tags, ef) => sk({ name, type: 'attack', power, pp, anima, desc, tags, effect: ef || {} });
  const sup = (name, pp, anima, desc, tags, ef) => sk({ name, type: 'support', pp, anima, desc, tags, effect: ef });
  /* v177（使用者 11/08 04:55）：每型態的技能比例重新分配——攻擊招都附帶特殊效果、每型態至少一招輔助；說明寫清楚【範圍】、威力與段數、每個效果。
     第二、三型態的攻擊共通被動寫在每招最後：【必中】【破無敵】【穿透】（第三型態再加【貫穿保命】）。 */
  const PS2 = '型態被動：【必中】不會被閃避、看穿、迴避躲開；【破無敵】出招前打破對手的無敵；【穿透】無視對手的減傷。';
  const PS3 = '型態被動：【必中】【破無敵】【穿透】同第二型態；【貫穿保命】這一擊足以擊倒對手時，撐住致命傷、不死之身、永劫不滅等保命效果無效。';
  /* 第一型態（詛咒王子・洛基），傷害 ×1 */
  const F1 = [
    atk('雷電噴吐', 85, 10, 'bolt', '【範圍】單體。從口中噴出雷電，威力 85 × 3～5 段。【效果】命中後 30% 機率麻痺：對手 1 回合無法攻擊，或下一招失效。',
      [['連擊', 'blue'], ['麻痺', 'blue']], { multiHitNormal: [3, 5], perHitPower: 85, lokiStun: .3 }),
    atk('鐵雷', 230, 8, 'thunder', '【範圍】單體。舉起鐵錘砸下雷霆，威力 230 × 1 段。【效果】50% 機率讓對手破防 3 回合（防禦下降，受到的傷害提高）。',
      [['重擊', 'red'], ['破防', 'red']], { armorBreakChance: .5, armorBreakTurns: 3 }),
    sup('原初世界', 5, 'awaken', '【範圍】對手＋自身，不造成傷害。【效果】① 打散對手身上全部的強化：能力提升、護盾、減傷、無敵、閃避、反彈、持續回復，以及伊姆的不死之身、永劫不滅、看穿；② 打散對手展開的領域（例如伊姆的世界之王）；③ 清除自己身上全部的負面狀態；④ 自己獲得最大體力 20% 的護盾。',
      [['驅散', 'red'], ['淨化', 'green'], ['護盾', 'green']], { lokiDispel: { block: 0 }, clearSelfDebuffs: true, selfShieldMaxHpRatio: .2 }),
    atk('鐵雷五矢', 260, 5, 'thunder', '【範圍】單體＋後排波及。五道鐵雷同時落下，威力 260 × 1 段。【效果】① 追加對手最大體力 5% 的真實傷害（無視護盾、減傷與防禦；對 BOSS 減半）；② 對手後排還沒上場的角色受到這次傷害 25% 的波及。',
      [['強力', 'red'], ['真實傷害', 'gold'], ['波及後排', 'red']], { trueBurst: { pct: .05, label: '第五道鐵雷的真實傷害' }, splash: .25 })
  ];
  F1.forEach((x, i) => { const o = C.skills[i]; if (o) { Object.keys(o).forEach(k => delete o[k]); Object.assign(o, x); } });
  /* 第二型態（尼德霍格・洛基），傷害 ×1.4 */
  C.form2Skills = [
    atk('冥龍雷息', 95, 10, 'bolt', `【範圍】單體。尼德霍格噴出黑雷吐息，威力 95 × 3～6 段。【效果】命中後 2 回合內對手的回復量 -40%。${PS2}`,
      [['連擊', 'blue'], ['回復壓制', 'red'], ['必中', 'red']], Object.assign({ multiHitNormal: [3, 6], perHitPower: 95, healSeal: { turns: 2, cut: .4 } }, P2)),
    atk('黑雷裂空', 300, 6, 'thunder', `【範圍】單體。撕裂天空的黑雷，威力 300 × 1 段。【效果】① 2 回合內對手無法使用奧義（伊姆的「最初20人」晉升也會被擋下）；② 55% 機率麻痺：對手 1 回合無法攻擊，或下一招失效。${PS2}`,
      [['重擊', 'red'], ['奧義壓制', 'red'], ['麻痺', 'blue'], ['必中', 'red']], Object.assign({ ultSeal: 2, lokiStun: .55 }, P2)),
    atk('啃噬世界樹', 180, 5, 'chomp', `【範圍】單體。咬碎支撐世界的根，威力 180 × 1 段。【效果】① 打散對手身上全部的強化與展開的領域（內容同「原初世界」）；② 接下來 2 回合，對手無法再獲得任何強化；③ 吸走對手一半的型態與傷害加成。${PS2}`,
      [['驅散', 'red'], ['封鎖強化', 'red'], ['吸收加成', 'gold'], ['必中', 'red']], Object.assign({ lokiDispel: { block: 2 }, drainForm: .5 }, P2)),
    sup('冥龍鱗甲', 5, 'awaken', '【範圍】自身，不造成傷害。【效果】① 獲得最大體力 35% 的護盾；② 回復最大體力 20% 的體力；③ 接下來 4 回合進入「自由」：不會被契約、支配、技能封印、能力壓制、奪取體力與秒殺影響。',
      [['護盾', 'green'], ['回復', 'green'], ['自由', 'gold']], { selfShieldMaxHpRatio: .35, healRatio: .2, freeTurns: 4 })
  ];
  /* 第三型態（諸神黃昏・洛基），傷害 ×1.8 */
  C.form3Skills = [
    atk('諸神黃昏之雷', 115, 10, 'bolt', `【範圍】單體。終末之雷連續落下，威力 115 × 5～8 段。【效果】造成傷害的 20% 回復到自己身上。${PS3}`,
      [['連擊', 'blue'], ['吸血', 'green'], ['必中', 'red'], ['貫穿保命', 'red']], Object.assign({ multiHitNormal: [5, 8], perHitPower: 115, lifesteal: .2 }, P3)),
    atk('拉格納洛克', 420, 5, 'ragnarok', `【範圍】單體＋後排波及。諸神黃昏的終焉一擊，威力 420 × 1 段。【效果】① 追加對手最大體力 8% 的真實傷害（無視護盾、減傷與防禦；對 BOSS 減半）；② 對手後排還沒上場的角色受到這次傷害 40% 的波及。${PS3}`,
      [['終焉', 'gold'], ['真實傷害', 'gold'], ['波及後排', 'red'], ['貫穿保命', 'red']], Object.assign({ trueBurst: { pct: .08, label: '拉格納洛克的真實傷害' }, splash: .4 }, P3)),
    sup('芬布爾之冬', 4, 'ice', '【範圍】對手，不造成傷害。【效果】① 打散對手身上全部的強化與展開的領域（內容同「原初世界」）；② 接下來 4 回合，對手無法再獲得任何強化，回復量 -80%；③ 接下來 3 回合，對手無法使用奧義（伊姆的「最初20人」晉升也會被擋下）。',
      [['驅散', 'red'], ['封鎖強化', 'red'], ['回復壓制', 'red'], ['奧義壓制', 'red']], { lokiDispel: { block: 4 }, healSeal: { turns: 4, cut: .8 }, ultSeal: 3 }),
    sup('諸神之鎧', 5, 'awaken', '【範圍】自身，不造成傷害。【效果】① 獲得最大體力 40% 的護盾；② 回復最大體力 25% 的體力；③ 清除自己身上全部的負面狀態；④ 接下來 4 回合進入「自由」：不會被契約、支配、技能封印、能力壓制、奪取體力與秒殺影響。',
      [['護盾', 'green'], ['回復', 'green'], ['淨化', 'green'], ['自由', 'gold']], { selfShieldMaxHpRatio: .4, healRatio: .25, clearSelfDebuffs: true, freeTurns: 4 })
  ];
  /* 第 5 招：晉升；v177 每次施放都把第 1～4 招的次數恢復到全滿（第 5 招本身不恢復） */
  { const U = C.skills[4]; if (U) {
    Object.keys(U).forEach(k => delete U[k]);
    Object.assign(U, { name: '尼德霍格覺醒', type: 'support', pp: 4, maxPP: 4, ultimate: true, power: 0, accuracy: 100, anima: 'awaken',
      desc: '奧義，共 4 次（無法用道具恢復）。【範圍】自身（第三型態時為對手）。【每次施放】第 1～4 招的次數全部恢復到全滿（第 5 招不恢復），並回復最大體力 30% 的體力。【第 1 次】晉升為第二型態「尼德霍格・洛基」：技能欄換成第二型態的 4 招，全部傷害 ×1.4，攻擊獲得【必中】【破無敵】【穿透】。【第 2 次】晉升為第三型態「諸神黃昏・洛基」：技能欄換成第三型態的 4 招，全部傷害 ×1.8，攻擊再獲得【貫穿保命】。【第 3 次以後】改為「諸神黃昏」：對手直接失去最大體力 25% 的體力（BOSS 為 8%）。',
      tags: [['奧義', 'gold'], ['變身', 'gold'], ['恢復次數', 'green']],
      effect: { lokiAscend: { mul: [1.4, 1.8], final: { strike: .25, bossStrike: .08 } }, healRatio: .3, noRestore: true } });
  } }
  if (C.desc && !C.desc.includes('三種型態')) C.desc = '艾爾巴夫的王子「詛咒王子」，有三種型態。吃下幻獸種尼德霍格的果實，施放奧義「尼德霍格覺醒」晉升為尼德霍格・洛基、再晉升為諸神黃昏・洛基。攻擊必中、打破無敵、無視減傷，輔助招能打散強化與領域、封鎖強化與奧義，是專門對抗世界之王伊姆的力量；伊姆的支配與秒殺對他無效。';

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
    if (!t || t.hp <= 0) return;
    if (t.voidImmune) { L(`🐉 ${t.name} 不受諸神黃昏的比例傷害影響！`); }
    else { const b = B(), boss = !!(b && b.isBoss && t === b.enemy); const d = Math.max(1, Math.floor(t.maxHp * (boss ? J.bossStrike : J.strike) * (isImuF(t) ? VS().atk : 1))); const h0 = t.hp; t.hp = Math.max(0, t.hp - d);
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
    { let n = 0; f.skills.slice(0, 4).forEach(s => { if (s && s.maxPP && s.pp < s.maxPP) { s.pp = s.maxPP; n++; } }); if (n) L(`🔄 ${f.name} 第 1～4 招的次數全部恢復！`); } /* v177：每次施放都恢復第 1～4 招 */
    if (onScreen(f) && f === B().player && typeof renderSkills === 'function') try { renderSkills(); } catch (e) { }
  }

  /* ---------- 技能效果 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    const vs = isLoki(actor) && isImuF(target) && VS().atk !== 1, d0 = actor && actor.__dmgB; if (vs) actor.__dmgB = (d0 || 1) * VS().atk; /* 比例與真實傷害也套用對伊姆倍率 */
    let r; try { r = _ase.apply(this, arguments); } finally { if (vs) actor.__dmgB = d0; }
    try { const ef = (skill && skill.effect) || {};
      if (ef.lokiDispel && actor && target && target !== actor && (skill.type !== 'attack' || (result && result.damage > 0))) dispel(actor, target, ef.lokiDispel);
      if (ef.lokiAscend && isLoki(actor)) ascend(actor, target, ef.lokiAscend);
    } catch (e) { console.warn('洛基型態效果錯誤', e); }
    return r;
  };
  /* v172b 使用者 11/07 22:05「洛基打贏伊姆的機率 60～65% 就好」：洛基與伊姆互打時的傷害倍率（模擬調出來的值，見 CHANGELOG） */
  /* 模擬（tests/imu-sim.js，各 60～120 場）調出來的：BOSS／勇者之塔／虛空王座的伊姆（真・伊姆，第 250 層）洛基隊勝率約 63～68%；一般對戰 1 對 1 約 60～66%。
     atk＝洛基打伊姆的傷害倍率（也套用到比例與真實傷害、諸神黃昏），def＝伊姆打洛基的傷害倍率（疊在巨人的意志減半之上）。 */
  const VS_BOSS = { atk: .29, def: 3 }, VS_NORM = { atk: 2.3, def: .45 }; /* v177 技能重新配置後重調（各 80～100 場）：塔 250 洛基隊 64%、洛基單人 55%；1 對 1 洛基先手 74%、後手 47%（平均約 61%） */
  const VS = () => { if (window.__LOKI_VS_IMU) return window.__LOKI_VS_IMU; const b = B(); return b && b.opts && b.opts.throne ? VS_THRONE : b && (b.isBoss || (b.opts && b.opts.tower)) ? VS_BOSS : VS_NORM; };
  /* 虛空王座是比累積傷害：洛基的穿透減傷會無視王座伊姆的巨額減傷，傷害變成其他隊伍的上百倍，這裡壓回和改版前差不多（模擬約 2.4 萬，改版前約 2.6 萬） */
  const VS_THRONE = { atk: .55, def: 3 };
  const isImuF = t => !!(t && (t.id === 'imu' || t.__imu));
  if (typeof computeSkillOutcome === 'function') { const _cso = computeSkillOutcome;
    computeSkillOutcome = function (actor, target, skill) {
      const r = _cso.apply(this, arguments);
      try { if (r && r.damage > 0 && actor && skill && skill.type === 'attack') { let m = isLoki(actor) ? actor.__loki.pow || 1 : 1; const g = skill.effect && skill.effect.godSlayer; if (g && transformed(target)) { m *= g; r.__god = 1; }
        if (isLoki(actor) && isImuF(target)) m *= VS().atk;
        if (m !== 1) r.damage = Math.floor(r.damage * m); if (r.__god) L(`⚔️ 弒神！對變身中的 ${target.name} 傷害 ×${g}`); } } catch (e) { }
      try { if (r && r.damage > 0 && isImuF(actor) && isLoki(target) && VS().def !== 1) r.damage = Math.floor(r.damage * VS().def); } catch (e) { }
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
    '諸神之鎧': async A => { SFX.play('buff'); X().wings(A.f.x, A.f.y - 40, { color: '#c86bff', life: .8 }); X().ring(A.f.x, A.f.y, { r1: 200, color: '#ff9cf5', w: 10, life: .55 }); await sl(240); X().particles({ x: A.f.x, y: A.f.y, n: 34, spd: [60, 220], life: [.5, 1], size: [4, 8], colors: ['#ff9cf5', '#ffffff'], shape: 'spark', add: true, g: 0 }); },
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
  window.LOKI172 = { init, setForm, ascend, dispel, transformed, vs: () => VS() };
})();
