/* v165 伊姆三型態機制（使用者 11/06 規格 /root/promo/v165/src/imu_skills.txt；技能資料在 js/balance_v165.js）。
   型態：f.__imu.form 0 初始（只能用①⑤）→ 1 第一型態「伊姆聖」（開啟②③④）→ 2 第二型態「世界之王・伊姆聖」（①～④換成 form2Skills、次數全部恢復）。
   最多晉升兩次；之後⑤仍有晉升效果，但立繪不再改變、也不會變回去（倒下、復活、霸王色解除變身都不影響）。
   效果欄位：
   imuUndying { turns, regen, bossRegen, guard, thorn }：不死之身（每回合回復、致命保命 1 次、反彈受到傷害、淨化並把能力下降轉成提升）
   imuPact { turns, ratio, healCut, bossHealExempt, allDown, domChance, domRecoil, reward, full, noBuff, steal, sealChance }：惡魔契約／完全支配
   imuVoid { turns, evade, abyss, strike, stackPer, stackMax }：迴避、深淵轉移（我方陣容其他角色承擔；沒有就不轉移）、深淵攻擊、迴避後加成
   imuSealAtk：機率封印對手下一回合的攻擊技能｜imuPactChase：對契約中的對手追擊｜imuDefIgnore：無視防禦比例（晉升後一律 100%＝真實傷害）
   imuAscend { stat, inv, steal, pow, exec, clutch, clutchAt }：最初20人（晉升與每次的晉升效果）
   imuEternal { turns, regen, dr, reflect, stack, stackMax }：永劫不滅｜imuDomain {...}：世界之王領域（存在 battle.__imuDom，跨換人）
   imuRuin { extra, erase, healCut, low, chase, kill, flat }：毀滅之力（追加最大體力傷害、奪取強化、存在抹除、低血追擊、擊殺未出戰角色）
   對外：window.IMU165 = { preAct, postAct, ai, setForm, init }（battle.js 的 executeAction 包裝與 tests/imu-sim.js 共用）。
   載入順序：balance_v165.js 之後（所有 ext_*.js、balance_*.js 之後，成為最外層包裝）。 */
(function () {
  if (typeof computeSkillOutcome !== 'function' || typeof applySkillEffects !== 'function') return;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const R = (a, b) => a + Math.random() * (b - a), pct = x => Math.round(x * 100);
  const wait = ms => new Promise(r => setTimeout(r, ms / (window.BSPEED || 1)));
  const STAGES = ['atk', 'def', 'spd'];
  const isImu = f => !!(f && f.__imu);
  const teamOf = () => { const b = B(); return (b && b.team) || []; };
  const isPlayerSide = f => { const b = B(); return !!(b && f && (f === b.player || teamOf().includes(f))); };
  const foeOf = f => { const b = B(); if (!b || !f) return null; if (f === b.enemy) return b.player || null; if (isPlayerSide(f)) return b.enemy || null; return null; };
  const sideOf = f => { const b = B(); return b && f === b.enemy ? 'R' : 'L'; };
  const onScreen = f => { const b = B(); return !!(b && f && (f === b.player || f === b.enemy)); };
  const isBossUnit = f => { const b = B(); return !!(b && b.isBoss && f === b.enemy && !f.voidImmune); };
  const ownerOf = side => { const b = B(); if (!b) return null; if (side === 'E') return b.enemy || null; return teamOf().find(isImu) || b.player || null; };
  const sideKey = f => { const b = B(); return b && f === b.enemy ? 'E' : 'P'; };
  const immune = f => typeof immuneTo === 'function' && immuneTo(f);
  const hasTrait = (f, t) => !!(f && f.traits && f.traits.includes(t));
  const dmgFx = (f, d, c) => { try { if (onScreen(f)) showDamage(sideOf(f), d, c); } catch (e) { } };
  const healFx = (f, h) => { try { if (onScreen(f) && h > 0) showHeal(sideOf(f), h); } catch (e) { } };
  const say = (f, t) => { try { if (onScreen(f)) floatText(sideOf(f), t, 'status'); } catch (e) { } };
  const hud = () => { try { renderHUD(); } catch (e) { } };
  const canHeal = f => typeof healOk !== 'function' || healOk(f);
  let curActor = null, curSkill = null, reflecting = 0, inAction = 0, dCso = 0, dAse = 0;
  /* ---------- v165 通用效果（洛基、尼卡魯夫、洛克斯、黑鬍子；對所有對手都有效） ----------
     pierceDR：無視對手減傷的比例（含減傷型態、套組減傷、龍人型態、永劫不滅、世界之王領域）｜breakInvuln：出招前打破對手的無敵
     guardBreak：致命一擊時該機率讓對手的保命效果（撐住、不死、瀕死回滿、復活）不發動｜healSeal { turns, cut }：命中後對手回復量減少
     ultSeal：命中後對手幾回合內無法使用奧義（第 5 招，含變身／晉升）｜nullNext：機率讓對手下一招失效｜drainForm：吸走對手一半的型態增益（倍率加成）
     voidGuard：機率讓對手身上的保命效果全部失效｜mirror：幾回合內反彈到自己身上的傷害轉回反彈的人｜cleanseMarks：解除契約、支配、封印、存在抹除等（惡魔契約反轉給對手）
     breakField：對手展開的場地效果（世界之王、火山、冰河）縮短幾回合 */
  const ce = () => (curSkill && curSkill.effect) || {};
  const free = f => !!(f && f.status && f.status.__free > 0); /* freeTurns：尼卡魯夫的「自由」——不受契約、支配、封印、壓制與秒殺 */
  const freeMsg = f => L(`🥁 ${f.name} 是自由的，不受影響！`);
  function pierceOf(a) { if (!a || a !== curActor) return 0; return Math.min(1, ce().pierceDR || 0); }
  function pierceInv(t) { return !!(curActor && curActor !== t && ce().breakInvuln); }
  function guardBreak(a, t, amt) { const g = a && a === curActor ? ce().guardBreak : 0; if (!g || !t || t.hp <= 0 || amt < t.hp + (t.status.shield || 0)) return false; if (Math.random() >= g) return false; L(`💥 ${a.name} 的一擊貫穿了 ${t.name} 的保命效果！`); return true; }
  function bounce(atk, from, d) { if (!atk || d <= 0) return; reflecting++; try { if (atk.status.__mirror > 0 && from && from.hp > 0) { L(`🔄 ${atk.name} 把反彈回來的傷害再反轉回去，${from.name} 自己承受 ${d} 點！`); _adRef(from, d, sideOf(from)); } else _adRef(atk, d, sideOf(atk)); } finally { reflecting--; } }
  let _adRef = (t, d, s) => applyDamage(t, d, s);

  /* ---------- 初始化與型態 ---------- */
  function ppFor(f, s, i) {
    const lv = f.level || MAX_LV, need = (typeof SKILL_UNLOCK !== 'undefined' && SKILL_UNLOCK[i]) || 1;
    if (lv < need) return -need;
    if ((f.__imu && f.__imu.throne) || (f.skills[4] && f.skills[4].maxPP >= 999)) return 9999; /* 虛空王座：次數無限 */
    const src = s.maxPP > 0 ? s : ((CHARACTERS.imu.skills || [])[i] || s); /* 鎖住的技能 maxPP 是 0，改用原始資料 */
    let n = skillPP(src, lv, lvStats(CHARACTERS.imu, lv).ppAdj);
    if (f.difficulty && f.difficulty.order >= 3) n += 1;
    return n;
  }
  function init(f) {
    if (!f || f.id !== 'imu' || !f.skills) return f;
    if (!f.__imu) f.__imu = { form: 0, asc: 0, ascSeq: 0, pow: 1, evStacks: 0, etStacks: 0, exec: 0, execStep: .05, execBase: .2, stealR: .3, clutch: 0, clutchAt: .1, formTurns: 0, voidUsed: false, pend: null,
      base: { image: f.image, avatar: f.avatar, name: f.name, title: f.title } };
    lockForm(f); return f;
  }
  function lockForm(f) {
    if (!isImu(f) || f.__imu.form > 0) return;
    f.skills.forEach(s => { if (!s || !s.formNeed || typeof s.locked === 'number') return; if (s.locked !== 'form') { s.__inf = s.maxPP >= 999; s.locked = 'form'; s.pp = 0; s.maxPP = 0; } });
  }
  function unlockForm1(f) {
    f.skills.forEach((s, i) => { if (s && s.locked === 'form') { const n = s.__inf ? 9999 : ppFor(f, s, i); if (n < 0) { s.locked = -n; s.pp = s.maxPP = 0; } else { s.locked = 0; s.pp = s.maxPP = n; } } });
    L(`👁 ${f.name} 開啟了「黑轉支配」「虛空威壓」「黑焰・凶兆」！`);
  }
  function swapForm2(f) {
    const K = (CHARACTERS.imu && CHARACTERS.imu.form2Skills) || []; if (!K.length) return;
    K.forEach((src, i) => { const s = JSON.parse(JSON.stringify(src)); const n = ppFor(f, s, i); if (n < 0) { s.locked = -n; s.pp = s.maxPP = 0; } else { s.pp = s.maxPP = n; } f.skills[i] = s; });
    /* 所有技能次數恢復＝第 1～4 招（換成第二型態的新技能，次數全滿）；第 5 招「最初20人」不恢復，最多 4 次（使用者 11/06 確認） */
    L(`👑 技能欄換成第二型態：「永劫不滅」「黑轉支配・萬物逆轉」「世界之王」「毀滅之力」，第 1～4 招次數全滿！`);
  }
  function setForm(f, form) {
    if (!isImu(f)) return; const F = ((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[form] || null;
    const src = form === 0 || !F ? f.__imu.base : F;
    f.image = src.image; f.avatar = src.avatar; f.name = src.name; f.title = src.title;
    const VO = typeof visualOverride === 'function' ? visualOverride('form:imu_form' + form) : null;
    f.visMul = form === 0 ? 1 : (VO && VO.battleScale) || F.scale || 1; f.mirror = VO && VO.faceLeft !== undefined ? VO.faceLeft : false;
    if (!onScreen(f)) return;
    try { if (typeof refreshFighterImage === 'function') refreshFighterImage(f); } catch (e) { }
    const S = sideOf(f), $$ = id => document.getElementById(id);
    try { if ($$('bName' + S)) $$('bName' + S).textContent = f.name; if ($$('bTitle' + S)) $$('bTitle' + S).textContent = f.title; if ($$('bAv' + S)) $$('bAv' + S).src = f.avatar; if (S === 'L' && typeof renderTeam === 'function') renderTeam(); } catch (e) { }
  }

  /* ---------- 晉升（最初20人） ---------- */
  function transferNegatives(f, t) {
    const A = f.status; let n = 0;
    const keys = [...Object.keys(typeof ABN !== 'undefined' ? ABN : {}), 'skipAttack', 'skillNullify', 'buffBlock', 'attackFail', 'healBlock'];
    keys.forEach(k => { if ((A[k] || 0) > 0) { if (t && !t.voidImmune) t.status[k] = Math.max(t.status[k] || 0, A[k]); A[k] = 0; n++; } });
    if (A.attackFail === 0 && t && t.status.attackFail > 0 && !t.status.attackFailChance) t.status.attackFailChance = .5;
    if (A.dots && A.dots.length) { if (t && !t.voidImmune) t.status.dots.push(...A.dots.map(d => ({ ...d }))); A.dots = []; n++; }
    STAGES.forEach(k => { if (f.buffs[k] < 0) { if (t && !t.voidImmune) t.buffs[k] = clamp(t.buffs[k] + f.buffs[k], -6, 6); f.buffs[k] = 0; n++; } });
    ['__pact', '__erase', '__sealAtk', '__sealNext', '__imuDomd', '__awe'].forEach(k => { if (A[k]) { A[k] = k === '__pact' || k === '__erase' ? null : 0; n++; } });
    return n;
  }
  function ascend(f, t, A) {
    const I = f.__imu, S = f.status; I.asc++; I.ascSeq++;
    if (I.form < 2) {
      I.form++; I.formTurns = 0;
      { const F = ((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[I.form]; if (F) L(`👑 ${f.name} 晉升為${F.label}「${F.name}」！`); }
      if (I.form === 1) unlockForm1(f); else swapForm2(f);
      if (inAction) I.pend = I.form; else setForm(f, I.form);
    } else L(`👑 ${f.name} 已是最終型態，最初20人的力量再次湧現！`);
    STAGES.forEach(k => { f.buffs[k] = clamp(f.buffs[k] + A.stat, -6, 6); });
    S.__imuInv = Math.max(S.__imuInv || 0, A.inv); S.invuln = Math.max(S.invuln || 0, A.inv);
    const ts = I.tScale || 1; S.__imuSteal = Math.max(S.__imuSteal || 0, A.steal[0]); I.stealR = A.steal[1] * ts;
    const moved = transferNegatives(f, t && t.hp > 0 ? t : null); S.__reflectDebuff = 99999;
    const up = R(A.pow[0], A.pow[1]); I.pow = Math.round(I.pow * (1 + up) * 100) / 100;
    if (!I.exec) I.exec = A.exec[0] * ts; I.execBase = A.exec[0] * ts; I.execStep = A.exec[1] * ts;
    I.clutch += A.clutch; I.clutchAt = A.clutchAt;
    L(`👑 最初20人！${f.name} 全能力 +${A.stat}、無敵 ${A.inv} 回合、接下來 ${A.steal[0]} 回合每回合奪走對手 ${pct(A.steal[1])}% 體力`);
    L(`👑 全部技能威力 +${pct(up)}%（累計 ×${I.pow}），伊姆的傷害全部改為真實傷害；${moved ? '身上的負面效果全部反彈給對手，' : ''}之後對手施加的負面效果也會反彈`);
    L(`👑 每回合秒殺判定 ${pct(I.exec)}%（每回合 +${pct(I.execStep)}%）；瀕死時恢復全部體力（剩 ${I.clutch} 次）`);
    if (onScreen(f) && f === B().player && typeof renderSkills === 'function') try { renderSkills(); } catch (e) { }
  }

  /* ---------- 共用：狀態查詢 ---------- */
  const act = (o, k) => !!(o && o.t > 0);
  const etOn = f => !!(f && f.status && act(f.status.__imuEt));
  const kit = f => !!(f && f.status && (f.__imu || f.status.__imuUnd || f.status.__imuEt || f.status.__imuEv || f.status.__imuInv > 0)); /* 伊姆本人，或用闇穴道複製到伊姆技能的角色 */
  const domOwner = D => D && (D.owner || ownerOf(D.side));
  function domain() { const b = B(), D = b && b.__imuDom; if (!D || D.t <= 0) return null; const o = domOwner(D); if (!o || o.hp <= 0) return null; return D; }
  const domainOwner = () => { const D = domain(); return D ? domOwner(D) : null; };
  function domainVs(c) { const D = domain(); if (!D || !c || free(c)) return null; const o = domOwner(D); if (o === c) return null; return (D.side === 'E' ? isPlayerSide(c) : c === B().enemy) ? D : null; }
  function evadeChance(f) { if (!kit(f) && domainOwner() !== f) return 0; let miss = 1; const V = f.status.__imuEv; if (act(V)) miss *= 1 - V.evade; const D = domain(); if (D && domainOwner() === f) miss *= 1 - D.evade; return 1 - miss; }
  function healCutOf(f) { const S = f && f.status; if (!S) return 0; let keep = 1; if (act(S.__pact) && S.__pact.healCut) keep *= 1 - S.__pact.healCut; if (act(S.__erase) && S.__erase.healCut) keep *= 1 - S.__erase.healCut; if (act(S.__healSeal)) keep *= 1 - S.__healSeal.cut; return 1 - keep; }
  const healScale = f => 1 - healCutOf(f); /* 伊姆自己的回復（不死、永劫、瀕死回滿、保命）也吃減療 */
  function cutHeal(f, before) {
    if (!f || f.hp <= before || f.hp <= 0) return; const c = healCutOf(f); if (c <= 0) return;
    const gain = f.hp - before, keep = Math.floor(gain * (1 - c)); f.hp = before + keep;
    L(`🩸 ${f.name} 受到的治療效果 -${pct(c)}%（只回復 ${keep}）`);
  }
  function noBuffRevert(f, snap) { const P = f && f.status && f.status.__pact; if (!act(P) || !P.noBuff) return; let n = 0; STAGES.forEach(k => { if (f.buffs[k] > snap[k]) { f.buffs[k] = snap[k]; n++; } }); if (n) L(`👁 ${f.name} 在契約中，無法獲得新的能力提升！`); }
  function pactReward(t, lethal) {
    const P = t && t.status && t.status.__pact; if (!act(P) || P.paid) return; if (!(t.hp <= 0 || (P.full && lethal))) return;
    const o = ownerOf(P.owner); if (!o || o.hp <= 0) return; P.paid = true;
    if (P.reward === 'full') { if (t.hp > 0) t.hp = 0; const h = o.maxHp - o.hp; o.hp = o.maxHp; o.status.__imuInv = Math.max(o.status.__imuInv || 0, 1); o.status.invuln = Math.max(o.status.invuln || 0, 1); healFx(o, h); L(`👁 完全支配！${o.name} 吸收了 ${t.name} 剩餘的生命，體力全滿並獲得 1 回合無敵！`); }
    else { const h = Math.min(o.maxHp - o.hp, Math.floor(o.maxHp * (P.reward || .5))); o.hp += h; healFx(o, h); L(`👁 惡魔契約：${t.name} 在契約中被擊敗，${o.name} ${h > 0 ? `恢復 ${h} 體力` : '吸收了契約之力（體力已滿）'}！`); }
    hud();
  }

  /* ---------- 傷害計算 ---------- */
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    if (!actor || !target || !skill || dCso > 0) return _cso.apply(this, arguments);
    dCso++; curActor = actor; curSkill = skill;
    const ef = skill.effect || {}; let p = ef.imuDefIgnore || 0, sv = null;
    if (isImu(actor) && actor.__imu.asc > 0) p = 1;
    if (p > 0) { sv = { bd: target.buffs.def, d: target.def || 0 }; if (target.buffs.def > 0) target.buffs.def = target.buffs.def * (1 - p); target.def = sv.d * (1 - p); sv.mbd = target.buffs.def; sv.md = target.def; }
    let r;
    try { r = _cso.call(this, actor, target, skill, blocked); }
    finally { if (sv) { target.buffs.def = sv.bd + (target.buffs.def - sv.mbd); target.def = sv.d + ((target.def || 0) - sv.md); } dCso--; }
    if (!r) return r; r.meta = r.meta || {};
    if (free(target) && (r.meta.execute || r.meta.executeBuff)) { r.meta.execute = false; r.meta.executeBuff = false; r.damage = calcAttackDamage(actor, target, { type: 'attack', power: skill.power || 100, effect: {} }); L(`🥁 ${target.name} 是自由的，不會被秒殺！`); }
    if (etOn(target) && (r.meta.execute || r.meta.executeBuff)) { r.meta.execute = false; r.meta.executeBuff = false; r.damage = calcAttackDamage(actor, target, { type: 'attack', power: skill.power || 100, effect: {} }); L(`👑 ${target.name} 永劫不滅，不會被秒殺！`); }
    if (isImu(actor) || kit(actor) || ef.imuVoid || ef.imuPactChase || ef.imuRuin) {
      const I = actor.__imu || { pow: 1, etStacks: 0, evStacks: 0, asc: 0 };
      if (ef.imuVoid && target.hp > 0 && !target.voidImmune) { const d = Math.max(1, Math.floor(target.maxHp * (ef.imuVoid.strike || .1))); r.damage = (r.damage || 0) + d; L(`🌑 深淵攻擊：造成 ${target.name} 最大體力 ${pct(ef.imuVoid.strike || .1)}% 的傷害！`); }
      if (r.damage > 0 && !r.meta.execute && !r.meta.executeBuff) {
        let m = I.pow; const atk = skill.type === 'attack';
        if (atk && I.etStacks > 0) m *= 1 + I.etStacks * .1;
        if (atk && I.evStacks > 0) { m *= 1 + .2 * I.evStacks; L(`🌑 迴避累積：這次攻擊威力 +${I.evStacks * 20}%！`); I.evStacks = 0; }
        if (m !== 1) r.damage = Math.floor(r.damage * m);
        if (ef.imuPactChase && act(target.status.__pact)) { const add = Math.floor(r.damage * ef.imuPactChase); r.damage += add; L(`🔥 ${target.name} 身上有惡魔契約，黑焰追擊 ${add} 點傷害！`); }
        if (ef.imuRuin && !target.voidImmune) { const add = Math.floor(target.maxHp * ef.imuRuin.extra * ((actor.__imu && actor.__imu.tScale) || 1)); r.damage += add; L(`🔥 毀滅之刃追加對手最大體力 ${pct(ef.imuRuin.extra)}% 的傷害（${add}）！`); }
      }
      if (I.asc > 0 && r.damage > 0) r.meta.imuTrue = true;
    }
    return r;
  };

  /* ---------- 技能效果 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    if (!actor || !skill) return _ase.apply(this, arguments);
    if (dAse > 0) { const r0 = _ase.apply(this, arguments); if (skill.__copyCast && !isImu(actor)) { try { imuEffects(actor, target, skill, result || { damage: 0, meta: {} }); } catch (e) { console.warn(e); } } return r0; }
    const preHp = actor.hp, preB = { ...actor.buffs }, tEt = target && target !== actor && etOn(target), preT = target ? { ...target.buffs } : null;
    dAse++; let r;
    try { r = _ase.apply(this, arguments); } finally { dAse--; }
    noBuffRevert(actor, preB); cutHeal(actor, preHp);
    if (tEt && preT) { let n = 0; STAGES.forEach(k => { if (target.buffs[k] < preT[k]) { target.buffs[k] = preT[k]; n++; } }); if (n) L(`👑 ${target.name} 永劫不滅，不受能力下降影響！`); }
    try { counterFx(actor, target, skill, result || { damage: 0, meta: {} }); } catch (e) { console.warn('v165 通用效果錯誤', e); }
    try { if (isImu(actor) || skill.__copyCast) imuEffects(actor, target, skill, result || { damage: 0, meta: {} }); } catch (e) { console.warn('伊姆技能效果錯誤', e); }
    return r;
  };
  function counterFx(f, t, sk, res) {
    const ef = sk.effect || {}, S = f.status, hit0 = t && t !== f && t.hp > 0 && !t.voidImmune, T = t && t.status, hit = hit0 && !free(t);
    if (hit0 && !hit && (ef.healSeal || ef.ultSeal || ef.nullNext)) freeMsg(t);
    if (ef.freeTurns) { S.__free = Math.max(S.__free || 0, ef.freeTurns); L(`🥁 ${f.name} 接下來 ${ef.freeTurns} 回合是自由的：不受契約、支配、封印、壓制、場地壓制、奪取體力與秒殺！`); }
    if (ef.healSeal && hit && (res.damage > 0 || sk.type !== 'attack')) { T.__healSeal = { t: Math.max((T.__healSeal || {}).t || 0, ef.healSeal.turns), cut: Math.max((T.__healSeal || {}).cut || 0, ef.healSeal.cut) }; L(`🩸 ${t.name} 的回復被壓制：${ef.healSeal.turns} 回合內回復量 -${pct(ef.healSeal.cut)}%`); }
    if (ef.ultSeal && hit) { T.__ultSeal = Math.max(T.__ultSeal || 0, ef.ultSeal); L(`⛓️ ${t.name} 被壓制：${ef.ultSeal} 回合內無法使用奧義（含變身與晉升）`); }
    if (ef.nullNext && hit && Math.random() < ef.nullNext) { T.__nullNext = 1; L(`🕳️ 黑暗吞噬了 ${t.name} 的力量：下一招將會失效！`); }
    if (ef.drainForm && hit) { const k = ef.drainForm; let n = 0;
      if (t.__imu && t.__imu.pow > 1) { const was = t.__imu.pow; t.__imu.pow = Math.round((1 + (was - 1) * (1 - k)) * 100) / 100; n++; L(`🕳️ ${f.name} 吸走了 ${t.name} 的型態力量：威力 ×${was} → ×${t.__imu.pow}`); }
      if (T.damageMultTurns > 0 && T.damageMultValue > 1) { const was = T.damageMultValue; T.damageMultValue = Math.round((1 + (was - 1) * (1 - k)) * 10) / 10; n++; L(`🕳️ ${f.name} 吸走了 ${t.name} 的傷害加成：×${was} → ×${T.damageMultValue}`); }
      if (T.__dragon && T.__dragon.dmg > 1) { T.__dragon.dmg = Math.round((1 + (T.__dragon.dmg - 1) * (1 - k)) * 100) / 100; n++; L(`🕳️ ${f.name} 吸走了 ${t.name} 的龍人型態加成（傷害 ×${T.__dragon.dmg}）`); } }
    if (ef.voidGuard && hit && Math.random() < ef.voidGuard) { const lost = [];
      if (act(T.__imuUnd) && T.__imuUnd.guard) { T.__imuUnd.guard = false; lost.push('不死之身的保命'); } if (act(T.__imuEt) && T.__imuEt.guard) { T.__imuEt.guard = false; lost.push('永劫不滅的保命'); }
      if (T.__lastStand && T.__lastStand.charges > 0) { T.__lastStand.charges = 0; lost.push('撐住致命傷'); } if (T.undyingTurns > 0) { T.undyingTurns = 0; lost.push('重生'); } if (T.clutchHealCharges > 0) { T.clutchHealCharges = 0; lost.push('瀕死回滿'); }
      if (t.__imu && t.__imu.clutch > 0) { t.__imu.clutch--; lost.push(`瀕死回滿 1 次`); } if (T.lives > 0) { T.lives--; lost.push('1 條命'); }
      if (lost.length) L(`🕳️ 黑暗吞噬了 ${t.name} 的保命效果：${lost.join('、')}失效！`); }
    if (ef.mirror) { S.__mirror = Math.max(S.__mirror || 0, ef.mirror); L(`🔄 ${f.name} 接下來 ${ef.mirror} 回合，反彈到自己身上的傷害都會反轉回去！`); }
    if (ef.cleanseMarks) { const o = foeOf(f), done = [];
      if (act(S.__pact)) { const P = S.__pact; S.__pact = null; done.push(P.full ? '完全支配' : '惡魔契約'); if (o && o.hp > 0 && !o.voidImmune) { o.status.__pact = Object.assign({}, P, { owner: sideKey(f), paid: false, healCut: P.healCut }); L(`🔄 ${f.name} 把${P.full ? '完全支配' : '惡魔契約'}反轉給 ${o.name}！`); } }
      [['__erase', '存在抹除'], ['__imuDomd', '支配'], ['__sealAtk', '攻擊封印'], ['__sealNext', '技能封印'], ['__awe', '震懾'], ['__nullNext', '技能失效'], ['__ultSeal', '奧義壓制'], ['__healSeal', '回復壓制']].forEach(([k, n]) => { if (S[k] && (S[k] > 0 || S[k].t > 0)) { S[k] = typeof S[k] === 'object' ? null : 0; done.push(n); } });
      if (done.length) L(`🥁 解放！${f.name} 解除了：${done.join('、')}`); }
    if (ef.breakField) { const b = B(), o = foeOf(f), n = ef.breakField; const cut = (F, name) => { F.t != null ? (F.t = Math.max(0, F.t - n)) : (F.left = Math.max(0, F.left - n)); L(`🥁 ${f.name} 的自由打破了「${name}」：持續時間 -${n} 回合${(F.t ?? F.left) <= 0 ? '，效果消失了' : ''}`); };
      if (b && b.__imuDom && domOwner(b.__imuDom) === o) { cut(b.__imuDom, '世界之王'); if (b.__imuDom.t <= 0) b.__imuDom = null; }
      if (b && b.eruption && b.eruption.owner === o) { cut(b.eruption, '火山噴發'); if (b.eruption.left <= 0) b.eruption = null; }
      if (b && b.iceAge && b.iceAge.owner === o) { cut(b.iceAge, '冰河時期'); if (b.iceAge.left <= 0) b.iceAge = null; } }
  }
  function imuEffects(f, t, skill, res) {
    const ef = skill.effect || {}, S = f.status, tOk = t && t !== f && t.hp > 0 && !t.voidImmune;
    if (ef.imuUndying) { const U = ef.imuUndying; S.__imuUnd = { t: U.turns, regen: U.regen, bossRegen: U.bossRegen, guard: true, guardHeal: U.guard, thorn: U.thorn };
      if (typeof clearAbnormal === 'function') clearAbnormal(f); let n = 0; STAGES.forEach(k => { if (f.buffs[k] < 0) { f.buffs[k] = -f.buffs[k]; n++; } });
      const boss = isBossUnit(foeOf(f));
      L(`✨ 不死之身！${U.turns} 回合內每回合恢復 ${pct(boss ? U.bossRegen : U.regen)}% 體力${boss ? '（對手是 BOSS）' : ''}、能撐住一次致命傷，受到傷害的 ${pct(U.thorn)}% 會反彈；異常狀態全部解除${n ? '，能力下降轉成了提升' : ''}！`); }
    if (tOk && free(t) && (ef.imuPact || ef.imuSealAtk)) freeMsg(t);
    else if (ef.imuPact && tOk) { const P = ef.imuPact, T = t.status, cut = P.bossHealExempt && isBossUnit(t) ? 0 : P.healCut;
      T.__pact = { t: P.turns, ratio: P.ratio * ((f.__imu && f.__imu.tScale) || 1), healCut: cut, noBuff: !!P.noBuff, full: !!P.full, reward: P.reward, owner: sideKey(f), paid: false };
      L(P.full ? `👁 黑轉支配・萬物逆轉！${t.name} 陷入「完全支配」${P.turns} 回合：每回合失去最大體力 ${pct(P.ratio)}%，治療 -${pct(cut)}%，無法獲得新的能力提升` : `👁 黑轉支配！${t.name} 被刻上「惡魔契約」${P.turns} 回合：每回合失去最大體力 ${pct(P.ratio)}%${cut ? `，治療 -${pct(cut)}%` : '（BOSS 不受減療影響）'}`);
      if (P.noBuff) T.buffBlock = Math.max(T.buffBlock || 0, P.turns);
      if (P.allDown) { if (immune(t) || hasTrait(t, 'immuneDown')) L(`🛡️ ${t.name} 不受能力下降影響！`); else { STAGES.forEach(k => { t.buffs[k] = clamp(t.buffs[k] - P.allDown, -6, 6); }); L(`👁 ${t.name} 全能力 -${P.allDown}！`); } }
      if (P.steal) { let n = 0; STAGES.forEach(k => { if (t.buffs[k] > 0) { f.buffs[k] = clamp(f.buffs[k] + t.buffs[k], -6, 6); n += t.buffs[k]; t.buffs[k] = 0; } }); L(n ? `👁 ${f.name} 奪走了 ${t.name} 的能力提升（共 ${n} 階）！` : `👁 ${t.name} 沒有能力提升可以奪取。`); }
      if (P.domChance && Math.random() < P.domChance) { if (immune(t)) L(`🛡️ ${t.name} 抵抗了支配！`); else { T.__imuDomd = Math.max(T.__imuDomd || 0, 1); T.__domRecoil = P.domRecoil || .5; L(`👁 ${t.name} 陷入「支配」：下一次行動無法自己選擇技能！`); } }
      if (P.sealChance && Math.random() < P.sealChance) { if (immune(t)) L(`🛡️ ${t.name} 抵抗了封印！`); else { T.__sealNext = 1; L(`🔒 ${t.name} 的下一次主動技能被封印！`); } } }
    if (ef.imuVoid) { const V = ef.imuVoid; S.__imuEv = { t: V.turns, evade: V.evade, abyss: V.abyss }; if (f.__imu) { f.__imu.voidUsed = true; f.__imu.stackMax = V.stackMax; }
      const allies = isPlayerSide(f) ? teamOf().filter(x => x !== f && x.hp > 0).length : 0;
      L(`🌑 虛空威壓！${V.turns} 回合內迴避率 +${pct(V.evade)}%，受到攻擊時 ${pct(V.abyss)}% 透過深淵轉移給${allies ? `我方其他 ${allies} 位角色` : '其他角色（目前沒有可以承擔的角色，不會轉移）'}`); }
    if (ef.imuSealAtk && tOk && !free(t) && Math.random() < ef.imuSealAtk) { if (immune(t)) L(`🛡️ ${t.name} 抵抗了封印！`); else { t.status.__sealAtk = 1; L(`🔒 黑焰封印了 ${t.name} 下一回合的攻擊技能！`); } }
    if (ef.imuAscend && isImu(f)) ascend(f, t, ef.imuAscend);
    if (ef.imuEternal) { const E = ef.imuEternal; S.__imuEt = { t: E.turns, regen: E.regen, dr: E.dr, reflect: E.reflect, guard: true }; if (f.__imu) f.__imu.etMax = E.stackMax || 5; S.immune = Math.max(S.immune || 0, E.turns);
      if (typeof clearAbnormal === 'function') clearAbnormal(f); STAGES.forEach(k => { if (f.buffs[k] < 0) f.buffs[k] = 0; });
      L(`♾️ 永劫不滅！${E.turns} 回合內每回合恢復 ${pct(E.regen)}% 體力、能撐住一次致命傷並回滿、免疫異常／控制／秒殺／能力下降、受到傷害 -${pct(E.dr)}% 並反彈 ${pct(E.reflect)}%`); }
    if (ef.imuDomain) { const D = ef.imuDomain, b = B(); if (b) { b.__imuDom = { t: D.turns, side: sideKey(f), evade: D.evade, dr: D.dr, acc: D.acc, spd: D.spd, shock: D.shock, shockDmg: D.shockDmg * ((f.__imu && f.__imu.tScale) || 1), punishAt: D.punishAt, punish: D.punish, pend: false }; Object.defineProperty(b.__imuDom, 'owner', { value: f, enumerable: false });
      L(`👑 世界之王！虛空王座展開深淵 ${D.turns} 回合（對手換人也持續）：${f.name} 迴避 +${pct(D.evade)}%、受到傷害 -${pct(D.dr)}%；對手命中與速度 -${pct(D.acc)}%，每回合承受霸王色震懾`); } }
    if (ef.imuRuin && t && t !== f) { const X = ef.imuRuin;
      if (!t.voidImmune) { let n = 0; STAGES.forEach(k => { if (t.buffs[k] > 0) { f.buffs[k] = clamp(f.buffs[k] + t.buffs[k], -6, 6); n += t.buffs[k]; t.buffs[k] = 0; } }); if (n) L(`🔥 毀滅之力清除了 ${t.name} 的能力提升，並奪為己有（${n} 階）！`);
        t.status.__erase = { t: X.erase, healCut: X.healCut }; L(`🔥 ${t.name} 陷入「存在抹除」${X.erase} 回合：治療 -${pct(X.healCut)}%、無法復活、無法發動保命效果！`); }
      if (t.hp > 0 && t.hp < t.maxHp * X.low) { const d = Math.max(1, Math.floor((res.damage || 0) * X.chase)); if (d > 0 && !t.voidImmune) { L(`🔥 ${t.name} 體力低於 ${pct(X.low)}%，黑焰追擊！`); applyDamage(t, d, sideOf(t), { ignoreShield: true }); } }
      if (t.hp < t.maxHp * X.low && Math.random() < X.kill * ((f.__imu && f.__imu.tScale) || 1)) {
        const bench = isPlayerSide(t) ? teamOf().filter(x => x !== B().player && x.hp > 0) : [];
        if (bench.length) { const v = bench[Math.floor(Math.random() * bench.length)];
          if (hasTrait(v, 'immuneExec')) { v.hp = Math.max(0, v.hp - X.flat); L(`🔥 毀滅之力波及未出戰的 ${v.name}，造成 ${X.flat} 點傷害！`); }
          else { v.hp = 0; L(`💀 毀滅之力抹除了未出戰的 ${v.name}！`); }
          try { if (typeof renderTeam === 'function') renderTeam(); } catch (e) { } }
        else if (t.hp > 0 && !t.voidImmune) { L(`🔥 對手沒有其他角色，毀滅之力改為造成 ${X.flat} 點傷害！`); applyDamage(t, X.flat, sideOf(t), { ignoreShield: true }); }
      } }
  }

  /* ---------- 受到傷害 ---------- */
  const _ad = applyDamage; _adRef = _ad;
  applyDamage = function (target, amount, side, opts) {
    if (!target || !target.status || reflecting) return _ad.apply(this, arguments);
    if (target === curActor && target.status.__mirror > 0 && amount > 0 && inAction) { const f = foeOf(target); if (f && f.hp > 0) { L(`🔄 ${target.name} 把反彈回來的傷害反轉回去，${f.name} 自己承受 ${amount} 點！`); reflecting++; try { _ad(f, amount, sideOf(f)); } finally { reflecting--; } hud(); return; } }
    const S = target.status, atk = curActor && curActor !== target && foeOf(target) === curActor ? curActor : null;
    if (S.__imuInv > 0 && amount > 0 && !pierceInv(target)) { L(`🛡️ ${target.name} 處於無敵狀態，不受傷害！`); say(target, '無敵'); hud(); return; }
    let amt = amount;
    if ((kit(target) || domainOwner() === target) && atk && amt > 0) {
      const V = S.__imuEv;
      if (act(V) && V.abyss && Math.random() < V.abyss) { const allies = isPlayerSide(target) ? teamOf().filter(x => x !== target && x.hp > 0) : [];
        if (allies.length) { const a = allies[Math.floor(Math.random() * allies.length)], before = a.hp; a.hp = Math.max(0, a.hp - amt);
          L(`🌑 深淵轉移！這次攻擊由 ${a.name} 承擔了 ${before - a.hp} 點傷害${a.hp <= 0 ? `，${a.name} 倒下了` : ''}`); say(target, '轉移');
          recoil(atk, before - a.hp); try { if (typeof renderTeam === 'function') renderTeam(); } catch (e) { } hud(); return; } }
      let m = 1; if (etOn(target)) m *= 1 - S.__imuEt.dr; const D = domain(); if (D && domainOwner() === target) m *= 1 - D.dr;
      const pz = pierceOf(atk); if (pz > 0 && m < 1) { m = 1 - (1 - m) * (1 - pz); }
      if (m < 1) amt = Math.max(1, Math.floor(amt * m));
    }
    let td = null, er = null;
    if (atk && ((isImu(atk) && atk.__imu.asc > 0) || pierceOf(atk) > 0)) { const pz = isImu(atk) && atk.__imu.asc > 0 ? 1 : pierceOf(atk); td = { drt: S.damageReductionTurns, sdr: target.setDR, dd: S.__dragon ? S.__dragon.dr : null }; if (pz >= 1) { S.damageReductionTurns = 0; target.setDR = 0; if (S.__dragon) S.__dragon.dr = 0; } else { td.drv = S.damageReductionValue; S.damageReductionValue = (S.damageReductionValue || 0) * (1 - pz); target.setDR = (target.setDR || 0) * (1 - pz); if (S.__dragon) S.__dragon.dr = (S.__dragon.dr || 0) * (1 - pz); } }
    if (act(S.__erase) || guardBreak(atk, target, amt)) { er = { ls: S.__lastStand, ch: S.clutchHealCharges, dad: target.__dad ? target.__dad.guts : null }; S.__lastStand = null; S.clutchHealCharges = 0; if (target.__dad) target.__dad.guts = false; }
    const before = target.hp, shield = S.shield || 0; let r;
    try { r = _ad.call(this, target, amt, side, opts); }
    finally {
      if (td) { S.damageReductionTurns = td.drt; if (td.drv != null) S.damageReductionValue = td.drv; target.setDR = td.sdr; if (S.__dragon && td.dd != null) S.__dragon.dr = td.dd; }
      if (er) { S.__lastStand = er.ls; S.clutchHealCharges = er.ch; if (target.__dad && er.dad != null) target.__dad.guts = er.dad; }
    }
    const lost = Math.max(0, before - target.hp);
    if ((kit(target) || domainOwner() === target) && before > 0) imuGuard(target, before, lost, atk, !!er);
    if (atk && lost > 0) recoil(atk, lost);
    if (act(S.__pact)) pactReward(target, before > 0 && amt >= before + (opts && opts.ignoreShield ? 0 : shield));
    return r;
  };
  function recoil(atk, lost) { const S = atk.status; if (!S.__domAct || atk.hp <= 0 || lost <= 0) return; const d = Math.max(1, Math.floor(lost * (S.__domRecoil || .5))); L(`👁 被支配的攻擊反噬：${atk.name} 自己也要承受 ${d} 點傷害！`); bounce(atk, foeOf(atk), d); }
  function imuGuard(f, before, lost, atk, noGuard) {
    const S = f.status, I = f.__imu || {}, hs = healScale(f);
    if (f.hp <= 0 && !noGuard) {
      if (etOn(f) && S.__imuEt.guard) { S.__imuEt.guard = false; f.hp = Math.max(1, Math.floor(f.maxHp * hs)); healFx(f, f.hp); L(`♾️ 永劫不滅！${f.name} 保住 1 點體力，立即恢復全部體力！`); say(f, '不滅'); }
      else if (act(S.__imuUnd) && S.__imuUnd.guard) { S.__imuUnd.guard = false; f.hp = Math.min(f.maxHp, 1 + Math.floor(f.maxHp * S.__imuUnd.guardHeal * hs)); healFx(f, f.hp); L(`✨ 不死之身！${f.name} 保住 1 點體力，立即恢復 ${pct(S.__imuUnd.guardHeal)}% 體力！`); say(f, '不死'); }
    }
    if (I.clutch > 0 && f.hp < f.maxHp * I.clutchAt && !(noGuard && f.hp <= 0)) { I.clutch--; const h0 = Math.max(0, f.hp), h = Math.floor((f.maxHp - h0) * hs); f.hp = Math.max(1, h0 + h); if (hs < 1) L(`🩸 回復受到壓制，只回復 ${h}`); healFx(f, h); L(`👑 ${f.name} 瀕死時被最初20人的力量拉回，體力全滿！（剩 ${I.clutch} 次）`); say(f, '回滿'); }
    if (atk && lost > 0 && atk.hp > 0) { let rr = 0; if (act(S.__imuUnd)) rr += S.__imuUnd.thorn || 0; if (etOn(f)) rr += S.__imuEt.reflect || 0;
      if (rr > 0) { const d = Math.max(1, Math.floor(lost * rr)); L(`↩️ ${f.name} 把受到傷害的 ${pct(rr)}%（${d}）反彈給 ${atk.name}！`); bounce(atk, f, d); } }
    const D = domain(); if (D && domainOwner() === f && atk && lost > f.maxHp * D.punishAt && !D.pend) { D.pend = true; L(`👑 ${atk.name} 對世界之王造成超過 ${pct(D.punishAt)}% 的傷害，下回合將直接損失目前體力的 ${pct(D.punish)}%！`); }
    hud();
  }

  /* ---------- 回合結束 ---------- */
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    if (!c || !c.status) return _ets.apply(this, arguments);
    curActor = null; const S = c.status, pre = c.hp, inv = S.__imuInv > 0;
    const r = _ets.apply(this, arguments);
    if (inv && c.hp < pre) c.hp = pre;
    cutHeal(c, pre);
    try { marksTick(c); if (kit(c) || domainOwner() === c) imuTick(c); } catch (e) { console.warn('伊姆回合結束錯誤', e); }
    if (typeof beginTurn !== 'function') punishNow();
    return r;
  };
  function marksTick(c) {
    const S = c.status, P = S.__pact;
    if (act(P)) { if (c.hp > 0) { const d = Math.max(1, Math.floor(c.maxHp * P.ratio)); c.hp = Math.max(0, c.hp - d); dmgFx(c, d, '#c8003a'); L(`👁 ${P.full ? '完全支配' : '惡魔契約'}：${c.name} 失去 ${d} 點體力（剩 ${P.t - 1} 回合）`); if (c.hp <= 0) pactReward(c, true); }
      P.t--; if (P.t <= 0 && !P.paid) { S.__pact = null; L(`👁 ${c.name} 的${P.full ? '完全支配' : '惡魔契約'}結束了。`); } }
    if (act(S.__erase)) { S.__erase.t--; if (S.__erase.t <= 0) { S.__erase = null; L(`🔥 ${c.name} 的存在抹除結束了。`); } }
    if (act(S.__healSeal)) { S.__healSeal.t--; if (S.__healSeal.t <= 0) S.__healSeal = null; }
    if (S.__ultSeal > 0) S.__ultSeal--; if (S.__mirror > 0) S.__mirror--; if (S.__free > 0) S.__free--;
  }
  function imuTick(c) {
    const S = c.status, I = c.__imu || { form: 0, exec: 0 }, o = foeOf(c), oOk = o && o.hp > 0 && !o.voidImmune, hs = healScale(c);
    if (I.form > 0) I.formTurns++;
    if (S.__imuInv > 0) S.__imuInv--;
    if (c.hp <= 0) return;
    const U = S.__imuUnd; if (act(U)) { const rg = isBossUnit(o) ? U.bossRegen : U.regen; if (canHeal(c)) { const h = Math.min(c.maxHp - c.hp, Math.floor(c.maxHp * rg * hs)); c.hp += h; healFx(c, h); if (h > 0) L(`✨ 不死之身：${c.name} 恢復 ${h} 體力`); } U.t--; if (U.t <= 0) L(`✨ ${c.name} 的不死之身結束了。`); }
    const E = S.__imuEt; if (act(E)) { if (canHeal(c)) { const h = Math.min(c.maxHp - c.hp, Math.floor(c.maxHp * E.regen * hs)); c.hp += h; healFx(c, h); }
      if (c.__imu && I.etStacks < (I.etMax || 5)) { I.etStacks++; L(`♾️ 永劫不滅：${c.name} 回復體力，攻擊技能威力 +${I.etStacks * 10}%`); } E.t--; if (E.t <= 0) { L(`♾️ ${c.name} 的永劫不滅結束了。`); } }
    if (act(S.__imuEv)) S.__imuEv.t--;
    if (S.__imuSteal > 0 && oOk && free(o)) { S.__imuSteal--; L(`🥁 ${o.name} 是自由的，體力沒有被奪走！`); }
    else if (S.__imuSteal > 0 && oOk) { const d = Math.max(1, Math.floor(o.hp * I.stealR)); o.hp = Math.max(0, o.hp - d); dmgFx(o, d, '#ff2a5a'); const h = canHeal(c) ? Math.min(c.maxHp - c.hp, Math.floor(d * hs)) : 0; c.hp += h; healFx(c, h); S.__imuSteal--; L(`👑 最初20人奪走 ${o.name} ${d} 點體力${h ? `，${c.name} 回復 ${h}` : ''}（還剩 ${S.__imuSteal} 回合）`); }
    else if (S.__imuSteal > 0) S.__imuSteal--;
    if (I.exec > 0 && o && o.hp > 0) {
      if (Math.random() < I.exec) {
        const no = o.voidImmune || hasTrait(o, 'immuneExec') || ['loki', 'joyboy'].includes(o.id) || etOn(o) || free(o);
        if (no) L(`🛡️ 秒殺判定成功，但 ${o.name} 不會被秒殺！`);
        else if (isBossUnit(o)) { const d = Math.floor(calcAttackDamage(c, o, { type: 'attack', power: 100, effect: { forceMultiplier: 3 } }) * I.pow); L(`👑 秒殺判定成功！${o.name} 是 BOSS，改為受到 3 倍傷害（${d}）`); curActor = c; applyDamage(o, d, sideOf(o), { ignoreShield: true }); curActor = null; }
        else { L(`☠️ 最初20人的秒殺判定成功（${pct(I.exec)}%）！${o.name} 被直接擊倒！`); curActor = c; applyDamage(o, o.hp + (o.status.shield || 0), sideOf(o), { ignoreShield: true }); curActor = null; }
        I.exec = I.execBase;
      } else I.exec = Math.min(1, Math.round((I.exec + I.execStep) * 100) / 100);
    }
    const b = B(), D = b && b.__imuDom; if (D && D.t > 0 && domOwner(D) === c) {
      if (oOk && free(o) && Math.random() < D.shock) L(`🥁 ${o.name} 是自由的，霸王色震懾對他無效！`);
      else if (oOk && Math.random() < D.shock) { const d = Math.max(1, Math.floor(o.maxHp * D.shockDmg)); o.hp = Math.max(0, o.hp - d); dmgFx(o, d, '#ff2a5a');
        if (immune(o) || free(o)) L(`👑 霸王色震懾！${o.name} 受到最大體力 ${pct(D.shockDmg)}% 的真實傷害（${d}），但免疫了無法行動`);
        else { o.status.__awe = Math.max(o.status.__awe || 0, 1); L(`👑 霸王色震懾！${o.name} 受到最大體力 ${pct(D.shockDmg)}% 的真實傷害（${d}），下回合無法行動！`); } }
      D.t--; if (D.t <= 0) { b.__imuDom = null; L(`👑 世界之王的深淵消散了。`); }
    }
  }
  function punishNow() {
    const D = domain(); if (!D || !D.pend) return; D.pend = false; const o = foeOf(domainOwner()); if (!o || o.hp <= 0) return;
    const d = Math.floor(o.hp * D.punish); if (d <= 0) return; o.hp -= d; dmgFx(o, d, '#ff2a5a'); L(`👑 世界之王的懲罰：${o.name} 直接損失目前體力的 ${pct(D.punish)}%（${d}）！`); hud();
  }
  if (typeof beginTurn === 'function') { const _bt = beginTurn; beginTurn = function () { try { punishNow(); } catch (e) { } return _bt.apply(this, arguments); }; }

  /* ---------- 出招前後：震懾、封印、支配、命中、迴避 ---------- */
  function preAct(actor, target, idx) {
    const S = actor.status, out = { idx, skip: false };
    if (S.__awe > 0) { S.__awe--; L(`👑 ${actor.name} 被霸王色震懾，這回合無法行動！`); say(actor, '震懾'); out.skip = true; return out; }
    if (S.__sealNext > 0) { S.__sealNext--; L(`🔒 ${actor.name} 的主動技能被封印，這回合無法施放！`); say(actor, '封印'); out.skip = true; return out; }
    let skill = idx >= 0 ? actor.skills[idx] : null;
    if (S.__nullNext > 0 && skill) { S.__nullNext = 0; if (skill.pp > 0) skill.pp--; L(`🕳️ ${actor.name} 的「${skill.name}」被黑暗吞噬，失效了！`); say(actor, '失效'); out.skip = true; return out; }
    if (S.__ultSeal > 0 && skill && skill.ultimate) { L(`⛓️ ${actor.name} 被壓制，無法施放奧義「${skill.name}」！`); say(actor, '壓制'); out.skip = true; return out; }
    if (skill && skill.effect && skill.effect.breakInvuln && target && (target.status.invuln > 0 || target.status.__imuInv > 0)) { target.status.invuln = 0; target.status.__imuInv = 0; L(`⚡ ${actor.name} 的「${skill.name}」打破了 ${target.name} 的無敵！`); }
    if (S.__imuDomd > 0) { S.__imuDomd--; const pool = actor.skills.map((s, i) => ({ s, i })).filter(x => x.s && x.s.pp > 0 && !x.s.locked);
      if (pool.length) { const pk = pool[Math.floor(Math.random() * pool.length)]; out.idx = pk.i; skill = pk.s; L(`👁 ${actor.name} 被支配，無法自己選擇技能，被迫施放「${pk.s.name}」！`); say(actor, '支配'); if (skill.type === 'attack') S.__domAct = 1; } }
    if (S.__sealAtk > 0) { S.__sealAtk--; if (skill && skill.type === 'attack') { L(`🔒 ${actor.name} 的攻擊技能被黑焰封印，這回合無法攻擊！`); say(actor, '封印'); S.__domAct = 0; out.skip = true; return out; } }
    const D = skill && domainVs(actor); if (D) { out.acc = [skill, skill.accuracy]; skill.accuracy = skill.accuracy * (1 - D.acc); }
    if (skill && skill.type === 'attack' && target && isImu(target) && target.hp > 0) { const ev = evadeChance(target); if (ev > 0 && Math.random() < ev) { target.status.dodge = (target.status.dodge || 0) + 1; out.dodge = target.status.dodge; out.dodgeT = target; } }
    return out;
  }
  function postAct(actor, target, skill, pre) {
    if (pre.acc) pre.acc[0].accuracy = pre.acc[1];
    if (pre.dodgeT) { const T = pre.dodgeT; if ((T.status.dodge || 0) >= pre.dodge) T.status.dodge = Math.max(0, T.status.dodge - 1);
      else if (T.__imu.voidUsed && T.__imu.evStacks < (T.__imu.stackMax || 3)) { T.__imu.evStacks++; L(`🌑 ${T.name} 迴避成功！下一次攻擊威力 +${T.__imu.evStacks * 20}%（最多 ${(T.__imu.stackMax || 3) * 20}%）`); } }
    if (actor && actor.status) actor.status.__domAct = 0;
  }

  /* ---------- 出招：包住 executeAction（battle.js） ---------- */
  if (typeof executeAction === 'function') {
    const _ea = executeAction;
    executeAction = async function (side, idx) {
      const b = B(); if (!b) return _ea.apply(this, arguments);
      const actor = side === 'P' ? b.player : b.enemy, target = side === 'P' ? b.enemy : b.player;
      if (!actor || actor.hp <= 0) return _ea.apply(this, arguments);
      const pre = preAct(actor, target, idx);
      if (pre.skip) { hud(); try { renderSkills(); } catch (e) { } await wait(650); return; }
      idx = pre.idx; const skill = idx >= 0 ? actor.skills[idx] : null, pp0 = skill ? skill.pp : 0, seq0 = isImu(actor) ? actor.__imu.ascSeq : 0;
      inAction++; curActor = actor; let r;
      try { r = await _ea.call(this, side, idx); }
      finally { inAction--; postAct(actor, target, skill, pre); curActor = null; }
      if (isImu(actor) && skill && skill.effect && skill.effect.imuAscend && skill.pp < pp0 && actor.__imu.ascSeq === seq0 && actor.hp > 0) ascend(actor, target, skill.effect.imuAscend); /* 附加效果被封印時，晉升本身仍然發生 */
      if (isImu(actor) && actor.__imu.pend != null) { const form = actor.__imu.pend; actor.__imu.pend = null;
        if (onScreen(actor) && typeof imuFormFx === 'function') { try { await imuFormFx(side === 'P' ? 'L' : 'R', actor, form, () => setForm(actor, form)); } catch (e) { console.warn(e); setForm(actor, form); } } else setForm(actor, form);
        hud(); try { renderSkills(); } catch (e) { } }
      return r;
    };
  }

  /* ---------- 敵方 AI：先晉升，再用②③④ ---------- */
  function ai(f, o) {
    if (!isImu(f) || !o) return -1;
    const s = f.skills, ok = i => !!(s[i] && !s[i].locked && s[i].pp > 0 && !(s[i].ultimate && f.status.__ultSeal > 0)), I = f.__imu, S = f.status, hp = f.hp / f.maxHp, OS = o.status || {};
    if (S.__sealAtk > 0) { for (const i of [0, 1, 2, 4]) if (ok(i) && s[i].type !== 'attack') return i; }
    if (I.throne && I.form === 2) { for (const i of (Math.random() < .5 ? [3, 2, 1, 0] : [2, 1, 3, 0])) if (ok(i) && !(i === 2 && domain()) && !(i === 0 && act(S.__imuEt))) return i; return ok(3) ? 3 : -1; }
    /* pace：勇者之塔的伊姆不會一開場就晉升（tower.js 的 enemyMod.imuPace＝第幾回合起才放⑤；體力低於 50% 時提早） */
    const b0 = B(), rd = (b0 && b0.round) || 1, wait5 = I.pace && hp >= (I.paceHp ?? .5) && (I.form === 0 ? rd < I.pace : I.formTurns < I.pace);
    if (wait5 && I.form < 2) { if (I.form === 0) { if (ok(0) && !act(S.__imuUnd) && hp < .9) return 0; return -2; } }
    if (I.form === 0) { if (ok(4)) return 4; if (ok(0)) return 0; return -1; }
    if (I.form === 1) {
      if (hp < .35 && ok(0) && !act(S.__imuUnd)) return 0;
      if (!act(OS.__pact) && ok(1)) return 1;
      if (ok(4) && !wait5 && (I.formTurns >= 2 || hp < .5)) return 4;
      if (!act(S.__imuEv) && ok(2) && Math.random() < .5) return 2;
      for (const i of [3, 2, 4, 0, 1]) if (ok(i)) return i; return -1;
    }
    if (hp < .45 && ok(0) && !act(S.__imuEt)) return 0;
    if (!domain() && ok(2)) return 2;
    if (!act(OS.__pact) && ok(1)) return 1;
    if (ok(4) && !(S.__imuInv > 0) && hp < .5 && Math.random() < .5) return 4;
    for (const i of [3, 1, 2, 0, 4]) if (ok(i)) return i; return -1;
  }
  if (typeof pickEnemySkill === 'function') {
    const _pes = pickEnemySkill;
    pickEnemySkill = function () {
      const b = B(), e = b && b.enemy;
      if (e && isImu(e)) { const i = ai(e, b.player); if (i >= 0) return i; if (i === -2) return -1; /* 還沒到晉升的時機：用奮力一擊 */ }
      let i = _pes.apply(this, arguments);
      if (e && e.status && e.status.__ultSeal > 0 && i >= 0 && e.skills[i] && e.skills[i].ultimate) { const al = e.skills.map((s, k) => ({ s, k })).filter(x => x.s.pp > 0 && !x.s.locked && !x.s.ultimate); if (al.length) i = al[Math.floor(Math.random() * al.length)].k; }
      if (e && e.status && e.status.__sealAtk > 0 && i >= 0 && e.skills[i] && e.skills[i].type === 'attack') { const sup = e.skills.map((s, k) => ({ s, k })).filter(x => x.s.pp > 0 && !x.s.locked && x.s.type !== 'attack'); if (sup.length) i = sup[Math.floor(Math.random() * sup.length)].k; }
      return i;
    };
  }

  /* ---------- 速度：世界之王領域 ---------- */
  if (typeof effectiveSpeed === 'function') { const _es = effectiveSpeed; effectiveSpeed = function (c) { const v = _es.apply(this, arguments); const D = domainVs(c); return D ? v * (1 - D.spd) : v; }; }

  /* ---------- 倒下：契約回報、存在抹除（無法復活） ---------- */
  if (typeof checkBattleEnd === 'function') {
    const _cbe = checkBattleEnd;
    checkBattleEnd = function () {
      const b = B();
      if (b) [b.player, b.enemy, ...teamOf()].forEach(f => { if (!f || !f.status || f.hp > 0) return; pactReward(f, true);
        const S = f.status; if (act(S.__erase) && (S.undyingTurns > 0 || S.lives > 0 || S.revive > 0)) { S.undyingTurns = 0; S.lives = 0; S.revive = 0; L(`🔥 ${f.name} 的存在被抹除，無法復活！`); } });
      return _cbe.apply(this, arguments);
    };
  }

  /* ---------- 道具回復也受減療影響 ---------- */
  if (typeof applyItem === 'function') { const _ai = applyItem; applyItem = async function () { const b = B(), p = b && b.player, h0 = p ? p.hp : 0; const r = await _ai.apply(this, arguments); if (p) { cutHeal(p, h0); hud(); } return r; }; }

  /* ---------- BOSS 奧義次數上限（story_boss_v156 的 bossUltCap）不套用在「最初20人」：使用者指定 4 次 ---------- */
  if (typeof applyChapterDifficulty === 'function') { const _acd = applyChapterDifficulty; applyChapterDifficulty = function (f) { const r = _acd.apply(this, arguments); const U = r && r.id === 'imu' && r.skills && r.skills[4];
    if (U && U.effect && U.effect.imuAscend && !U.locked) { const n = Math.max(U.maxPP, ((CHARACTERS.imu.skills || [])[4] || {}).maxPP || 4); U.pp = U.maxPP = n; } return r; }; }

  /* ---------- 建立角色與開戰 ---------- */
  if (typeof buildFighter === 'function') { const _bf = buildFighter; buildFighter = function (id) { const f = _bf.apply(this, arguments); if (id === 'imu') init(f); return f; }; }
  if (typeof startBattle === 'function') {
    const _sb = startBattle;
    startBattle = function () {
      const r = _sb.apply(this, arguments); const b = B();
      if (b) { b.__imuDom = null; [b.enemy, ...teamOf()].forEach(f => { if (f && f.id === 'imu') { init(f); lockForm(f); } });
        if (isImu(b.enemy) && b.opts && b.opts.enemyMod && b.opts.enemyMod.imuPace) { b.enemy.__imu.pace = b.opts.enemyMod.imuPace; if (b.opts.enemyMod.imuPaceHp != null) b.enemy.__imu.paceHp = b.opts.enemyMod.imuPaceHp; }
        /* 虛空王座：伊姆完全體直接以第二型態登場（不經過晉升，所以沒有晉升的無敵、奪血、秒殺判定），也不施放「最初20人」，
           否則開場連續 10 回合無敵、累積傷害永遠是 0，挑戰失去意義（v165 待使用者確認） */
        const e = b.enemy; if (b.opts && b.opts.throne && isImu(e) && e.__imu.form === 0) throneInit(e);
        try { renderSkills(); renderHUD(true); } catch (e) { } }
      return r;
    };
  }

  /* ---------- 介面：技能按鈕（型態未開啟、攻擊封印）與狀態標籤 ---------- */
  if (typeof renderSkills === 'function') {
    const _rs = renderSkills;
    renderSkills = function () {
      const r = _rs.apply(this, arguments); const b = B(), p = b && b.player, root = document.getElementById('bSkills'); if (!p || !root) return r;
      const kids = root.children;
      p.skills.forEach((s, i) => { const el = kids[i]; if (!el) return;
        if (s.locked === 'form') { const d = el.querySelector('.sk-desc'), k = el.querySelector('.sk-kind'); if (d) d.textContent = '晉升第一型態後開啟'; if (k) k.textContent = '型態'; el.classList.add('imu-form-lock'); }
        if (p.status.__ultSeal > 0 && s.ultimate && el.tagName === 'BUTTON') { el.disabled = true; el.classList.add('imu-sealed'); el.title = '奧義被壓制'; }
        if (p.status.__sealAtk > 0 && s.type === 'attack' && el.tagName === 'BUTTON') { el.disabled = true; el.classList.add('imu-sealed'); el.title = '攻擊技能被黑焰封印'; } });
      return r;
    };
  }
  if (typeof statusChips === 'function') {
    const _sc = statusChips;
    statusChips = function (c) {
      const h0 = _sc.apply(this, arguments); const S = c && c.status; if (!S) return h0; let h = ''; /* v165 標籤放在最前面：手機只顯示前 3 個 */
      const chip = (t, k, tip) => { h += `<span class="chip ${k}"${tip ? ` title="${tip}"` : ''}>${t}</span>`; };
      if (isImu(c)) { const I = c.__imu;
        if (I.form > 0) chip(I.form === 1 ? '第一型態' : '第二型態', 'up', '最初20人晉升的型態');
        if (S.__imuInv > 0) chip('無敵 ' + S.__imuInv, 'good', '不受任何傷害');
        if (act(S.__imuUnd)) chip('不死 ' + S.__imuUnd.t, 'good', `每回合回復、${S.__imuUnd.guard ? '可撐住一次致命傷、' : ''}反彈 ${pct(S.__imuUnd.thorn)}% 傷害`);
        if (act(S.__imuEt)) chip('永劫不滅 ' + S.__imuEt.t, 'good', `每回合回復 ${pct(S.__imuEt.regen)}%、減傷 ${pct(S.__imuEt.dr)}%、反彈 ${pct(S.__imuEt.reflect)}%`);
        if (act(S.__imuEv)) chip(`迴避 +${pct(S.__imuEv.evade)}% ` + S.__imuEv.t, 'good', '受到攻擊時有機率迴避或深淵轉移');
        if (I.evStacks > 0) chip(`下擊 +${I.evStacks * 20}%`, 'up', '迴避成功的累積加成');
        if (I.etStacks > 0) chip(`攻擊威力 +${I.etStacks * 10}%`, 'up', '永劫不滅的累積加成');
        if (I.pow > 1) chip('威力 ×' + I.pow, 'up', '最初20人：全部技能威力提升，傷害改為真實傷害');
        if (S.__imuSteal > 0) chip('奪血 ' + S.__imuSteal, 'up', `每回合奪走對手目前體力 ${pct(I.stealR)}%`);
        if (I.exec > 0) chip('秒殺 ' + pct(I.exec) + '%', 'up', '每回合判定秒殺對手，失敗則 +5%');
        if (I.clutch > 0) chip('瀕死回滿 ×' + I.clutch, 'good', `體力低於 ${pct(I.clutchAt)}% 時恢復全部體力`);
        const D = domain(); if (D && domainOwner() === c) chip('世界之王 ' + D.t, 'good', `迴避 +${pct(D.evade)}%、減傷 ${pct(D.dr)}%、每回合霸王色震懾`);
      }
      if (act(S.__pact)) chip(`${S.__pact.full ? '完全支配' : '惡魔契約'} ${S.__pact.t}`, 'bad', `每回合失去最大體力 ${pct(S.__pact.ratio)}%${S.__pact.healCut ? `、治療 -${pct(S.__pact.healCut)}%` : ''}${S.__pact.noBuff ? '、無法獲得能力提升' : ''}`);
      if (S.__imuDomd > 0) chip('支配', 'bad', '下一次行動無法自己選擇技能');
      if (S.__sealAtk > 0) chip('攻擊封印', 'bad', '下一回合無法使用攻擊技能');
      if (S.__sealNext > 0) chip('技能封印', 'bad', '下一次主動技能會被封印');
      if (S.__awe > 0) chip('霸王色震懾', 'bad', '下回合無法行動');
      if (act(S.__erase)) chip('存在抹除 ' + S.__erase.t, 'bad', `治療 -${pct(S.__erase.healCut)}%、無法復活、無法發動保命效果`);
      if (act(S.__healSeal)) chip(`回復 -${pct(S.__healSeal.cut)}% ${S.__healSeal.t}`, 'bad', '回復量被壓制');
      if (S.__ultSeal > 0) chip('奧義壓制 ' + S.__ultSeal, 'bad', '無法使用第 5 招（含變身與晉升）');
      if (S.__nullNext > 0) chip('下一招失效', 'bad', '下一招會被黑暗吞噬');
      if (S.__mirror > 0) chip('反彈反轉 ' + S.__mirror, 'good', '反彈到自己身上的傷害會轉回去');
      if (S.__free > 0) chip('自由 ' + S.__free, 'good', '不受契約、支配、封印、壓制與秒殺');
      const Dv = domainVs(c); if (Dv) chip(`命中・速度 -${pct(Dv.acc)}%`, 'bad', '世界之王的深淵壓制（換人也持續）');
      return h + h0;
    };
  }

  function throneInit(e) { const I = e.__imu; I.throne = true; I.tScale = THRONE_SCALE; I.pace = THRONE_PACE; I.paceHp = 0; e.dmgMul = (e.dmgMul || 1) * THRONE_DMG;
    lockForm(e); const U = e.skills[4]; if (U) { const n = ((CHARACTERS.imu.skills || [])[4] || {}).maxPP || 4; U.pp = U.maxPP = n; } /* 第 5 招維持規格的 4 次；其他技能次數無限 */
    L(`👑 虛空王座上的伊姆從初始型態開始，施放「最初20人」後才會一步步晉升！`); }
  /* 虛空王座的伊姆（v167：從初始型態開始，第 THRONE_PACE 回合起才施放「最初20人」，晉升後每次至少隔 THRONE_PACE 回合）：比例類效果（契約、霸王色震懾、毀滅之力追加、擊殺未出戰角色的機率、晉升的奪血與秒殺判定）×THRONE_SCALE，傷害倍率 ×THRONE_DMG。
     王座比的是累積傷害，伊姆照原規格出手時三人隊 4～5 回合全滅、累積傷害幾乎是 0；調整後回到與 v164 王座相近的挑戰長度（v165 待使用者確認） */
  const THRONE_SCALE = .2, THRONE_DMG = .35, THRONE_PACE = 6;
  window.IMU165 = { throneInit, preAct, postAct, ai, setForm, init, lockForm, ascend, punishNow, pactReward };
})();
