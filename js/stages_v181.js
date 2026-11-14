/* v181 活動關卡（使用者 11/08 04:55「遊戲大廳的右側偏空……限時的活動、節慶活動等限時闖關關卡放在大廳右側……獲得角色碎片、角色道具、角色武器……常駐的關卡讓每個人每天去掃蕩」）
   大廳右側新增兩個入口（直式手機在右上、電腦在立繪與資訊區之間）：
   ① 限時祭典：依台灣日期自動開放的節慶關卡（萬聖夜、艾爾巴夫巨人祭、聖誕晚宴、和之國新春祭、魯夫生日祭、水之七島夏日祭）。
      初級／中級／高級三關，每天共 5 次。打贏得到「祭典徽章」與活動抽獎券；徽章在祭典商店換限定角色碎片、抽獎券、SSR 航海寶物、覺醒結晶、掃蕩券等（每期限量）。
   ② 每日秘境（常駐）：貝里寶藏船（貝里）、海軍本部訓練場（經驗書）、貝加龐克的寶物研究所（航海寶物＝角色武器）、空島覺醒試煉（覺醒結晶、技能書）、玩具屋補給庫（戰鬥道具）。
      每個秘境每天 3 次，通關過的難度可以用掃蕩券直接掃蕩（1 張 1 次）。
   存檔：SAVE.data.stg = { day, runs:{key:n}, clear:{key:1}, first:{key:1}, badge:{fest:n}, buy:{fest:{goods:n}} }，每天 00:00（台灣時間）重置次數。 */
(function () {
  const $ = id => document.getElementById(id);
  const TIER = [
    { name: '初級', lv: 30, rec: 20, ch: 'east', boss: false },
    { name: '中級', lv: 60, rec: 50, ch: 'skypiea', boss: false },
    { name: '高級', lv: 90, rec: 80, ch: 'dark', boss: true }
  ];
  const FEST_RUNS = 5, REALM_RUNS = 3;
  /* 難度校正（tests/imu-sim.js 模擬：建議等級的 SSR 隊伍高級約 60～100% 勝率、SR 隊伍約 30～60%；量測見 /root/promo/v181/diff*_out.json）。
     UR+ 的四皇級對手體力與傷害打折；少數有剋制機制的對手個別調整。戰敗不扣次數。 */
  const ADJ = { kaido: { hp: .5, dmg: .55 }, king: { hp: .7, dmg: .8 }, kuma: { hp: .75, dmg: .8 }, lucci: { hp: .8, dmg: .85 }, gunko: { hp: .75, dmg: .8 }, buggy: { hp: .8, dmg: .85 } };
  const modOf = id => ADJ[id] || ((typeof CHAR_RARITY !== 'undefined' && /^UR\+/.test(CHAR_RARITY[id] || '')) ? { hp: .55, dmg: .6 } : {});
  /* 節慶檔期（台灣時間）；every:'year' 每年固定，start/end 寫 MM-DD；沒寫 every 寫完整日期 */
  const FESTS = [
    { id: 'halloween', every: 'year', start: '10-18', end: '11-01', name: '恐怖三桅帆船・萬聖夜', art: 'assets/chapters/thriller.webp', color: '#9b6cff',
      story: '魔幻三角地帶的濃霧裡，莫莉亞的殭屍大軍又動起來了。打倒佩羅娜的幽靈與夜裡徘徊的骷髏紳士，把被搶走的影子搶回來！',
      foes: [['perona'], ['brook', 'perona'], ['moria']] },
    { id: 'elbaf_fest', start: '2026-11-01', end: '2026-12-01', name: '艾爾巴夫・巨人戰士祭', art: 'assets/chapters/giant.webp', color: '#f2b632',
      story: '巨人族的戰士祭典開始了！多利與布洛基在小花園決鬥了一百年，這次要在艾爾巴夫的祭典場上分出勝負。神之騎士團也混進了會場……',
      foes: [['dorry'], ['brogy', 'gunko'], ['shamrock']] },
    { id: 'xmas', every: 'year', start: '12-01', end: '12-26', name: '萬國・聖誕點心晚宴', art: 'assets/chapters/wholecake.webp', color: '#ff6f8a',
      story: 'BIG MOM 在托特蘭舉辦聖誕晚宴，香吉士負責做蛋糕。可是卡塔庫栗的甜甜圈先被偷吃了——想吃到蛋糕，就先打贏晚宴的守衛！',
      foes: [['sanji'], ['katakuri', 'sanji_wano'], ['bigmom']] },
    { id: 'newyear', every: 'year', start: '01-01', end: '02-01', name: '和之國・花之都新春祭', art: 'assets/chapters/wano.webp', color: '#ff5a4a',
      story: '和之國迎來凱多倒台後的第一個新年，花之都放起了煙火。鬼之島的殘黨卻在祭典上鬧事——拔刀吧，武士們！',
      foes: [['kinemon'], ['zoro_wano', 'king'], ['kaido']] },
    { id: 'luffy_bd', every: 'year', start: '05-01', end: '05-16', name: '魯夫生日祭（5/5）', art: 'assets/chapters/east.webp', color: '#ffd34a',
      story: '5 月 5 日是魯夫的生日！草帽一夥準備了宴會，可是壽星本人說「先打一場再吃肉！」——從風車村的少年到太陽神尼卡，全部的魯夫都來了。',
      foes: [['luffy0'], ['luffy_wano', 'luffy'], ['luffy_nika']] },
    { id: 'summer', every: 'year', start: '07-15', end: '08-16', name: '水之七島・夏日水上祭', art: 'assets/chapters/enies.webp', color: '#4fc3ff',
      story: '水之七島的夏天到了，阿庫亞・拉谷那退潮後全城都在辦水上祭。佛朗基家族和 CP9 又在船塢槓上了！',
      foes: [['franky'], ['nami', 'franky'], ['lucci']] }
  ];
  const REALMS = [
    { id: 'berry', name: '巴基的貝里寶藏船', sub: '獲得大量貝里', art: 'assets/chapters/east.webp', color: '#ffcf5a',
      story: '小丑巴基把搶來的貝里全堆在船上。打倒船上的海賊，把寶藏搶回來！',
      foes: [['alvida'], ['buggy', 'alvida'], ['buggy']], rw: t => ({ berry: [8000, 20000, 40000][t] }) },
    { id: 'exp', name: '海軍本部訓練場', sub: '獲得經驗書', art: 'assets/chapters/marineford.webp', color: '#5fb8ff',
      story: '卡普親自坐鎮的特訓！撐過鐵拳的「愛之拳」，船員就能飛快成長。',
      foes: [['koby_mf'], ['marine', 'garp_mf'], ['garp_hc']], rw: t => ({ items: [{ exp_s: 6, exp_m: 1 }, { exp_m: 4 }, { exp_m: 4, exp_l: 1 }][t] }) },
    { id: 'gear', name: '貝加龐克的寶物研究所', sub: '獲得航海寶物（角色武器）', art: 'assets/chapters/egghead.webp', color: '#c58bff',
      story: '蛋頭島的研究所裡收著各種名刀、外套與永久指針。研究所的守衛可不會輕易放行。',
      foes: [['york'], ['kuma', 'york'], ['kizaru']], rw: t => ({ gear: [['R'], ['SR'], ['SR', 'SSR?']][t] }) },
    { id: 'awaken', name: '空島・覺醒試煉', sub: '獲得覺醒結晶、技能書', art: 'assets/chapters/skypiea.webp', color: '#7fe0c0',
      story: '神之島的試煉之地。通過神官與神的考驗，就能得到喚醒力量的結晶。',
      foes: [['wiper'], ['wiper', 'enel'], ['enel']], rw: t => ({ items: [{ awaken_gem: 4 }, { awaken_gem: 8, skill_book: 1 }, { awaken_gem: 14, skill_book: 2 }][t] }) },
    { id: 'supply', name: '玩具屋補給庫', sub: '獲得戰鬥道具', art: 'assets/chapters/dressrosa.webp', color: '#ff8a5a',
      story: '德雷斯羅薩的玩具屋地下，堆滿了唐吉訶德家族的補給。打倒看守，把藥水和霸氣丹帶走！',
      foes: [['sugar'], ['monet', 'vergo'], ['doflamingo']], rw: t => ({ items: [{ potion_s: 2, pp_s: 1, herb: 1 }, { potion_m: 2, pp_s: 2, shield: 1 }, { potion_l: 2, pp_l: 1, guard_pot: 1, haki: 1 }][t] }) }
  ];
  const FIRST = { fest: [10, 20, 30], realm: [5, 10, 20] };
  const BADGE = [10, 20, 40], FTICKET = [1, 1, 2];

  /* ---------- 時間 ---------- */
  const TZ = 8 * 3600e3, tw = (y, md, hm) => { const [m, d] = md.split('-').map(Number), [h, mi] = (hm || '00:00').split(':').map(Number); return Date.UTC(y, m - 1, d, h, mi) - TZ; };
  function win(F, t = Date.now()) {
    if (F.every === 'year') { const Y = new Date(t + TZ).getUTCFullYear(); const W = [Y - 1, Y, Y + 1].map(y => { const s = tw(y, F.start), e = tw(F.end < F.start ? y + 1 : y, F.end); return { s, e }; }); return W.find(w => t >= w.s && t < w.e) || W.find(w => t < w.s); }
    const p = s => { const [y, md] = [s.slice(0, 4), s.slice(5)]; return tw(+y, md); }; return { s: p(F.start), e: p(F.end) };
  }
  const liveFest = (t = Date.now()) => FESTS.filter(F => { const w = win(F, t); return w && t >= w.s && t < w.e; }).sort((a, b) => win(a, t).e - win(b, t).e)[0] || null;
  const nextFest = (t = Date.now()) => FESTS.map(F => ({ F, w: win(F, t) })).filter(x => x.w && x.w.s > t).sort((a, b) => a.w.s - b.w.s)[0] || null;
  const left = ms => { const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 3600e3), m = Math.floor(ms % 3600e3 / 60e3); return d ? `${d} 天 ${h} 小時` : h ? `${h} 小時 ${m} 分` : `${Math.max(1, m)} 分`; };
  const md = ms => { const d = new Date(ms + TZ); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };

  /* ---------- 存檔 ---------- */
  const dayKey = () => (typeof today === 'function' ? today() : new Date(Date.now() + TZ).toISOString().slice(0, 10));
  function S() {
    const d = SAVE.data, s = d.stg = d.stg || {}; ['runs', 'clear', 'first', 'badge', 'buy'].forEach(k => { s[k] = s[k] || {}; });
    if (s.day !== dayKey()) { s.day = dayKey(); s.runs = {}; }
    return s;
  }
  const runsLeft = (kind, id) => (kind === 'fest' ? FEST_RUNS : REALM_RUNS) - (S().runs[kind + ':' + id] || 0);
  const key = (kind, id, t) => `${kind}:${id}:${t}`;
  const unlocked = (kind, id, t) => t === 0 || !!S().clear[key(kind, id, t - 1)];
  const inv = () => (SAVE.data.inventory = SAVE.data.inventory || {});
  const lineup = () => (SAVE.data.lineup || []).filter(id => typeof owned !== 'function' || owned(id));
  const nm = id => (CHARACTERS[id] ? CHARACTERS[id].name : id);
  const av = id => (CHARACTERS[id] ? CHARACTERS[id].avatar : '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- 獎勵 ---------- */
  const livePools = () => { try { return (typeof EVENT_POOLS !== 'undefined' ? EVENT_POOLS : []).filter(p => typeof eventPhase !== 'function' || eventPhase(p.id) === 'live'); } catch (e) { return []; } };
  /* 打贏一次（或掃蕩一次）的獎勵：回傳 showRewards 用的清單 */
  function grant(kind, def, t, first) {
    const out = [];
    if (kind === 'fest') {
      const s = S(); s.badge[def.id] = (s.badge[def.id] || 0) + BADGE[t]; out.push({ name: '祭典徽章', count: BADGE[t], emoji: '🏅', rar: 'SR' });
      const P = livePools()[0]; if (P && typeof eventState === 'function') { try { const E = eventState(P); E.tickets = (E.tickets || 0) + FTICKET[t]; out.push({ item: 'event_ticket', count: FTICKET[t], name: '活動抽獎券' }); } catch (e) { } }
      const b = 1500 * (t + 1); addBerry(b); out.push({ name: '貝里', count: b, img: 'assets/ui/coin_berry.webp?v=5c0e832b', rar: 'R' });
    } else {
      const R = def.rw(t);
      if (R.berry) { addBerry(R.berry); out.push({ name: '貝里', count: R.berry, img: 'assets/ui/coin_berry.webp?v=5c0e832b', rar: 'R' }); }
      if (R.items) Object.entries(R.items).forEach(([k, n]) => { if (!ITEMS[k]) return; inv()[k] = (inv()[k] || 0) + n; out.push({ item: k, count: n }); });
      if (R.gear && window.GEAR) R.gear.forEach(r => { const maybe = r.endsWith('?'); if (maybe && Math.random() >= .35) return; const g = GEAR.addGear(GEAR.roll(null, r.replace('?', '')), true); if (g) out.push({ name: g.name, count: 1, emoji: '⚔️', rar: g.rar }); else out.push({ name: '寶物已滿（請先分解）', count: 0, emoji: '⚠️', rar: 'N' }); });
    }
    if (first) { const n = FIRST[kind][t]; SAVE.data.inventory.summon_ticket = (SAVE.data.inventory.summon_ticket || 0) + n; out.push({ name: '一般召喚券（首次通關）', count: n, img: 'assets/ui/summon_ticket.webp?v=5109b7b0', rar: 'SSR' }); }
    SAVE.save(); if (typeof coins === 'function') coins();
    return out.filter(x => x.item ? (x.count > 0) : true);
  }
  /* 同名獎勵合併（掃蕩多次時） */
  const merge = L => { const M = new Map(); L.forEach(x => { const k = x.item || x.name; if (M.has(k)) M.get(k).count += x.count; else M.set(k, { ...x }); }); return [...M.values()]; };

  /* ---------- 戰鬥 ---------- */
  let RUN = null;
  function begin(kind, def, t) {
    const L = lineup(); if (!L.length) { toast('請先在船員畫面設定出戰陣容'); return; }
    if (L.some(id => typeof isTraining === 'function' && isTraining(id))) { toast('出戰陣容中有船員正在訓練營'); return; }
    if (runsLeft(kind, def.id) <= 0) { toast('今天的挑戰次數用完了，明天 00:00 重置'); return; }
    if (!unlocked(kind, def.id, t)) { toast(`先通關「${TIER[t - 1].name}」才能挑戰`); return; }
    RUN = { kind, def, t, i: 0, foes: def.foes[t], team: L.map(id => ({ id, lv: crewLv(id) })) }; fight();
  }
  function fight() {
    const R = RUN, T = TIER[R.t], last = R.i === R.foes.length - 1, foe = R.foes[R.i];
    startBattle({ team: R.team, enemyId: foe, enemyLv: T.lv, bg: R.def.art, chapterId: T.ch, isBoss: T.boss && last, revives: 0,
      enemyMod: { ...modOf(foe), title: `${R.def.name}・${T.name}` }, onEnd: r => end(r), onLeave: () => openStages(R.kind) });
    if (R.foes.length > 1) log(`${R.def.name}・${T.name}：第 ${R.i + 1}/${R.foes.length} 場`);
  }
  function end(r) {
    const R = RUN; if (!R) return {};
    if (!r.win) { RUN = null; return { message: `${r.fled ? '撤退' : '戰敗'}了，這次不扣挑戰次數。提升等級、換個陣容再來！`, alt: { label: '返回活動關卡', fn: () => openStages(R.kind) } }; }
    track('wins');
    if (R.i < R.foes.length - 1) { R.team = teamSnapshot().map((x, k) => ({ ...x, lv: R.team[k].lv })); R.i++; return { message: `第 ${R.i}/${R.foes.length} 場勝利！體力與技能次數會延續。<br>下一位：<b>${esc(nm(R.foes[R.i]))}</b>`, next: { label: '迎戰下一位', fn: fight } }; }
    RUN = null; const s = S(), k = key(R.kind, R.def.id, R.t), first = !s.first[k];
    s.runs[R.kind + ':' + R.def.id] = (s.runs[R.kind + ':' + R.def.id] || 0) + 1; s.clear[k] = 1; s.first[k] = 1;
    track(R.kind === 'fest' ? 'fest' : 'realm'); if (R.t === 2) track('bossWins');
    lineup().forEach(id => gainExp(id, 200 + R.t * 300, true));
    const got = grant(R.kind, R.def, R.t, first); SAVE.save();
    setTimeout(() => window.showRewards && showRewards({ title: first ? '首次通關！' : '挑戰成功', sub: `${R.def.name}・${TIER[R.t].name}` }, got), 300);
    return { message: `🏆 ${esc(R.def.name)}・${TIER[R.t].name} 通關！今天還剩 ${runsLeft(R.kind, R.def.id)} 次。`, next: { label: '返回活動關卡', fn: () => openStages(R.kind) } };
  }
  function sweep(kind, def, t, n) {
    const s = S(), k = key(kind, def.id, t), rl = runsLeft(kind, def.id); n = Math.min(n, rl);
    if (!s.clear[k]) { toast('先通關一次才能掃蕩'); return; }
    if (n <= 0) { toast('今天的挑戰次數用完了'); return; }
    if ((inv().sweep || 0) < n) { toast(`掃蕩券不足：需要 ${n} 張，目前 ${inv().sweep || 0} 張`); return; }
    inv().sweep -= n; s.runs[kind + ':' + def.id] = (s.runs[kind + ':' + def.id] || 0) + n;
    let all = []; for (let i = 0; i < n; i++) all = all.concat(grant(kind, def, t, false));
    lineup().forEach(id => gainExp(id, (200 + t * 300) * n, true));
    track('sweeps', n); track(kind === 'fest' ? 'fest' : 'realm', n); SAVE.save(); render();
    if (typeof SFX !== 'undefined') SFX.play('quest');
    if (window.showRewards) showRewards({ title: '掃蕩完成', sub: `${def.name}・${TIER[t].name} ×${n}（掃蕩券 −${n}）` }, merge(all));
  }

  /* ---------- 祭典商店 ---------- */
  function goods(F) {
    const G = [];
    livePools().forEach(P => P.shards.forEach(x => { if (CHARACTERS[x.char]) G.push({ id: 'sh_' + x.char, name: `${nm(x.char)} 碎片 ×10`, img: x.icon, cost: 100, lim: 8, rar: 'SSR', note: typeof owned === 'function' && owned(x.char) ? '已擁有・自動換覺醒結晶' : '限定角色', give: () => { const E = eventState(P); E.shards[x.char] = (E.shards[x.char] || 0) + 10; return [{ name: `${nm(x.char)} 碎片`, count: 10, img: x.icon, rar: 'SSR' }]; } }); }));
    const P0 = livePools()[0]; if (P0) G.push({ id: 'ticket', name: '活動抽獎券 ×1', item: 'event_ticket', cost: 40, lim: 15, rar: 'SR', give: () => { const E = eventState(P0); E.tickets = (E.tickets || 0) + 1; return [{ item: 'event_ticket', count: 1 }]; } });
    G.push({ id: 'gear_ssr', name: 'SSR 航海寶物', gear: 1, cost: 300, lim: 2, rar: 'SSR', note: '欄位隨機', give: () => { const g = window.GEAR && GEAR.addGear(GEAR.roll(null, 'SSR'), true); return g ? [{ name: g.name, count: 1, emoji: '⚔️', rar: 'SSR' }] : null; } });
    [['awaken_gem', 5, 60, 10, 'SR'], ['skill_book', 1, 80, 5, 'SR'], ['exp_l', 1, 50, 6, 'SSR'], ['sweep', 3, 30, 10, 'R'], ['haki_l', 1, 60, 3, 'SSR'], ['guard_pot', 2, 30, 5, 'SR']].forEach(([it, n, c, l, r]) => { if (ITEMS[it]) G.push({ id: it, name: `${ITEMS[it].name} ×${n}`, item: it, cost: c, lim: l, rar: r, give: () => { inv()[it] = (inv()[it] || 0) + n; return [{ item: it, count: n }]; } }); });
    return G;
  }
  function buy(F, g) {
    const s = S(), B = s.buy[F.id] = s.buy[F.id] || {}, have = s.badge[F.id] || 0, n = B[g.id] || 0;
    if (n >= g.lim) { toast('這一期已經換完了'); return; } if (have < g.cost) { toast(`祭典徽章不足：需要 ${g.cost}，目前 ${have}`); return; }
    const got = g.give(); if (!got) { toast('航海寶物已滿（150 件），請先分解'); return; }
    s.badge[F.id] = have - g.cost; B[g.id] = n + 1; SAVE.save(); render(); if (typeof SFX !== 'undefined') SFX.play('coin');
    if (window.showRewards) showRewards({ title: '兌換成功', sub: F.name }, got);
  }

  /* ---------- 畫面 ---------- */
  let tab = 'fest', sel = { realm: 'berry', tier: {} };
  const icoOf = g => g.gear && window.GEAR && GEAR.gearIcon ? GEAR.gearIcon({ slot: 'blade', rar: g.rar }, 56) : g.item && ITEMS[g.item] && typeof itemIcon === 'function' ? itemIcon(ITEMS[g.item]) : g.img ? `<img src="${g.img}" alt="">` : `<em>${g.emoji || '🎁'}</em>`;
  function rewardChips(kind, def, t) {
    if (kind === 'fest') return `<span class="stg-chip">🏅 徽章 ×${BADGE[t]}</span>${livePools().length ? `<span class="stg-chip">🎟 抽獎券 ×${FTICKET[t]}</span>` : ''}<span class="stg-chip"><img class="cur-ic" src="assets/ui/coin_berry.webp?v=5c0e832b" alt="貝里"> ${(1500 * (t + 1)).toLocaleString()}</span>`;
    const R = def.rw(t), a = [];
    if (R.berry) a.push(`<img class="cur-ic" src="assets/ui/coin_berry.webp?v=5c0e832b" alt="貝里"> ${R.berry.toLocaleString()}`);
    if (R.items) Object.entries(R.items).forEach(([k, n]) => ITEMS[k] && a.push(`${ITEMS[k].name} ×${n}`));
    if (R.gear) R.gear.forEach(r => a.push(r.endsWith('?') ? `${r.slice(0, -1)} 寶物（35%）` : `${r} 寶物 ×1`));
    return a.map(x => `<span class="stg-chip">${x}</span>`).join('');
  }
  function tierRow(kind, def) {
    const s = S(), rl = runsLeft(kind, def.id);
    return `<ol class="stg-tiers">${TIER.map((T, t) => { const k = key(kind, def.id, t), ok = unlocked(kind, def.id, t), cl = !!s.clear[k];
      return `<li class="stg-tier ${ok ? '' : 'lock'} ${cl ? 'done' : ''} t${t}">
        <div class="stg-t-h"><b>${T.name}${T.boss ? '<i class="stg-boss">BOSS</i>' : ''}</b><small>敵人 LV ${T.lv}</small><small>建議 LV ${T.rec}+</small></div>
        <div class="stg-foes">${def.foes[t].map(id => `<img src="${av(id)}" alt="${esc(nm(id))}" title="${esc(nm(id))}">`).join('')}<span>${def.foes[t].map(nm).join('、')}</span></div>
        <div class="stg-rw">${rewardChips(kind, def, t)}${s.first[k] ? '' : `<span class="stg-chip first">首通 <img class="cur-ic" src="assets/ui/summon_ticket.webp?v=5109b7b0" alt="一般召喚券">×${FIRST[kind][t]}</span>`}</div>
        <div class="stg-btns">${ok ? `<button class="btn-gold" data-go="${t}" ${rl > 0 ? '' : 'disabled'}>挑戰</button><button class="btn-ghost" data-sw="${t}" ${cl && rl > 0 ? '' : 'disabled'} title="${cl ? '' : '通關後可以掃蕩'}">掃蕩 ×${Math.max(0, rl)}</button>` : `<span class="stg-lock">🔒 通關${TIER[t - 1].name}後開放</span>`}</div>
      </li>`; }).join('')}</ol>`;
  }
  function bind(root, kind, def) {
    root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => begin(kind, def, +b.dataset.go));
    root.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => sweep(kind, def, +b.dataset.sw, runsLeft(kind, def.id)));
  }
  function renderFest(main) {
    const F = liveFest(), N = nextFest(), s = S();
    if (!F) { main.innerHTML = `<div class="stg-empty"><b>目前沒有開放中的祭典</b>${N ? `<p>下一場：<b>${N.F.name}</b><br>${md(N.w.s)} 開放（還有 ${left(N.w.s - Date.now())}）</p>` : ''}<p class="stg-cal">${FESTS.filter(f => f.every === 'year').map(f => `<span>${f.start.replace('-', '/')}～${f.name}</span>`).join('')}</p><button class="btn-gold" data-tab2="realm">先去每日秘境</button></div>`;
      main.querySelector('[data-tab2]').onclick = () => { tab = 'realm'; render(); }; return; }
    const w = win(F), have = s.badge[F.id] || 0, B = s.buy[F.id] || {};
    main.innerHTML = `<header class="stg-ban" style="--ac:${F.color}"><span class="stg-ban-art" style="background-image:url('${F.art}')"></span><div class="stg-ban-in"><span class="stg-tag">限時祭典・剩 ${left(w.e - Date.now())}</span><h3>${F.name}</h3><p>${F.story}</p>
        <div class="stg-meta"><span>今日次數 <b>${runsLeft('fest', F.id)}/${FEST_RUNS}</b></span><span>祭典徽章 <b>🏅 ${have.toLocaleString()}</b></span><span>掃蕩券 <b>${inv().sweep || 0}</b></span></div></div></header>
      ${tierRow('fest', F)}
      <h4 class="stg-h">祭典商店 <small>用祭典徽章兌換，每期限量・祭典結束後徽章保留到下一期同名祭典</small></h4>
      <ul class="stg-shop">${goods(F).map(g => { const n = B[g.id] || 0, out = n >= g.lim; return `<li class="r-${g.rar} ${out ? 'out' : ''}"><span class="stg-g-ic">${icoOf(g)}</span><b>${esc(g.name)}</b>${g.note ? `<small>${g.note}</small>` : '<small>&nbsp;</small>'}<em>剩 ${g.lim - n}/${g.lim}</em><button class="btn-gold sm" data-buy="${g.id}" ${out || have < g.cost ? 'disabled' : ''}>🏅 ${g.cost}</button></li>`; }).join('')}</ul>`;
    bind(main, 'fest', F); const G = goods(F); main.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buy(F, G.find(g => g.id === b.dataset.buy)));
  }
  function renderRealm(main) {
    const R = REALMS.find(r => r.id === sel.realm) || REALMS[0];
    main.innerHTML = `<nav class="stg-realms">${REALMS.map(r => `<button data-r="${r.id}" class="${r.id === R.id ? 'on' : ''}" style="--ac:${r.color}"><span style="background-image:url('${r.art}')"></span><b>${r.name}</b><small>${r.sub}</small><em>${runsLeft('realm', r.id)}/${REALM_RUNS}</em></button>`).join('')}</nav>
      <header class="stg-ban sm" style="--ac:${R.color}"><span class="stg-ban-art" style="background-image:url('${R.art}')"></span><div class="stg-ban-in"><span class="stg-tag">每日秘境・每天 00:00 重置</span><h3>${R.name}</h3><p>${R.story}</p>
        <div class="stg-meta"><span>今日次數 <b>${runsLeft('realm', R.id)}/${REALM_RUNS}</b></span><span>掃蕩券 <b>${inv().sweep || 0}</b></span></div></div></header>
      ${tierRow('realm', R)}`;
    main.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { sel.realm = b.dataset.r; render(); });
    bind(main, 'realm', R);
  }
  function render() {
    const sc = $('stageScreen'); if (!sc) return; S();
    sc.querySelectorAll('[data-stab]').forEach(b => { b.classList.toggle('on', b.dataset.stab === tab); b.setAttribute('aria-selected', String(b.dataset.stab === tab)); });
    const main = $('stgMain'); if (tab === 'fest') renderFest(main); else renderRealm(main);
    if (typeof coins === 'function') coins(); railTxt();
  }
  function build() {
    if ($('stageScreen')) return;
    const sc = document.createElement('section'); sc.className = 'screen hidden'; sc.id = 'stageScreen';
    sc.innerHTML = `<header class="topbar"><button class="btn-ghost ch-lobby" id="stgBack" aria-label="回到遊戲大廳">‹ 大廳</button><h2 class="stg-title">活動關卡</h2><div class="topbar-right"><div class="coin berry"><i class="berry-ico">B</i><b class="berryVal">0</b></div></div></header>
      <div class="stg-bg" aria-hidden="true"></div>
      <div class="stg-wrap"><nav class="stg-tabs" role="tablist"><button role="tab" data-stab="fest">🎉 限時祭典</button><button role="tab" data-stab="realm">🗺 每日秘境</button></nav><section class="stg-main" id="stgMain"></section></div>`;
    document.body.appendChild(sc);
    if (typeof SCREENS !== 'undefined' && !SCREENS.includes('stageScreen')) SCREENS.push('stageScreen');
    $('stgBack').onclick = () => openModes();
    sc.querySelectorAll('[data-stab]').forEach(b => b.onclick = () => { tab = b.dataset.stab; render(); $('stgMain').scrollTop = 0; });
  }
  function openStages(t) { build(); if (t) tab = t; showScreen('stageScreen'); render(); const m = $('stgMain'); if (m) m.scrollTop = 0; if (typeof AUDIO !== 'undefined' && AUDIO.playSong) AUDIO.playSong('map'); }
  window.openStages = openStages;

  /* ---------- 大廳右側入口 ---------- */
  const SVG_FEST = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/><path d="M15 17l1.2 2.4 2.6.4-1.9 1.8.5 2.6L15 23l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" transform="translate(2 -5) scale(.8)"/></svg>';
  const SVG_REALM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/></svg>';
  function rail() {
    const lob = $('lobby'); if (!lob || $('v181Rail')) return;
    const n = document.createElement('nav'); n.className = 'v181-rail'; n.id = 'v181Rail'; n.setAttribute('aria-label', '活動關卡');
    n.innerHTML = `<button class="v181-ic fest" id="v181Fest"><i class="l2-svg" aria-hidden="true">${SVG_FEST}</i><b>限時祭典</b><small id="v181FestT"></small></button>
      <button class="v181-ic realm" id="v181Realm"><i class="l2-svg" aria-hidden="true">${SVG_REALM}</i><b>每日秘境</b><small id="v181RealmT"></small></button>`;
    lob.appendChild(n);
    $('v181Fest').onclick = () => openStages('fest'); $('v181Realm').onclick = () => openStages('realm');
    railTxt();
  }
  function railTxt() {
    try { const F = liveFest(), ft = $('v181FestT'), rt = $('v181RealmT'), fb = $('v181Fest'), rb = $('v181Realm'); if (!ft) return;
      if (F) { const n = runsLeft('fest', F.id); ft.textContent = `剩 ${left(win(F).e - Date.now())}`; fb.classList.toggle('has-dot', n > 0); fb.classList.add('live'); fb.title = `${F.name}・今日 ${n}/${FEST_RUNS}`; }
      else { const N = nextFest(); ft.textContent = N ? `${md(N.w.s)} 開放` : ''; fb.classList.remove('has-dot', 'live'); fb.title = N ? `下一場：${N.F.name}` : ''; }
      const tot = REALMS.reduce((a, r) => a + Math.max(0, runsLeft('realm', r.id)), 0); rt.textContent = `${tot}/${REALMS.length * REALM_RUNS} 次`; rb.classList.toggle('has-dot', tot > 0);
    } catch (e) { }
  }
  /* 直式：對話框避開右側入口（lobby_v156 每次量測都會重設 --v6sayR） */
  function sayFix() { const lob = $('lobby'), r = $('v181Rail'); if (!lob || !r || lob.classList.contains('v6-desk')) return; const w = Math.round(r.getBoundingClientRect().width + 16); if (w > 16 && lob.style.getPropertyValue('--v6sayR') !== w + 'px') lob.style.setProperty('--v6sayR', w + 'px'); }

  /* 每日懸賞：秘境任務 */
  if (typeof BOUNTY_POOL !== 'undefined') { const add = (L, b) => { if (!L.some(x => x.id === b.id)) L.push(b); };
    add(BOUNTY_POOL, { id: 'realm2', text: '完成每日秘境 2 次（含掃蕩）', stat: 'realm', goal: 2, berry: 1500 });
    if (typeof BOUNTY_PREMIUM !== 'undefined') add(BOUNTY_PREMIUM, { id: 'p_realm6', text: '完成每日秘境 6 次（含掃蕩）', stat: 'realm', goal: 6, berry: 5000, tokens: 5, premium: true }); }

  /* 道具商店（貝里）：掃蕩券、護盾、羅格鎮的傳說也能用貝里買，配合秘境每天掃蕩（秘境次數有上限，不會無限刷） */
  if (typeof SHOP !== 'undefined') [['sweep', 2000], ['shield', 1500], ['exp_l', 9000]].forEach(([id, price]) => { if (ITEMS[id] && !SHOP.some(x => x.id === id)) SHOP.push({ id, price }); });

  window.STAGES = { FESTS, REALMS, TIER, liveFest, nextFest, win, S, runsLeft, grant, goods };
  window.addEventListener('DOMContentLoaded', () => {
    build(); rail();
    const om = window.openModes; if (om) window.openModes = function () { const r = om.apply(this, arguments); rail(); railTxt(); [60, 500, 1000].forEach(t => setTimeout(sayFix, t)); return r; };
    addEventListener('resize', () => setTimeout(sayFix, 80));
    const lob = $('lobby'); if (lob && window.MutationObserver) new MutationObserver(() => sayFix()).observe(lob, { attributes: true, attributeFilter: ['style', 'class'] });
    setInterval(() => { if (typeof currentScreen !== 'undefined' && currentScreen === 'modeScreen') railTxt(); }, 60e3);
  });
})();
