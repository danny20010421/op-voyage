/* v128：凱多（四皇）換新立繪（使用者提供圖 1，左右鏡射），縮放照舊（scale 1.2）。
   第 5 招「升龍・火焰八卦」使用後：雷光劈下 → 化為龍人型態（使用者提供圖 2，立繪縮放 1.2 + 0.3 ＝ 1.5，即 ×1.25），
   一直維持到凱多倒下或戰鬥結束才恢復圖 1。效果 kaidoDragon 的處理在 ext_v128.js，雷光演出在 fx_v128.js。
   載入順序：data_ext.js 之後、roster_v91.js 之前（與其他 roster 檔相同）。 */
(function () {
  const K = typeof CHARACTERS !== 'undefined' && CHARACTERS.kaido; if (!K) return;
  const V = 128;
  K.image = `assets/chars/kaido_v128.webp?v=${V}`;
  K.ultimateBg = `assets/chars/kaido_v128.webp?v=${V}`;
  K.avatar = `assets/chars/kaido_face_v128.webp?v=${V}`;
  K.cardPos = '50% 12%'; K.cardFocus = '50% 16%';
  const U = K.skills && K.skills[4]; if (!U) return;
  U.effect.kaidoDragon = { image: `assets/chars/kaido_dragon.webp?v=${V}`, scale: 1.25, label: '龍人型態' };
  if (!/龍人型態/.test(U.desc)) U.desc += ' 使用後雷光劈下，化為「龍人型態」（立繪改變），直到凱多倒下或戰鬥結束。';
  if (U.tags && !U.tags.some(t => t[0] === '變身')) U.tags.push(['變身', 'gold']);
})();
