/* v128 凱多龍人型態的變身演出（ext_v128.js 在第 5 招演出結束後呼叫）：
   畫面暗下 → 紫、紅、藍的雷光連續劈在凱多身上 → 最後一道巨雷落下的瞬間換成龍人型態立繪 → 青色光環擴散。
   閃光強度保持適中（只在換圖那一下明顯）。swap() 負責真正換圖（kaidoDragonOn）。 */
(function () {
  const wait = ms => new Promise(r => setTimeout(r, ms)), R = (a, b) => a + Math.random() * (b - a);
  const COL = ['#c58bff', '#ff3a4a', '#8fd8ff', '#ffffff'];
  /* 全畫面圖層（見 css/v128.css）：放在 #battleScreen，不受戰場鏡頭縮放影響 */
  const layer = cls => { const scr = document.getElementById('battleScreen'); if (!scr) return null; let d = scr.querySelector('.' + cls); if (!d) { d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); scr.appendChild(d); } return d; };
  const flash = (a, d, c) => { const el = layer('kd-flash'); if (!el) return; el.style.setProperty('--a', a); el.style.setProperty('--d', d + 's'); el.style.setProperty('--c', c || '#fff'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); };
  window.kaidoDragonFx = async function (S, actor, swap) {
    const el = document.getElementById('bF' + S);
    if (typeof X === 'undefined' || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') { swap(); return; }
    let dim = null;
    FXE.ensure(); const p = fighterPoint(S), top = p.y - 150;
    if (typeof SFX !== 'undefined') SFX.play('thunder');
    dim = layer('kd-dim'); if (dim) { void dim.offsetWidth; dim.classList.add('on'); }
    if (el) el.classList.add('morph-out');
    for (let i = 0; i < 7; i++) {
      const x = p.x + R(-120, 120);
      X.bolt(x + R(-60, 60), -20, p.x + R(-40, 40), top + R(-30, 80), { color: COL[i % 3], w: R(6, 11), life: .26, amp: 34 });
      if (i % 2 === 0) { flash(.12, .14, '#e8dcff'); if (typeof SFX !== 'undefined') SFX.play('zap'); }
      await wait(110);
    }
    if (typeof SFX !== 'undefined') SFX.play('thunder');
    X.bolt(p.x, -20, p.x, p.y, { color: '#ffffff', w: 16, life: .4, amp: 24 });
    X.bolt(p.x - 30, -20, p.x + 10, p.y - 40, { color: '#8fd8ff', w: 10, life: .4 });
    flash(.4, .35);
    if (typeof shake === 'function') shake();
    swap();
    if (el) { el.classList.remove('morph-out'); el.classList.add('morph-in'); setTimeout(() => el.classList.remove('morph-in'), 800); }
    X.ring(p.x, p.y, { r1: 380, color: '#8fd8ff', w: 10, life: .65 });
    X.ring(p.x, p.y, { r1: 250, color: '#c58bff', w: 5, life: .5 });
    X.particles({ x: p.x, y: p.y - 40, n: 46, spd: [160, 440], life: [.5, 1], size: [3, 8], colors: COL, shape: 'spark', add: true });
    X.text(p.x, p.y - 220, '龍人型態', { size: 62, color: '#e8f6ff', color2: '#3a5aff' });
    for (let i = 0; i < 3; i++) setTimeout(() => X.bolt(p.x + R(-20, 20), p.y - 80, p.x + R(-200, 200), p.y + R(-160, 40), { color: COL[i], w: 6, life: .22 }), 120 + i * 120);
    await wait(700);
    if (dim) dim.classList.remove('on');
  };
})();
