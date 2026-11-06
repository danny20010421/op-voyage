/* v166 使用者 11/06：洛克斯換上新立繪（assets/chars/rocks.webp），舊立繪改成皮膚「神之谷的霸者」（rocks_skin1）；
   新立繪在戰鬥中有藍黑色閃電環繞（.rocks-aura，只在原本造型時出現，皮膚與戴維分身不顯示）。
   皮膚取得：擁有洛克斯就自動獲得（那是洛克斯原本的樣子）。可動 GIF 待使用者提供檔案後再換上。 */
(function () {
  if (typeof SKINS === 'undefined' || typeof CHARACTERS === 'undefined' || !CHARACTERS.rocks) return;
  const V = 166, img = n => `assets/chars/${n}.webp?v=${V}`;
  const R = CHARACTERS.rocks; R.battleScale = .85; /* 使用者 11/06 08:13：新立繪尺寸 0.85 */ R.image = img('rocks'); R.avatar = img('rocks_face'); R.ultimateBg = img('rocks'); R.cardFocus = '61% 22%'; R.cardPos = '50% 12%';
  SKINS.rocks_classic = { char: 'rocks', name: '神之谷的霸者', image: img('rocks_skin1'), avatar: img('rocks_skin1_face'), battleScale: 1, how: '擁有洛克斯即可使用（洛克斯原本的造型）' };
  const grant = () => { try { if (!SAVE || !SAVE.data || typeof owned !== 'function' || !owned('rocks')) return; const S = SAVE.data.skins = SAVE.data.skins || { owned: [], equip: {} }; S.owned = S.owned || [];
    if (!S.owned.includes('rocks_classic')) { S.owned.push('rocks_classic'); SAVE.save && SAVE.save(); } } catch (e) { } };
  document.addEventListener('DOMContentLoaded', () => { grant(); setInterval(grant, 5000); });
  /* 戰鬥：原本造型的洛克斯加上閃電環繞 */
  const SVG = '<svg class="rk-bolts" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
    ['M8,30 L18,38 L12,46 L24,56', 'M92,26 L80,36 L88,44 L74,58', 'M20,80 L32,70 L28,62 L40,52', 'M84,78 L70,70 L76,60 L62,50', 'M48,6 L44,18 L54,24 L46,36', 'M30,12 L36,24 L26,30'].map((d, i) => `<path d="${d}" style="--i:${i}"/>`).join('') + '</svg>';
  const tag = f => { try { if (!battle || !f) return; const side = f === battle.player ? 'L' : f === battle.enemy ? 'R' : null; if (!side) return; const el = document.getElementById('bF' + side); if (!el) return;
    const on = f.id === 'rocks' && /assets\/chars\/rocks\.webp/.test(f.image || '');
    el.classList.toggle('rocks-aura', on); if (on && !el.querySelector('.rk-bolts')) el.insertAdjacentHTML('beforeend', SVG); } catch (e) { } };
  const hook = () => { if (typeof applyVisual !== 'function' || applyVisual.__rk) return; const _a = applyVisual; applyVisual = function (f) { const r = _a.apply(this, arguments); tag(f); return r; }; applyVisual.__rk = true; };
  document.addEventListener('DOMContentLoaded', () => setTimeout(hook, 0));
})();
