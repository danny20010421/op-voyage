/* v118 專屬技能動畫：尼卡魯夫第 1～4 招（第 4 招「巨人」施放時立繪放大 3 倍）。奧義用 fx_v104 主題＋fx_v111 標題字。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const WH = ['#ffffff', '#f4ecff', '#ffe98a'];
  const name = (at, n, sz) => X.text(at.x, at.y - 160, n, { size: sz || 54, color: '#ffffff', color2: '#b58cff' });
  const impact = (A, big) => { X.flash('#ffffff', big ? .3 : .15, .16); X.ring(A.t.x, A.t.y, { r1: big ? 260 : 170, color: '#fff2a8', w: big ? 10 : 6, life: .34 }); X.particles({ x: A.t.x, y: A.t.y, n: big ? 36 : 18, spd: [160, 440], life: [.3, .7], size: [2, 6], colors: WH, shape: 'spark', add: true, g: 380 }); if (big) shake(); };
  const fighter = S => (typeof battle !== 'undefined' && battle) ? (S === 'L' ? battle.player : battle.enemy) : null;
  const NIKA = [
    async A => { moveFighter(A.S, 'dash'); for (let i = 0; i < 9; i++) { SFX.play(i % 2 ? 'hit' : 'whoosh'); X.burst(A.t.x + R(-70, 70), A.t.y + R(-60, 40), { r: R(50, 90), color: '#ffffff' }); X.puffs(A.t.x + R(-50, 50), A.t.y + R(-30, 30), { n: 6, rad: 80, life: .5, color: '#efe6ff' }); await wait(55); } name(A.t, '橡膠橡膠·火箭砲'); impact(A); },
    async A => { SFX.play('buff'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y - 60, { color: '#ffe04a', r: 200, life: .6, hold: true }); await wait(260);
      for (let i = 0; i < 3; i++) { X.bolt && X.bolt(A.t.x + R(-60, 60), A.t.y - 420, A.t.x + R(-20, 20), A.t.y, { color: '#fff7a0', w: 6, life: .35 }); SFX.play('hit'); await wait(90); } name(A.t, '橡膠橡膠·雷電'); impact(A, true); },
    async A => { SFX.play('heal'); for (let i = 0; i < 4; i++) { X.ring(A.f.x, A.f.y, { r1: 120 + i * 50, color: i % 2 ? '#ffe98a' : '#ffffff', w: 5, life: .5 }); SFX.play('hit'); await wait(130); }
      X.glow(A.f.x, A.f.y, { color: '#fff7c0', r: 240, life: .8, hold: true }); X.text(A.f.x + A.d * 80, A.f.y - 110, '咚咚咚咚', { size: 38, color: '#ffffff', color2: '#b58cff', life: .9 }); await wait(360); name(A.f, '解放之鼓', 52); },
    async A => { const f = fighter(A.S); const old = f ? (f.visMul || 1) : 1; SFX.play('ult');
      if (f && typeof applyVisual === 'function') { f.visMul = old * 3; applyVisual(f); }
      X.tint('#fff8e0', .25, .35); await wait(520); moveFighter(A.S, 'stomp'); SFX.play('heavy'); X.cracks(A.t.x, A.t.y + 60, { n: 12, len: 320, color: '#ffffff' }); X.puffs(A.t.x, A.t.y + 70, { n: 18, rad: 200, life: 1, color: '#f4ecff' }); name(A.t, '橡膠橡膠·巨人', 62); impact(A, true);
      await wait(520); if (f && typeof applyVisual === 'function') { f.visMul = old; applyVisual(f); } }
  ];
  window.addEventListener('DOMContentLoaded', () => { if (typeof CHOREO === 'undefined' || !CHARACTERS.luffy_nika) return; CHOREO.luffy_nika = CHOREO.luffy_nika || []; NIKA.forEach((fn, i) => { CHOREO.luffy_nika[i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); });
})();
