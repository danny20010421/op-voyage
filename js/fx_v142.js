/* v142 娜美五招專屬動畫：天候棒的雷雲、蜃氣樓分身、小貓竊賊、雷光槍、雷雲「宙斯」。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const Y = ['#ffffff', '#fff3a0', '#ffd23a', '#8fd8ff'], B = ['#ffffff', '#cfefff', '#7fc8ff', '#3a7ad8'];
  const name = (at, n, sz) => X.text(at.x, at.y - 170, n, { size: sz || 52, color: '#ffffff', color2: '#e8781a' });
  const cloud = (x, y, big) => { X.puffs && X.puffs(x, y, { n: big ? 14 : 8, rad: big ? 150 : 90, life: big ? 1.1 : .8, color: '#e8f0ff' }); X.puffs && X.puffs(x, y + 10, { n: big ? 8 : 4, rad: big ? 110 : 60, life: big ? 1 : .7, color: '#9aa8c0' }); };
  const zap = (x, y, ty, w, col) => X.bolt(x, y, x + R(-30, 30), ty, { color: col || '#fff3a0', w: w || 6, life: .26 });
  const hit = (A, big) => { X.flash('#fffbd0', big ? .3 : .14, .16); X.ring(A.t.x, A.t.y, { r1: big ? 260 : 160, color: '#ffd23a', w: big ? 10 : 5, life: .34 }); X.particles({ x: A.t.x, y: A.t.y, n: big ? 40 : 18, spd: [150, 460], life: [.3, .7], size: [2, 6], colors: Y, shape: 'spark', add: true, g: 260 }); if (big && typeof shake === 'function') shake(); };
  const NAMI = [
    /* 1 雷擊節奏：天候棒點出小雷雲，落雷劈下 */
    async A => { SFX.play('whoosh'); moveFighter(A.S, 'dash'); cloud(A.t.x, A.t.y - 200); await wait(260);
      for (let i = 0; i < 3; i++) { SFX.play('hit'); zap(A.t.x + R(-40, 40), A.t.y - 200, A.t.y, i === 2 ? 9 : 6); await wait(90); }
      name(A.t, '雷擊節奏'); hit(A); X.text(A.f.x, A.f.y - 150, '速度 ↑', { size: 30, color: '#fff3a0', color2: '#2a6ad8', life: .7 }); },
    /* 2 蜃氣樓節奏：熱氣與冷氣扭曲空氣，出現好幾個分身 */
    async A => { SFX.play('buff'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y - 50, { color: '#ffb0d8', r: 200, life: .8, hold: true });
      for (let i = 0; i < 5; i++) { X.ring(A.f.x, A.f.y - 40, { r1: 90 + i * 50, color: i % 2 ? '#ff9ac0' : '#8fd8ff', w: 3, life: .55 }); await wait(80); }
      for (let i = 0; i < 4; i++) X.text(A.f.x + (i - 1.5) * 90, A.f.y - R(20, 90), '✦', { size: 46, color: '#ffffff', color2: '#ff7ab0', life: .8 });
      X.text(A.f.x, A.f.y - 190, '蜃氣樓節奏', { size: 48, color: '#ffffff', color2: '#d8509a' }); await wait(380); },
    /* 3 小貓竊賊：一閃而過，從對手身上摸走東西 */
    async A => { SFX.play('whoosh'); moveFighter(A.S, 'dash'); X.particles({ x: A.f.x, y: A.f.y - 30, n: 18, spd: [200, 420], life: [.2, .4], size: [2, 4], colors: ['#ffb24a', '#ffffff'], shape: 'spark', add: true }); await wait(160);
      X.burst(A.t.x, A.t.y - 30, { r: 70, color: '#ffb24a' }); SFX.play('hit');
      for (let i = 0; i < 6; i++) { X.text(A.t.x + R(-50, 50), A.t.y - R(40, 120), i % 2 ? '฿' : '★', { size: R(26, 40), color: '#ffe27a', color2: '#8a5a00', life: .7 }); await wait(45); }
      name(A.t, '小貓竊賊'); X.text(A.f.x, A.f.y - 150, '偷到了！', { size: 34, color: '#ffe27a', color2: '#8a3a00', life: .9 }); },
    /* 4 雷光槍節奏：雷電凝成長槍直直刺穿 */
    async A => { SFX.play('buff'); X.glow(A.f.x + A.d * 40, A.f.y - 40, { color: '#fff3a0', r: 140, life: .4, hold: true }); await wait(200);
      SFX.play('slash'); for (let i = 0; i < 3; i++) X.bolt(A.f.x + A.d * 40, A.f.y - 40 + i * 6, A.t.x + A.d * 40, A.t.y - 30 + i * 6, { color: i === 1 ? '#ffffff' : '#ffd23a', w: 12 - i * 3, life: .3 });
      await wait(120); name(A.t, '雷光槍節奏'); hit(A, true); },
    /* 5 宙斯・微風節奏：巨大雷雲「宙斯」籠罩戰場，整片雷電砸下 */
    async A => {
      SFX.play('ult'); X.tint && X.tint('#0a1028', 1.3, .6); moveFighter(A.S, 'float');
      cloud(A.t.x, A.t.y - 230, true); cloud(A.t.x - 180, A.t.y - 210, true); cloud(A.t.x + 180, A.t.y - 210, true);
      X.text(A.t.x, A.t.y - 300, '宙斯！', { size: 44, color: '#ffffff', color2: '#2a4a8a', life: .9 }); await wait(520);
      for (let i = 0; i < 14; i++) { SFX.play(i % 3 ? 'hit' : 'slash'); zap(A.t.x + R(-200, 200), A.t.y - 230, A.t.y + R(-20, 20), R(6, 12), i % 4 ? '#fff3a0' : '#8fd8ff'); if (i % 4 === 0) X.flash('#fffbd0', .18, .1); await wait(55); }
      X.bolt(A.t.x, -40, A.t.x, A.t.y, { color: '#ffffff', w: 26, life: .5 }); X.bolt(A.t.x, -40, A.t.x, A.t.y, { color: '#ffd23a', w: 44, life: .5 });
      hit(A, true); X.glow(A.t.x, A.t.y, { color: '#ffd23a', r: 320, life: .8, hold: true });
      X.text(A.t.x, A.t.y - 200, '宙斯・微風節奏', { size: 62, color: '#fffbe0', color2: '#c8700a' }); await wait(560);
    }
  ];
  window.addEventListener('DOMContentLoaded', () => { if (typeof CHOREO === 'undefined' || !CHARACTERS.nami) return; CHOREO.nami = CHOREO.nami || []; NAMI.forEach((fn, i) => { CHOREO.nami[i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); });
})();
