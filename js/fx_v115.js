/* v115 專屬技能動畫：燼（第 1～4 招）。奧義「火龍皇」用 fx_v104 的火焰奧義主題＋fx_v111 的標題字。
   載入順序：fx_v105.js 之後；角色擴充檔較晚載入，所以等頁面載入完成再註冊（會覆蓋主題式的預設編排）。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const FIRE = ['#ff4a1a', '#ff9a2a', '#ffe08a', '#ffffff'];
  const name = (at, n, sz) => X.text(at.x, at.y - 160, n, { size: sz || 54, color: '#fff4d0', color2: '#c8320a' });
  const sparks = (x, y, n) => X.particles({ x, y, n, spd: [160, 440], life: [.3, .7], size: [2, 6], colors: FIRE, shape: 'spark', add: true, g: 380 });
  const impact = (A, big) => { X.flash('#ffd8a0', big ? .28 : .14, .16); X.ring(A.t.x, A.t.y, { r1: big ? 260 : 170, color: '#ff7a2a', w: big ? 10 : 6, life: .34 }); sparks(A.t.x, A.t.y, big ? 34 : 18); if (big) shake(); };
  const KING = [
    /* 刃里双皇：燃燒的刀刃連斬 */
    async A => { moveFighter(A.S, 'dash'); afterimage(A.S); await wait(180);
      for (let i = 0; i < 6; i++) { SFX.play(i % 2 ? 'hit' : 'slash'); X.slash(A.t.x + R(-30, 30), A.t.y + R(-40, 30), { a: R(-3, -1.6), span: 2, r: 160, w: 16, color: i % 2 ? '#ffe08a' : '#ff5a1a', life: .3 });
        X.flames(A.t.x + R(-60, 60), A.t.y + R(-20, 40), { n: 16, jx: 40, colors: FIRE }); await wait(80); }
      name(A.t, '刃里双皇'); impact(A); },
    /* 丹弓皇：翼龍般的高速突進，火焰吸回自身 */
    async A => { SFX.play('whoosh'); X.wings(A.f.x, A.f.y - 30, { color: '#ff7a2a', life: .7 }); moveFighter(A.S, 'lunge'); afterimage(A.S); await wait(240);
      X.beam(A.f.x + A.d * 40, A.f.y - 30, A.t.x, A.t.y, { w: 22, c1: '#fff0c0', c2: '#ff5a1a', life: .35 }); SFX.play('heavy'); await wait(140);
      X.flames(A.t.x, A.t.y, { n: 50, jx: 70, colors: FIRE }); impact(A, true);
      X.particles({ x: A.t.x, y: A.t.y, n: 26, spd: [200, 420], ang: A.d > 0 ? [2.6, 3.7] : [-.5, .5], life: [.5, .8], size: [3, 6], colors: ['#9dffb8', '#ffe08a'], g: 0 });
      name(A.t, '丹弓皇'); },
    /* 貂自尊皇：火焰護身後引爆 */
    async A => { SFX.play('buff'); X.glow(A.f.x, A.f.y, { color: '#ff7a2a', r: 220, life: .7, hold: true }); X.flames(A.f.x, A.f.y + 40, { n: 40, jx: 70, colors: FIRE }); await wait(320);
      moveFighter(A.S, 'stomp'); X.beam(A.f.x + A.d * 40, A.f.y - 20, A.t.x, A.t.y, { w: 12, c1: '#ffffff', c2: '#ff7a2a', life: .25 }); await wait(160);
      SFX.play('explode'); X.burst(A.t.x, A.t.y, { r: 240, color: '#ff8a3a' }); X.flames(A.t.x, A.t.y, { n: 80, jx: 110, colors: FIRE }); X.puffs(A.t.x, A.t.y + 40, { n: 14, rad: 200, life: 1, color: '#5a3a2a' });
      X.cracks(A.t.x, A.t.y + 50, { n: 9, len: 240, color: '#ff5a1a' }); name(A.t, '貂自尊皇', 60); impact(A, true); },
    /* 露娜莉亞族的驕傲：背上點燃白焰、火焰從身上流過 */
    async A => { SFX.play('heal'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y - 20, { color: '#ffb03a', r: 240, life: 1, hold: true });
      X.wings(A.f.x, A.f.y - 30, { color: '#ffd26c', life: 1 }); X.ring(A.f.x, A.f.y + 60, { r1: 170, color: '#ffe08a', w: 5, life: .6 });
      X.particles({ x: A.f.x, y: A.f.y + 80, n: 44, spd: [80, 220], ang: [-1.95, -1.2], life: [.6, 1], size: [3, 7], colors: ['#ffffff', '#ffe08a', '#9dffb8'], g: -60 });
      await wait(620); name(A.f, '露娜莉亞族的驕傲', 48); }
  ];
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof CHOREO === 'undefined' || !CHARACTERS.king) return;
    CHOREO.king = CHOREO.king || [];
    KING.forEach((fn, i) => { CHOREO.king[i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; });
  });
})();
