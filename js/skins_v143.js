/* v143 新皮膚：
   ・娜美「月下魔法師」（nami_witch）：2026 年 10 月月費限定，購買月費即可獲得（vip_v115.js 的 MC.extraSkins；已買過的玩家進大廳時補發）。戰鬥立繪縮放 0.75。
   ・妮可·羅賓「城市女郎」（robin_city）：只能從一般懸賞召喚（tokens 抽獎、免費抽、召喚券）隨機抽到，取代原本的「？？？ 敬請期待」位置。戰鬥立繪縮放 0.8。
     機率 0.5%（從 SSR 道具機率中分出來，總機率不變）；保底與十連保底補的那一抽不會出皮膚。重複抽到 → 覺醒結晶 ×10。
   抽獎道具 ITEMS.skin_robin_city 標 noPool，不會被一般道具池或活動池抽到；只由這裡的 rollOne 包裝決定。
   載入順序：data.js 之後即可；rollOne／grant／openGacha 的包裝在 DOMContentLoaded 時掛上。 */
(function () {
  const V = 143, img = n => `assets/chars/${n}.webp?v=${V}`;
  const RATE = .005, DUP_GEM = 10, KEY = 'robin_city', ITEM = 'skin_robin_city';
  SKINS.nami_witch = { char: 'nami', name: '月下魔法師', image: img('nami_skin2'), avatar: img('nami_skin2_face'), battleScale: .75, faceLeft: true /* v144：立繪朝左，戰鬥中鏡像（使用者指定） */, monthCard: '2026-10', how: '2026 年 10 月月費限定（購買月費即可獲得）' };
  delete SKINS.robin_s2;
  SKINS[KEY] = { char: 'robin', name: '城市女郎', image: img('robin_skin3'), avatar: img('robin_skin3_face'), battleScale: .8, gacha: true, how: `一般懸賞召喚獲得（機率 ${RATE * 100}%）` };
  ITEMS[ITEM] = { name: '皮膚「城市女郎」', rarity: 'SSR', noPool: true, skin: KEY, img: SKINS[KEY].avatar, icon: 'gem', color: '#ff7ab0', effect: {},
    desc: `妮可·羅賓的皮膚，抽到馬上可以在角色背包換上。重複抽到時自動換成覺醒結晶 ×${DUP_GEM}。` };

  /* SSR 道具實際的絕對機率（照 app.js rollOne 的累加方式：船員、N、R、SR 之後剩下的才是 SSR）→ 皮膚佔其中多少比例，讓皮膚實際機率＝RATE */
  const ssrAbs = () => { const before = GAME_SETTINGS.charRate + RARITY.N.rate + RARITY.R.rate + RARITY.SR.rate; return Math.max(1e-6, Math.min(RARITY.SSR.rate, 1 - before)); };
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof rollOne !== 'function' || typeof grant !== 'function') return;
    const _roll = rollOne;
    rollOne = function (minR) {
      const x = _roll.apply(this, arguments);
      if (!minR && x && x.item && ITEMS[x.item].rarity === 'SSR' && Math.random() < RATE / ssrAbs()) return { item: ITEM };
      return x;
    };
    const _grant = grant;
    grant = function (res) {
      const S = SAVE.data.skins = SAVE.data.skins || { owned: [], equip: {} }; S.owned = S.owned || [];
      let dup = 0, fresh = false;
      (res || []).forEach(x => { if (!x || !x.item || !ITEMS[x.item] || !ITEMS[x.item].skin) return; const k = ITEMS[x.item].skin;
        if (S.owned.includes(k)) { x.dup = true; dup++; } else { S.owned.push(k); fresh = true; } x.skinDone = true; });
      if (dup) { const inv = SAVE.data.inventory = SAVE.data.inventory || {}; inv.awaken_gem = (inv.awaken_gem || 0) + DUP_GEM * dup; }
      const r = _grant.call(this, (res || []).filter(x => !(x && x.skinDone)));
      if (fresh) setTimeout(() => toast(`獲得皮膚「${SKINS[KEY].name}」！可在角色背包裝備`, 'gold'), 2400);
      if (dup) setTimeout(() => toast(`皮膚「${SKINS[KEY].name}」重複，換成覺醒結晶 ×${DUP_GEM * dup}`, 'gold'), 2400);
      SAVE.save(); return r;
    };
    if (typeof openGacha === 'function') {
      const _open = openGacha;
      openGacha = function () {
        const r = _open.apply(this, arguments), t = document.getElementById('rateTable');
        if (t && !t.querySelector('.rt-skin')) t.insertAdjacentHTML('beforeend', `<tr class="rt-skin"><th><span class="rar r-SSR">皮膚</span></th><td>${+(RATE * 100).toFixed(2)}%</td><td>妮可·羅賓「${SKINS[KEY].name}」（包含在 SSR 道具機率內；重複換覺醒結晶 ×${DUP_GEM}）</td></tr>`);
        return r;
      };
    }
  });
})();
