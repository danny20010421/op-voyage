/* v156 其他模式與抽獎池盤查
   ・一般懸賞召喚的機率表改成「實際出率」：照 app.js rollOne 的累加方式計算（船員 → N → R → SR → 剩下的才是 SSR），
     以前的表用 RARITY.rate×(1−3%) 四捨五入，和實際不符（例：表上 SSR 6%，實際 5%；N 表上 48%，實際 49.2%；C 級船員 0.8% 沒列出）。
   ・船員列出每個稀有度的實際機率與人數，並公開「6 成從已擁有的角色中抽出」的規則（CHAR_DUP_RATE）。
   ・皮膚「城市女郎」仍包含在 SSR 道具機率內（skins_v143.js），這裡只顯示扣除後的 SSR 道具機率。
   載入：skins_v143.js、gacha_v144.js、event.js 之後；openGacha 包裝在 DOMContentLoaded 時掛上（最外層）。 */
(function () {
  const pct = (x, d = 2) => `${+(x * 100).toFixed(d)}%`;
  /* 實際出率：回傳 { char:{總和, 各稀有度}, item:{N,R,SR,SSR}, skin } */
  function realRates() {
    const cr = GAME_SETTINGS.charRate, CR = typeof CHAR_RATE_BY_RARITY !== 'undefined' ? CHAR_RATE_BY_RARITY : {};
    const pool = typeof gachaChars === 'function' ? gachaChars() : [];
    const has = k => pool.some(id => CHAR_RARITY[id] === k);
    /* rollChar：依 UR→SSR→SR→…→C 的順序扣，某稀有度沒有角色時，這段機率落到下一個有角色的稀有度 */
    const order = ['UR', 'SSR', 'SR', 'RRR', 'RR', 'U', 'C'].filter(k => CR[k]), tot = order.reduce((t, k) => t + CR[k], 0) || 1, ch = {};
    let carry = 0; order.forEach(k => { carry += CR[k]; if (has(k)) { ch[k] = carry / tot * cr; carry = 0; } });
    const item = {}; let acc = cr; ['N', 'R', 'SR', 'SSR'].forEach(k => { const v = Math.max(0, Math.min(RARITY[k].rate, 1 - acc)); item[k] = v; acc += v; });
    const skin = typeof ITEMS !== 'undefined' && ITEMS.skin_robin_city ? Math.min(.005, item.SSR) : 0;
    return { cr, ch, item, skin, n: k => pool.filter(id => CHAR_RARITY[id] === k).length };
  }
  window.GACHA_RATES = realRates;
  function drawTable() {
    const t = document.getElementById('rateTable'); if (!t || typeof RARITY === 'undefined') return;
    const R = realRates(), dup = typeof CHAR_DUP_RATE !== 'undefined' ? CHAR_DUP_RATE : .6;
    const chRows = Object.keys(R.ch).map(k => `<span class="rt-t">${k} ${pct(R.ch[k])}・${R.n(k)} 位</span>`).join('');
    const names = k => Object.values(ITEMS).filter(i => i.rarity === k && !i.noPool).map(i => i.name).join('、');
    const keepCap = t.querySelector('caption');
    t.innerHTML = `<tr class="rt-char"><th><span class="rar c-rar r-CHAR">船員</span></th><td>${pct(R.cr, 1)}</td><td><span class="rt-ts">${chRows}</span><small>抽到船員時 ${Math.round(dup * 10)} 成是已擁有的角色（重複卡可換貝里或覺醒結晶）、${Math.round((1 - dup) * 10)} 成是還沒有的角色；LV ${typeof GACHA_CHAR_LV !== 'undefined' ? GACHA_CHAR_LV : 20} 加入；限定角色不會出現。</small></td></tr>`
      + ['N', 'R', 'SR', 'SSR'].map(k => { const v = k === 'SSR' ? R.item.SSR - R.skin : R.item[k]; return `<tr><th><span class="rar r-${k}">${k}</span></th><td>${pct(v, 1)}</td><td>${names(k)}</td></tr>`; }).join('')
      + (R.skin ? `<tr class="rt-skin"><th><span class="rar r-SSR">皮膚</span></th><td>${pct(R.skin, 1)}</td><td>妮可·羅賓「城市女郎」（重複抽到換成覺醒結晶 ×10）</td></tr>` : '');
    if (keepCap) t.prepend(keepCap); else t.insertAdjacentHTML('afterbegin', '<caption>出現機率</caption>');
    if (typeof pityCaption === 'function') pityCaption();
  }
  window.addEventListener('DOMContentLoaded', () => {
    const og = window.openGacha; if (typeof og !== 'function') return;
    window.openGacha = function () { const r = og.apply(this, arguments); try { drawTable(); } catch (e) { console.warn(e); } return r; };
    try { openGacha = window.openGacha; } catch (e) { }
  });
})();
