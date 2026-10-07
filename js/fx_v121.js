/* v121 專屬技能動畫：美音第 1～4 招（音符、五線譜、歌聲光環）。第 5 招「召喚魔王」是變身招式，由 fx_v104 的 transformFx 演出並換成魔王立繪。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const PK = ['#ff8ae0', '#ffd0f2', '#8fe8ff', '#ffe98a', '#ffffff'], NOTES = ['♪', '♫', '♬', '♩'];
  const name = (at, n, sz) => X.text(at.x, at.y - 160, n, { size: sz || 52, color: '#ffffff', color2: '#ff6ad5' });
  const note = (x, y, big) => X.text(x, y, NOTES[Math.floor(Math.random() * NOTES.length)], { size: big ? 54 : R(30, 44), color: PK[Math.floor(Math.random() * PK.length)], color2: '#7a2a8a', life: R(.5, .9) });
  const hit = (A, big) => { X.flash('#ffd0f2', big ? .28 : .14, .16); X.ring(A.t.x, A.t.y, { r1: big ? 240 : 160, color: '#ff8ae0', w: big ? 9 : 5, life: .34 }); X.particles({ x: A.t.x, y: A.t.y, n: big ? 34 : 16, spd: [150, 420], life: [.3, .7], size: [2, 6], colors: PK, shape: 'spark', add: true, g: 300 }); if (big && typeof shake === 'function') shake(); };
  const UTA = [
    /* 1 歌聲催眠：一圈圈粉紅歌聲波紋＋飄向對手的音符 */
    async A => { SFX.play('buff'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y - 60, { color: '#ff8ae0', r: 200, life: .7, hold: true });
      for (let i = 0; i < 5; i++) { X.ring(A.f.x + A.d * 40, A.f.y - 40, { r1: 120 + i * 60, color: i % 2 ? '#ff8ae0' : '#ffffff', w: 4, life: .6 }); note(A.f.x + A.d * R(40, 160), A.f.y - R(60, 160)); await wait(110); }
      for (let i = 0; i < 6; i++) { note(A.t.x + R(-90, 90), A.t.y - R(40, 180)); await wait(60); }
      X.tint && X.tint('#5a1a6a', .22, .4); X.text(A.t.x, A.t.y - 110, 'zzZ', { size: 44, color: '#ffd0f2', color2: '#7a2a8a', life: 1 }); name(A.t, '歌聲催眠'); },
    /* 2 五線譜束縛：五條譜線纏住對手，音符連續砸下並爆炸 */
    async A => { SFX.play('whoosh'); moveFighter(A.S, 'dash');
      for (let i = 0; i < 5; i++) X.ring(A.t.x, A.t.y - 40 + i * 16, { r1: 150 - i * 6, color: '#ff8ae0', w: 3, life: .9 });
      await wait(220);
      for (let i = 0; i < 12; i++) { SFX.play(i % 3 ? 'hit' : 'whoosh'); const x = A.t.x + R(-80, 80), y = A.t.y + R(-80, 30); note(x, y - 40); X.burst(x, y, { r: R(40, 70), color: PK[i % PK.length] }); if (i % 4 === 3) X.puffs(x, y, { n: 8, rad: 90, life: .5, color: '#ffb0e8' }); await wait(50); }
      name(A.t, '五線譜束縛'); hit(A, true); },
    /* 3 具現化攻擊：音符化為實體連續攻擊 */
    async A => { SFX.play('buff'); X.glow(A.f.x, A.f.y, { color: '#8fe8ff', r: 160, life: .5, hold: true }); await wait(160);
      for (let i = 0; i < 8; i++) { SFX.play('hit'); const x = A.t.x + R(-70, 70), y = A.t.y + R(-70, 40); note(x, y, i === 7); X.burst(x, y, { r: R(36, 60), color: PK[i % PK.length] }); await wait(70); }
      name(A.t, '具現化攻擊'); hit(A); },
    /* 4 歌之世界：舞台光芒籠罩整個畫面，對手被拉進夢境 */
    async A => { SFX.play('ult'); X.tint && X.tint('#ffd0f2', .3, .5); X.glow(A.t.x, A.t.y - 40, { color: '#ff8ae0', r: 260, life: .9, hold: true });
      for (let i = 0; i < 14; i++) { note(R(A.t.x - 260, A.t.x + 260), R(A.t.y - 260, A.t.y + 40)); if (i % 3 === 0) X.ring(A.t.x, A.t.y - 40, { r1: 120 + i * 18, color: '#ffffff', w: 3, life: .5 }); await wait(55); }
      name(A.t, '歌之世界', 56); hit(A, true); }
  ];
  window.addEventListener('DOMContentLoaded', () => { if (typeof CHOREO === 'undefined' || !CHARACTERS.uta) return; CHOREO.uta = CHOREO.uta || []; UTA.forEach((fn, i) => { CHOREO.uta[i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); });
})();
