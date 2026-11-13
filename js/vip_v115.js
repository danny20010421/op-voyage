/* v115 VIP 會員中心：會員（依歷史儲值寶藏幣計算 VIP0～VIP6，各級福利）、月費（2026 年 10 月限時月費）、儲值（目前不開放）。
   也負責：登入時的月費宣傳（可設定今日不再顯示）、大廳玩家名片上的 VIP 徽章與頭像框、貝里／經驗加成、新道具（限定抽獎券、SSR 角色選擇卡）。
   存檔：SAVE.data.vip = { paid 累積儲值寶藏幣, once 已發放的升級禮包等級, day 今日禮包領取日 }；SAVE.data.mcard[月費 id] = { buy, last, got }；SAVE.data.mcAdHide 今日不再顯示的日期。
   v164：月費改成檔期表 MCS（2026-10 燼、2026-11 賈巴／雷利角色隨機卡＋兩款皮膚、2026-12 巴托洛米奧＋皮膚），依時間只顯示當月；新道具 mc_pick_2611（角色隨機卡，openMcPick）。 */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString();
  const COIN = 'assets/ui/coin_token.webp?v=5ebb3d9c';
  const badge = l => `assets/ui/vip${l}.webp?v=115`, badgeS = l => `assets/ui/vip${l}_s.webp?v=115`;
  /* v165：日期一律用台灣時間（js/twtime_v165.js） */
  const dayStr = d => TW.dateKey(d ? +d : undefined);
  const dayNum = s => TW.dayNum(s);
  const VIP0 = '<svg class="vip0" viewBox="0 0 44 20" role="img" aria-label="VIP0"><defs><linearGradient id="v0g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6478"/><stop offset="1" stop-color="#2e3446"/></linearGradient></defs><rect x=".5" y=".5" width="43" height="19" rx="6" fill="url(#v0g)" stroke="#8a93a6"/><text x="22" y="10.5" text-anchor="middle" dominant-baseline="central" font-family="Arial Black,Arial,sans-serif" font-style="italic" font-weight="900" font-size="11" fill="#dfe5ef">VIP0</text></svg>';
  const locked = () => typeof timeLocked === 'function' && timeLocked();

  /* ---------- 新道具 ---------- */
  /* 道具插圖（與 icons.js 同風格：深色描邊、漸層、高光），用 SVG data URI */
  const svgUri = b => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${b}</svg>`);
  const TICKET_IMG = svgUri('<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb36a"/><stop offset="1" stop-color="#e2461e"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c0"/><stop offset="1" stop-color="#f3b33a"/></linearGradient></defs><g transform="rotate(-14 32 32)"><path d="M6 18h52v9a5 5 0 0 0 0 10v9H6v-9a5 5 0 0 0 0-10z" fill="url(#a)" stroke="#1a1410" stroke-width="2.4" stroke-linejoin="round"/><path d="M10 22h44" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/><path d="M42 20v24" stroke="#1a1410" stroke-opacity=".55" stroke-width="2" stroke-dasharray="3 3"/><path d="M24 23.5l3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1z" fill="url(#b)" stroke="#1a1410" stroke-width="1.6" stroke-linejoin="round"/><circle cx="50" cy="32" r="3" fill="#fff3c0" stroke="#1a1410" stroke-width="1.4"/></g>');
  const CARD_IMG = svgUri('<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#e2a83a"/><stop offset="1" stop-color="#8a5a12"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3ab0"/><stop offset="1" stop-color="#1e0e40"/></linearGradient></defs><rect x="13" y="5" width="38" height="54" rx="6" fill="url(#a)" stroke="#1a1410" stroke-width="2.4"/><rect x="18" y="10" width="28" height="44" rx="3.5" fill="url(#b)" stroke="#1a1410" stroke-width="1.6"/><path d="M32 16l3.6 7.3 8 1.2-5.8 5.6 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.6 8-1.2z" fill="#fff3c0" stroke="#1a1410" stroke-width="1.6" stroke-linejoin="round"/><rect x="20" y="42" width="24" height="9" rx="4.5" fill="#1a1410"/><text x="32" y="49.6" font-family="Arial Black,Arial,sans-serif" font-size="8" font-weight="900" text-anchor="middle" fill="#ffd86a">SSR</text><path d="M17 9l6 0" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>');
  /* v164：11 月月費「賈巴／雷利角色隨機卡」插圖（左綠右紫，對應宣傳圖兩位角色的配色） */
  const PICK_IMG = svgUri('<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#e2a83a"/><stop offset="1" stop-color="#8a5a12"/></linearGradient><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7a4a"/><stop offset="1" stop-color="#0c2a18"/></linearGradient><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a4ad0"/><stop offset="1" stop-color="#2a0e48"/></linearGradient></defs><rect x="13" y="5" width="38" height="54" rx="6" fill="url(#a)" stroke="#1a1410" stroke-width="2.4"/><path d="M18 10h14v44H18a3.5 3.5 0 0 1-3.5-3.5v-37A3.5 3.5 0 0 1 18 10z" transform="translate(3.5 0)" fill="url(#g)"/><path d="M32 10h10.5a3.5 3.5 0 0 1 3.5 3.5v37a3.5 3.5 0 0 1-3.5 3.5H32z" fill="url(#p)"/><rect x="18" y="10" width="28" height="44" rx="3.5" fill="none" stroke="#1a1410" stroke-width="1.6"/><path d="M32 10v32" stroke="#ffd86a" stroke-width="1.4" stroke-dasharray="2 2"/><text x="32" y="33" font-family="Arial Black,Arial,sans-serif" font-size="20" font-weight="900" text-anchor="middle" fill="#fff3c0" stroke="#1a1410" stroke-width="1.4" paint-order="stroke">?</text><rect x="20" y="42" width="24" height="9" rx="4.5" fill="#1a1410"/><text x="32" y="49.6" font-family="Arial Black,Arial,sans-serif" font-size="8" font-weight="900" text-anchor="middle" fill="#ffd86a">UR</text><path d="M17 9l6 0" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>');
  if (typeof ITEMS !== 'undefined') {
    /* v164：11 月月費贈品。使用後從 ids 中隨機獲得一位尚未擁有的角色；兩位都已擁有時改發覺醒結晶（數量＝分解一位重複角色，UR 為 35）。noPool：不會被任何抽獎池抽到 */
    ITEMS.mc_pick_2611 = { name: '賈巴／雷利角色隨機卡', rarity: 'SSR', noPool: true, icon: 'scroll', img: PICK_IMG, color: '#d8a43a', desc: '使用後隨機獲得「賈巴」或「雷利」其中一位。已擁有其中一位時，必定獲得另一位；兩位都已擁有時，改為獲得覺醒結晶 ×35。在背包裡使用。', effect: { mcPick: ['gaban', 'rayleigh'] } };
    ITEMS.event_ticket = { name: '限定抽獎券', rarity: 'SR', icon: 'scroll', img: TICKET_IMG, color: '#ff8a3a', desc: '可在任一限定召喚池抽 1 次（會先用該活動自己的抽獎券）。', effect: { eventTicket: true } };
    ITEMS.char_select = { name: 'SSR 角色選擇卡', rarity: 'SSR', icon: 'scroll', img: CARD_IMG, color: '#d8a43a', desc: '從一般召喚池的 SSR 角色中，任選一位尚未擁有的角色加入船隊。在背包裡使用。', effect: { charSelect: 'SSR' } };
  }

  /* ---------- VIP 等級與福利 ---------- */
  const NEED = [0, 1000, 5000, 10000, 30000, 80000, 100000];
  const COL = ['#8a93a6', '#d88a4a', '#5aa0ff', '#f3c45a', '#3fd07a', '#ff4a5a', '#f4ecff'];
  /* 每一級的福利（使用者 v115 指定等級門檻，福利內容由我們規劃，見 design/01-decisions/D-0115-vip.md） */
  const PERK = [null,
    { berry: 3, exp: 0, daily: { berry: 3000, items: { exp_s: 2 } }, once: { items: { event_ticket: 5 } } },
    { berry: 5, exp: 3, bubble: true, daily: { berry: 6000, items: { exp_s: 3, sweep: 1 } }, once: { items: { event_ticket: 10, exp_l: 2 } } },
    { berry: 8, exp: 5, bubble: true, daily: { berry: 10000, tokens: 2, items: { exp_m: 1, sweep: 2 } }, once: { items: { skin_ticket: 1 } } },
    { berry: 10, exp: 8, bubble: true, daily: { berry: 15000, tokens: 3, items: { exp_m: 2, sweep: 3 } }, once: { items: { event_ticket: 20, exp_l: 5 } } },
    { berry: 12, exp: 10, bubble: true, glow: true, daily: { berry: 20000, tokens: 5, items: { exp_l: 1, sweep: 4 } }, once: { items: { char_select: 1 } } },
    { berry: 15, exp: 12, bubble: true, glow: true, title: 'vip6', daily: { berry: 30000, tokens: 8, items: { exp_l: 2, sweep: 5, event_ticket: 1 } }, once: { items: { skin_ticket: 2, char_select: 1 } } }];
  const st = () => { const d = SAVE.data; d.vip = d.vip || { paid: 0, once: [], day: '' }; d.vip.once = d.vip.once || []; return d.vip; };
  const levelOf = paid => { let l = 0; NEED.forEach((n, i) => { if (paid >= n && i > 0) l = i; }); return l; };
  const level = () => (typeof SAVE !== 'undefined' && SAVE.data ? levelOf(st().paid || 0) : 0);
  const perk = l => PERK[l] || { berry: 0, exp: 0 };
  if (typeof TITLES !== 'undefined' && !TITLES.some(t => t.id === 'vip6')) TITLES.push({ id: 'vip6', name: '七海贊助者', how: 'VIP6 專屬稱號' });

  /* 發放獎勵，回傳 showRewards 用的清單 */
  function give(R, why) {
    const inv = SAVE.data.inventory = SAVE.data.inventory || {}, list = [];
    if (R.berry) { addBerry(R.berry, true); list.push({ name: '貝里', count: R.berry, emoji: '💰' }); }
    if (R.tokens) { SAVE.data.tokens = (SAVE.data.tokens || 0) + R.tokens; list.push({ name: '寶藏幣', count: R.tokens, img: COIN, rar: 'SR' }); }
    Object.entries(R.items || {}).forEach(([k, n]) => { inv[k] = (inv[k] || 0) + n; list.push({ item: k, count: n }); });
    SAVE.save(); if (typeof coins === 'function') coins(); return list;
  }
  const listText = R => { const a = []; if (R.berry) a.push(`貝里 ${fmt(R.berry)}`); if (R.tokens) a.push(`寶藏幣 ×${R.tokens}`); Object.entries(R.items || {}).forEach(([k, n]) => a.push(`${(ITEMS[k] || {}).name || k} ×${n}`)); return a; };
  const popup = (title, sub, list) => { if (window.showRewards) showRewards({ title, sub }, list); else toast(`${title}：${list.map(x => (x.name || (ITEMS[x.item] || {}).name) + ' ×' + x.count).join('、')}`, 'gold'); };
  /* 升級禮包（達到等級時自動發放，每級一次）與專屬稱號 */
  function grantOnce(silent) {
    const S = st(), L = level(); let got = [];
    for (let l = 1; l <= L; l++) if (!S.once.includes(l)) { S.once.push(l); got = got.concat(give(perk(l).once || {})); }
    if (L >= 6) { const p = SAVE.data.profile = SAVE.data.profile || {}; p.titles = p.titles || []; if (!p.titles.includes('vip6')) p.titles.push('vip6'); }
    SAVE.save(); if (got.length && !silent) popup('VIP 升級禮包', `恭喜達到 VIP${L}`, got);
    return got;
  }
  /* 儲值入帳（目前沒有開放付款，只給管理後台測試與日後金流使用） */
  function recharge(n, why) {
    n = Math.max(0, Math.floor(n || 0)); if (!n) return; const S = st(), before = level();
    S.paid = (S.paid || 0) + n; SAVE.data.tokens = (SAVE.data.tokens || 0) + n; SAVE.save(); if (typeof coins === 'function') coins();
    toast(`儲值 ${fmt(n)} 寶藏幣${why ? '・' + why : ''}`, 'gold'); const after = level(); if (after > before) grantOnce(false); refreshLobby(); if (open_) render();
  }
  function dailyReady() { const L = level(); return L > 0 && st().day !== dayStr() && !locked(); }
  function claimDaily() { if (!dailyReady()) return; const L = level(), S = st(); S.day = dayStr(); const list = give(perk(L).daily); popup('VIP 每日禮包', `VIP${L}・${dayStr()}`, list); refreshLobby(); if (open_) render(); }

  /* 貝里加成（所有貝里收入）與經驗加成（戰鬥、掃蕩獲得的角色經驗；經驗書不加成） */
  if (typeof addBerry === 'function') { const _ab = addBerry; addBerry = function (n, raw) { if (!raw && n > 0) { const b = Math.round(n * perk(level()).berry / 100); if (b > 0) n += b; } return _ab.call(this, n); }; }
  if (typeof gainExp === 'function') { const _ge = gainExp; let inner = 0; gainExp = function (id, n, silent, noShare) { if (!inner && noShare !== true && n > 0) { const b = Math.round(n * (perk(level()).exp || 0) / 100); if (b > 0) n += b; } inner++; try { return _ge.call(this, id, n, silent, noShare); } finally { inner--; } }; } /* 分給其他船員的經驗（gainExp 內部再呼叫）不重複加成 */

  /* ---------- 月費 ----------
     v164 起改成檔期表 MCS：同一時間只販售、宣傳「當月」的月費（pickMC 依現在時間挑選）；
     每期的價格、天數、每日寶藏幣、限定抽獎券、SSR 角色選擇卡都沿用 10 月的規則。
     chars＝購買就送的角色（已擁有改發覺醒結晶，數量同分解一位重複角色）；pick＝購買就送的角色隨機卡道具；skins＝購買就送的皮膚（已擁有不重複發放）。
     買過舊月費的玩家，每日寶藏幣照樣領到該期的第 30 天（mcClaim 會檢查每一期）。 */
  const D_ = (y, m, d) => TW.midnight(y, m, d); /* v165：檔期以台灣時間 00:00 為準 */
  const MCS = [
    { id: '2026-10', name: '萬聖火龍燼', label: '2026 年 10 月限時月費', start: D_(2026, 10, 1), end: D_(2026, 11, 1) - 1000, price: 300, /* v127：1200 → 300（使用者指定） */ days: 30, daily: 10, tickets: 10, select: 1,
      chars: ['king'], skins: ['king_halloween', 'nami_witch'] /* v143：娜美萬聖節皮膚「月下魔法師」也包含在本期月費 */, banner: 'assets/ui/monthcard_2610.webp?v=03eaf413', ratio: '1100/712', theme: 'oct', face: ['king'], short: 'SSR 燼＋萬聖皮膚',
      skinTag: '萬聖限定皮膚' },
    { id: '2026-11', name: '雙慶折扣・雙強左右開弓', label: '2026 年 11 月限時月費', start: D_(2026, 11, 1), end: D_(2026, 12, 1) - 1000, price: 300, days: 30, daily: 10, tickets: 10, select: 1,
      chars: [], pick: 'mc_pick_2611', skins: ['gaban_skin1', 'rayleigh_skin1'], banner: 'assets/ui/monthcard_2611.webp?v=de5897d2', ratio: '1100/694', theme: 'nov', face: ['rayleigh', 'gaban'], short: '賈巴／雷利＋兩款皮膚',
      skinTag: '11 月限定皮膚', skinName: { gaban_skin1: ['賈巴', '揮金如土'], rayleigh_skin1: ['雷利', '價格斬殺'] } },
    { id: '2026-12', name: '聖誕樹下・巴托洛米奧的追求', label: '2026 年 12 月限時月費', start: D_(2026, 12, 1), end: D_(2027, 1, 1) - 1000, price: 300, days: 30, daily: 10, tickets: 10, select: 1,
      chars: ['bartolomeo'], skins: ['bartolomeo_skin1'], banner: 'assets/ui/monthcard_2612.webp?v=b4a9eee7', ratio: '1100/621', theme: 'dec', face: ['bartolomeo'], short: '巴托洛米奧＋聖誕皮膚',
      skinTag: '聖誕限定皮膚', skinName: { bartolomeo_skin1: ['巴托洛米奧', '極夜聖誕'] }, charName: { bartolomeo: '巴托洛米奧' } }
  ];
  /* 現在販售中的那期；都不在販售期間時，顯示最近一期已截止的（或第一期「即將開賣」） */
  const pickMC = t => { t = t == null ? Date.now() : t; return MCS.find(m => t >= m.start && t <= m.end) || MCS.slice().reverse().find(m => t > m.end) || MCS[0]; };
  let MC = pickMC();
  const syncMC = () => { MC = pickMC(); return MC; };
  const mcAll = () => { const d = SAVE.data; d.mcard = d.mcard || {}; return d.mcard; };
  const mcSt = m => mcAll()[(m || MC).id];
  const onSale = m => { m = m || MC; return Date.now() >= m.start && Date.now() <= m.end; };
  const mcDay = m => { const s = mcSt(m); return s ? dayNum(dayStr()) - dayNum(s.buy) + 1 : 0; }; /* 第幾天（購買當天是第 1 天） */
  const mcActive = m => { m = m || MC; const s = mcSt(m), d = mcDay(m); return !!s && d >= 1 && d <= m.days; };
  const md = t => TW.fmtMD(t);
  const rarOf_ = id => (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[id]) || 'SSR';
  const dupGem = id => { const c = (window.PROG && PROG.cfg && PROG.cfg.dupeGem) || { SR: 10, SSR: 20, UR: 35 }; return c[rarOf_(id)] || 20; };
  const skinBox = () => { const S = SAVE.data.skins = SAVE.data.skins || { owned: [], equip: {} }; S.owned = S.owned || []; S.equip = S.equip || {}; return S; };
  const LV0 = () => typeof GACHA_CHAR_LV !== 'undefined' ? GACHA_CHAR_LV : 20;
  /* 每日寶藏幣：每一期已購買且還在 30 天內的月費各領一次 */
  function mcClaim(silent) {
    if (locked()) return false; const T = dayStr(), got = [];
    MCS.forEach(m => { const s = mcSt(m); if (!mcActive(m) || s.last === T) return; s.last = T; s.got = (s.got || 0) + 1; SAVE.data.tokens = (SAVE.data.tokens || 0) + m.daily; got.push(m); });
    if (!got.length) return false; SAVE.save(); if (typeof coins === 'function') coins();
    if (!silent) got.forEach((m, i) => setTimeout(() => toast(`${got.length > 1 ? `${+m.id.slice(5)} 月` : ''}月費每日福利：寶藏幣 +${m.daily}（第 ${mcDay(m)}/${m.days} 天）`, 'gold'), i * 1800));
    return true;
  }
  function mcBuy() {
    syncMC(); const m = MC;
    if (mcSt(m)) return toast('這期月費已經購買過了');
    if (!onSale(m)) return toast('目前不在月費販售期間');
    if (locked()) return toast('裝置時間異常，暫停購買。請開啟「自動設定日期與時間」', 'warn');
    if ((SAVE.data.tokens || 0) < m.price) return note('寶藏幣不足', `購買月費需要 ${fmt(m.price)} 枚寶藏幣，目前有 ${fmt(SAVE.data.tokens)} 枚。`, '前往儲值', () => { tab = 'top'; render(); });
    const go = () => {
      if (mcSt(m) || !onSale(m) || (SAVE.data.tokens || 0) < m.price) return;
      SAVE.data.tokens -= m.price; mcAll()[m.id] = { buy: dayStr(), last: '', got: 0 };
      const list = [], inv = SAVE.data.inventory = SAVE.data.inventory || {};
      (m.chars || []).forEach(id => { if (!CHARACTERS[id]) return;
        if (!owned(id)) { addCrew(id, LV0()); list.push({ char: id }); }
        else { const g = dupGem(id); inv.awaken_gem = (inv.awaken_gem || 0) + g; list.push({ item: 'awaken_gem', count: g }); } });
      const S = skinBox(); (m.skins || []).forEach(k => { if (SKINS[k] && !S.owned.includes(k)) { S.owned.push(k); list.push({ name: `皮膚「${SKINS[k].name}」`, count: 1, img: SKINS[k].avatar, rar: 'SSR' }); } });
      list.push(...give({ items: Object.assign(m.pick ? { [m.pick]: 1 } : {}, { event_ticket: m.tickets, char_select: m.select }) }));
      mcClaim(true); list.push({ name: '寶藏幣（第 1 天）', count: m.daily, img: COIN, rar: 'SR' });
      SAVE.save(); if (typeof coins === 'function') coins(); if (typeof SFX !== 'undefined') SFX.play('rare');
      popup('月費購買成功', `${m.label}・之後 ${m.days - 1} 天每天登入再領 ${m.daily} 枚寶藏幣${m.pick ? `・「${ITEMS[m.pick].name}」請到背包使用` : ''}`, list);
      refreshLobby(); render();
    };
    note('購買月費', `花費 ${fmt(m.price)} 枚寶藏幣購買「${m.label}」？（目前有 ${fmt(SAVE.data.tokens)} 枚）`, '購買', go, '再想想');
  }

  /* ---------- 角色隨機卡（v164，11 月月費的「賈巴／雷利角色隨機卡」） ----------
     從 effect.mcPick 裡「還沒擁有」的角色隨機給一位（LV 同召喚獲得的角色）；兩位都已擁有 → 覺醒結晶（同分解一位重複角色的數量）。 */
  window.openMcPick = function (itemId) {
    const it = ITEMS[itemId], inv = SAVE.data.inventory || {}; if (!it || !(inv[itemId] > 0)) return toast(`沒有${it ? it.name : '角色隨機卡'}`);
    const ids = ((it.effect || {}).mcPick || []).filter(id => CHARACTERS[id]);
    if (!ids.length) return toast('角色資料準備中，請更新遊戲後再使用');
    const left = ids.filter(id => !owned(id)), gem = dupGem(ids[0]);
    const box = document.createElement('div'); box.className = 'dl-wrap mp-wrap'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', it.name);
    box.innerHTML = `<div class="dl-card st-card cs-card mp-card"><header><h3>${esc(it.name)}</h3><button class="icon-btn sm" data-x aria-label="關閉">×</button></header>
      <p class="dl-sub">${left.length === 2 ? '隨機獲得其中一位' : left.length === 1 ? `你已經擁有${esc(CHARACTERS[ids.find(id => owned(id))].name)}，這次必定獲得${esc(CHARACTERS[left[0]].name)}` : `兩位都已經擁有，使用後改為獲得覺醒結晶 ×${gem}`}（擁有 ${inv[itemId]} 張）</p>
      <div class="mp-row">${ids.map(id => { const c = CHARACTERS[id], own = owned(id); return `<div class="mp-opt ${own ? 'own' : ''}" data-id="${id}"><span class="mp-art"><img src="${c.avatar}" alt=""></span><b>${esc(c.name)}</b><small>${own ? '已擁有' : `${rarOf_(id)}・${esc(c.title || '')}`}</small></div>`; }).join('')}</div>
      <div class="mp-act"><button class="btn-gold" data-go>${left.length ? '使用隨機卡' : `換成覺醒結晶 ×${gem}`}</button></div></div>`;
    document.body.appendChild(box); let busy = false; const close = () => { if (!busy) box.remove(); };
    box.querySelector('[data-x]').onclick = close; box.onclick = e => { if (e.target === box) close(); };
    box.querySelector('[data-go]').onclick = () => {
      if (busy) return; const I = SAVE.data.inventory || {}; if (!(I[itemId] > 0)) return close();
      const L = ids.filter(id => !owned(id)), pick = L.length ? L[Math.floor(Math.random() * L.length)] : null;
      /* 先扣卡、發獎、存檔，再播動畫（中途關掉頁面也不會吃卡） */
      I[itemId]--; if (!I[itemId]) delete I[itemId];
      if (pick) addCrew(pick, LV0()); else I.awaken_gem = (I.awaken_gem || 0) + gem;
      SAVE.save(); busy = true; box.querySelector('[data-go]').disabled = true; if (window.bagRefresh) bagRefresh();
      const opts = [...box.querySelectorAll('.mp-opt')], reduce = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
      const finish = () => { busy = false; box.remove(); if (pick) popup('角色隨機卡', `${it.name}：${CHARACTERS[pick].name}加入了船隊！`, [{ char: pick }]); else popup('角色隨機卡', '兩位都已擁有，換成覺醒結晶', [{ item: 'awaken_gem', count: gem }]); if (window.bagRefresh) bagRefresh(); if (open_) render(); };
      if (!pick || L.length < 2 || reduce) return setTimeout(finish, pick && L.length < 2 && !reduce ? 400 : 0);
      let k = 0; const N = 9 + ids.indexOf(pick) % 2, tick = () => { opts.forEach((o, j) => o.classList.toggle('hot', j === k % opts.length)); if (k >= N && opts[k % opts.length].dataset.id === pick) { opts[k % opts.length].classList.add('win'); return setTimeout(finish, 600); } k++; setTimeout(tick, 80 + k * 14); };
      tick();
    };
  };

  /* ---------- SSR 角色選擇卡 ---------- */
  window.openCharSelect = function () {
    const inv = SAVE.data.inventory || {}, n = inv.char_select || 0; if (!n) return toast('沒有 SSR 角色選擇卡');
    const NG = typeof NOT_IN_GACHA === 'function' ? NOT_IN_GACHA : () => false;
    const EXCL = ['aokiji', 'kizaru']; /* v167 使用者 11/06：選擇卡不能選青雉、黃猿 */
    const list = CHARACTER_ORDER.filter(id => CHAR_RARITY[id] === 'SSR' && !EXCL.includes(id) && !NG(id) && !(CHAR_OBTAIN[id] || {}).npcOnly && !(CHARACTERS[id] || {}).mystery);
    const box = document.createElement('div'); box.className = 'dl-wrap'; box.innerHTML = `<div class="dl-card st-card cs-card"><header><h3>SSR 角色選擇卡</h3><button class="icon-btn sm" data-x aria-label="關閉">×</button></header><p class="dl-sub">從一般召喚池的 SSR 角色中任選一位（擁有 ${n} 張）。已擁有的角色不能選。</p><div class="st-grid">${list.map(id => { const c = CHARACTERS[id], own = owned(id); return `<button class="st-opt ${own ? 'own' : ''}" data-id="${id}" ${own ? 'disabled' : ''}><img src="${c.avatar}" alt=""><b>${esc(c.name)}</b><small>${own ? '已擁有' : esc(c.title || '')}</small></button>`; }).join('')}</div></div>`;
    document.body.appendChild(box); const close = () => box.remove(); box.querySelector('[data-x]').onclick = close; box.onclick = e => { if (e.target === box) close(); };
    box.querySelectorAll('.st-opt[data-id]:not([disabled])').forEach(b => b.onclick = () => { const id = b.dataset.id, c = CHARACTERS[id];
      confirmBox(`選擇「${c.name}」？`, '會用掉 1 張 SSR 角色選擇卡。', '選擇', () => { if (!((SAVE.data.inventory || {}).char_select > 0) || owned(id)) return; SAVE.data.inventory.char_select--; addCrew(id, typeof GACHA_CHAR_LV !== 'undefined' ? GACHA_CHAR_LV : 20); SAVE.save(); close(); if (typeof SFX !== 'undefined') SFX.play('rare'); toast(`${c.name} 加入了船隊！`, 'gold'); if (window.bagRefresh) bagRefresh(); }); });
  };

  /* ---------- 共用小視窗 ---------- */
  function note(title, msg, okText, ok, cancelText) {
    const w = document.createElement('div'); w.className = 'vp-note'; w.setAttribute('role', 'alertdialog');
    w.innerHTML = `<div class="vp-note-c"><h4>${esc(title)}</h4><p>${esc(msg)}</p><div class="vp-note-a ${cancelText ? 'two' : ''}">${cancelText ? `<button class="btn-ghost" data-n="0">${esc(cancelText)}</button>` : ''}<button class="btn-gold" data-n="1">${esc(okText || '我知道了')}</button></div></div>`;
    document.body.appendChild(w); const close = () => w.remove();
    w.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { close(); if (b.dataset.n === '1' && ok) ok(); }); w.onclick = e => { if (e.target === w) close(); };
    const f = w.querySelector('[data-n="1"]'); if (f) f.focus();
  }
  const NO_PAY = () => note('儲值服務', '本遊戲目前僅開放免費遊玩，暫無儲值服務。');

  /* ---------- 小圖示 ---------- */
  const SV = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const IC = {
    badge: SV('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 11l2 2 4-4"/>'),
    frame: SV('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5c1.5-2.5 3.3-3.5 5.5-3.5s4 1 5.5 3.5"/>'),
    bubble: SV('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>'),
    gift: SV('<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12"/><path d="M12 9c-2-4-6-4-6-1.5S9 9 12 9zM12 9c2-4 6-4 6-1.5S15 9 12 9z"/>'),
    daily: SV('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M12 13l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z"/>'),
    berry: SV('<circle cx="12" cy="12" r="9"/><path d="M10 7v10M10 7h3a2.5 2.5 0 0 1 0 5h-3M10 12h3.5a2.5 2.5 0 0 1 0 5H10"/>'),
    exp: SV('<path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M12 14V8M9 11l3-3 3 3"/>'),
    glow: SV('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>'),
    title: SV('<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>')
  };

  /* ---------- VIP 會員中心介面 ---------- */
  let open_ = false, tab = 'member', sel = 1;
  function wrap() { let m = $('vipHub'); if (!m) { m = document.createElement('div'); m.id = 'vipHub'; m.className = 'vp-wrap'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'VIP 會員中心'); document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) close(); }); } return m; }
  function close() { open_ = false; const m = $('vipHub'); if (m) m.classList.remove('show'); refreshLobby(); }
  window.openVIP = function (t) { if (typeof SAVE === 'undefined' || !SAVE.data) return; syncMC(); grantOnce(false); tab = t || 'member'; const L = level(); sel = Math.max(1, Math.min(6, L < 6 ? L + (L ? 0 : 1) : 6)); open_ = true; render(); wrap().classList.add('show'); };
  const leadFace = () => { const d = SAVE.data, id = [(d.lineup || [])[0], d.player].find(x => x && CHARACTERS[x]) || 'luffy0'; return typeof charArt === 'function' ? charArt(id, 'avatar') : CHARACTERS[id].avatar; };
  function perkRows(l, L) {
    const P = perk(l), rows = [], on = L >= l;
    const row = (ic, t, d, pv, extra) => rows.push(`<li class="vp-perk ${on ? '' : 'off'} ${extra || ''}"><div class="vp-pt"><span class="vp-pi">${IC[ic]}</span><div><b>${t}</b><small>${d}</small></div></div><div class="vp-pv">${pv}</div></li>`);
    row('badge', 'VIP 徽章', '名字旁顯示專屬徽章，好友與排行榜都看得到', `<img src="${badgeS(l)}" alt="VIP${l}">`);
    row('frame', '專屬頭像框', `大廳與好友名片的 VIP${l} 頭像框`, `<span class="vp-av vipf v${l}"><img src="${leadFace()}" alt=""></span>`);
    if (P.bubble) row('bubble', '聊天氣泡', '船團留言板使用 VIP 專屬氣泡', `<span class="vp-bub v${l}">出航囉！</span>`);
    row('gift', '升級禮包', `達到 VIP${l} 時發放：${listText(P.once).join('、')}`, `<span class="vp-chip ${st().once.includes(l) ? 'done' : ''}">${st().once.includes(l) ? '已發放' : on ? '可領取' : '未達成'}</span>`);
    row('daily', '每日禮包', listText(P.daily).join('、'), `<span class="vp-num sm">每日</span>`);
    row('berry', '貝里加成', '戰鬥、寶箱、掃蕩、任務等所有貝里收入', `<span class="vp-num">+${P.berry}%</span>`);
    if (P.exp) row('exp', '經驗加成', '戰鬥與掃蕩獲得的角色經驗（經驗書除外）', `<span class="vp-num">+${P.exp}%</span>`);
    if (P.glow) row('glow', '名字流光', '大廳玩家名稱顯示流動光澤', `<span class="vp-glow">${esc((SAVE.data.profile || {}).name || '草帽新人')}</span>`);
    if (P.title) row('title', '專屬稱號', '獲得稱號「七海贊助者」，可在玩家資料中更換', `<span class="vp-chip gold">七海贊助者</span>`);
    return rows.join('');
  }
  function memberHTML() {
    const L = level(), S = st(), paid = S.paid || 0, l = sel, need = NEED[l], prev = NEED[l - 1] || 0;
    const pct = L >= l ? 100 : Math.max(0, Math.min(100, (paid - prev) / (need - prev) * 100));
    const status = L >= l ? (L === l ? '目前等級' : '已解鎖') : `還差 ${fmt(need - paid)} 寶藏幣`;
    return `<nav class="vp-lvs" aria-label="VIP 等級">${[1, 2, 3, 4, 5, 6].map(i => `<button class="${i === l ? 'on' : ''} ${i <= L ? 'got' : ''}" data-lv="${i}" style="--vc:${COL[i]}">VIP${i}</button>`).join('')}</nav>
      <section class="vp-hero" style="--vc:${COL[l]}"><div class="vp-hero-in">
        <div class="vp-ht"><b>VIP ${l}</b><span class="vp-st ${L >= l ? 'ok' : ''}">${L >= l ? '✓ ' : '🔒 '}${status}</span>
          <div class="vp-prog"><div class="vp-pbar"><i style="width:${pct}%"></i></div><small>累積儲值 <em>${fmt(Math.min(paid, need))}</em> / ${fmt(need)} 寶藏幣</small></div></div>
        <img class="vp-hb" src="${badge(l)}" alt="VIP${l} 徽章"></div></section>
      <h3 class="vp-sec"><span>VIP 特權</span></h3>
      <ul class="vp-perks">${perkRows(l, L)}</ul>`;
  }
  function memberBar() {
    const L = level(), paid = st().paid || 0, ready = dailyReady();
    return `<div class="vp-me"><span class="vp-mb">${L ? `<img src="${badgeS(L)}" alt="">` : VIP0}</span><div><b>目前 VIP${L}</b><small>累積儲值 ${fmt(paid)} 寶藏幣${L < 6 ? `・距 VIP${L + 1} 還差 ${fmt(NEED[L + 1] - paid)}` : '・已達最高等級'}</small></div></div>
      <div class="vp-acts ${L ? 'two' : ''}">${L ? `<button class="btn-ghost" data-a="daily" ${ready ? '' : 'disabled'}>${ready ? '領取每日禮包' : st().day === dayStr() ? '今日已領取' : '每日禮包'}</button>` : ''}<button class="btn-gold" data-a="gotop">前往儲值</button></div>`;
  }
  /* 皮膚顯示用的名字：皮膚資料（SKINS）有就用，還沒載入時用檔期表裡的備用名稱 */
  const skinInfo = (m, k) => { const s = SKINS[k], f = (m.skinName || {})[k] || []; return { img: s ? s.avatar : '', who: s && CHARACTERS[s.char] ? CHARACTERS[s.char].name : f[0] || '', name: s ? s.name : f[1] || '' }; };
  function cardItems(m) {
    const out = [];
    (m.chars || []).forEach(id => { const c = CHARACTERS[id], r = rarOf_(id); out.push([c ? c.avatar : '', `${r} 角色「${c ? c.name : (m.charName || {})[id] || id}」`, `${c && c.title ? c.title + '・' : ''}購買即可獲得（已擁有改發覺醒結晶 ×${dupGem(id)}）`, 'img']); });
    if (m.pick && ITEMS[m.pick]) { const ids = (ITEMS[m.pick].effect || {}).mcPick || []; out.push(['pick', `${ITEMS[m.pick].name} ×1`, `使用後隨機獲得${ids.map(id => CHARACTERS[id] ? CHARACTERS[id].name : '').filter(Boolean).join('或') || '其中一位'}（已擁有的不會抽到；兩位都有時換覺醒結晶 ×${dupGem(ids[0])}）`, 'ico']); }
    (m.skins || []).forEach(k => { const S = skinInfo(m, k); out.push([S.img, `${S.who}${/^\d/.test(m.skinTag) ? ' ' : ''}${m.skinTag}`, `「${S.name}」（只能從本期月費取得）`, 'img']); });
    out.push([COIN, `每日寶藏幣 ×${m.daily}`, `購買起 ${m.days} 天，每天登入自動領取（共 ${m.daily * m.days} 枚）`, 'coin'],
      ['ticket', `限定抽獎券 ×${m.tickets}`, '可在任一限定召喚池使用', 'ico'],
      ['card', `SSR 角色選擇卡 ×${m.select}`, '一般召喚池 SSR 角色任選一位', 'ico']);
    return out;
  }
  function cardHTML() {
    syncMC(); const m = MC, s = mcSt(), d = mcDay(), act = mcActive(), sale = onSale(), leftD = Math.max(0, Math.ceil((m.end - Date.now()) / 864e5));
    const ico = (src, k) => k === 'ico' ? itemIcon(ITEMS[src === 'ticket' ? 'event_ticket' : src === 'pick' ? m.pick : 'char_select']) : src ? `<img src="${src}" alt="">` : '<em class="mc-q">？</em>';
    const stateLine = s ? (act ? `已購買・第 ${d}/${m.days} 天・今日寶藏幣${s.last === dayStr() ? '已領取' : '待領取'}` : '已購買・本期月費福利已結束') : sale ? `限時販售中・剩 ${leftD} 天（${md(m.end)} 23:59 截止）` : Date.now() < m.start ? `${md(m.start)} 開賣` : '本期月費已截止';
    /* 之前買的月費還在 30 天內：一併顯示進度（每日寶藏幣照領） */
    const also = MCS.filter(x => x !== m && mcActive(x)).map(x => `<p class="mc-also">${+x.id.slice(5)} 月月費：第 ${mcDay(x)}/${x.days} 天・今日寶藏幣${mcSt(x).last === dayStr() ? '已領取' : '待領取'}</p>`).join('');
    return `<figure class="mc-ban" data-mc="${m.theme}"><div class="mc-ban-img" style="aspect-ratio:${m.ratio}"><img src="${m.banner}" alt="${m.label}：${m.name}"></div><figcaption class="mc-tag ${s ? 'own' : ''}">${stateLine}</figcaption>${also}</figure>
      <h3 class="vp-sec"><span>月費福利</span></h3>
      <ul class="mc-items">${cardItems(m).map(([src, t, dsc, k]) => `<li><span class="mc-ic ${k}">${ico(src, k)}</span><div><b>${t}</b><small>${dsc}</small></div></li>`).join('')}</ul>
      <p class="vp-tip">月費使用 ${fmt(m.price)} 枚寶藏幣購買（不計入 VIP 儲值），每一期都可以購買一次。每天的寶藏幣需要當天登入遊戲才會發放，錯過的天數不補發。已擁有的角色改發覺醒結晶；皮膚已擁有時不會重複發放。</p>`;
  }
  function cardBar() {
    const m = MC, s = mcSt(), sale = onSale(), np = m.pick && (SAVE.data.inventory || {})[m.pick] > 0;
    return `<div class="vp-me"><span class="vp-mb cn"><img src="${COIN}" alt=""></span><div><b>${fmt(m.price)} 寶藏幣 / ${m.days} 天</b><small>目前擁有 ${fmt(SAVE.data.tokens)} 枚</small></div></div>
      <div class="vp-acts">${s && np ? '<button class="btn-gold" data-a="pick">使用角色隨機卡</button>' : `<button class="btn-gold" data-a="buy" ${!s && sale ? '' : 'disabled'}>${s ? '已購買' : sale ? '購買月費' : '不在販售期間'}</button>`}</div>`;
  }
  const PACKS = [{ nt: 5, tk: 1 }, { nt: 450, tk: 100 }, { nt: 800, tk: 1000 }];
  function topHTML() {
    return `<p class="vp-lead">儲值的寶藏幣會累積到 VIP 等級（目前累積 ${fmt(st().paid || 0)} 枚）。</p>
      <ul class="tp-packs">${PACKS.map((p, i) => `<li class="tp-p p${i}"><span class="tp-art">${`<img src="${COIN}" alt="">`.repeat(i + 1)}</span><b><img src="${COIN}" alt="" class="tp-c">${fmt(p.tk)}</b><small>寶藏幣</small><button class="btn-gold" data-pay="${i}">NT$ ${fmt(p.nt)}</button></li>`).join('')}</ul>
      <p class="vp-tip">本遊戲目前僅開放免費遊玩，暫無儲值服務。以上為預定方案，正式開放時會另行公告。</p>`;
  }
  function topBar() { return `<div class="vp-me"><span class="vp-mb cn"><img src="${COIN}" alt=""></span><div><b>${fmt(SAVE.data.tokens)} 寶藏幣</b><small>VIP${level()}・累積儲值 ${fmt(st().paid || 0)}</small></div></div><div class="vp-acts"><button class="btn-ghost" data-a="member">查看 VIP 福利</button></div>`; }
  function render() {
    const m = wrap(), L = level();
    m.innerHTML = `<div class="vp" data-view="${tab}">
      <header class="vp-head"><h2>VIP 會員中心</h2><button class="vp-x" aria-label="關閉">×</button></header>
      <nav class="vp-tabs" role="tablist">${[['member', '會員'], ['card', '月費'], ['top', '儲值']].map(([k, n]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''} ${(k === 'card' && onSale() && !mcSt()) || (k === 'member' && dailyReady()) ? 'dot' : ''}" data-tab="${k}">${n}</button>`).join('')}</nav>
      <div class="vp-body">${tab === 'member' ? memberHTML() : tab === 'card' ? cardHTML() : topHTML()}</div>
      <footer class="vp-bar">${tab === 'member' ? memberBar() : tab === 'card' ? cardBar() : topBar()}</footer></div>`;
    m.querySelector('.vp-x').onclick = close;
    m.querySelectorAll(".vp-tabs [data-tab]").forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    m.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { sel = +b.dataset.lv; render(); const n = m.querySelector('.vp-lvs .on'); if (n) n.scrollIntoView({ inline: 'center', block: 'nearest' }); });
    m.querySelectorAll('[data-pay]').forEach(b => b.onclick = NO_PAY);
    const A = (k, f) => { const b = m.querySelector(`[data-a="${k}"]`); if (b) b.onclick = f; };
    A('daily', claimDaily); A('gotop', () => { tab = 'top'; render(); }); A('member', () => { tab = 'member'; render(); }); A('buy', mcBuy); A('pick', () => window.openMcPick(MC.pick));
    const on = m.querySelector('.vp-lvs .on'); if (on) requestAnimationFrame(() => { const nav = on.parentElement; nav.scrollLeft = on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2; });
    if (window.fixIcons) fixIcons(m);
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open_ && !document.querySelector('.vp-note')) close(); });

  /* ---------- 大廳：玩家名片上的 VIP 徽章、頭像框、名字流光；寶藏幣「＋」改開儲值 ---------- */
  window.vipLevel = level;
  window.vipTag = l => { l = +l || 0; return l > 0 ? `<img class="vip-tag" src="${badgeS(l)}" alt="VIP${l}" title="VIP${l}">` : ''; };
  window.vipFrameCls = l => { l = +l || 0; return l > 0 ? `vipf v${l}` : ''; };
  function refreshLobby() {
    const chip = $('profileChip'); if (!chip || !chip.classList.contains('lb-prof')) return; const L = level();
    const b = chip.querySelector('.lbpf-txt b'); if (b) { const crown = b.querySelector('i[aria-hidden]'); if (crown) crown.remove(); let v = b.querySelector('.lbpf-vip');
      if (!v) { v = document.createElement('span'); v.className = 'lbpf-vip'; v.setAttribute('role', 'button'); v.tabIndex = 0; v.onclick = e => { e.stopPropagation(); openVIP('member'); }; v.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openVIP('member'); } }; b.appendChild(v); }
      v.setAttribute('aria-label', `VIP${L}：開啟 VIP 會員中心`); v.className = 'lbpf-vip vc' + L; v.innerHTML = `<svg class="vipsvg" viewBox="0 0 64 24" aria-hidden="true"><path d="M7 8.5l3.2 2.8L13 6.5l2.8 4.8L19 8.5l-1.4 8H8.4z" fill="#f3c45a" stroke="#8a5a12" stroke-width=".8" stroke-linejoin="round"/><text x="40" y="12.5" text-anchor="middle" dominant-baseline="central" font-family="Arial Black,Arial,sans-serif" font-style="italic" font-weight="900" font-size="12" fill="#eef2fa">VIP${L}</text></svg>`; v.classList.toggle('dot', dailyReady() || (onSale() && !mcSt()));
      b.classList.toggle('vip-glow', !!perk(L).glow); }
    const av = chip.querySelector('.lbpf-av'); if (av) { av.className = av.className.replace(/\s*vipf v\d/g, ''); if (L) av.className += ` vipf v${L}`; }
    document.querySelectorAll('#modeScreen .topbar .coin:not(.berry) .lb-plus').forEach(p => { if (!p.__vip) { p.__vip = true; p.setAttribute('aria-label', '儲值寶藏幣'); p.onclick = e => { e.stopPropagation(); openVIP('top'); }; } });
    const rail = document.querySelector('#lobby .l2-rail'); if (rail && !$('l2Vip')) { const b = document.createElement('button'); b.className = 'l2-ic'; b.id = 'l2Vip'; b.setAttribute('aria-label', 'VIP 會員中心');
      b.innerHTML = '<i class="l2-svg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/><path d="M8.5 15.5h7"/></svg></i><b>VIP 會員</b><small class="l2-vip-lv"></small>';
      b.onclick = () => openVIP(onSale() && !mcSt() ? 'card' : 'member'); const ref = rail.querySelector('[data-lb=treasure]'); if (ref) ref.after(b); else rail.appendChild(b); }
    const vb = $('l2Vip'); if (vb) { vb.classList.toggle('has-dot', dailyReady() || (onSale() && !mcSt())); const lv = vb.querySelector('.l2-vip-lv'); if (lv) lv.textContent = `目前 VIP${L}`; }
    const side = document.querySelector('#lobby .l2-side'); let mc = $('l2Month');
    syncMC();
    if (side && onSale() && !mcSt()) { if (!mc) { mc = document.createElement('button'); mc.id = 'l2Month'; mc.className = 'l2-month'; mc.onclick = () => openVIP('card'); side.appendChild(mc); }
      /* v164：卡面跟著當月月費（頭像＝第一位已有資料的角色，配色 data-mc） */
      if (mc.dataset.mc !== MC.id || !mc.querySelector('img[src]')) { const fid = (MC.face || []).find(id => CHARACTERS[id]), src = fid ? CHARACTERS[fid].avatar : '';
        mc.dataset.mc = MC.id; mc.dataset.theme = MC.theme; mc.setAttribute('aria-label', `限時月費：${MC.name}`);
        mc.innerHTML = `${src ? `<img src="${src}" alt="">` : '<i class="mc-fq" aria-hidden="true">？</i>'}<span><b>限時月費</b><small>${MC.short}</small></span>`; } }
    else if (mc) mc.remove();
    fitMonth();
  }
  /* 月費小卡放在右側欄最下面；若會碰到下方導覽列或被裁切，就先隱藏（VIP 會員圖示仍可進入） */
  function fitMonth() { const mc = $('l2Month'); if (!mc) return; mc.hidden = false; const nav = document.querySelector('#lobby .l2-nav, .l2-nav'); const r = mc.getBoundingClientRect();
    const limit = nav ? nav.getBoundingClientRect().top - 8 : innerHeight - 8; if (r.height && (r.bottom > limit || r.height < 48)) mc.hidden = true; }
  window.addEventListener('resize', () => setTimeout(fitMonth, 120));
  window.vipRefreshLobby = refreshLobby;

  /* ---------- 月費宣傳：每次進入遊戲顯示一次；可設定今日不再顯示；點宣傳圖前往購買 ---------- */
  let adShown = false;
  /* v141：新手教學（大廳導覽 GUIDE）還沒完成、或正在播放時，月費宣傳一律等教學結束才出現 */
  const guidePending = () => { try { return (typeof GUIDE !== 'undefined' && !GUIDE.done()) || !!document.querySelector('.gd-wrap'); } catch (e) { return false; } };
  /* v164：只在「大廳畫面」且沒有任何其他畫面或視窗開著時才顯示（航路、篇章、3D 島嶼、戰鬥、召喚、背包、船員……都算） */
  const onLobbyScreen = () => { const m = $('modeScreen'); if (typeof currentScreen !== 'undefined' && currentScreen !== 'modeScreen') return false; if (!m || m.classList.contains('hidden')) return false;
    return ![...document.querySelectorAll('.screen')].some(x => x !== m && !x.classList.contains('hidden')); };
  const vis = el => { if (!el || el.hidden) return false; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  /* 其他視窗：常見的視窗 class，加上所有 role=dialog／aria-modal 且看得到的元素（月費宣傳本身除外） */
  const otherDialog = () => !!document.querySelector('.modal.show, .dl-wrap, .gw-wrap.show, .vp-wrap.show, .vp-note, .cer-wrap, .guide-mask, .gd-tip, .gd-wrap, .rt-wrap, #tutorial.show, #dialog.show')
    || [...document.querySelectorAll('[role=dialog], [role=alertdialog], [aria-modal=true]')].some(el => !el.closest('.mc-ad') && !el.closest('#modeScreen .l2-rail') && vis(el));
  function busyUI() { return guidePending() || !onLobbyScreen() || otherDialog(); }
  function showAd() {
    syncMC(); if (adShown || mcSt() || !onSale() || SAVE.data.mcAdHide === dayStr()) return; adShown = true;
    const w = document.createElement('div'); w.className = 'mc-ad'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', '限時月費宣傳');
    w.innerHTML = `<div class="mc-ad-c"><button class="mc-ad-x" aria-label="關閉">×</button><button class="mc-ad-img" aria-label="查看月費" data-mc="${MC.theme}"><img src="${MC.banner}" alt="${MC.label}：${MC.name}" style="aspect-ratio:${MC.ratio}"></button>
      <div class="mc-ad-a"><button class="btn-ghost" data-k="hide">今日不再顯示</button><button class="btn-gold" data-k="go">查看月費</button></div></div>`;
    document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('show'));
    let guard = null; const close = () => { clearInterval(guard); w.classList.remove('show'); setTimeout(() => w.remove(), 200); };
    /* v164：廣告顯示中切到其他畫面（航路、戰鬥……）或有其他視窗打開 → 先收起，回到大廳再顯示 */
    guard = setInterval(() => { if (!document.body.contains(w)) return clearInterval(guard); if (!onLobbyScreen() || otherDialog()) { clearInterval(guard); w.remove(); adShown = false; queueAd(); } }, 400);
    w.querySelector('.mc-ad-x').onclick = close; w.onclick = e => { if (e.target === w) close(); };
    w.querySelector('[data-k=hide]').onclick = () => { SAVE.data.mcAdHide = dayStr(); SAVE.save(); toast('今天不會再顯示月費宣傳'); close(); };
    const go = () => { close(); openVIP('card'); }; w.querySelector('.mc-ad-img').onclick = go; w.querySelector('[data-k=go]').onclick = go;
  }
  let adQ = null;
  function queueAd() { if (adShown || adQ) return; let n = 0; adQ = setInterval(() => { const stop = () => { clearInterval(adQ); adQ = null; };
      if (adShown) return stop(); if (guidePending() || !onLobbyScreen()) { n = 0; return; } /* 教學期間、或不在大廳時不計次（v164：離開大廳時廣告留在佇列，回到大廳再出現） */
      if (++n > 60) return stop();
      if (!busyUI()) { stop(); setTimeout(() => { if (!busyUI()) showAd(); else queueAd(); }, 1200); } }, 700); }

  /* 進入大廳：升級禮包補發、月費每日寶藏幣、名片徽章、宣傳 */
  /* v143：已經買過月費的玩家，補發後來加入的月費皮膚（v164 起每一期都檢查） */
  function mcExtraGrant() { const S = skinBox(), got = []; MCS.forEach(m => { if (mcSt(m)) (m.skins || []).forEach(k => { if (SKINS[k] && !S.owned.includes(k)) { S.owned.push(k); got.push(k); } }); }); if (!got.length) return; SAVE.save(); setTimeout(() => toast(`月費追加福利：獲得皮膚${got.map(k => `「${SKINS[k].name}」`).join('、')}！`, 'gold'), 1600); }
  /* 月費皮膚在皮膚圖鑑的「獲得方式」：皮膚資料沒寫時補上 */
  function tagSkins() { const P = ITEMS.mc_pick_2611; if (P) { const ids = P.effect.mcPick, nm = ids.map(id => CHARACTERS[id] ? CHARACTERS[id].name : '').filter(Boolean); if (nm.length === 2) P.desc = `使用後隨機獲得「${nm[0]}」或「${nm[1]}」其中一位。已擁有其中一位時，必定獲得另一位；兩位都已擁有時，改為獲得覺醒結晶 ×${dupGem(ids[0])}。在背包裡使用。`; }
    MCS.forEach(m => (m.skins || []).forEach(k => { const s = SKINS[k]; if (!s) return; if (!s.monthCard) s.monthCard = m.id; if (!s.how) s.how = `${m.label.replace('限時月費', '月費')}限定（購買月費即可獲得）`; })); }
  function onLobby() { try { if (!SAVE.data || !Object.keys(SAVE.data.roster || {}).length) return; syncMC(); tagSkins(); grantOnce(false); mcExtraGrant(); mcClaim(false); refreshLobby(); setTimeout(refreshLobby, 60); queueAd(); } catch (e) { console.warn('VIP', e); } }
  window.addEventListener('DOMContentLoaded', () => {
    tagSkins();
    const om = window.openModes; if (om) window.openModes = function () { const r = om.apply(this, arguments); setTimeout(onLobby, 300); return r; };
    const rl = window.renderLobby; if (rl) window.renderLobby = function () { const r = rl.apply(this, arguments); refreshLobby(); return r; };
    /* 大廳重繪玩家名片時（innerHTML 會蓋掉徽章），自動補回 VIP 徽章與頭像框 */
    const chip = $('profileChip'); if (chip) new MutationObserver(() => { if (chip.classList.contains('lb-prof') && !chip.querySelector('.lbpf-vip')) refreshLobby(); }).observe(chip, { childList: true });
  });
  /* monthCard：現在這期（依時間）；cards：全部檔期；monthCardAt(時間)：查某個時間點是哪一期（測試用） */
  window.VIP = { level, recharge, need: NEED, perk, get monthCard() { return syncMC(); }, cards: MCS, monthCardAt: pickMC, mcActive, open: openVIP, grantOnce };
})();
