/* v129 洛克斯專屬技能動畫（深紅與黑色的霸氣雷光，配合立繪）。第 5 招是奧義：先播奧義過場，再由這裡演出。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const RED = ['#ff2a3a', '#ff6a5a', '#1a0006', '#ffffff', '#c8102a'];
  const name = (at, n, sz) => X.text(at.x, at.y - 170, n, { size: sz || 60, color: '#ffe8e8', color2: '#8a0010' });
  const bolts = (x, y, n, spread, life) => { for (let i = 0; i < n; i++) setTimeout(() => X.bolt(x + R(-spread, spread), y - R(120, 260), x + R(-30, 30), y + R(-40, 30), { color: i % 3 ? '#ff2a3a' : '#ffffff', w: R(5, 10), life: life || .22, amp: 26 }), i * 60); };
  const ROCKS = [
    /* 1 蝕：黑紅色的侵蝕直線貫穿一切 */
    async A => { SFX.play('dark'); X.tint && X.tint('#16000a', .9, .45); X.glow(A.f.x, A.f.y - 40, { color: '#ff2a3a', r: 180, life: .5, hold: true }); await wait(220);
      moveFighter(A.S, 'dash'); SFX.play('explode'); X.beam && X.beam(A.f.x + A.d * 40, A.f.y - 60, A.t.x, A.t.y - 20, { w: 36, c2: '#ff2a3a', life: .45 });
      X.bolt(A.f.x, A.f.y - 60, A.t.x, A.t.y, { color: '#ff2a3a', w: 12, amp: 18 }); X.cracks && X.cracks(A.t.x, A.t.y, { n: 8, color: '#ffb0b0' });
      X.particles({ x: A.t.x, y: A.t.y, n: 26, spd: [160, 420], life: [.3, .7], size: [2, 6], colors: RED, shape: 'spark', add: true }); name(A.t, '蝕'); await wait(260); },
    /* 2 瞬：身影一閃，殘影與黑紅雷光 */
    async A => { SFX.play('whoosh'); moveFighter(A.S, 'float'); for (let i = 0; i < 4; i++) { X.ring(A.f.x, A.f.y - 40, { r1: 90 + i * 50, color: i % 2 ? '#ff2a3a' : '#ffffff', w: 4, life: .4 }); await wait(70); }
      bolts(A.f.x, A.f.y, 5, 90, .2); X.glow(A.f.x, A.f.y - 40, { color: '#ffffff', r: 160, life: .4 }); name(A.f, '瞬'); await wait(320); },
    /* 3 殺：畫面一黑，一道紅色斬擊 */
    async A => { SFX.play('ult'); X.tint && X.tint('#000000', 1.1, .7); await wait(260); moveFighter(A.S, 'dash'); SFX.play('slash');
      X.slash && X.slash(A.t.x, A.t.y, { a: -.6, span: 2.8, r: 170, w: 40, color: '#ff2a3a', life: .45 });
      bolts(A.t.x, A.t.y, 6, 120, .24); X.flash('#ff2a3a', .2, .25); if (typeof shake === 'function') shake(); name(A.t, '殺', 84); await wait(360); },
    /* 4 蓄：黑色漩渦把傷害吸進身體 */
    async A => { SFX.play('dark'); X.vortex && X.vortex(A.f.x, A.f.y - 30, { r: 150, color: '#3a0010', core: '#000', rim: '#ff2a3a', arms: 6, spin: 4, life: .9 });
      for (let i = 0; i < 10; i++) { X.particles({ x: A.f.x + R(-160, 160), y: A.f.y + R(-180, 40), n: 2, spd: [40, 120], life: [.4, .7], size: [2, 5], colors: RED, shape: 'spark', add: true }); await wait(40); }
      name(A.f, '蓄'); await wait(240); },
    /* 5 戴維的秘密：雷光從天而降，全身纏繞霸氣 */
    async A => { SFX.play('thunder'); X.tint && X.tint('#12000a', 1.6, .6); bolts(A.f.x, A.f.y, 10, 160, .26); await wait(420);
      SFX.play('ult'); X.ring(A.f.x, A.f.y, { r1: 360, color: '#ff2a3a', w: 10, life: .6 }); X.ring(A.f.x, A.f.y, { r1: 220, color: '#ffffff', w: 4, life: .45 });
      X.particles({ x: A.f.x, y: A.f.y - 40, n: 50, spd: [160, 440], life: [.5, 1], size: [3, 8], colors: RED, shape: 'spark', add: true }); name(A.f, '戴維的秘密', 56); await wait(420); }
  ];
  window.addEventListener('DOMContentLoaded', () => { if (typeof CHOREO === 'undefined' || !CHARACTERS.rocks) return; CHOREO.rocks = CHOREO.rocks || []; ROCKS.forEach((fn, i) => { CHOREO.rocks[i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); });
})();
