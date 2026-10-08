/* v131 第一階段：長期養成與每日節奏（使用者同意的商業化規劃・第一階段）。
   1. 角色覺醒（★0～★5）：用「覺醒結晶」＋貝里升星；每升一顆星，劇情／挑戰（非 PvP）中體力與傷害 +5%（★5＝+25%）。
      升星需要角色等級：★1 LV20、★2 LV40、★3 LV60、★4 LV80、★5 LV100。重複抽到的角色可以分解成覺醒結晶。
   2. 技能等級（Lv1～Lv5，每一招分開）：用「秘傳書」＋貝里升級；技能等級上限跟角色等級走（LV20→2、40→3、60→4、80→5）。
      攻擊招式每級傷害 +6%（Lv5＝+24%）；Lv3 次數 +1（奧義除外）；輔助招式 Lv5 再 +1 次。只在劇情／挑戰中生效，PvP 雙方條件相同。
   3. 每日活躍（0～100）：完成「今日必做」得到活躍度，20／40／60／80／100 各開一個寶箱；活躍度同時累積到本週活躍（150／300／450／600 寶箱）
      與航海通行證經驗（pass_v131.js 的 passAddXp）。
   存檔：roster[id].star、roster[id].sk[0..4]；SAVE.data.act＝{ day, base, got:[], credited }；SAVE.data.actW＝{ wk, pts, got:[] }。
   給培養視窗（grow_v112.js）用的介面：window.PROG。給通行證畫面用：window.ACT。 */
const PROG_CFG = {
  starLv: [20, 40, 60, 80, 100],                 /* 升到第 k 顆星需要的角色等級 */
  starGem: [20, 40, 70, 110, 160],               /* 每顆星需要的覺醒結晶（SSR 基準，依稀有度倍率調整） */
  starBerry: [10000, 20000, 40000, 80000, 150000],
  rarMul: { C: .5, U: .5, N: .5, R: .5, RR: .6, RRR: .7, SR: .75, SSR: 1, UR: 1.3, 'UR+': 1.6, 'UR++': 2 },
  dupeGem: { C: 3, U: 3, N: 3, R: 5, RR: 6, RRR: 8, SR: 10, SSR: 20, UR: 35, 'UR+': 50, 'UR++': 80 }, /* 分解一隻重複角色得到的覺醒結晶 */
  starBonus: .05,                                /* 每顆星：體力、傷害 +5% */
  skBook: [1, 2, 3, 5],                          /* 技能升到 Lv2～5 需要的秘傳書 */
  skBerry: [5000, 10000, 20000, 40000],
  skDmg: .06,                                    /* 攻擊招式每級傷害 +6% */
  daily: [                                       /* 今日必做：合計 100 活躍 */
    { id: 'login', text: '登入遊戲', pts: 10, goal: 1, get: () => 1, go: null },
    { id: 'wins', text: '戰鬥勝利 3 場', pts: 15, goal: 3, stat: 'wins', go: 'chart' },
    { id: 'bounty', text: '領取 2 張每日懸賞', pts: 15, goal: 2, stat: 'bounty', go: 'bounty' },
    { id: 'tower', text: '勇者之塔前進 1 層', pts: 10, goal: 1, stat: 'towerWins', go: 'tower' },
    { id: 'sweep', text: '使用掃蕩 1 次', pts: 10, goal: 1, stat: 'sweeps', go: 'chart' },
    { id: 'grow', text: '培養角色 1 次（升級、覺醒或技能）', pts: 10, goal: 1, stat: 'grows', go: 'crew' },
    { id: 'pull', text: '懸賞召喚 1 次', pts: 10, goal: 1, stat: '_pulls', go: 'summon' },
    { id: 'rhythm', text: '完成 1 首歌姬挑戰', pts: 10, goal: 1, stat: 'rhythm', go: 'rhythm' },
    { id: 'pvp', text: '天梯或好友對戰 1 場', pts: 10, goal: 1, stat: 'pvp', go: 'ladder' }
  ],
  dailyChest: [
    { at: 20, rew: { berry: 3000 } },
    { at: 40, rew: { items: { exp_m: 1, skill_book: 1 } } },
    { at: 60, rew: { items: { awaken_gem: 10 } } },
    { at: 80, rew: { berry: 8000, items: { skill_book: 1 } } },
    { at: 100, rew: { tokens: 3, items: { awaken_gem: 15 } } }
  ],
  weekChest: [
    { at: 150, rew: { tokens: 5, items: { exp_l: 1 } } },
    { at: 300, rew: { items: { awaken_gem: 30, skill_book: 2 } } },
    { at: 450, rew: { tokens: 8, items: { skill_book: 3 } } },
    { at: 600, rew: { tokens: 12, items: { awaken_gem: 50, exp_l: 2 } } }
  ]
};
(function () {
  const C = PROG_CFG;
  /* ---------- 新道具 ---------- */
  if (typeof ITEMS !== 'undefined') {
    ITEMS.awaken_gem = { name: '覺醒結晶', rarity: 'SR', icon: 'gem', color: '#ff6fb8', desc: '角色覺醒（升星）用的結晶。在角色培養的「覺醒」分頁使用；重複的角色也能分解成覺醒結晶。', effect: { grow: true } };
    ITEMS.skill_book = { name: '秘傳書', rarity: 'SR', icon: 'book', color: '#ffcf5a', desc: '提升技能等級用的秘笈。在角色培養的「技能」分頁使用。', effect: { grow: true } };
  }
  if (typeof ICONS !== 'undefined' && !ICONS.gem) ICONS.gem = '<path d="M32 6 52 24 32 58 12 24z" fill="var(--c)"/><path d="M32 6 40 24H24zM12 24h40L32 58z" fill="#fff" opacity=".28"/><path d="M24 24 32 58 40 24" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>';

  if (typeof SHOP !== 'undefined' && !SHOP.some(x => x.id === 'skill_book')) SHOP.push({ id: 'skill_book', price: 15000 }, { id: 'awaken_gem', price: 1500 }); /* 商店也能用貝里買（貝里的長期用途） */
  const inv = () => (SAVE.data.inventory = SAVE.data.inventory || {});
  const rarOf = id => (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[id]) || 'R';
  const R = id => (SAVE.data.roster || {})[id];
  const fmt = n => (+n || 0).toLocaleString();

  /* ---------- 發獎勵（寶箱、通行證、賽季共用） ---------- */
  function give(rew, why) {
    const list = []; if (!rew) return list;
    if (rew.berry) { addBerry(rew.berry); list.push({ name: '貝里', count: rew.berry, img: 'assets/ui/coin_berry.webp?v=100', rar: 'R' }); }
    if (rew.tokens) { SAVE.data.tokens = (SAVE.data.tokens || 0) + rew.tokens; list.push({ name: '寶藏幣', count: rew.tokens, img: 'assets/ui/coin_token.webp?v=115', rar: 'SR' }); }
    Object.entries(rew.items || {}).forEach(([k, n]) => { if (!ITEMS[k] || !n) return; inv()[k] = (inv()[k] || 0) + n; list.push({ item: k, count: n }); });
    SAVE.save(); if (typeof coins === 'function') coins();
    return list;
  }
  const rewText = rew => [rew.berry ? `貝里 ${fmt(rew.berry)}` : '', rew.tokens ? `寶藏幣 ×${rew.tokens}` : '', ...Object.entries(rew.items || {}).map(([k, n]) => ITEMS[k] ? `${ITEMS[k].name} ×${n}` : '')].filter(Boolean).join('、');
  function celebrate(title, list, sub) { if (!list.length) return; if (window.showRewards) showRewards({ title, sub }, list); else toast(`${title}：${list.map(x => x.item ? ITEMS[x.item].name : x.name).join('、')}`, 'gold'); }

  /* ---------- 覺醒（星級） ---------- */
  const starOf = id => Math.max(0, Math.min(5, (R(id) || {}).star || 0));
  const starCost = (id, k) => ({ gem: Math.max(5, Math.round(C.starGem[k - 1] * (C.rarMul[rarOf(id)] || 1))), berry: C.starBerry[k - 1], lv: C.starLv[k - 1] });
  function starUp(id) {
    const r = R(id); if (!r) return { ok: false, msg: '還沒有這位船員' }; const k = starOf(id) + 1; if (k > 5) return { ok: false, msg: '已經是最高星級' };
    const c = starCost(id, k); if (r.lv < c.lv) return { ok: false, msg: `角色要先升到 LV ${c.lv}` };
    if ((inv().awaken_gem || 0) < c.gem) return { ok: false, msg: `覺醒結晶不足（需要 ${c.gem}）` };
    if ((SAVE.data.berry || 0) < c.berry) return { ok: false, msg: `貝里不足（需要 ${fmt(c.berry)}）` };
    inv().awaken_gem -= c.gem; SAVE.data.berry -= c.berry; r.star = k; track('grows'); SAVE.save(); if (typeof coins === 'function') coins();
    return { ok: true, star: k };
  }
  const dupes = id => ((SAVE.data.dupes || {})[id] || 0);
  function dupeToGem(id) { const n = dupes(id); if (!n) return 0; const g = n * (C.dupeGem[rarOf(id)] || 5); SAVE.data.dupes[id] = 0; inv().awaken_gem = (inv().awaken_gem || 0) + g; SAVE.save(); return g; }

  /* ---------- 技能等級 ---------- */
  const skLv = (id, i) => Math.max(1, Math.min(5, (((R(id) || {}).sk) || [])[i] || 1));
  const skMax = id => Math.min(5, 1 + Math.floor(((R(id) || {}).lv || 1) / 20));
  const skCost = n => ({ book: C.skBook[n - 2], berry: C.skBerry[n - 2] });
  /* 等級效果說明（給介面顯示） */
  function skEffect(s, lv) {
    const atk = s.type === 'attack' && (s.power || 0) > 0, out = [];
    if (atk && lv > 1) out.push(`傷害 +${Math.round(C.skDmg * (lv - 1) * 100)}%`);
    if (!s.ultimate && lv >= 3) out.push(`次數 +${lv >= 5 && !atk ? 2 : 1}`);
    return out.join('、') || '尚無加成';
  }
  function skNext(s, lv) { if (lv >= 5) return ''; return skEffect(s, lv + 1); }
  function skUp(id, i) {
    const r = R(id), c = CHARACTERS[id]; if (!r || !c || !c.skills[i]) return { ok: false, msg: '找不到技能' };
    const u = (typeof SKILL_UNLOCK !== 'undefined' && SKILL_UNLOCK[i]) || 1; if (r.lv < u) return { ok: false, msg: `LV ${u} 才會學會這一招` };
    const lv = skLv(id, i); if (lv >= 5) return { ok: false, msg: '已經是最高等級' };
    if (lv >= skMax(id)) return { ok: false, msg: `角色升到 LV ${lv * 20} 才能把技能升到 Lv${lv + 1}` };
    const cost = skCost(lv + 1); if ((inv().skill_book || 0) < cost.book) return { ok: false, msg: `秘傳書不足（需要 ${cost.book}）` };
    if ((SAVE.data.berry || 0) < cost.berry) return { ok: false, msg: `貝里不足（需要 ${fmt(cost.berry)}）` };
    inv().skill_book -= cost.book; SAVE.data.berry -= cost.berry; r.sk = r.sk || [1, 1, 1, 1, 1]; r.sk[i] = lv + 1; track('grows'); SAVE.save(); if (typeof coins === 'function') coins();
    return { ok: true, lv: lv + 1 };
  }

  /* ---------- 戰鬥中生效（劇情、挑戰；PvP 不套用） ---------- */
  function applyGrowth(f, t) {
    if (!f || !R(f.id)) return; const st = starOf(f.id), r = R(f.id);
    if (st) { const m = 1 + C.starBonus * st; f.maxHp = Math.round(f.maxHp * m); f.dmgMul = (f.dmgMul || 1) * m; f.hp = t && t.hp != null ? Math.max(0, Math.min(f.maxHp, Math.round(t.hp))) : f.maxHp; f.__star = st; }
    f.skills.forEach((s, i) => { const lv = skLv(f.id, i); if (lv <= 1 || s.locked) return; s.__lv = lv;
      const atk = s.type === 'attack' && (s.power || 0) > 0, add = s.ultimate || s.maxPP <= 0 ? 0 : (lv >= 3 ? 1 : 0) + (lv >= 5 && !atk ? 1 : 0);
      if (add) { s.maxPP += add; if (!(t && Array.isArray(t.pp) && t.pp[i] != null)) s.pp = s.maxPP; } });
  }
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof startBattle === 'function') {
      const _sb = startBattle;
      startBattle = function (opts) {
        const r = _sb.apply(this, arguments);
        try { if (opts && !opts.pvp && !opts.live && battle && battle.team) { const spec = opts.team && opts.team.length ? opts.team : null; battle.team.forEach((f, i) => applyGrowth(f, spec ? spec[i] : null)); if (typeof renderHUD === 'function') renderHUD(true); if (typeof renderSkills === 'function') renderSkills(); } } catch (e) { console.warn(e); }
        return r;
      };
    }
    if (typeof computeSkillOutcome === 'function') {
      const _cso = computeSkillOutcome;
      computeSkillOutcome = function (actor, target, skill) {
        const r = _cso.apply(this, arguments);
        if (r && skill && skill.__lv > 1 && skill.type === 'attack' && r.damage > 0 && !(r.meta && (r.meta.execute || r.meta.executeBuff))) r.damage = Math.floor(r.damage * (1 + C.skDmg * (skill.__lv - 1)));
        return r;
      };
    }
  });

  /* ---------- 每日活躍、本週活躍 ---------- */
  const statOfX = k => k === '_pulls' ? (SAVE.data.pulls || 0) : (typeof statOf === 'function' ? statOf(k) : ((SAVE.data.stats || {})[k] || 0));
  const twWeek = () => { const t = Date.now() + 3 * 3600e3; const d = Math.floor(t / 864e5), dow = (new Date(t).getUTCDay() + 6) % 7; return 'W' + (d - dow); }; /* 台灣時間週一 05:00 換週 */
  function act() {
    const d = SAVE.data, day = typeof today === 'function' ? today() : new Date().toDateString();
    if (!d.act || d.act.day !== day) { const base = {}; C.daily.forEach(x => { if (x.stat) base[x.stat] = statOfX(x.stat); }); d.act = { day, base, got: [], credited: 0 }; SAVE.save(); }
    const wk = twWeek(); if (!d.actW || d.actW.wk !== wk) { d.actW = { wk, pts: 0, got: [] }; SAVE.save(); }
    return d.act;
  }
  function tasks() { const A = act(); return C.daily.map(x => { const v = x.get ? x.get() : statOfX(x.stat) - (A.base[x.stat] || 0); const prog = Math.max(0, Math.min(x.goal, v)); return { ...x, prog, done: prog >= x.goal }; }); }
  const points = () => tasks().reduce((a, x) => a + (x.done ? x.pts : 0), 0);
  /* 新增的活躍度：同步到本週活躍與通行證經驗（只算一次） */
  function sync() {
    if (typeof SAVE === 'undefined' || !SAVE.data || !SAVE.data.roster) return 0;
    const A = act(), p = points(), add = p - (A.credited || 0); if (add <= 0) return 0;
    A.credited = p; SAVE.data.actW.pts += add; SAVE.save();
    if (typeof window.passAddXp === 'function') window.passAddXp(add, '每日活躍');
    return add;
  }
  function claimDaily(at) { const A = act(), ch = C.dailyChest.find(c => c.at === at); if (!ch || A.got.includes(at) || points() < at) return null; A.got.push(at); SAVE.save(); const L = give(ch.rew); celebrate(`活躍度 ${at} 寶箱`, L); return L; }
  function claimWeek(at) { act(); const W = SAVE.data.actW, ch = C.weekChest.find(c => c.at === at); if (!ch || W.got.includes(at) || W.pts < at) return null; W.got.push(at); SAVE.save(); const L = give(ch.rew); celebrate(`本週活躍 ${at} 寶箱`, L);
    if (typeof window.passAddXp === 'function') window.passAddXp(50, '本週活躍寶箱'); return L; }
  const claimable = () => { const A = act(), p = points(), W = SAVE.data.actW; return C.dailyChest.filter(c => p >= c.at && !A.got.includes(c.at)).length + C.weekChest.filter(c => W.pts >= c.at && !W.got.includes(c.at)).length; };
  /* 任何統計更新（track）時順便同步活躍度 */
  if (typeof track === 'function') { const _t = track; track = function () { const r = _t.apply(this, arguments); try { sync(); } catch (e) { } return r; }; }
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => { try { sync(); } catch (e) { } }, 1500));

  window.PROG = { cfg: C, give, rewText, celebrate, starOf, starCost, starUp, dupes, dupeToGem, skLv, skMax, skCost, skEffect, skNext, skUp, rarOf };
  window.ACT = { tasks, points, sync, claimDaily, claimWeek, claimable, week: () => (act(), SAVE.data.actW), today: act };
})();
