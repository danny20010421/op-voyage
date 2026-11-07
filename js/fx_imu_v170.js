/* v170 伊姆技能特效精緻化（使用者 11/07 01:26「幫我把伊姆的每一個技能特效動畫都做的更精緻」）。
   ‧ 每一招都有自己的編排（同一招不同型態也不一樣）：預備（蓄力）→ 命中（爆發、震屏、適度閃光）→ 餘韻。
     初始／第一型態：不死之身（深紅繭）、黑轉支配（鎖鏈＋契約紋）、虛空威壓（化影、深淵裂縫）、黑焰・凶兆（黑焰彈＋凶兆之眼）、最初20人（二十道紅光聚集）
     第二型態：永劫不滅（深紅日冕）、萬物逆轉（世界反轉、四面鎖鏈、奪走強化）、世界之王（空白王座＋霸王色黑雷）、毀滅之力（黑焰巨刃劈下）
     第三型態：千眼天啟（八隻紅眼睜開、凝視線）、終焉契約（地面巨大契約陣、鎖鏈連到後排）、虛空王座・天翼（遮天雙翼＋王座＋羽毛風暴）、終焉之翼（雙翼羽刃交叉橫掃、波及後排）、天罰（天空裂開、八眼、審判雷柱、強化碎裂）
     晉升演出 imuFormFx（覆寫 fx_v165.js 的版本）：第一型態（黑轉之繭破殼）、第二型態（王座升起＋霸王色雷暴）、第三型態（天空裂縫、八眼、雙翼展開、羽毛爆散）
     事件：看穿迴避（八眼一閃＋凝視線）、深淵迴避、霸王色震懾（每回合）、契約每回合扣血、契約連鎖／翅膀掃擊對後排（鎖鏈／羽刃飛向後排頭像＋頭像閃紅）
     狀態持續中的場上氛圍（css/fx_imu_v170.css）：世界之王／虛空王座領域、看穿的八隻眼、對手腳下的契約紋、存在抹除、不滅光環。
   ‧ 畫法：戰場畫布（fx.js 的 FXE，requestAnimationFrame、結束自動清掉）＋ 立繪後方的 DOM 背景（王座、雙翼 SVG，演完移除）＋ 00GameDevs 3D 素材（VFX00.fx，只在「技能特效 高」且畫質不是省電時）。
   ‧ 降級：系統「減少動態」或設定「減少動態效果」→ 只留短暫光暈與文字（不閃光、不震屏）；技能特效「低」或畫質「省電」→ 粒子 35%、不用 3D；手機 → 粒子 60%。
   ‧ 倍速：所有等待用 BSPEED 換算（FXE 的動畫時間本來就乘 BSPEED）。連續施放時先收掉上一招還沒演完的特效，不會疊爆；粒子總數有上限。
   ‧ 包住 playChoreo（最外層，伊姆的招式不再跑一般角色的通用特效層）、triggerImpact（伊姆攻擊命中時不再疊通用 hitFX）、log（辨識回合結束事件）、IMU165.preAct/postAct、onEvaded、applySkillEffects、endTurnStatus、renderHUD、startBattle、finishBattle。
   ‧ 3D 素材只用 healing-field／flame-surge／energy-burst／thunder-strike（black-hole、spatial-sweep、dimensional-rend 在遊戲畫面上是大片灰白，不用）。window.__NO_FX170＝量測用，改回 v169 演出。
   ‧ 載入順序：ext_v169.js 之後、loader.js 之前。 */
(function () {
  'use strict';
  if (typeof FXE === 'undefined' || typeof fighterPoint !== 'function') return;
  const X = FXE.P, TAU = Math.PI * 2, R = (a, b) => a + Math.random() * (b - a);
  const $ = id => document.getElementById(id);
  const ls = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const RMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const MOB = typeof LOWFX !== 'undefined' ? !!LOWFX : false;
  /* 0＝減少動態｜1＝技能特效低／省電｜2＝手機｜3＝電腦 */
  const tierNow = () => (RMQ.matches || ls('op_motion') === '1') ? 0 : (ls('op_fxpro') === '0' || ls('op_gfx') === 'low') ? 1 : MOB ? 2 : 3;
  let T = tierNow();
  const NMUL = [0, .35, .6, 1], CAPS = [0, 70, 150, 280];
  const N = n => Math.max(1, Math.round(n * NMUL[T]));
  const spd = () => window.BSPEED || 1;
  const nap = ms => new Promise(r => setTimeout(r, ms / spd()));
  let gen = 0;
  const later = (ms, fn) => { const g = gen; setTimeout(() => { if (g === gen) try { fn(); } catch (e) { } }, ms / spd()); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => 1 - Math.pow(1 - k, 3), easeIO = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const fade = (k, a, b) => k < a ? k / a : k > b ? Math.max(0, (1 - k) / (1 - b)) : 1;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  const C = { crim: '#ff2a5a', blood: '#a0002a', pink: '#ff5ab4', mag: '#d04aff', pur: '#8a3aff', lav: '#e8c8ff', deep: '#14020e', ink: '#07000a', white: '#fff2f6', gold: '#ffd27a' };

  /* ---------- 畫布：自己的特效都經過 add()，可以一次收掉 ---------- */
  const mine = new Set(); let liveP = 0;
  function add(e) { mine.forEach(x => { if (x.t >= x.life) mine.delete(x); }); mine.add(e); return FXE.add(e); }
  function cancelOld() { mine.forEach(e => { if (e.t < e.life) e.life = Math.min(e.life, e.t + .12); }); mine.clear(); }
  const SPR = {};
  function glowS(hex) { const k = 'g' + hex; if (!SPR[k]) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.22, rgba(hex, 1)); r.addColorStop(.55, rgba(hex, .3)); r.addColorStop(1, rgba(hex, 0)); g.fillStyle = r; g.fillRect(0, 0, 64, 64); SPR[k] = c; } return SPR[k]; }
  function smokeS(hex) { const k = 's' + hex; if (!SPR[k]) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); for (let i = 0; i < 6; i++) { const x = 32 + R(-9, 9), y = 32 + R(-9, 9), r = R(14, 26), rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgba(hex, .85)); rg.addColorStop(1, rgba(hex, 0)); g.globalAlpha = .55; g.fillStyle = rg; g.fillRect(0, 0, 64, 64); } SPR[k] = c; } return SPR[k]; }
  const spr = (c, img, x, y, s) => c.drawImage(img, x - s, y - s, s * 2, s * 2);
  function jag(x1, y1, x2, y2, seg, amp) { const p = [[x1, y1]], nx = -(y2 - y1), ny = x2 - x1, l = Math.hypot(nx, ny) || 1; for (let i = 1; i < seg; i++) { const t = i / seg, o = R(-amp, amp) * Math.sin(t * Math.PI); p.push([x1 + (x2 - x1) * t + nx / l * o, y1 + (y2 - y1) * t + ny / l * o]); } p.push([x2, y2]); return p; }
  const pathOf = (c, p) => { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); };

  /* 粒子：feather 黑羽｜tongue 黑焰舌｜mote 光點｜shard 碎片｜streak 火花線｜smoke 煙 */
  function parts(o) {
    let n = N(o.n); const cap = CAPS[T]; if (liveP + n > cap) n = Math.max(0, cap - liveP); if (!n) return;
    const ps = []; let life = 0;
    for (let i = 0; i < n; i++) { const a = R(o.ang ? o.ang[0] : 0, o.ang ? o.ang[1] : TAU), s = R(o.spd[0], o.spd[1]), l = R(o.life[0], o.life[1]), d = R(0, o.delay || 0);
      ps.push({ x: o.x + R(-(o.jx || 0), o.jx || 0), y: o.y + R(-(o.jy || 0), o.jy || 0), vx: Math.cos(a) * s, vy: Math.sin(a) * s, l, d, s: R(o.size[0], o.size[1]), c: o.colors[i % o.colors.length], r: R(0, TAU), vr: R(-4, 4), w: R(0, TAU) }); life = Math.max(life, l + d); }
    liveP += n; setTimeout(() => { liveP = Math.max(0, liveP - n); }, (life * 1000 + 200) / spd());
    const shp = o.shape || 'mote', g = o.g || 0, drag = o.drag || 0, to = o.to, pull = o.pull || 0, rim = o.rim || C.pink;
    return add({ add: !!o.add, life, draw(c, k, dt, t) {
      for (const p of ps) { const lt = t - p.d; if (lt < 0 || lt > p.l) continue; const q = lt / p.l;
        if (to) { const dx = to.x - p.x, dy = to.y - p.y, dd = Math.hypot(dx, dy) || 1; p.vx += dx / dd * pull * 60 * dt; p.vy += dy / dd * pull * 60 * dt; if (dd < 14) { p.l = lt; continue; } }
        p.vx *= 1 - drag * dt; p.vy = p.vy * (1 - drag * dt) + g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        const al = (o.alpha || 1) * (q < .15 ? q / .15 : 1 - Math.pow(q, 2)); if (al <= .01) continue; c.globalAlpha = al;
        if (shp === 'mote') spr(c, glowS(p.c), p.x, p.y, p.s * (1 - q * .5));
        else if (shp === 'smoke') spr(c, smokeS(p.c), p.x, p.y, p.s * (.6 + q * .9));
        else if (shp === 'streak') { const v = Math.hypot(p.vx, p.vy) || 1, L = Math.min(40, v * .05) * (1 - q); c.strokeStyle = p.c; c.lineWidth = p.s; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx / v * L, p.y - p.vy / v * L); c.stroke(); }
        else { c.save(); c.translate(p.x, p.y);
          if (shp === 'feather') { p.x += Math.sin(t * 2.2 + p.w) * 28 * dt; c.rotate(p.r * .3 + Math.sin(t * 3 + p.w) * .6); const s = p.s / 20; c.scale(s, s);
            c.beginPath(); c.moveTo(0, -22); c.quadraticCurveTo(8, -6, 2, 20); c.lineTo(-2, 20); c.quadraticCurveTo(-8, -6, 0, -22); c.closePath(); c.fillStyle = p.c; c.fill();
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = rim; c.lineWidth = 1.4; c.stroke(); c.beginPath(); c.moveTo(0, -18); c.lineTo(0, 22); c.stroke(); }
          else if (shp === 'tongue') { const s = p.s * (1 - q * .6); c.rotate(Math.sin(t * 9 + p.w) * .25); c.beginPath(); c.moveTo(0, -s * 1.8); c.quadraticCurveTo(s, -s * .1, 0, s); c.quadraticCurveTo(-s, -s * .1, 0, -s * 1.8); c.fillStyle = p.c; c.fill();
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = rim; c.globalAlpha = al * .7; c.lineWidth = 1.5; c.stroke(); }
          else { c.rotate(p.r); const s = p.s; c.beginPath(); c.moveTo(0, -s); c.lineTo(s * .55, s * .5); c.lineTo(-s * .4, s * .7); c.closePath(); c.fillStyle = p.c; c.fill(); }
          c.restore(); } } } });
  }
  /* 黑霸王色雷：外圈黑、內圈色、中心白，每 0.05 秒重新抖動 */
  function hbolt(x1, y1, x2, y2, o) { o = o || {}; let p, fk, acc = 1; const w = o.w || 7, col = o.color || C.crim;
    const mk = () => { p = jag(x1, y1, x2, y2, 12, o.amp || 26); fk = [4, 8].map(i => jag(p[i][0], p[i][1], p[i][0] + R(-70, 70), p[i][1] + R(-40, 70), 5, 12)); }; mk();
    return add({ life: o.life || .32, draw(c, k, dt) { acc += dt; if (acc > .05) { acc = 0; mk(); } const a = 1 - k * k; c.lineJoin = 'round'; c.lineCap = 'round';
      c.globalAlpha = a * .85; c.strokeStyle = C.ink; c.lineWidth = w * 1.9; pathOf(c, p); c.stroke(); c.lineWidth = w; fk.forEach(f => { pathOf(c, f); c.stroke(); });
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = w * .75; pathOf(c, p); c.stroke(); c.lineWidth = w * .4; fk.forEach(f => { pathOf(c, f); c.stroke(); });
      c.strokeStyle = '#fff0f4'; c.lineWidth = w * .25; pathOf(c, p); c.stroke(); } }); }
  /* 不用 shadowBlur 的發光環／裂痕／光柱／弧斬（shadowBlur 在低階手機很吃效能，改用預畫的光暈貼圖） */
  function ring(x, y, o) { o = o || {}; const col = o.color || '#ffffff'; return add({ add: true, life: o.life || .45, draw(c, k) { const r = (o.r0 || 10) + ((o.r1 || 150) - (o.r0 || 10)) * ease(k), w = (o.w || 12) * (1 - k) + 1; c.translate(x, y); c.scale(1, o.flat || 1);
    c.globalAlpha = (1 - k) * .45; c.strokeStyle = col; c.lineWidth = w * 2.6; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.globalAlpha = 1 - k; c.lineWidth = w; c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, w * .3); c.stroke(); } }); }
  function cracks(x, y, o) { const L = []; for (let i = 0; i < (o.n || 10); i++) { const a = R(-Math.PI, 0) * (Math.random() < .5 ? 1 : -1), d = R(.4, 1) * (o.len || 200); L.push(jag(x, y, x + Math.cos(a) * d, y + Math.sin(a) * d * .35, 7, 12)); }
    return add({ life: o.life || .9, draw(c, k) { c.globalAlpha = 1 - k * k * k; c.lineJoin = 'miter'; L.forEach((l, i) => { const sub = l.slice(0, Math.max(2, Math.ceil(l.length * Math.min(1, k * 7)))); c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(0,0,0,.75)'; c.lineWidth = 5 - (i % 3); pathOf(c, sub); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = o.color || C.pink; c.lineWidth = 2 - (i % 3) * .5; c.stroke(); }); } }); }
  function pillar(x, y, o) { const col = o.color || C.crim; ring(x, y, { r1: o.w * 2.2, flat: .25, color: col, life: .6 }); return add({ add: true, life: o.life || .7, draw(c, k) { const w = o.w * Math.sin(Math.min(1, k * 1.3) * Math.PI); if (w < 1) return; const g = glowS(col);
    c.globalAlpha = .9; c.drawImage(g, x - w * 1.4, -60, w * 2.8, y + 80); c.drawImage(glowS('#ffffff'), x - w * .45, -60, w * .9, y + 80); spr(c, g, x, y, w * 2.2); } }); }
  function slash(x, y, o) { const a0 = o.a, span = o.span || 1.8, r = o.r, w = o.w || 26, col = o.color || C.crim, N = 20;
    return add({ add: true, life: o.life || .32, draw(c, k) { const head = ease(Math.min(1, k * 2.2)), tail = Math.max(0, (k - .25) / .75), s0 = a0 + span * tail, s1 = a0 + span * head; if (s1 - s0 < .01) return; c.translate(x, y); c.scale(1, .7);
      const band = (ww, cl, al) => { c.globalAlpha = al; c.fillStyle = cl; c.beginPath(); for (let i = 0; i <= N; i++) { const q = i / N, a = s0 + (s1 - s0) * q, th = Math.sin(q * Math.PI) * ww * (.3 + q * .7); c.lineTo(Math.cos(a) * (r + th), Math.sin(a) * (r + th)); } for (let i = N; i >= 0; i--) { const a = s0 + (s1 - s0) * i / N; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); };
      band(w * 2.2, col, .35 * (1 - k * .6)); band(w * 1.4, col, .6 * (1 - k * .6)); band(w * .5, '#ffffff', 1 - k * .5); } }); }
  /* 深色衝擊環（不發光的黑環＋細細的發光邊） */
  function dring(x, y, o) { o = o || {}; return add({ life: o.life || .55, draw(c, k) { const r = (o.r0 || 10) + ((o.r1 || 200) - (o.r0 || 10)) * ease(k), w = (o.w || 18) * (1 - k) + 2; c.translate(x, y); c.scale(1, o.flat || 1);
    c.globalAlpha = (1 - k) * .85; c.strokeStyle = C.ink; c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k; c.strokeStyle = o.color || C.crim; c.lineWidth = Math.max(1.2, w * .22); c.beginPath(); c.arc(0, 0, r + w * .4, 0, TAU); c.stroke(); } }); }
  /* 魔法陣／契約紋：雙圈、星形、符文刻度，可平放在地上（flat） */
  function sigil(x, y, o) { const n = o.n || 5, runes = o.runes || 18, col = o.col || C.pink;
    return add({ add: true, life: o.life || 1.2, draw(c, k, dt, t) { const a = fade(k, .1, .72) * (o.a || 1), r = o.r * (.7 + .3 * ease(Math.min(1, k * 3))), dp = Math.min(1, k * 3.4);
      c.translate(x, y); c.scale(1, o.flat || 1); c.rotate(t * (o.spin == null ? .7 : o.spin)); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = o.lw || 2.4; c.lineJoin = 'round';
      c.beginPath(); c.arc(0, 0, r, 0, TAU * dp); c.stroke(); c.beginPath(); c.arc(0, 0, r * .8, 0, -TAU * dp, true); c.stroke();
      c.globalAlpha = a * clamp((k - .06) * 5, 0, 1); c.beginPath();
      if (n === 6) { for (let s = 0; s < 2; s++) for (let i = 0; i <= 3; i++) { const g = -Math.PI / 2 + s * Math.PI / 3 + i * TAU / 3, px = Math.cos(g) * r * .78, py = Math.sin(g) * r * .78; i ? c.lineTo(px, py) : c.moveTo(px, py); } }
      else for (let i = 0; i <= n; i++) { const g = -Math.PI / 2 + i * 2 * TAU / n, px = Math.cos(g) * r * .78, py = Math.sin(g) * r * .78; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke(); c.lineWidth = 1.5;
      for (let i = 0; i < runes; i++) { const g = i / runes * TAU, cs = Math.cos(g), sn = Math.sin(g); c.beginPath(); c.moveTo(cs * r * .83, sn * r * .83); c.lineTo(cs * r * .95, sn * r * .95); if (i % 3 === 0) { c.moveTo(cs * r * .89 - sn * 5, sn * r * .89 + cs * 5); c.lineTo(cs * r * .89 + sn * 5, sn * r * .89 - cs * 5); } c.stroke(); }
      if (o.eye) { const e = r * .34; c.rotate(-t * (o.spin == null ? .7 : o.spin)); c.lineWidth = 2; c.beginPath(); c.moveTo(-e, 0); c.quadraticCurveTo(0, -e * .9, e, 0); c.quadraticCurveTo(0, e * .9, -e, 0); c.stroke(); c.beginPath(); c.arc(0, 0, e * .3, 0, TAU); c.stroke(); }
      c.globalAlpha = a * .35; spr(c, glowS(col), 0, 0, r * .9); } }); }
  /* 鎖鏈：沿著下垂的曲線一節一節伸出去，伸到後拉緊，再有一道光沿鏈子跑過 */
  function chain(x1, y1, x2, y2, o) { o = o || {}; const K = o.k || 1, L = 13 * K, rim = o.rim || C.pink, grow = o.grow || .32, sag0 = o.sag == null ? 60 : o.sag;
    return add({ life: o.life || 1, draw(c, k, dt, t) { const g = clamp(t / grow, 0, 1), tight = clamp((t - grow) / .14, 0, 1), sag = sag0 * (1 - tight * .85) + Math.sin(t * 9) * 3 * (1 - tight), out = k > .78 ? (1 - k) / .22 : 1;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, cx = mx - dy / len * sag, cy = my + dx / len * sag, cnt = Math.ceil(len * 1.04 / L);
      const P = q => { const u = 1 - q; return [u * u * x1 + 2 * u * q * cx + q * q * x2, u * u * y1 + 2 * u * q * cy + q * q * y2, Math.atan2(2 * u * (cy - y1) + 2 * q * (y2 - cy), 2 * u * (cx - x1) + 2 * q * (x2 - cx))]; };
      c.globalAlpha = out; const lim = Math.floor(cnt * g);
      for (let i = 0; i < lim; i++) { const [px, py, a] = P((i + .5) / cnt); c.save(); c.translate(px, py); c.rotate(a); c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#1c1424'; c.lineWidth = 3.2 * K; c.beginPath();
        if (i % 2 === 0) c.ellipse(0, 0, L * .62, L * .3, 0, 0, TAU); else { c.moveTo(-L * .62, 0); c.lineTo(L * .62, 0); } c.stroke();
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = rim; c.lineWidth = 1.2 * K; c.stroke(); c.restore(); }
      c.globalCompositeOperation = 'lighter';
      if (g < 1) { const [hx, hy] = P(g); c.globalAlpha = out; spr(c, glowS(rim), hx, hy, 18 * K); }
      else { const q = clamp((t - grow - .1) / .35, 0, 1); if (q > 0 && q < 1) { const [hx, hy] = P(q); spr(c, glowS('#ffffff'), hx, hy, 14 * K); spr(c, glowS(rim), hx, hy, 30 * K); } } } }); }
  /* 眼睛：杏仁形眼眶、紅色虹膜、直立瞳孔；依序睜開，結尾閉上；gaze 讓瞳孔看向某點，beam 從每隻眼拉出凝視線 */
  function eyes(cx, cy, o) {
    const n = o.n || 8, pts = [], a0 = o.a0 == null ? -2.7 : o.a0, a1 = o.a1 == null ? -.44 : o.a1, mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) { const a = n === 1 ? -Math.PI / 2 : a0 + (a1 - a0) * i / (n - 1), x = n === 1 ? cx : cx + Math.cos(a) * o.rx, y = n === 1 ? cy : cy + Math.sin(a) * o.ry;
      const s = o.size * (n === 1 ? 1 : .82 + .3 * (1 - Math.abs(i - mid) / (mid || 1))); let gx = 0, gy = 0; if (o.gaze) { const dx = o.gaze.x - x, dy = o.gaze.y - y, dd = Math.hypot(dx, dy) || 1; gx = dx / dd * s * .22; gy = dy / dd * s * .12; }
      pts.push({ x, y, s, d: (o.stag == null ? .06 : o.stag) * Math.abs(i - mid), tilt: n === 1 ? 0 : (a + Math.PI / 2) * .35, gx, gy }); }
    const life = o.life || 1.2, closeAt = o.closeAt || .8, op = (p, t, k) => ease(clamp((t - p.d) / .16, 0, 1)) * (k > closeAt ? clamp((1 - k) / (1 - closeAt), 0, 1) : 1);
    add({ add: true, life, draw(c, k, dt, t) { const glare = o.glareAt != null && t > o.glareAt ? Math.max(0, 1 - (t - o.glareAt) / .3) : 0;
      for (const p of pts) { const e = op(p, t, k); if (e < .02) continue; c.globalAlpha = e * (.55 + glare * .45); spr(c, glowS(o.col || C.crim), p.x, p.y, p.s * (2 + glare * 1.6));
        if (o.beam && t > o.beam.at && t < o.beam.at + .45) { const q = (t - o.beam.at) / .45; c.globalAlpha = e * (1 - q) * .9; c.strokeStyle = o.col || C.crim; c.lineWidth = 2.2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + (o.beam.x - p.x) * Math.min(1, q * 3), p.y + (o.beam.y - p.y) * Math.min(1, q * 3)); c.stroke(); } } } });
    return add({ life, draw(c, k, dt, t) { for (const p of pts) { const e = op(p, t, k); if (e < .02) continue; const w = p.s, h = w * .46 * e;
      c.save(); c.translate(p.x, p.y); c.rotate(p.tilt); c.globalAlpha = Math.min(1, e * 1.3);
      c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(0, -h * 2, w, 0); c.quadraticCurveTo(0, h * 2, -w, 0); c.closePath();
      const g = c.createRadialGradient(0, 0, 0, 0, 0, w); g.addColorStop(0, '#ff7a8a'); g.addColorStop(.5, '#b8002a'); g.addColorStop(1, '#2a0008'); c.fillStyle = g; c.fill();
      c.save(); c.clip(); c.fillStyle = '#ffc0ca'; c.beginPath(); c.arc(p.gx, p.gy, w * .42, 0, TAU); c.fill(); c.fillStyle = '#ff1438'; c.beginPath(); c.arc(p.gx, p.gy, w * .34, 0, TAU); c.fill();
      c.fillStyle = '#0a0004'; c.beginPath(); c.ellipse(p.gx, p.gy, w * .065, w * .3, 0, 0, TAU); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(p.gx - w * .13, p.gy - w * .1, w * .06, 0, TAU); c.fill(); c.restore();
      c.strokeStyle = '#12000a'; c.lineWidth = Math.max(1.5, w * .09); c.beginPath(); c.moveTo(-w * 1.1, 0); c.quadraticCurveTo(0, -h * 2.15, w * 1.1, 0); c.stroke(); c.restore(); } } });
  }
  /* 空間裂縫：直立的杏仁形裂口，裡面是深淵與星點，邊緣粉紫發光 */
  function rift(x, y, o) { const st = []; for (let i = 0; i < 14; i++) st.push([R(-.35, .35), R(-.42, .42), R(.6, 1.6), R(0, TAU)]);
    add({ life: o.life || 1.2, draw(c, k) { const e = ease(clamp(k / .25, 0, 1)) * (k > .8 ? (1 - k) / .2 : 1), ww = o.w * e, h = o.h * (.6 + .4 * e); if (ww < 1) return;
      c.beginPath(); c.moveTo(x, y - h / 2); c.quadraticCurveTo(x + ww, y, x, y + h / 2); c.quadraticCurveTo(x - ww, y, x, y - h / 2); const g = c.createRadialGradient(x, y, 0, x, y, h * .5); g.addColorStop(0, '#000000'); g.addColorStop(.7, '#12001e'); g.addColorStop(1, '#3a0640'); c.fillStyle = g; c.globalAlpha = .95; c.fill(); } });
    return add({ add: true, life: o.life || 1.2, draw(c, k, dt, t) { const e = ease(clamp(k / .25, 0, 1)) * (k > .8 ? (1 - k) / .2 : 1), ww = o.w * e, h = o.h * (.6 + .4 * e); if (ww < 1) return;
      c.globalAlpha = e; c.lineWidth = 4; c.strokeStyle = o.col || C.pink; c.beginPath(); c.moveTo(x, y - h / 2); c.quadraticCurveTo(x + ww, y, x, y + h / 2); c.quadraticCurveTo(x - ww, y, x, y - h / 2); c.stroke(); c.lineWidth = 1.4; c.strokeStyle = '#ffffff'; c.stroke();
      st.forEach(s => { c.globalAlpha = e * (.5 + .5 * Math.sin(t * 6 + s[3])); spr(c, glowS(C.lav), x + s[0] * ww, y + s[1] * h, s[2] * 3); });
      c.globalAlpha = e * .8; spr(c, glowS(o.col || C.pink), x, y - h / 2, 26); spr(c, glowS(o.col || C.pink), x, y + h / 2, 26); } }); }
  /* 羽刃橫掃：沿著圓弧一片片長出黑羽，前端粉白發光，尾巴追上前端後消失 */
  function sweep(cx, cy, o) { const M = T >= 3 ? 20 : 13, col = o.col || C.pink;
    return add({ life: o.life || .6, draw(c, k) { const head = ease(clamp(k / .55, 0, 1)), tail = ease(clamp((k - .22) / .7, 0, 1)); if (head <= tail) return;
      for (let j = 0; j <= M; j++) { const q = tail + (head - tail) * j / M, a = o.a0 + (o.a1 - o.a0) * q, px = cx + Math.cos(a) * o.r, py = cy + Math.sin(a) * o.r * (o.flat || 1), fq = j / M, L = o.w * (.55 + .45 * fq);
        c.save(); c.translate(px, py); c.rotate(a + (o.a1 > o.a0 ? Math.PI / 2 : -Math.PI / 2) + .5); c.globalCompositeOperation = 'source-over'; c.globalAlpha = .35 + .6 * fq;
        c.beginPath(); c.moveTo(0, -L); c.quadraticCurveTo(L * .22, 0, 0, L * .35); c.quadraticCurveTo(-L * .22, 0, 0, -L); c.fillStyle = C.deep; c.fill();
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = fq > .85 ? '#ffffff' : col; c.lineWidth = 1.6 + fq * 1.6; c.stroke(); c.restore(); }
      const a = o.a0 + (o.a1 - o.a0) * head; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k * .5; spr(c, glowS(col), cx + Math.cos(a) * o.r, cy + Math.sin(a) * o.r * (o.flat || 1), o.w * 1.1); } }); }
  /* 深紅日冕（永劫不滅）：旋轉的光環與放射細刺 */
  function corona(x, y, o) { const sp = []; for (let i = 0; i < 30; i++) sp.push([i / 30 * TAU, R(1.12, 1.45)]);
    return add({ add: true, life: o.life || 1.2, draw(c, k, dt, t) { const a = fade(k, .15, .7), r = o.r * (.8 + .2 * ease(Math.min(1, k * 2))); c.translate(x, y); c.rotate(t * .5); c.globalAlpha = a; c.strokeStyle = o.col || C.crim; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.lineWidth = 1.6; c.beginPath(); sp.forEach(s => { c.moveTo(Math.cos(s[0]) * r * 1.04, Math.sin(s[0]) * r * 1.04); c.lineTo(Math.cos(s[0]) * r * s[1], Math.sin(s[0]) * r * s[1]); }); c.stroke();
      c.globalAlpha = a * .6; spr(c, glowS(o.col || C.crim), 0, 0, r * 1.3); } }); }
  /* 黑焰巨刃（毀滅之力）：在目標上方成形，從後上方劈到前下方 */
  function blade(px, py, L, d, o) { const th0 = Math.PI - .6 * d, th1 = Math.PI + d * (Math.PI - .3), wb = L * .1;
    return add({ life: o.life || 1, draw(c, k, dt, t) { const form = ease(clamp(k / .42, 0, 1)), sw = easeIO(clamp((k - .42) / .14, 0, 1)), out = k > .7 ? (1 - k) / .3 : 1, th = th0 + (th1 - th0) * sw, len = L * (.3 + .7 * form);
      c.translate(px, py); c.rotate(th); c.globalAlpha = out;
      c.beginPath(); c.moveTo(-wb * .5, 0); c.lineTo(wb * .5, 0); c.lineTo(wb * .35, len * .85); c.lineTo(0, len); c.lineTo(-wb * .35, len * .85); c.closePath();
      const g = c.createLinearGradient(0, 0, 0, len); g.addColorStop(0, '#1a0010'); g.addColorStop(.6, '#07000a'); g.addColorStop(1, '#3a0018'); c.fillStyle = g; c.fill();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = o.col || C.crim; c.lineWidth = 3; c.stroke(); c.strokeStyle = '#ffe0e8'; c.lineWidth = 1; c.stroke();
      for (let i = 0; i < 7; i++) { const yy = R(.05, .9) * len, xx = (Math.random() < .5 ? -1 : 1) * wb * .45; c.globalAlpha = out * .7; spr(c, glowS(o.col || C.crim), xx, yy, R(6, 14)); }
      if (sw > 0 && sw < 1) { c.globalAlpha = .5 * out; c.rotate(-(th1 - th0) * .08 * Math.sign(th1 - th0)); c.strokeStyle = o.col || C.crim; c.lineWidth = wb * .8; c.beginPath(); c.moveTo(0, len * .3); c.lineTo(0, len); c.stroke(); } } }); }
  /* 黑焰彈：從施放者飛向目標，拖著黑焰 */
  function orb(x1, y1, x2, y2, o) { return add({ life: o.life || .3, draw(c, k) { const e = easeIO(k), x = x1 + (x2 - x1) * e, y = y1 + (y2 - y1) * e - Math.sin(k * Math.PI) * (o.arc || 60), r = o.r || 26;
    c.globalAlpha = 1; spr(c, smokeS('#12000c'), x, y, r * 1.6); c.globalCompositeOperation = 'lighter'; spr(c, glowS(o.col || C.mag), x, y, r * 1.3); c.globalCompositeOperation = 'source-over'; c.fillStyle = C.ink; c.beginPath(); c.arc(x, y, r * .5, 0, TAU); c.fill(); } }); }
  /* 全畫面：四周壓暗（戰場畫布會跟著鏡頭換算，所以畫一個大方塊蓋住） */
  function vigS(hex) { const k = 'v' + hex; if (!SPR[k]) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 35, 9, 32, 35, 46); r.addColorStop(0, rgba(hex, 0)); r.addColorStop(1, rgba(hex, 1)); g.fillStyle = r; g.fillRect(0, 0, 64, 64); SPR[k] = c; } return SPR[k]; }
  /* 四周壓暗：預先畫好的小張漸層放大貼上（每幀不重建漸層，低階手機也省）；技能特效低／省電時不畫（背景暗幕已經夠） */
  function vig(hex, a, life) { if (T < 2) return; const img = vigS(hex); return add({ life, draw(c, k) { const W = FXE.W || 400, H = FXE.H || 400; c.globalAlpha = fade(k, .15, .72) * a; c.drawImage(img, -W * .3, -H * .7, W * 1.6, H * 2.4); } }); }
  const flash = (col, a, life) => { if (T >= 1) X.flash(col, life || .3, Math.min(.35, a) * (T === 1 ? .7 : 1)); };
  const quake = () => { if (T >= 1 && typeof shake === 'function') shake(); };
  const stop = ms => { if (T >= 2 && window.FXPRO && FXPRO.hitStop) try { FXPRO.hitStop(ms); } catch (e) { } };
  const sfx = n => { try { SFX.play(n); } catch (e) { } };
  const say = (x, y, s, o) => X.text(x, y, s, Object.assign({ size: 52, color: '#ffd0dc', color2: '#a0002a', stroke: '#14000a' }, o || {}));
  /* 背景暗幕：只壓暗背景（.kd-dim 在背景與戰場之間），角色維持明亮 */
  function dim(ms) { const scr = $('battleScreen'); if (!scr) return; let d = scr.querySelector('.kd-dim'); if (!d) { d = document.createElement('div'); d.className = 'kd-dim'; d.setAttribute('aria-hidden', 'true'); scr.appendChild(d); }
    d.classList.add('on', 'imu-dim'); clearTimeout(d.__imuT); d.__imuT = setTimeout(() => d.classList.remove('on', 'imu-dim'), ms / spd()); }
  /* 00GameDevs 3D 素材（只在高特效時） */
  const vfx = (id, opt, mode, S, life, ox, oy) => { if (T < 2 || !window.VFX00 || !VFX00.fx) return false; try { return VFX00.fx(id, opt, mode, S, life, ox, oy); } catch (e) { return false; } };

  /* ---------- 位置 ---------- */
  function geo(S) { const p = fighterPoint(S), img = $('bImg' + S), f = $('bF' + S); const sc = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1;
    const h = clamp((img.offsetHeight || 220) * sc, 120, (p.h || 500) * .92), k = clamp(h / 320, .6, 1.6); return { x: p.x, y: p.y, h, k, head: p.y - h * .28, feet: p.y + h * .46, W: p.w, H: p.h }; }
  function iconPt(i) { const b = document.querySelector(`#bTeam .tm[data-i="${i}"]`), A = $('bArena'); if (!b || !A || !b.offsetWidth) return null; const r = b.getBoundingClientRect(), aR = A.getBoundingClientRect(), s = aR.width / (A.offsetWidth || 1) || 1;
    return { x: (r.left + r.width / 2 - aR.left) / s, y: (r.top + r.height / 2 - aR.top) / s, i }; }
  function benchOf(t) { const b = typeof battle !== 'undefined' && battle; if (!b || !t || !Array.isArray(b.team)) return []; if (!(t === b.player || b.team.includes(t))) return [];
    return b.team.map((x, i) => ({ x, i })).filter(o => o.x && o.x !== b.player && o.x !== t && o.x.hp > 0 && !o.x.voidImmune); }
  function pulseIcon(i, kind) { const b = document.querySelector(`#bTeam .tm[data-i="${i}"]`); if (!b) return; b.classList.remove('imu-bh', 'imu-bh-c', 'imu-bh-w'); void b.offsetWidth; b.classList.add('imu-bh', kind === 'chain' ? 'imu-bh-c' : 'imu-bh-w'); setTimeout(() => b.classList.remove('imu-bh', 'imu-bh-c', 'imu-bh-w'), 1000); }
  const onBattle = () => { const s = $('battleScreen'); return !!(s && !s.classList.contains('hidden') && typeof battle !== 'undefined' && battle); };

  /* ---------- DOM 背景：王座、雙翼（在立繪後方，演完移除） ---------- */
  const f1 = v => v.toFixed(1);
  let WING = {};
  /* 翅膀：前緣的「骨」從肩膀往上往外彎，飛羽從骨上往外下方垂（越外側越長），三層羽毛 */
  function wingSVG(tip, mirror) { const key = tip + mirror; if (WING[key]) return WING[key]; let s = ''; const id = tip.slice(1);
    const P = u => { const v = 1 - u; return [v * v * 10 + 2 * v * u * 70 + u * u * 220, v * v * 250 + 2 * v * u * 30 + u * u * 30]; };
    const layer = (n, a0, a1, L0, L1, wf, fill, stroke, op, u0) => { for (let i = 0; i < n; i++) { const u = (u0 || 0) + (1 - (u0 || 0)) * i / (n - 1), a = a0 + (a1 - a0) * u, L = L0 + (L1 - L0) * u, [bx, by] = P(u), dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, tx = bx + dx * L, ty = by + dy * L, mx = bx + dx * L * .55, my = by + dy * L * .55;
      s += `<path d="M${f1(bx)} ${f1(by)}Q${f1(mx + nx * wf)} ${f1(my + ny * wf)} ${f1(tx)} ${f1(ty)}Q${f1(mx - nx * wf * .5)} ${f1(my - ny * wf * .5)} ${f1(bx)} ${f1(by)}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6" opacity="${op}"/>`; } };
    layer(13, 1.62, .32, 110, 330, 22, `url(#iwA${id})`, tip, .97); layer(11, 1.5, .5, 70, 190, 18, `url(#iwB${id})`, '#c070ff', .97, .05); layer(9, 1.4, .7, 34, 90, 13, '#1c0414', C.crim, .97, .1);
    s += `<path d="M10 250Q70 30 220 30" fill="none" stroke="#12000a" stroke-width="9" stroke-linecap="round"/><path d="M10 250Q70 30 220 30" fill="none" stroke="${tip}" stroke-width="2.6" stroke-linecap="round"/>`;
    const g = `<defs><linearGradient id="iwA${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#07000a"/><stop offset=".6" stop-color="#2e0420"/><stop offset="1" stop-color="${tip}"/></linearGradient><linearGradient id="iwB${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a0008"/><stop offset="1" stop-color="#4a0a3a"/></linearGradient></defs>`;
    return (WING[key] = `<svg viewBox="-10 0 560 370" preserveAspectRatio="none">${g}<g${mirror ? ' transform="translate(540 0) scale(-1 1)"' : ''}>${s}</g></svg>`); }
  const THRONE = `<svg viewBox="0 0 200 260" preserveAspectRatio="none"><defs><linearGradient id="itG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0418"/><stop offset=".6" stop-color="#0a0008"/><stop offset="1" stop-color="#000"/></linearGradient></defs>
    <path d="M100 4L112 42L127 20L133 64L151 38L152 122L162 132L162 198L176 200L180 256L20 256L24 200L38 198L38 132L48 122L49 38L67 64L73 20L88 42Z" fill="url(#itG)" stroke="#ff2a5a" stroke-width="2.4" opacity=".92"/>
    <path d="M100 30L108 60L100 92L92 60Z M62 96L138 96 M56 150L144 150" fill="none" stroke="#ff5ab4" stroke-width="1.6" opacity=".8"/><rect x="40" y="170" width="120" height="22" rx="4" fill="#120008" stroke="#ff2a5a" stroke-width="1.6"/></svg>`;
  /* v174：背景元素（王座、雙翼）照立繪高度放大，伊姆第三型態 5.5 倍時會變成好幾千像素的圖層，iPhone 記憶體不足閃退；
     限制在畫面看得到的大小約 1.5 倍以內（換回戰場座標：÷ 鏡頭倍率），保持底部置中。 */
  function capBox(A, o) { const cam = parseFloat(A.style.getPropertyValue('--cam')) || 1, mw = innerWidth * 1.5 / cam, mh = innerHeight * 1.3 / cam, k = Math.min(1, mw / Math.max(1, o.w), mh / Math.max(1, o.h));
    if (k < 1) { const w = o.w * k, h = o.h * k; o = Object.assign({}, o, { x: o.x + (o.w - w) / 2, y: o.y + (o.h - h), w, h }); } return o; }
  function back(S, html, o) { const A = $('bArena'); if (!A || T === 0) return null; o = capBox(A, o); const d = document.createElement('div'); d.className = 'imu-bk ' + (o.cls || ''); d.setAttribute('aria-hidden', 'true'); d.innerHTML = html;
    d.style.cssText = `left:${f1(o.x)}px;top:${f1(o.y)}px;width:${f1(o.w)}px;height:${f1(o.h)}px;transform-origin:${o.origin || '50% 100%'}`;
    let wr = A.querySelector(':scope > .imu-bkwrap'); if (!wr) { wr = document.createElement('div'); wr.className = 'imu-bkwrap'; wr.setAttribute('aria-hidden', 'true'); A.insertBefore(wr, A.querySelector('.fighter') || A.firstChild); } wr.appendChild(d); const ms = o.ms / spd(); let an = null;
    try { an = d.animate(o.kf, { duration: ms, easing: o.ease || 'ease-out', fill: 'forwards' }); an.onfinish = () => d.remove(); } catch (e) { }
    setTimeout(() => d.remove(), ms + 300); return d; }
  function throneBack(S, g, ms, sc) { const h = g.h * (sc || 1.3), w = h * .74; return back(S, THRONE, { x: g.x - w / 2, y: g.feet - h + g.h * .04, w, h, ms, cls: 'imu-throne',
    kf: [{ opacity: 0, transform: 'translateY(14%) scale(.92)' }, { opacity: 1, transform: 'translateY(0) scale(1)', offset: .3 }, { opacity: .9, transform: 'translateY(0) scale(1.03)', offset: .8 }, { opacity: 0, transform: 'translateY(-2%) scale(1.05)' }] }); }
  function wingsBack(S, g, ms, sc, tip, hold) { const w = clamp(g.h * (sc || 1.2) * .62, 110, (FXE.W || 400) * .62), h = w * 370 / 560, sy = g.y - g.h * .16, gap = g.h * .05, tp = tip || C.pink, op = hold || 1;
    const kf = s => [{ opacity: 0, transform: `rotate(${s * 55}deg) scale(.35)` }, { opacity: op, transform: `rotate(${s * -5}deg) scale(1.03)`, offset: .3 }, { opacity: op * .92, transform: 'rotate(0deg) scale(1)', offset: .78 }, { opacity: 0, transform: `rotate(${s * 10}deg) scale(1.05)` }];
    back(S, wingSVG(tp, false), { x: g.x + gap - .036 * w, y: sy - .676 * h, w, h, ms, kf: kf(1), origin: '3.6% 67.6%', cls: 'imu-wing', ease: 'cubic-bezier(.2,.8,.2,1)' });
    back(S, wingSVG(tp, true), { x: g.x - gap - .964 * w, y: sy - .676 * h, w, h, ms, kf: kf(-1), origin: '96.4% 67.6%', cls: 'imu-wing', ease: 'cubic-bezier(.2,.8,.2,1)' }); }

  /* ---------- 各招編排（回傳＝命中瞬間；之後的餘韻用 later） ---------- */
  const CH = {};
  /* 初始型態 不死之身：深紅黑繭包住伊姆，破繭後血色光點上升 */
  CH.und0 = async A => { const f = A.f; sfx('dark'); dim(1300); vig(C.blood, .45, 1.3);
    sigil(f.x, f.feet, { r: f.h * .5, flat: .3, col: C.crim, n: 5, life: 1.3, spin: .5 });
    parts({ x: f.x, y: f.y, n: 34, spd: [10, 40], life: [.5, .8], size: [14, 28], colors: ['#1a0010', '#2a0018'], shape: 'smoke', jx: f.h * .55, jy: f.h * .5, to: { x: f.x, y: f.y }, pull: 5 });
    parts({ x: f.x, y: f.y, n: 24, spd: [20, 60], life: [.5, .8], size: [5, 10], colors: ['#2a0010', '#3a0018'], shape: 'shard', jx: f.h * .45, jy: f.h * .45, to: { x: f.x, y: f.y }, pull: 6, delay: .15 });
    await nap(520); sfx('heal'); X.glow(f.x, f.y, { color: C.crim, r: f.h * .7, life: .6 }); ring(f.x, f.y, { r1: f.h * .75, color: C.crim, w: 8, life: .55 });
    parts({ x: f.x, y: f.y, n: 30, spd: [180, 420], life: [.3, .6], size: [4, 8], colors: ['#3a0018', '#1a0010'], shape: 'shard', g: 300 });
    vfx('healing-field', { color: C.crim, size: .9 }, 'c', A.S, 1.2, 0, .9);
    later(80, () => parts({ x: f.x, y: f.feet - 20, n: 34, spd: [40, 110], ang: [-2.2, -.9], life: [.8, 1.3], size: [6, 12], colors: [C.crim, C.pink, '#ffd0dc'], shape: 'mote', add: true, jx: f.h * .3, g: -40 }));
    say(f.x, f.head - f.h * .2, '不死', { size: 50 }); await nap(180); };
  /* 第一型態 不死之身：加上黑轉之環與向上的深紅雷 */
  CH.und1 = async A => { const f = A.f; sfx('dark'); dim(1400); vig(C.blood, .5, 1.4);
    sigil(f.x, f.feet, { r: f.h * .58, flat: .3, col: C.crim, n: 6, life: 1.4, spin: .6 }); sigil(f.x, f.feet, { r: f.h * .4, flat: .3, col: C.mag, n: 5, life: 1.3, spin: -.9 });
    parts({ x: f.x, y: f.y, n: 40, spd: [10, 40], life: [.5, .8], size: [14, 28], colors: ['#1a0010', '#22001a'], shape: 'smoke', jx: f.h * .6, jy: f.h * .55, to: { x: f.x, y: f.y }, pull: 6 });
    for (let i = 0; i < 3; i++) later(120 + i * 110, () => hbolt(f.x + R(-.25, .25) * f.h, f.feet, f.x + R(-.1, .1) * f.h, f.head - f.h * .3, { color: C.crim, w: 5 * f.k, life: .25 }));
    await nap(560); sfx('heal'); dring(f.x, f.y, { r1: f.h * .85, w: 20, life: .55 }); X.glow(f.x, f.y, { color: C.crim, r: f.h * .75, life: .6 });
    vfx('healing-field', { color: C.crim, size: 1 }, 'c', A.S, 1.3, 0, .9);
    later(60, () => parts({ x: f.x, y: f.feet - 20, n: 40, spd: [50, 130], ang: [-2.2, -.9], life: [.8, 1.3], size: [6, 12], colors: [C.crim, C.pink, '#ffd0dc'], shape: 'mote', add: true, jx: f.h * .32, g: -40 }));
    say(f.x, f.head - f.h * .2, '不死之身', { size: 48 }); await nap(180); };
  /* 黑轉支配：黑粉霧旋繞，三條鎖鏈纏上對手，契約紋烙在對手身上 */
  CH.pact1 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1400);
    parts({ x: f.x, y: f.y, n: 30, spd: [60, 160], life: [.6, 1], size: [16, 26], colors: ['#2a0420', '#3a0a3a'], shape: 'smoke', jx: f.h * .3, jy: f.h * .3, drag: 2 });
    sigil(f.x + A.d * f.h * .2, f.head, { r: f.h * .16, col: C.mag, n: 5, life: 1, spin: 2 });
    await nap(220); sfx('crank');
    for (let i = 0; i < 3; i++) chain(f.x + A.d * f.h * .2, f.head + i * 14, t.x + R(-.1, .1) * t.h, t.y + (i - 1) * t.h * .18, { sag: (i - 1) * 70 + 30, k: f.k * .85, rim: i === 1 ? C.mag : C.pink, life: 1.15, grow: .32 });
    await nap(420); sfx('buff'); sigil(t.x, t.y, { r: t.h * .32, col: C.pink, n: 5, life: 1, spin: -1.2, eye: true }); flash('#3a0030', .22, .3);
    try { impactFrame(A.T); } catch (e) { } say(t.x, t.head - t.h * .18, '惡魔契約', { size: 44, color: '#ffc0e8', color2: '#7a0a5a' });
    later(120, () => parts({ x: t.x, y: t.y, n: 26, spd: [40, 140], life: [.5, .9], size: [4, 8], colors: [C.pink, C.mag, '#ffffff'], shape: 'mote', add: true, jx: t.h * .2, jy: t.h * .3 })); await nap(120); };
  /* 虛空威壓：伊姆化成影子，壓迫波一圈圈擴散，對手腳下裂開深淵 */
  CH.void1 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1300); vig(C.ink, .55, 1.3);
    const img = $('bImg' + A.S); try { img.animate([{ opacity: 1 }, { opacity: .25, offset: .35 }, { opacity: .25, offset: .7 }, { opacity: 1 }], { duration: 1200 / spd() }); } catch (e) { }
    parts({ x: f.x, y: f.y, n: 30, spd: [80, 200], life: [.5, .9], size: [14, 26], colors: ['#07000a', '#14001a'], shape: 'smoke', jx: f.h * .25, jy: f.h * .35, drag: 1.5 });
    for (let i = 0; i < 3; i++) later(i * 150, () => dring(f.x, f.y, { r1: f.h * (1 + i * .3), w: 24, life: .6, color: C.mag }));
    await nap(450); sfx('heavy'); rift(t.x, t.feet - t.h * .05, { w: t.h * .18, h: t.h * .5, life: .9, col: C.mag }); cracks(t.x, t.feet, { n: 9, len: t.h * .6, color: C.pink });
    for (let i = 0; i < 3; i++) later(60 + i * 60, () => hbolt(t.x + R(-.08, .08) * t.h, t.feet, t.x + R(-.15, .15) * t.h, t.y - t.h * .2, { color: C.mag, w: 5 * t.k, life: .22 }));
    await nap(200); quake(); say(t.x, t.head - t.h * .2, '深淵', { size: 46, color: '#e8c8ff', color2: '#5a0a7a' }); };
  /* 黑焰・凶兆：黑焰聚成火球擲出，炸開黑色火舌，凶兆之眼在對手頭上睜開 */
  CH.flame1 = async A => { const f = A.f, t = A.t, hx = f.x + A.d * f.h * .28, hy = f.y - f.h * .1; sfx('dark');
    parts({ x: hx, y: hy, n: 30, spd: [20, 60], life: [.35, .6], size: [8, 14], colors: ['#0a0006', '#1a0010'], shape: 'tongue', rim: C.mag, jx: f.h * .35, jy: f.h * .35, to: { x: hx, y: hy }, pull: 8 });
    X.glow(hx, hy, { color: C.mag, r: f.h * .3, life: .5, hold: true });
    await nap(420); sfx('whoosh'); orb(hx, hy, t.x, t.y, { r: 24 * f.k, life: .28, col: C.mag });
    await nap(270); sfx('explode'); quake(); stop(70); flash('#2a0030', .25, .3);
    parts({ x: t.x, y: t.y + t.h * .1, n: 46, spd: [100, 300], ang: [-2.6, -.5], life: [.5, .9], size: [10, 18], colors: ['#07000a', '#14000e'], shape: 'tongue', rim: C.pink, jx: t.h * .2, g: -160 });
    parts({ x: t.x, y: t.y, n: 26, spd: [220, 520], life: [.25, .5], size: [1.5, 3], colors: [C.mag, C.pink, '#ffffff'], shape: 'streak', add: true, drag: 3 });
    dring(t.x, t.y, { r1: t.h * .7, w: 22, life: .5, color: C.mag }); X.glow(t.x, t.y, { color: C.pur, r: t.h * .6, life: .5 });
    vfx('flame-surge', { color: C.pur, size: 1.1 }, 'g', A.T, 1.1);
    eyes(t.x, t.head - t.h * .22, { n: 1, size: t.h * .09, life: 1.1, closeAt: .75 }); say(t.x, t.head - t.h * .42, '凶兆', { size: 44, color: '#e8c8ff', color2: '#6a0a8a' }); };
  /* 最初20人（晉升前的蓄力）：二十道紅光繞著伊姆收攏 */
  CH.asc = async A => { const f = A.f; sfx('dark'); dim(1600); vig(C.blood, .5, 1);
    const pts = []; for (let i = 0; i < 20; i++) pts.push(i / 20 * TAU);
    add({ add: true, life: .7, draw(c, k, dt, t) { const r = f.h * (.85 - .7 * ease(k)); c.globalAlpha = fade(k, .15, .85); pts.forEach(a => { const aa = a + t * 3; spr(c, glowS(C.crim), f.x + Math.cos(aa) * r, f.y + Math.sin(aa) * r * .55, 12 * f.k); }); } });
    sigil(f.x, f.feet, { r: f.h * .6, flat: .3, col: C.crim, n: 5, runes: 20, life: 1.6, spin: 1.4 }); await nap(420); X.glow(f.x, f.y, { color: C.crim, r: f.h * .5, life: .4 });
    /* 結算與晉升之間（約 0.6 秒）：二十道紅光化成血色光柱維持住，不出現空檔 */
    X.glow(f.x, f.y, { color: C.blood, r: f.h * .8, life: 1.1, hold: true }); parts({ x: f.x, y: f.feet, n: 26, spd: [80, 200], ang: [-1.8, -1.35], life: [.6, 1], size: [5, 10], colors: [C.crim, '#ffd0dc'], shape: 'mote', add: true, jx: f.h * .25, delay: .5 }); };
  /* 最初20人（已是最終型態，例如勇者之塔第 200 層停在第二型態）：力量再次湧現 */
  CH.resurge = async A => { const f = A.f; await CH.asc(A); sfx('thunder'); quake(); X.rays(f.x, f.head, { r: f.h * 1.1, n: 20, c1: 'rgba(255,60,100,.85)', life: .9 }); dring(f.x, f.y, { r1: f.h, w: 24, life: .6 });
    for (let i = 0; i < 4; i++) later(i * 70, () => hbolt(f.x, f.y, f.x + R(-1, 1) * f.h, f.y + R(-.8, .4) * f.h, { w: 5 * f.k, life: .22 })); say(f.x, f.head - f.h * .25, '最初20人', { size: 48 }); await nap(200); };
  /* 第二型態 永劫不滅：深紅日冕在頭後展開，血光柱與上升光點 */
  CH.eternal2 = async A => { const f = A.f; sfx('buff'); dim(1500); vig(C.blood, .45, 1.4);
    corona(f.x, f.head, { r: f.h * .32, life: 1.4 }); sigil(f.x, f.feet, { r: f.h * .62, flat: .3, col: C.crim, n: 6, life: 1.4, spin: .4 });
    later(200, () => pillar(f.x, f.feet - 10, { w: f.h * .22, color: C.crim, life: .8 }));
    await nap(560); sfx('heal'); ring(f.x, f.y, { r1: f.h * .9, color: C.crim, w: 10, life: .6 }); X.glow(f.x, f.head, { color: '#ff7a9a', r: f.h * .5, life: .6 });
    vfx('healing-field', { color: C.crim, size: 1.2 }, 'c', A.S, 1.4, 0, .9);
    parts({ x: f.x, y: f.feet - 20, n: 44, spd: [60, 150], ang: [-2.1, -1], life: [.8, 1.4], size: [6, 13], colors: [C.crim, '#ffd0dc', C.gold], shape: 'mote', add: true, jx: f.h * .35, g: -50 });
    say(f.x, f.head - f.h * .3, '永劫不滅', { size: 50 }); await nap(220); };
  /* 第二型態 萬物逆轉：世界瞬間反轉，四面八方的鎖鏈纏住對手，對手的強化化作光流被吸走 */
  CH.pact2 = async A => { const f = A.f, t = A.t, ar = $('bArena'); sfx('dark'); dim(1600);
    if (T >= 2 && ar) try { ar.animate([{ filter: 'none' }, { filter: 'invert(1) hue-rotate(180deg)', offset: .2 }, { filter: 'invert(1) hue-rotate(180deg)', offset: .5 }, { filter: 'none' }], { duration: 260 / spd() }); } catch (e) { }
    sfx('crank'); const W = FXE.W, H = FXE.H, srcs = [[f.x + A.d * f.h * .2, f.head], [t.x - A.d * W * .25, -20], [t.x + A.d * W * .2, -20], [t.x + A.d * W * .4, t.y], [t.x - A.d * W * .3, H * .95]];
    srcs.slice(0, T >= 2 ? 5 : 3).forEach(([sx, sy], i) => later(i * 60, () => chain(sx, sy, t.x + R(-.08, .08) * t.h, t.y + R(-.2, .2) * t.h, { sag: R(-50, 50), k: f.k * .9, rim: i % 2 ? C.crim : C.pink, life: 1.2, grow: .3 })));
    await nap(480); sfx('buff'); sigil(t.x, t.y, { r: t.h * .4, col: C.crim, n: 6, life: 1.1, spin: -1.4, eye: true }); flash('#3a0018', .25, .3); try { impactFrame(A.T); } catch (e) { }
    parts({ x: t.x, y: t.y, n: 30, spd: [30, 80], life: [.7, 1], size: [6, 11], colors: [C.gold, '#8fd8ff', '#9dffb8'], shape: 'mote', add: true, jx: t.h * .2, jy: t.h * .3, to: { x: f.x, y: f.y }, pull: 9, delay: .2 });
    say(t.x, t.head - t.h * .2, '萬物逆轉', { size: 46, color: '#ffd0dc', color2: '#8a0a2a' }); await nap(300); };
  /* 第二型態 世界之王：空白王座在背後升起，深淵擴散到整個戰場，霸王色黑雷 */
  CH.domain2 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1800); vig(C.ink, .6, 1.6); throneBack(A.S, f, 1700, 1.7);
    sigil(f.x, f.feet, { r: Math.min(FXE.W * .5, f.h * 1.2), flat: .24, col: C.crim, n: 6, runes: 24, life: 1.6, spin: .3, lw: 3 });
    await nap(420); sfx('thunder'); quake();
    for (let i = 0; i < 5; i++) later(i * 70, () => hbolt(f.x, f.head, i < 2 ? t.x + R(-.1, .1) * t.h : f.x + R(-1.2, 1.2) * f.h, i < 2 ? t.y : f.y + R(-.9, .3) * f.h, { w: 6 * f.k, life: .26 }));
    dring(f.x, f.feet, { r1: FXE.W * .7, w: 30, flat: .35, life: .8 }); flash('#3a0010', .25, .3);
    await nap(380); say(f.x, f.head - f.h * .35, '世界之王', { size: 56 }); await nap(150); };
  /* 第二型態 毀滅之力：黑焰巨刃在對手上方成形、纏著黑雷，一刀劈下 */
  CH.ruin2 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1600); vig(C.ink, .5, 1.5);
    const L = t.h * 1.15, px = t.x - A.d * t.h * .35, py = t.y - t.h * .78; blade(px, py, L, A.d, { life: 1.3 });
    for (let i = 0; i < 4; i++) later(80 + i * 90, () => hbolt(px + R(-.3, .3) * L, py + R(-.5, .1) * L, px + R(-.3, .3) * L, py + R(-.6, 0) * L, { w: 4 * t.k, life: .2 }));
    parts({ x: f.x, y: f.y, n: 20, spd: [40, 120], ang: [-2.4, -.7], life: [.5, .8], size: [8, 14], colors: ['#07000a'], shape: 'tongue', rim: C.crim, jx: f.h * .3, g: -120 });
    await nap(560); sfx('slash'); await nap(170); sfx('explode'); quake(); stop(90); flash('#ffd0dc', .3, .25);
    slash(t.x, t.y, { a: A.d > 0 ? -2.2 : -.9, span: 1.6, r: t.h * .55, w: 30, color: C.crim, life: .35 });
    dring(t.x, t.y, { r1: t.h * .9, w: 26, life: .55 }); cracks(t.x, t.feet, { n: 12, len: t.h * .7, color: '#ff8aa0' });
    for (let i = 0; i < 3; i++) later(i * 60, () => hbolt(t.x, t.y, t.x + R(-1, 1) * t.h * .8, t.y + R(-.6, .5) * t.h, { w: 5 * t.k, life: .22 }));
    parts({ x: t.x, y: t.y + t.h * .1, n: 40, spd: [120, 320], ang: [-2.7, -.4], life: [.5, .9], size: [10, 18], colors: ['#07000a', '#14000e'], shape: 'tongue', rim: C.crim, jx: t.h * .25, g: -150 });
    vfx('energy-burst', { color: C.crim, size: 1.5 }, 'g', A.T, 1); vfx('thunder-strike', { color: C.crim, size: 1.3 }, 'g', A.T, 1);
    say(t.x, t.head - t.h * .55, '毀滅', { size: 60 }); };
  /* 第三型態 千眼天啟：八隻紅眼在伊姆周圍依序睜開，凝視線看穿對手 */
  CH.eyes3 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1700); vig('#12001e', .6, 1.6); wingsBack(A.S, f, 1600, 1.05, C.mag, .55);
    eyes(f.x, f.head + f.h * .05, { n: 8, rx: f.h * .62, ry: f.h * .5, size: f.h * .075, life: 1.6, stag: .07, gaze: { x: t.x, y: t.y }, beam: { x: t.x, y: t.y - t.h * .05, at: .62 }, glareAt: .6, closeAt: .82 });
    parts({ x: f.x, y: f.head - f.h * .4, n: 18, spd: [20, 60], ang: [.5, 2.6], life: [1, 1.5], size: [14, 22], colors: ['#14020e', '#1e0418'], shape: 'feather', rim: C.mag, jx: f.h * .6, g: 30 });
    await nap(620); sfx('zap'); flash('#3a0030', .2, .25); sigil(t.x, t.y, { r: t.h * .22, col: C.crim, n: 5, life: .8, spin: 2, eye: true });
    parts({ x: f.x, y: f.feet - 20, n: 34, spd: [60, 140], ang: [-2.1, -1], life: [.8, 1.3], size: [6, 12], colors: [C.crim, C.mag, '#ffd0dc'], shape: 'mote', add: true, jx: f.h * .35, g: -50 });
    vfx('healing-field', { color: C.mag, size: 1.1 }, 'c', A.S, 1.3, 0, .9);
    say(f.x, f.head - f.h * .42, '千眼天啟', { size: 52, color: '#ffd0e8', color2: '#8a0a5a' }); await nap(260); };
  /* 第三型態 終焉契約：對手腳下展開巨大契約陣，天上與陣緣射出鎖鏈，契約連鎖到後排 */
  CH.pact3 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1800); vig('#12001e', .55, 1.7);
    sigil(t.x, t.feet, { r: t.h * .75, flat: .3, col: C.pink, n: 6, runes: 24, life: 1.7, spin: .8, lw: 3 }); sigil(t.x, t.feet, { r: t.h * .5, flat: .3, col: C.crim, n: 5, life: 1.6, spin: -1.2 });
    parts({ x: t.x, y: -10, n: 16, spd: [20, 60], ang: [1.2, 1.9], life: [1.1, 1.6], size: [14, 22], colors: ['#14020e'], shape: 'feather', rim: C.mag, jx: t.h * .8, g: 40 });
    await nap(260); sfx('crank'); const n = T >= 2 ? 6 : 4;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, sx = i < 2 ? (i ? f.x + A.d * f.h * .2 : t.x + R(-.3, .3) * t.h) : t.x + Math.cos(a) * t.h * .75, sy = i < 2 ? (i ? f.head : -20) : t.feet + Math.sin(a) * t.h * .22;
      later(i * 55, () => chain(sx, sy, t.x + R(-.08, .08) * t.h, t.y + R(-.15, .2) * t.h, { sag: i < 2 ? 50 : R(-30, 30), k: f.k * .9, rim: i % 2 ? C.crim : C.pink, life: 1.25, grow: .3 })); }
    await nap(460); sfx('buff'); flash('#3a0030', .25, .3); try { impactFrame(A.T); } catch (e) { }
    sigil(t.x, t.y, { r: t.h * .36, col: C.pink, n: 6, life: 1, spin: -1.6, eye: true });
    parts({ x: t.x, y: t.y, n: 24, spd: [30, 80], life: [.7, 1], size: [6, 10], colors: [C.gold, '#8fd8ff'], shape: 'mote', add: true, jx: t.h * .2, jy: t.h * .3, to: { x: f.x, y: f.y }, pull: 9, delay: .15 });
    say(t.x, t.head - t.h * .25, '終焉契約', { size: 48, color: '#ffd0e8', color2: '#7a0a5a' }); await nap(200); };
  /* 第三型態 虛空王座・天翼：遮天雙翼完全展開、王座浮現、羽毛風暴橫掃戰場 */
  CH.domain3 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(2000); vig('#0e0018', .65, 1.9);
    throneBack(A.S, f, 1900, 1.6); wingsBack(A.S, f, 1900, 1.55, C.mag, 1);
    sigil(f.x, f.feet, { r: Math.min(FXE.W * .55, f.h * 1.3), flat: .22, col: C.mag, n: 6, runes: 28, life: 1.8, spin: .3, lw: 3 }); sigil(f.x, f.feet, { r: f.h * .7, flat: .22, col: C.crim, n: 5, life: 1.7, spin: -.6 });
    await nap(380); sfx('whoosh'); X.glow(f.x, f.head, { color: C.mag, r: f.h * .8, life: 1, hold: true });
    parts({ x: f.x, y: f.head, n: 70, spd: [220, 560], ang: [-Math.PI, 0], life: [.9, 1.5], size: [14, 26], colors: ['#14020e', '#1e0418', '#2a0624'], shape: 'feather', rim: C.mag, drag: 1.4, g: 90, jx: f.h * .35, jy: f.h * .2 });
    await nap(380); sfx('thunder'); quake(); flash('#2a0040', .25, .3); dring(f.x, f.feet, { r1: FXE.W * .75, w: 30, flat: .35, life: .8, color: C.mag });
    for (let i = 0; i < 3; i++) later(i * 80, () => hbolt(f.x, f.head, t.x + R(-.15, .15) * t.h, t.y + R(-.3, .2) * t.h, { w: 6 * f.k, color: C.mag, life: .25 }));
    say(f.x, f.head - f.h * .45, '虛空王座・天翼', { size: 50, color: '#f0d8ff', color2: '#6a0a8a' }); await nap(260); };
  /* 第三型態 終焉之翼：雙翼揚起、羽毛收攏，兩道黑焰羽刃交叉橫掃 */
  CH.wing3 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1800); vig('#0e0018', .55, 1.7); wingsBack(A.S, f, 1500, 1.4, C.pink, .9);
    parts({ x: f.x, y: f.y, n: 30, spd: [10, 40], life: [.4, .6], size: [12, 20], colors: ['#14020e', '#1e0418'], shape: 'feather', rim: C.pink, jx: f.h * .9, jy: f.h * .6, to: { x: f.x, y: f.head }, pull: 7 });
    X.glow(f.x, f.head, { color: C.mag, r: f.h * .45, life: .6, hold: true });
    await nap(430); sfx('slash'); const r = t.h * .72;
    sweep(t.x + A.d * r * .2, t.y - r * .1, { r, a0: A.d > 0 ? -2.6 : -.55, a1: A.d > 0 ? .5 : -3.65, w: t.h * .17, life: .55, col: C.pink });
    await nap(170); sfx('slash');
    sweep(t.x - A.d * r * .2, t.y + r * .05, { r: r * .9, a0: A.d > 0 ? 2.5 : .65, a1: A.d > 0 ? -.6 : 3.8, w: t.h * .15, life: .5, col: C.mag });
    await nap(150); sfx('explode'); quake(); stop(90); flash('#ffd0f0', .28, .25);
    dring(t.x, t.y, { r1: t.h * .95, w: 26, life: .55, color: C.pink }); X.glow(t.x, t.y, { color: C.mag, r: t.h * .7, life: .5 });
    parts({ x: t.x, y: t.y, n: 46, spd: [200, 520], life: [.5, .9], size: [12, 22], colors: ['#14020e', '#2a0624'], shape: 'feather', rim: C.pink, drag: 2, g: 80 });
    parts({ x: t.x, y: t.y, n: 26, spd: [260, 600], life: [.25, .5], size: [1.5, 3], colors: [C.pink, '#ffffff', C.mag], shape: 'streak', add: true, drag: 3 });
    say(t.x, t.head - t.h * .55, '終焉之翼', { size: 54, color: '#ffe0f4', color2: '#8a0a6a' }); };
  /* 第三型態 天罰：天空裂開、八眼環繞，對手的強化碎裂，審判雷柱直劈而下 */
  CH.judge = async A => { const f = A.f, t = A.t, ry = Math.max(40, t.head - t.h * .55); sfx('thunder'); dim(2000); vig(C.ink, .7, 1.9);
    rift(t.x, ry, { w: t.h * .16, h: t.h * .55, life: 1.6, col: C.pink });
    eyes(t.x, ry, { n: 8, rx: t.h * .55, ry: t.h * .28, a0: -Math.PI + .25, a1: -.25, size: t.h * .06, life: 1.5, stag: .05, gaze: { x: t.x, y: t.y }, glareAt: .75, closeAt: .85 });
    await nap(420); sfx('pop'); parts({ x: t.x, y: t.y, n: 34, spd: [160, 420], life: [.4, .8], size: [5, 10], colors: [C.gold, '#ffffff', '#8fd8ff'], shape: 'shard', g: 380 }); ring(t.x, t.y, { r1: t.h * .6, color: C.gold, w: 6, life: .4 });
    say(t.x + A.d * t.h * .35, t.y - t.h * .05, '強化粉碎', { size: 34, color: '#fff4c8', color2: '#a07a1a', life: .8 });
    await nap(380); sfx('explode'); quake(); later(160, quake); stop(110); flash('#ffe0ea', .35, .3);
    pillar(t.x, t.feet, { w: t.h * .26, color: C.crim, life: .8 }); hbolt(t.x, ry, t.x, t.feet, { w: 14 * t.k, color: '#ff6a8a', amp: 18, life: .4 });
    for (let i = 0; i < 4; i++) later(i * 50, () => hbolt(t.x + R(-.4, .4) * t.h, ry, t.x + R(-.15, .15) * t.h, t.y + R(-.2, .3) * t.h, { w: 6 * t.k, life: .25 }));
    dring(t.x, t.feet, { r1: t.h * 1.2, w: 30, flat: .35, life: .7 }); cracks(t.x, t.feet, { n: 14, len: t.h * .8, color: '#ffb0c0' });
    vfx('thunder-strike', { color: C.crim, size: 1.7 }, 'g', A.T, 1.1);
    say(t.x, t.head - t.h * .4, '天罰', { size: 76, color: '#ffe0ea', color2: '#b0002a' }); await nap(120); };

  /* 減少動態：只留光暈與文字 */
  const NAME = { und0: '不死', und1: '不死之身', pact1: '惡魔契約', void1: '深淵', flame1: '凶兆', asc: '', resurge: '最初20人', eternal2: '永劫不滅', pact2: '萬物逆轉', domain2: '世界之王', ruin2: '毀滅', eyes3: '千眼天啟', pact3: '終焉契約', domain3: '虛空王座・天翼', wing3: '終焉之翼', judge: '天罰' };
  const SELF = { und0: 1, und1: 1, asc: 1, resurge: 1, eternal2: 1, domain2: 1, eyes3: 1, domain3: 1 };
  async function calm(key, A) { const p = SELF[key] ? A.f : A.t; X.glow(p.x, p.y, { color: key.endsWith('3') || key === 'judge' ? C.mag : C.crim, r: p.h * .5, life: .6 }); if (NAME[key]) say(p.x, p.head - p.h * .2, NAME[key], { size: 44, life: .7 }); await nap(380); }

  /* ---------- 招式辨識 ---------- */
  const BYNAME = { '不死之身': 'und', '黑轉支配': 'pact1', '虛空威壓': 'void1', '黑焰・凶兆': 'flame1', '最初20人': 'asc', '永劫不滅': 'eternal2', '黑轉支配・萬物逆轉': 'pact2', '世界之王': 'domain2', '毀滅之力': 'ruin2',
    '千眼天啟': 'eyes3', '黑轉支配・終焉契約': 'pact3', '虛空王座・天翼': 'domain3', '終焉之翼': 'wing3' };
  function keyOf(actor, skill) {
    if (!actor || !skill || (typeof STRUGGLE !== 'undefined' && skill === STRUGGLE)) return null;
    const isImu = actor.id === 'imu' || !!actor.__imu || (skill.copiedFrom && skill.copiedFrom.id === 'imu'); if (!isImu) return null;
    let k = BYNAME[skill.name]; if (!k) return null; const I = actor.__imu;
    if (k === 'und') return I && I.form >= 1 ? 'und1' : 'und0';
    if (k === 'asc') { if (!I) return 'resurge'; const max = window.IMU165 && IMU165.maxFormOf ? IMU165.maxFormOf(actor) : 3; if (I.form < max) return 'asc'; return I.form >= 3 ? 'judge' : 'resurge'; }
    return k;
  }
  function mk(side) { const S = side === 'P' ? 'L' : 'R', Tt = S === 'L' ? 'R' : 'L'; return { S, T: Tt, f: geo(S), t: geo(Tt), d: S === 'L' ? 1 : -1 }; }
  /* 伊姆攻擊招的命中爆發已在編排裡畫好：結算後 battle.js 的 triggerImpact 只保留受擊動作與音效，不再疊一般角色的 hitFX（避免疊爆、低階手機掉幀） */
  let own = null; const ATK = { flame1: 1, ruin2: 1, wing3: 1 };
  if (typeof triggerImpact === 'function') { const _ti = triggerImpact; triggerImpact = function (side, theme, big) {
    if (own && own.side === side && performance.now() < own.until) { own = null; try { sfx(big ? 'heavy' : 'hit'); const w = $('bF' + side); w.classList.remove('hit'); void w.offsetWidth; w.classList.add('hit'); setTimeout(() => w.classList.remove('hit'), 520); } catch (e) { } return; }
    return _ti.apply(this, arguments); }; }
  async function run(key, side) { T = tierNow(); gen++; cancelOld(); FXE.ensure(); const A = mk(side); own = ATK[key] && T > 0 ? { side: A.T, until: performance.now() + 2500 / spd() } : null; if (T === 0) return calm(key, A); return CH[key](A); }

  /* ---------- 晉升演出（覆寫 fx_v165.js 的 imuFormFx；ext_v165 在「最初20人」結算後呼叫，swap() 換立繪） ---------- */
  const _oldFormFx = window.imuFormFx; /* window.__NO_FX170＝量測用：改回 v169 的演出 */
  window.imuFormFx = async function (S, actor, form, swap) {
    if (window.__NO_FX170 && _oldFormFx) return _oldFormFx.apply(this, arguments);
    const el = $('bF' + S), F = ((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[form] || {}; let done = false; const doSwap = () => { if (!done) { done = true; swap(); } };
    try {
      T = tierNow(); gen++; FXE.ensure(); const g = geo(S), d = S === 'L' ? 1 : -1, tg = geo(S === 'L' ? 'R' : 'L');
      const title = (g2) => { say(g2.x, g2.head - g2.h * .5, F.label || '型態', { size: 34, color: '#ffe0e8', color2: '#8a0a2a', life: 1.2 }); say(g2.x, g2.head - g2.h * .3, F.name || '', { size: form === 3 ? 58 : 52, color: '#ffffff', color2: form === 3 ? '#8a1aaa' : '#c8003a', life: 1.2 }); };
      if (T === 0) { doSwap(); const g2 = geo(S); X.glow(g2.x, g2.y, { color: form === 3 ? C.mag : C.crim, r: g2.h * .6, life: .7 }); title(g2); await nap(700); return; }
      if (el) el.classList.add('morph-out'); sfx('thunder');
      if (form === 1) { /* 第一型態：黑轉之繭收攏 → 破殼 → 紅眼 */
        dim(1600); vig(C.blood, .55, 1.5);
        parts({ x: g.x, y: g.y, n: 46, spd: [10, 40], life: [.6, .9], size: [16, 30], colors: ['#14000c', '#22001a'], shape: 'smoke', jx: g.h * .7, jy: g.h * .6, to: { x: g.x, y: g.y }, pull: 6 });
        for (let i = 0; i < 4; i++) later(i * 120, () => { hbolt(g.x + R(-.6, .6) * g.h, -20, g.x + R(-.1, .1) * g.h, g.head + R(0, .3) * g.h, { w: R(5, 8) * g.k, life: .26 }); if (i % 2 === 0) sfx('zap'); });
        await nap(560); sfx('explode'); flash('#ffe0e8', .32, .3); quake(); doSwap(); const g2 = geo(S);
        parts({ x: g2.x, y: g2.y, n: 40, spd: [220, 560], life: [.4, .8], size: [6, 12], colors: ['#2a0010', '#14000a', C.crim], shape: 'shard', g: 320 });
        ring(g2.x, g2.y, { r1: g2.h * .9, color: C.crim, w: 10, life: .6 }); dring(g2.x, g2.y, { r1: g2.h * 1.1, w: 26, life: .7 });
        eyes(g2.x, g2.head, { n: 2, rx: g2.h * .06, ry: 1, a0: -Math.PI, a1: 0, size: g2.h * .04, life: .9, stag: 0 }); title(g2); await nap(680);
      } else if (form === 2) { /* 第二型態：空白王座升起 → 霸王色雷暴 → 冠冕光芒 */
        dim(2000); vig(C.ink, .65, 1.9); throneBack(S, g, 2000, 1.75);
        sigil(g.x, g.feet, { r: g.h * .9, flat: .26, col: C.crim, n: 6, runes: 24, life: 1.8, spin: .5, lw: 3 });
        for (let i = 0; i < 6; i++) later(i * 100, () => { hbolt(g.x, g.y - g.h * .1, g.x + R(-1.4, 1.4) * g.h, g.y + R(-1, .4) * g.h, { w: R(5, 9) * g.k, life: .26 }); if (i % 2 === 0) { sfx('zap'); flash('#ffd0dc', .12, .14); } });
        await nap(660); sfx('thunder'); flash('#ffd0e0', .35, .32); quake(); stop(100); doSwap(); const g2 = geo(S);
        X.rays(g2.x, g2.head, { r: g2.h * 1.2, n: 22, c1: 'rgba(255,60,100,.9)', life: 1, spin: .6 }); dring(g2.x, g2.y, { r1: Math.max(g2.h * 1.3, FXE.W * .5), w: 32, life: .8 });
        ring(g2.x, g2.y, { r1: g2.h, color: C.crim, w: 12, life: .7 }); vfx('energy-burst', { color: C.crim, size: 1.6 }, 'g', S, 1);
        for (let i = 0; i < 3; i++) later(140 + i * 120, () => hbolt(g2.x, g2.y - g2.h * .2, tg.x + R(-.2, .2) * tg.h, tg.y + R(-.3, .3) * tg.h, { w: 5 * g2.k, life: .22 }));
        title(g2); await nap(780);
      } else { /* 第三型態：天空裂開 → 八眼睜開 → 雙翼展開、羽毛爆散 */
        dim(2600); vig('#0e0018', .7, 2.4); const ry = Math.max(40, g.head - g.h * .45);
        rift(g.x, ry, { w: g.h * .14, h: g.h * .6, life: 1.3, col: C.mag });
        eyes(g.x, ry + g.h * .1, { n: 8, rx: g.h * .7, ry: g.h * .34, a0: -Math.PI + .2, a1: -.2, size: g.h * .07, life: 1.3, stag: .06, gaze: { x: g.x, y: g.y }, beam: { x: g.x, y: g.y, at: .7 }, glareAt: .7, closeAt: .85 });
        sigil(g.x, g.feet, { r: g.h * 1, flat: .24, col: C.mag, n: 6, runes: 28, life: 2.2, spin: .4, lw: 3 });
        for (let i = 0; i < 4; i++) later(200 + i * 120, () => hbolt(g.x + R(-.5, .5) * g.h, ry, g.x + R(-.1, .1) * g.h, g.y - g.h * .1, { w: R(5, 8) * g.k, color: i % 2 ? C.mag : C.crim, life: .24 }));
        await nap(900); sfx('thunder'); flash('#f0d8ff', .35, .34); quake(); later(200, quake); stop(110); doSwap(); const g2 = geo(S);
        wingsBack(S, g2, 1500, 1.7, C.mag, 1);
        ring(g2.x, g2.y, { r1: Math.max(g2.h * 1.2, FXE.W * .55), color: C.mag, w: 14, life: .9 }); ring(g2.x, g2.y, { r1: g2.h * .9, color: C.pink, w: 8, life: .7 });
        X.glow(g2.x, g2.head, { color: C.crim, r: g2.h * .7, life: 1 });
        parts({ x: g2.x, y: g2.head, n: 80, spd: [220, 600], life: [1, 1.6], size: [14, 26], colors: ['#14020e', '#1e0418', '#2a0624'], shape: 'feather', rim: C.mag, drag: 1.3, g: 70 });
        parts({ x: g2.x, y: g2.y, n: 30, spd: [200, 500], life: [.3, .6], size: [1.5, 3], colors: [C.pink, C.lav, '#ffffff'], shape: 'streak', add: true, drag: 3 }); title(g2); await nap(880);
      }
      if (el) { el.classList.remove('morph-out'); el.classList.add('morph-in'); setTimeout(() => el.classList.remove('morph-in'), 800); }
    } catch (e) { console.warn('v170 晉升演出', e); }
    finally { if (el) el.classList.remove('morph-out'); doSwap(); }
  };

  /* ---------- 事件特效 ---------- */
  function fsFx(imu, atk) { if (!onBattle()) return; T = tierNow(); const b = battle, S = imu === b.enemy ? 'R' : imu === b.player ? 'L' : null; if (!S) return; const g = geo(S), o = geo(S === 'L' ? 'R' : 'L');
    if (T === 0) { X.glow(g.x, g.head, { color: C.crim, r: g.h * .3, life: .4 }); return; }
    eyes(g.x, g.head + g.h * .05, { n: 8, rx: g.h * .58, ry: g.h * .44, size: g.h * .07, life: .8, stag: .02, gaze: { x: o.x, y: o.y }, beam: { x: o.x, y: o.y, at: .12 }, glareAt: .1, closeAt: .7 });
    const img = $('bImg' + S); try { img.animate([{ opacity: 1 }, { opacity: .35, offset: .3 }, { opacity: 1 }], { duration: 420 / spd() }); } catch (e) { }
    parts({ x: g.x, y: g.y, n: 16, spd: [200, 420], ang: S === 'R' ? [-.3, .3] : [Math.PI - .3, Math.PI + .3], life: [.2, .4], size: [1.5, 3], colors: [C.crim, C.pink], shape: 'streak', add: true, jy: g.h * .3 });
    say(g.x, g.head - g.h * .25, '看穿', { size: 46, color: '#ffd0dc', color2: '#a0002a', life: .7 }); sfx('zap'); }
  function voidEvFx(imu) { if (!onBattle() || tierNow() === 0) return; T = tierNow(); const b = battle, S = imu === b.enemy ? 'R' : 'L', g = geo(S); dring(g.x, g.y, { r1: g.h * .6, w: 18, life: .45, color: C.mag }); rift(g.x - (S === 'R' ? -1 : 1) * g.h * .25, g.y, { w: g.h * .06, h: g.h * .4, life: .5 }); }
  function shockFx(owner, foe) { if (!onBattle()) return; T = tierNow(); const b = battle, S = owner === b.enemy ? 'R' : owner === b.player ? 'L' : null, Tt = foe === b.enemy ? 'R' : foe === b.player ? 'L' : null; if (!S || !Tt) return;
    const g = geo(S), t = geo(Tt), f3 = owner.__imu && owner.__imu.form >= 3, col = f3 ? C.mag : C.crim; if (T === 0) { X.glow(t.x, t.y, { color: col, r: t.h * .4, life: .4 }); return; }
    for (let i = 0; i < (T >= 2 ? 3 : 2); i++) later(i * 70, () => hbolt(g.x, g.head, t.x + R(-.15, .15) * t.h, t.y + R(-.3, .2) * t.h, { w: 6 * g.k, color: col, life: .26 }));
    later(120, () => { dring(t.x, t.y, { r1: t.h * .7, w: 20, life: .45, color: col }); quake(); }); say(t.x, t.head - t.h * .2, '霸王色', { size: 40, color: '#ffd0dc', color2: f3 ? '#6a0a8a' : '#a0002a', life: .7 }); }
  function stealFx(imu, foe) { if (!onBattle() || tierNow() === 0) return; T = tierNow(); const b = battle, S = imu === b.enemy ? 'R' : imu === b.player ? 'L' : null, Tt = foe === b.enemy ? 'R' : foe === b.player ? 'L' : null; if (!S || !Tt) return; const g = geo(S), t = geo(Tt);
    parts({ x: t.x, y: t.y, n: 22, spd: [30, 90], life: [.6, .9], size: [6, 11], colors: [C.crim, C.pink, '#ffd0dc'], shape: 'mote', add: true, jx: t.h * .2, jy: t.h * .3, to: { x: g.x, y: g.y }, pull: 10 }); }
  function pactTickFx(f) { if (!onBattle() || tierNow() === 0) return; T = tierNow(); const b = battle, S = f === b.enemy ? 'R' : f === b.player ? 'L' : null; if (!S) return; const g = geo(S); sigil(g.x, g.y, { r: g.h * .26, col: C.pink, n: 5, life: .6, spin: 2, eye: true }); }
  function benchFx(kind, from, list) { if (!onBattle() || !list.length) return; T = tierNow(); const b = battle, S = from === b.enemy ? 'R' : from === b.player ? 'L' : null; if (!S) return; const g = geo(S);
    list.forEach((o, j) => { const p = iconPt(o.i); if (!p) return;
      if (T >= 1) { if (kind === 'chain') later(j * 70, () => chain(g.x, g.y, p.x, p.y, { sag: 40, k: .7, rim: C.pink, life: .75, grow: .26 }));
        else later(j * 60, () => parts({ x: g.x, y: g.y, n: 8, spd: [200, 380], life: [.45, .6], size: [12, 18], colors: ['#14020e', '#2a0624'], shape: 'feather', rim: C.pink, to: { x: p.x, y: p.y }, pull: 22 })); }
      later((T >= 1 ? 280 : 0) + j * 70, () => { pulseIcon(o.i, kind); X.glow(p.x, p.y, { color: kind === 'chain' ? C.pink : C.mag, r: 46, life: .45 }); }); }); }

  /* ---------- 場上氛圍（狀態持續中；樣式在 css/fx_imu_v170.css） ---------- */
  const EYES = '<svg viewBox="0 0 40 18"><path d="M1 9Q20-6 39 9Q20 24 1 9Z" fill="#2a0008"/><circle cx="20" cy="9" r="6" fill="#ff1a3a"/><ellipse cx="20" cy="9" rx="1.2" ry="5" fill="#0a0004"/></svg>';
  const MARK = '<svg viewBox="-50 -50 100 100"><g fill="none" stroke-width="1.6"><circle r="46"/><circle r="38" stroke-dasharray="4 3"/><path d="M0-36L21 29L-34-11L34-11L-21 29Z"/></g></svg>';
  let ambT = 0;
  function ambEl(cls, parent, before) { let d = parent.querySelector(':scope > .' + cls); if (!d) { d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); if (before) parent.insertBefore(d, before); else parent.appendChild(d); } return d; }
  function ambClear() { document.querySelectorAll('.imu-amb,.imu-eyes,.imu-mark,.imu-halo,.imu-bk').forEach(e => e.remove()); }
  function amb() {
    ambT = 0; const b = typeof battle !== 'undefined' && battle, scr = $('battleScreen'), A = $('bArena'); if (!scr || !A) return;
    if (!b || b.gameOver || scr.classList.contains('hidden')) { ambClear(); return; }
    const L = b.player, Rr = b.enemy, imu = Rr && Rr.__imu ? Rr : L && L.__imu ? L : null, S = imu === Rr ? 'R' : 'L', tier = tierNow();
    scr.classList.toggle('imu-lo', tier <= 1);
    /* 領域 */
    const D = b.__imuDom && b.__imuDom.t > 0 ? b.__imuDom : null, own = D && (D.owner || (D.side === 'E' ? Rr : L)), onS = own && own.hp > 0 && (own === Rr ? 'R' : own === L ? 'L' : null);
    const am = ambEl('imu-amb', scr, scr.querySelector('.b-arena')); const f3 = !!(D && /天翼/.test(D.name || ''));
    if (D && own && own.hp > 0) { if (!am.firstChild) am.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>'; am.classList.add('on'); am.classList.toggle('f3', f3); am.style.setProperty('--ox', (own === Rr ? 74 : 26) + '%'); } else am.classList.remove('on', 'f3');
    void onS;
    if (!imu) { ['imu-eyes', 'imu-halo'].forEach(c => { const e = A.querySelector('.' + c); if (e) e.remove(); }); }
    else { const g = geo(S), st = imu.status || {};
      /* 看穿：頭上八隻眼 */
      const F = st.__foresee && st.__foresee.t > 0 ? st.__foresee : null; let ey = A.querySelector(':scope > .imu-eyes');
      if (F && imu.hp > 0) { if (!ey) { ey = ambEl('imu-eyes', A); ey.innerHTML = Array.from({ length: 8 }, (_, i) => { const a = -2.7 + 2.26 * i / 7; return `<b style="left:${f1(50 + Math.cos(a) * 44)}%;top:${f1(60 + Math.sin(a) * 52)}%;animation-delay:${(i * .37).toFixed(2)}s">${EYES}</b>`; }).join(''); }
        const w = g.h * .95; ey.style.cssText = `left:${f1(g.x - w / 2)}px;top:${f1(g.head - w * .42)}px;width:${f1(w)}px;height:${f1(w * .5)}px`; ey.classList.toggle('used', F.r === (b.round || 0)); }
      else if (ey) ey.remove();
      /* 不滅光環（不死之身、永劫不滅、千眼天啟） */
      const und = st.__imuUnd && st.__imuUnd.t > 0, et = st.__imuEt && st.__imuEt.t > 0; let ha = A.querySelector(':scope > .imu-halo');
      if ((und || et) && imu.hp > 0) { if (!ha) ha = ambEl('imu-halo', A, A.querySelector('.fighter')); const w = g.h * .62; ha.style.cssText = `left:${f1(g.x - w / 2)}px;top:${f1(g.head - w / 2)}px;width:${f1(w)}px;height:${f1(w)}px`; ha.classList.toggle('f3', imu.__imu.form >= 3); }
      else if (ha) ha.remove(); }
    /* 對手腳下：契約紋、存在抹除 */
    ['L', 'R'].forEach(s => { const f = s === 'L' ? L : Rr, st = f && f.status; let mk2 = A.querySelector(`:scope > .imu-mark.${s}`); const pact = st && st.__pact && st.__pact.t > 0, er = st && st.__erase && st.__erase.t > 0;
      if (f && f.hp > 0 && (pact || er)) { if (!mk2) { mk2 = document.createElement('div'); mk2.className = 'imu-mark ' + s; mk2.setAttribute('aria-hidden', 'true'); mk2.innerHTML = MARK; A.insertBefore(mk2, A.querySelector('.fighter')); }
        const g = geo(s), w = g.h * .78; mk2.style.cssText = `left:${f1(g.x - w / 2)}px;top:${f1(g.feet - w / 2)}px;width:${f1(w)}px;height:${f1(w)}px`;
        mk2.classList.toggle('pact', !!pact); mk2.classList.toggle('full', !!(pact && st.__pact.full)); mk2.classList.toggle('erase', !!er); }
      else if (mk2) mk2.remove(); });
  }
  const ambSoon = () => { if (!ambT) ambT = requestAnimationFrame(amb); };

  /* ---------- 掛鉤 ---------- */
  function install() {
    const cur = window.playChoreo; if (typeof cur !== 'function' || cur.__imu170) return;
    const w = async function (side, actor, idx, skill) { const key = window.__NO_FX170 ? null : keyOf(actor, skill); if (!key) return cur.apply(this, arguments); try { await run(key, side); } catch (e) { console.warn('v170 伊姆特效', e); } };
    w.__imu170 = true; w.__fx3 = cur.__fx3; w.__vfx = cur.__vfx; window.playChoreo = w; try { playChoreo = w; } catch (e) { }
  }
  window.addEventListener('load', () => setTimeout(install, 120));
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { install(); gen++; cancelOld(); ambClear(); const r = _sb.apply(this, arguments); ambSoon(); return r; }; window.startBattle = startBattle; }
  if (typeof renderHUD === 'function') { const _rh = renderHUD; renderHUD = function () { const r = _rh.apply(this, arguments); ambSoon(); return r; }; }
  if (typeof finishBattle === 'function') { const _fb = finishBattle; finishBattle = function () { const r = _fb.apply(this, arguments); setTimeout(ambClear, 0); return r; }; }
  window.addEventListener('resize', ambSoon);
  /* 看穿／深淵迴避：記下 ext_v169 給的看穿目標，閃避發生時（battle.js 呼叫 onEvaded）放特效 */
  let fsT = null;
  const hookImu = () => { const I = window.IMU165; if (!I || I.__fx170) return; I.__fx170 = true; const _pre = I.preAct, _post = I.postAct;
    I.preAct = function () { const o = _pre.apply(this, arguments); fsT = o && o.fsT || null; return o; };
    I.postAct = function () { try { return _post.apply(this, arguments); } finally { fsT = null; } }; };
  hookImu();
  { const _oe = window.onEvaded; window.onEvaded = function (actor, target) { let r; try { if (_oe) r = _oe.apply(this, arguments); } finally { try { if (target && target === fsT) fsFx(target, actor); else if (target && target.__imu) voidEvFx(target); } catch (e) { } } return r; }; }
  /* 契約連鎖（施放時）、翅膀掃擊：後排頭像 */
  if (typeof applySkillEffects === 'function') { const _ase = applySkillEffects; applySkillEffects = function (actor, target, skill, result) {
    const ef = (skill && skill.effect) || {}, want = (ef.splash && result && result.damage > 0) || (ef.imuPact && ef.imuPact.chain), list = want && typeof document !== 'undefined' ? benchOf(target) : [];
    const r = _ase.apply(this, arguments);
    try { if (list.length) setTimeout(() => benchFx(ef.splash ? 'wing' : 'chain', target, list), 60); } catch (e) { } return r; }; }
  /* 回合結束：霸王色震懾、契約扣血、契約連鎖、最初20人奪血（以 ext_v165 寫進戰報的訊息判斷是哪一種，避免把其他扣血誤認） */
  let ev = null;
  if (typeof log === 'function') { const _lg = log; log = function (t) { if (ev && typeof t === 'string') { if (t.includes('霸王色震懾！')) ev.shock = 1; else if (/(完全支配|惡魔契約)：.+失去/.test(t)) ev.pact = 1; else if (t.includes('最初20人奪走')) ev.steal = 1; } return _lg.apply(this, arguments); }; }
  if (typeof endTurnStatus === 'function') { const _ets = endTurnStatus; endTurnStatus = function (c) {
    const b = typeof battle !== 'undefined' && battle; if (!b || !c || !c.status || typeof document === 'undefined') return _ets.apply(this, arguments);
    const foe = c === b.enemy ? b.player : c === b.player ? b.enemy : null, P = c.status.__pact, bl = P && P.t > 0 && P.chain > 0 ? benchOf(c) : [], bh = bl.map(o => o.x.hp);
    const prev = ev; ev = {}; let r, e;
    try { r = _ets.apply(this, arguments); } finally { e = ev; ev = prev; }
    try { if (e.shock && foe) shockFx(c, foe); if (e.pact) pactTickFx(c); if (e.steal && foe) stealFx(c, foe); const hit = bl.filter((o, i) => o.x.hp < bh[i]); if (hit.length) benchFx('chain', c, hit); } catch (x) { }
    return r; }; }
  window.IMU_FX170 = { keyOf, run, CH, amb, tier: tierNow, live: () => [...mine].filter(e => e.t < e.life).length, parts: () => liveP };
})();
