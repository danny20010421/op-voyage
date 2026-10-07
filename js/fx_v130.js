/* v130 補上缺少的第 5 招奧義動畫（巡檢時發現沒有專屬動畫的奧義）：
   荷帝·瓊斯「ES 能量鋼彈」——吞下禁藥 ES，血管暴起、紅色的鯊魚之氣捲上全身。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const ADD = {
    /* 哥爾·D·羅傑「神避」（洛克斯挑戰的敵人）：霸王色的紅黑斬擊劈開天地 */
    roger: [, , , , async A => {
      SFX.play('ult'); X.tint && X.tint('#14000a', 1.4, .55); X.glow(A.f.x, A.f.y - 40, { color: '#ff3a3a', r: 220, life: .7, hold: true }); await wait(320);
      moveFighter(A.S, 'dash'); SFX.play('slash');
      for (let i = 0; i < 3; i++) { X.slash && X.slash(A.t.x, A.t.y, { a: -1 + i * .5, span: 3, r: 160 + i * 30, w: 36 - i * 8, color: i % 2 ? '#ffffff' : '#ff2a3a', life: .45 }); await wait(90); }
      for (let i = 0; i < 6; i++) setTimeout(() => X.bolt(A.t.x + R(-160, 160), A.t.y - R(160, 280), A.t.x + R(-30, 30), A.t.y + R(-30, 30), { color: i % 2 ? '#ff2a3a' : '#1a0006', w: 8, life: .22 }), i * 60);
      X.flash('#ff2a3a', .2, .2); if (typeof shake === 'function') shake(); X.text(A.t.x, A.t.y - 170, '神避', { size: 72, color: '#fff0f0', color2: '#8a0010' }); await wait(460);
    }],
    hody: [, , , , async A => {
      SFX.play('buff'); X.tint && X.tint('#2a0008', 1.5, .5); moveFighter(A.S, 'float');
      for (let i = 0; i < 6; i++) { X.particles({ x: A.f.x + R(-30, 30), y: A.f.y - R(60, 140), n: 3, spd: [40, 120], life: [.4, .7], size: [4, 8], colors: ['#ff3a5a', '#ffd0d8', '#ffffff'], shape: 'spark', add: true }); await wait(70); }
      X.text(A.f.x, A.f.y - 180, 'E S', { size: 54, color: '#ffffff', color2: '#c8102a', life: .8 });
      SFX.play('ult'); for (let i = 0; i < 5; i++) { X.ring(A.f.x, A.f.y - 30, { r1: 120 + i * 55, color: i % 2 ? '#ff3a5a' : '#3f8fe8', w: 6, life: .5 }); await wait(80); }
      X.serpent && X.serpent(A.f.x - A.d * 200, A.f.y + 60, A.f.x + A.d * 160, A.f.y - 120, { body: '#3f6fa8', belly: '#e8f2f8', eye: '#ff3a3a', life: 1 });
      X.glow(A.f.x, A.f.y - 30, { color: '#ff3a5a', r: 240, life: 1, hold: true });
      X.particles({ x: A.f.x, y: A.f.y - 30, n: 44, spd: [160, 420], life: [.5, 1], size: [3, 8], colors: ['#ff3a5a', '#3f8fe8', '#ffffff'], shape: 'spark', add: true });
      if (typeof shake === 'function') shake(); X.text(A.f.x, A.f.y - 210, 'ES 能量鋼彈', { size: 56, color: '#ffe8ec', color2: '#8a0a1a' }); await wait(520);
    }]
  };
  window.addEventListener('DOMContentLoaded', () => { if (typeof CHOREO === 'undefined') return;
    Object.entries(ADD).forEach(([id, L]) => { if (!CHARACTERS[id]) return; CHOREO[id] = CHOREO[id] || []; L.forEach((fn, i) => { if (fn && !CHOREO[id][i]) CHOREO[id][i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); }); });
})();
