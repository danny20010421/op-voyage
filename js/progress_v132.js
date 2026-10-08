/* v132 角色培養第二批：覺醒外觀與被動、技能專精、航海寶物（裝備）。只在劇情與挑戰（非 PvP）中生效。
   1. 覺醒外觀：★3 培養視窗立繪加金框；★5 戰鬥中我方立繪有金色光環。
      覺醒被動：★3「覺醒護盾」開場獲得 8% 最大體力的護盾；★5「覺醒之力」開場全能力 +1，每場戰鬥第一次受到致命傷害時以 1 體力撐住。
   2. 技能專精：技能升到 Lv5 後二選一（第一次免費，之後更換花 1 本秘傳書）。
      攻擊招式：強攻（傷害再 +10%）／熟練（次數 +1）；輔助招式：熟練（次數 +1）／先制（這一招先出手）；奧義：攻擊型＝強攻／先制，輔助型＝先制。
   3. 航海寶物：名刀（傷害%）、海賊外套（體力%）、永久指針（速度%）三個欄位；稀有度 R／SR／SSR／UR 有 1～4 條隨機副詞條（傷害、體力、速度、防禦、奧義傷害）。
      強化 +1～+10（貝里），主詞條每級 +10%，+3／+6／+9 時隨機一條副詞條成長；不需要的寶物可分解成貝里（SR 以上另給覺醒結晶）。
      掉落：勇者之塔每層 20%（BOSS 層必掉）、篇章 BOSS 25%、皇帝領海／洛克斯挑戰 BOSS 必掉、天梯勝利 30%、本週活躍寶箱（450 以上至少 SSR）。背包上限 150 件。
   存檔：roster[id].spec[i]＝'power'|'pp'|'first'；SAVE.data.gear＝{ seq, items:[{ id, slot, rar, lv, main, subs:[[k,v]], eq }] }。 */
const GEAR_CFG = {
  slots: { blade: { name: '名刀', main: 'dmg', icon: 'blade' }, coat: { name: '海賊外套', main: 'hp', icon: 'coat' }, compass: { name: '永久指針', main: 'spd', icon: 'compass' } },
  rar: ['R', 'SR', 'SSR', 'UR'], weight: [50, 32, 15, 3], subs: { R: 1, SR: 2, SSR: 3, UR: 4 },
  mainBase: { dmg: [4, 6, 8, 10], hp: [5, 7, 9, 12], spd: [3, 4, 5, 6] },
  subRange: { dmg: [1, 3], hp: [1, 3], spd: [1, 2], def: [2, 5], ult: [3, 6] },
  label: { dmg: '傷害', hp: '體力', spd: '速度', def: '防禦', ult: '奧義傷害' },
  enhCost: lv => 2000 * (lv + 1), rarMul: { R: 1, SR: 1.5, SSR: 2, UR: 3 }, maxLv: 10, cap: 150,
  salvage: { R: { berry: 1500 }, SR: { berry: 3000, gem: 2 }, SSR: { berry: 6000, gem: 5 }, UR: { berry: 12000, gem: 12 } },
  names: { blade: ['海軍制式軍刀', '妖刀・夜叉', '大業物・白鞘', '最上大業物・龍吟'], coat: ['水手外套', '海賊團長披風', '霸王大衣', '皇帝的戰袍'], compass: ['航海指針', '紀錄指針', '永久指針', '最終之島指針'] }
};
(function () {
  const G = GEAR_CFG, R = id => (SAVE.data.roster || {})[id], inv = () => (SAVE.data.inventory = SAVE.data.inventory || {});
  const rnd = (a, b) => a + Math.random() * (b - a), fmt = n => (+n || 0).toLocaleString();
  const ICON = {
    blade: '<path d="M14 50 46 10l6 2-2 6-32 40z" fill="var(--g)"/><path d="M10 54l6-6 4 4-6 6z" fill="#6a4a2a"/><path d="M16 44l8 8" stroke="#c9973a" stroke-width="4"/>',
    coat: '<path d="M20 10h24l10 12-6 6v28H16V28l-6-6z" fill="var(--g)"/><path d="M32 12v44M24 10l8 10 8-10" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>',
    compass: '<circle cx="32" cy="32" r="20" fill="var(--g)"/><circle cx="32" cy="32" r="14" fill="#0e1a30"/><path d="M32 20l4 12-4 12-4-12z" fill="#ff5a5a"/><path d="M32 32l4 0-4 12-4-12z" fill="#fff"/>'
  };
  const RCOL = { R: '#5fb8ff', SR: '#c58bff', SSR: '#ffcf5a', UR: '#ff7ad9' };
  const gearIcon = (g, size) => `<svg class="gr-ico" viewBox="0 0 64 64" style="--g:${RCOL[g.rar]};width:${size || 40}px;height:${size || 40}px" aria-hidden="true">${ICON[G.slots[g.slot].icon]}</svg>`;

  /* ---------- 覺醒被動、技能專精、寶物加成：在 v131 的養成加成之後套用 ---------- */
  const specOf = (id, i) => (((R(id) || {}).spec) || [])[i] || null;
  function specOpts(s) { const atk = s.type === 'attack' && (s.power || 0) > 0; if (s.ultimate) return atk ? ['power', 'first'] : ['first']; return atk ? ['power', 'pp'] : ['pp', 'first']; }
  const SPEC_TXT = { power: ['強攻', '傷害再 +10%'], pp: ['熟練', '次數 +1'], first: ['先制', '這一招先出手'] };
  function setSpec(id, i, k) {
    const r = R(id), c = CHARACTERS[id], s = c && c.skills[i]; if (!r || !s) return { ok: false, msg: '找不到技能' };
    if (window.PROG.skLv(id, i) < 5) return { ok: false, msg: '技能 Lv5 才能選擇專精' }; if (!specOpts(s).includes(k)) return { ok: false, msg: '這一招不能選這個專精' };
    r.spec = r.spec || []; if (r.spec[i] === k) return { ok: true, same: true };
    if (r.spec[i]) { if ((inv().skill_book || 0) < 1) return { ok: false, msg: '更換專精需要 1 本秘傳書' }; inv().skill_book--; }
    r.spec[i] = k; SAVE.save(); return { ok: true };
  }
  const gear = () => { const d = SAVE.data; d.gear = d.gear || { seq: 1, items: [] }; return d.gear; };
  const equipped = id => gear().items.filter(g => g.eq === id);
  const mainVal = g => +(G.mainBase[G.slots[g.slot].main][G.rar.indexOf(g.rar)] * (1 + .1 * g.lv)).toFixed(1);
  function gearSum(id) { const s = { dmg: 0, hp: 0, spd: 0, def: 0, ult: 0 }; equipped(id).forEach(g => { s[G.slots[g.slot].main] += mainVal(g); g.subs.forEach(([k, v]) => { s[k] += v; }); }); Object.keys(s).forEach(k => s[k] = +s[k].toFixed(1)); return s; }
  function applyExtra(f, t) {
    const r = R(f.id); if (!r) return; const st = window.PROG ? PROG.starOf(f.id) : 0;
    /* 技能專精 */
    f.skills.forEach((s, i) => { const k = specOf(f.id, i); if (!k || s.locked || (window.PROG && PROG.skLv(f.id, i) < 5)) return; s.__spec = k;
      if (k === 'pp' && !s.ultimate && s.maxPP > 0) { s.maxPP += 1; if (!(t && Array.isArray(t.pp) && t.pp[i] != null)) s.pp = s.maxPP; }
      if (k === 'first') s.effect = Object.assign({}, s.effect, { firstStrike: true }); });
    /* 寶物 */
    const S = gearSum(f.id);
    if (S.hp) { const old = f.maxHp; f.maxHp = Math.round(f.maxHp * (1 + S.hp / 100)); f.hp = t && t.hp != null ? Math.max(0, Math.min(f.maxHp, Math.round(t.hp))) : f.hp >= old ? f.maxHp : f.hp; }
    if (S.dmg) f.__dmgB = (f.__dmgB || 1) * (1 + S.dmg / 100);
    if (S.spd) f.baseSpeed = Math.round(f.baseSpeed * (1 + S.spd / 100));
    if (S.def) f.def = Math.round((f.def || 0) * (1 + S.def / 100));
    if (S.ult) f.__ultB = (f.__ultB || 1) * (1 + S.ult / 100);
    /* 覺醒被動（每一場戰鬥開始時） */
    if (st >= 3) { const sh = Math.round(f.maxHp * .08); f.status.shield = (f.status.shield || 0) + sh; f.__aw3 = true; }
    if (st >= 5) { ['atk', 'def', 'spd'].forEach(k => { f.buffs[k] = Math.max(-6, Math.min(6, (f.buffs[k] || 0) + 1)); }); f.__guts = true; }
  }
  /* 覺醒之力：第一次致命傷以 1 體力撐住 */
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof startBattle === 'function') {
      const _sb = startBattle;
      startBattle = function (opts) {
        const r = _sb.apply(this, arguments);
        try { if (opts && !opts.pvp && !opts.live && battle && battle.team) { const spec = opts.team && opts.team.length ? opts.team : null; battle.team.forEach((f, i) => applyExtra(f, spec ? spec[i] : null));
          const st = battle.player.__aw3 || battle.player.__guts; if (st) log(`✨ 覺醒被動：${battle.team.filter(f => f.__aw3).map(f => f.name).join('、') || battle.player.name} 獲得覺醒護盾${battle.team.some(f => f.__guts) ? '；★5 角色全能力 +1' : ''}`);
          if (typeof renderHUD === 'function') renderHUD(true); if (typeof renderSkills === 'function') renderSkills(); }
          aura(); } catch (e) { console.warn(e); }
        return r;
      };
    }
    if (typeof applyDamage === 'function') {
      const _ad = applyDamage;
      applyDamage = function (target) { const r = _ad.apply(this, arguments); if (target && target.hp <= 0 && target.__guts && !target.status.dominated) { target.__guts = false; target.hp = 1; log(`⭐ 覺醒之力：${target.name} 撐住了致命一擊！`); try { if (typeof floatText === 'function') floatText(battle && target === battle.player ? 'L' : 'R', '覺醒', 'status'); if (typeof renderHUD === 'function') renderHUD(); } catch (e) { } } return r; };
    }
    /* ★5 金色光環：換人或換圖時跟著更新 */
    if (typeof applyVisual === 'function') { const _av = applyVisual; applyVisual = function () { const r = _av.apply(this, arguments); aura(); return r; }; }
  });
  function aura() { try { const L = document.getElementById('bFL'), R2 = document.getElementById('bFR'); if (!L || typeof battle === 'undefined' || !battle) return; const p = battle.player, pvp = battle.opts && (battle.opts.pvp || battle.opts.live);
    const st = !pvp && p && window.PROG ? PROG.starOf(p.id) : 0; L.classList.toggle('aw5', st >= 5); L.classList.toggle('aw3', st >= 3 && st < 5); if (R2) R2.classList.remove('aw5', 'aw3'); } catch (e) { } }

  /* ---------- 航海寶物 ---------- */
  function roll(slot, rar) {
    const sl = slot || Object.keys(G.slots)[Math.floor(Math.random() * 3)];
    let r = rar; if (!r) { let x = Math.random() * 100; for (let i = 0; i < 4; i++) { x -= G.weight[i]; if (x < 0) { r = G.rar[i]; break; } } r = r || 'R'; }
    const main = G.slots[sl].main, pool = Object.keys(G.subRange).filter(k => k !== main), subs = [];
    for (let i = 0; i < G.subs[r] && pool.length; i++) { const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0], [a, b] = G.subRange[k]; subs.push([k, +rnd(a, b).toFixed(1)]); }
    const gg = gear(); return { id: 'g' + (gg.seq++), slot: sl, rar: r, lv: 0, subs, eq: null, name: G.names[sl][G.rar.indexOf(r)] };
  }
  function addGear(g, quiet) { const gg = gear(); if (gg.items.length >= G.cap) { if (!quiet) toast('航海寶物已滿（150 件），請先分解不需要的寶物', 'warn'); return null; } gg.items.push(g); SAVE.save(); if (!quiet && typeof toast === 'function') toast(`獲得航海寶物：${g.rar} ${g.name}`, 'gold'); return g; }
  function drop(chance, minRar) { if (Math.random() >= chance) return null; let g = roll(); if (minRar && G.rar.indexOf(g.rar) < G.rar.indexOf(minRar)) g = roll(null, minRar); return addGear(g); }
  function equip(gid, id) { const g = gear().items.find(x => x.id === gid); if (!g || !R(id)) return false; equipped(id).filter(x => x.slot === g.slot).forEach(x => { x.eq = null; }); g.eq = id; SAVE.save(); return true; }
  function unequip(gid) { const g = gear().items.find(x => x.id === gid); if (g) { g.eq = null; SAVE.save(); } }
  const enhCost = g => Math.round(G.enhCost(g.lv) * G.rarMul[g.rar]);
  function enhance(gid) { const g = gear().items.find(x => x.id === gid); if (!g) return { ok: false, msg: '找不到寶物' }; if (g.lv >= G.maxLv) return { ok: false, msg: '已經強化到 +10' };
    const c = enhCost(g); if ((SAVE.data.berry || 0) < c) return { ok: false, msg: `貝里不足（需要 ${fmt(c)}）` }; SAVE.data.berry -= c; g.lv++;
    let up = null; if (g.lv % 3 === 0 && g.subs.length) { const s = g.subs[Math.floor(Math.random() * g.subs.length)], [a, b] = G.subRange[s[0]]; const add = +rnd(a, b).toFixed(1); s[1] = +(s[1] + add).toFixed(1); up = `${G.label[s[0]]} +${add}%`; }
    if (typeof track === 'function') track('grows'); SAVE.save(); if (typeof coins === 'function') coins(); return { ok: true, lv: g.lv, up }; }
  function salvage(ids) { const gg = gear(); let berry = 0, gem = 0, n = 0; ids.forEach(gid => { const i = gg.items.findIndex(x => x.id === gid && !x.eq); if (i < 0) return; const g = gg.items[i], v = G.salvage[g.rar]; berry += v.berry + enhSpent(g) * .5; gem += v.gem || 0; gg.items.splice(i, 1); n++; });
    berry = Math.round(berry); if (berry) SAVE.data.berry = (SAVE.data.berry || 0) + berry; if (gem) inv().awaken_gem = (inv().awaken_gem || 0) + gem; SAVE.save(); if (typeof coins === 'function') coins(); return { n, berry, gem }; }
  const enhSpent = g => { let s = 0; for (let i = 0; i < g.lv; i++) s += Math.round(G.enhCost(i) * G.rarMul[g.rar]); return s; };
  const describe = g => ({ main: `${G.label[G.slots[g.slot].main]} +${mainVal(g)}%`, subs: g.subs.map(([k, v]) => `${G.label[k]} +${v}%`) });

  /* ---------- 掉落：用統計更新（track）判斷 ---------- */
  let lastTower = 0;
  if (typeof track === 'function') { const _t = track; track = function (key) { const r = _t.apply(this, arguments); try {
    if (key === 'towerWins') { lastTower = Date.now(); if (typeof battle !== 'undefined' && battle && battle.isBoss) drop(1, 'SR'); else drop(.2); }
    else if (key === 'bossWins' && Date.now() - lastTower > 3000) { const ch = typeof battle !== 'undefined' && battle && battle.chapterId; drop(ch === 'emperor' ? 1 : .25, ch === 'emperor' ? 'SR' : null); }
  } catch (e) { } return r; }; }
  /* 本週活躍寶箱、天梯勝利 */
  window.addEventListener('DOMContentLoaded', () => {
    if (window.ACT && ACT.claimWeek) { const cw = ACT.claimWeek; ACT.claimWeek = function (at) { const L = cw.apply(this, arguments); if (L) addGear(roll(null, at >= 450 ? 'SSR' : 'SR')); return L; }; }
    if (window.passAddXp) { const pa = window.passAddXp; window.passAddXp = function (n, why) { const r = pa.apply(this, arguments); if (why === '天梯' && n >= 20) drop(.3); return r; }; }
  });

  window.GEAR = { cfg: G, gear, equipped, gearSum, roll, addGear, drop, equip, unequip, enhance, enhCost, salvage, describe, gearIcon, mainVal, RCOL };
  window.PROG2 = { specOf, specOpts, setSpec, SPEC_TXT };
})();
