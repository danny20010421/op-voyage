/* v157 召喚結果卡片統一（window.GCARD）：一般召喚百連／新手召喚（app.js showResults）與限定池抽獎（event.js animate）共用同一種卡片。
   結構固定：左上稀有度標籤、同高的圖片區（右下可放「新船員／重複」小標）、名稱（最多 2 行）、說明（最多 2 行，過長省略）。
   顏色用 --tc（依稀有度），樣式在 css/gcard_v157.css。 */
(function () {
  const TONE = { N: '#9fb3c4', C: '#9fb3c4', U: '#9fb3c4', R: '#5fb8ff', RR: '#5fb8ff', RRR: '#5fb8ff', SR: '#c58bff', SSR: '#ffcf5a', UR: '#ff7ad9', 'UR+': '#ff5a6a', 'UR++': '#ff5a6a' };
  const tone = r => TONE[r] || '#9fb3c4';
  function html(o) {
    return `<div class="gcd ${o.cls || ''}" style="--tc:${o.tone || tone(o.rar)};--d:${o.d || 0}ms">`
      + `<span class="gcd-rar rar ${o.rarCls || 'r-' + o.rar}">${o.rar}</span>`
      + `<div class="gcd-art">${o.art || ''}${o.tag ? `<span class="gcd-tag">${o.tag}</span>` : ''}</div>`
      + `<b class="gcd-name">${o.name || ''}</b><small class="gcd-sub">${o.sub || ''}</small>${o.extra || ''}</div>`;
  }
  /* 一般召喚的一筆結果 → 卡片 */
  function fromRes(x, i) {
    if (x.char) { const c = CHARACTERS[x.char], r = (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[x.char]) || 'SSR';
      return html({ rar: r, rarCls: `c-rar r-${r}`, cls: 'is-char', d: i * 60, art: `<img src="${c.image}" alt="" draggable="false">`, tag: x.dup ? '重複' : '新船員', name: c.name,
        sub: x.dup ? '可換貝里或覺醒結晶' : `LV ${x.lv}`, extra: x.setCap ? `<button class="btn-gold sm" data-cap="${x.char}">加入陣容並設為先鋒</button>` : '' }); }
    const it = ITEMS[x.item]; return html({ rar: it.rarity, d: i * 60, art: typeof itemIcon === 'function' ? itemIcon(it) : '', name: it.name + (x.count > 1 ? ` ×${x.count}` : ''), sub: it.desc });
  }
  window.GCARD = { html, fromRes, tone };
})();
