/* v196 技能特效（使用者 11/10 12:46 提供 8 張素材，「請根據角色站位與發動方向造型調整」）
   圖1 凱多第 5 招「升龍·火焰八卦」＝火龍；圖2 凱多第 2 招「酒龍八卦」＝紅紫氣焰（必須在凱多立繪後方）；
   圖3 女帝「虜之箭」＝大愛心先出現、愛心箭隨後射出；圖4 尼卡魯夫「解放之鼓」＝金色鼓聲光環（必須在立繪後方）；
   圖5 四皇黑鬍子「引發震動」＝空間碎裂；圖6 佩羅娜「鬼魂網域」＝幽靈群；圖7 佩羅娜第 5 招「特大幽靈」；圖8 基德「電磁砲」。
   素材：assets/fx/v196/*.webp（原圖是棋盤格假透明的 JPG，已去背成真正的透明圖，寬 840～1000px，iPhone 畫布安全）。
   做法與 viona_v187.js 相同：包住 playChoreo（最外層），用戰場畫布 FXE 畫素材；「立繪後方」的兩張用 DOM 插在角色圖之前。
   方向：素材有固定朝向（火龍、幽靈群、電磁砲朝左；愛心箭、特大幽靈朝右），依施放者在左或右自動鏡像；
        位置與大小全部用雙方立繪的實際範圍（pt：中線、頭頂、腳底、身高）與兩人距離計算，不寫死像素。
   黑鬍子「闇穴道」複製到這些招式時（skill.copiedFrom）也會用同一套特效。
   載入順序：viona_v187.js、battle_v195.js 之後。 */
(function () {
  if (typeof CHARACTERS === 'undefined' || typeof playChoreo !== 'function') return;
  const V = 196, $ = id => document.getElementById(id);
  /* 招式 → 素材 */
  const MAP = { kaido: { '升龍·火焰八卦': 'dragon', '酒龍八卦': 'burst' }, hancock: { '虜之箭': 'heart' }, luffy_nika: { '解放之鼓': 'drum' }, blackbeard: { '引發震動': 'quake' }, perona: { '鬼魂網域': 'ghosts', '特大幽靈': 'ghost' }, kid: { '電磁砲': 'rail' } };
  /* 素材上的定位點（佔圖寬、圖高的比例） */
  const AN = { dragon: { head: [.106, .592] }, burst: { base: [.491, .873] }, heart: { c: [.207, .557], tip: .979 }, drum: { c: [.525, .492] }, quake: { c: [.489, .514] }, ghosts: { c: [.502, .518] }, ghost: { c: [.569, .502] }, rail: { ring: [.923, .515], hit: [.148, .521] } };
  const IMG = {};
  const get = k => { if (!IMG[k]) { const i = new Image(); i.decoding = 'async'; i.src = `assets/fx/v196/${k}.webp?v=${V}`; IMG[k] = i; } return IMG[k]; };
  const ready = i => i && i.complete && i.naturalWidth > 0;
  /* 等素材載入（最多 0.6 秒；沒載到就退回原本的動畫） */
  const need = k => new Promise(res => { const i = get(k); if (ready(i)) return res(true); let done = false; const ok = v => { if (!done) { done = true; res(v); } };
    i.addEventListener('load', () => ok(true), { once: true }); i.addEventListener('error', () => ok(false), { once: true }); setTimeout(() => ok(ready(i)), 600); });
  const PI = Math.PI, TAU = PI * 2, lerp = (a, b, q) => a + (b - a) * q, cl = q => Math.max(0, Math.min(1, q));
  const eOut = q => 1 - Math.pow(1 - cl(q), 3), eIn = q => Math.pow(cl(q), 2.2), eIO = q => { q = cl(q); return q * q * (3 - 2 * q); };
  const back3 = q => { q = cl(q); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(q - 1, 3) + c1 * Math.pow(q - 1, 2); }; /* 略為彈過頭再回來 */
  const X = () => FXE.P, sl = ms => (typeof sleep === 'function' ? sleep(ms) : new Promise(r => setTimeout(r, ms)));
  const wait = ms => sl(ms / (window.BSPEED || 1));
  /* 用特效畫布的時間等待（掉幀時特效與等待同步）；分頁在背景時最多等 3 倍＋1 秒 */
  const fw = ms => typeof FXE === 'undefined' ? wait(ms) : new Promise(res => { let done = false; const ok = () => { if (!done) { done = true; res(); } };
    const e = FXE.add({ life: 99, draw(c, q, dt, t) { if (t * 1000 >= ms) { e.t = 99; ok(); } } }); setTimeout(ok, ms * 3 / (window.BSPEED || 1) + 1000); });
  /* 角色在戰場上的實際範圍（戰場座標）：x 中線、top 頭頂、bot 腳底、h 身高、y 身體中心 */
  function pt(side) { const f = $('bF' + side), img = $('bImg' + side);
    const sc = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1, h = Math.max(60, img.offsetHeight * sc), bot = f.offsetTop + img.offsetTop + img.offsetHeight;
    return { x: f.offsetLeft + img.offsetLeft + img.offsetWidth / 2 + (window.__camTx ? __camTx(side) : 0), bot, top: bot - h, h, y: bot - h * .5 }; }
  /* sp(圖, 參數)：畫在戰場畫布。x、y、w、s、sy、a、r 可以是數字或 (進度 q, 秒 t) => 值；ax/ay＝錨點（佔圖寬高比例）；fx＝水平鏡像；add＝加亮；
     clip(c, x0, y0, w, h, q, t)＝在圖片座標裡建立裁切路徑（x0,y0 是圖左上角） */
  function sp(k, o) { const img = get(k);
    return FXE.add({ add: !!o.add, life: o.life || .8, draw(c, q, dt, t) { if (!ready(img)) return; const v = f => typeof f === 'function' ? f(q, t) : f;
      const s = v(o.s == null ? 1 : o.s), w = v(o.w || 300) * s, h = w * img.naturalHeight / img.naturalWidth, a = v(o.a == null ? 1 : o.a);
      if (a <= 0 || w <= 1) return; c.globalAlpha = Math.min(1, a); c.translate(v(o.x), v(o.y)); c.rotate(v(o.r || 0)); if (o.fx) c.scale(-1, 1); if (o.sy != null) c.scale(1, v(o.sy));
      const x0 = -w * (o.ax == null ? .5 : o.ax), y0 = -h * (o.ay == null ? .5 : o.ay);
      if (o.clip) { c.beginPath(); o.clip(c, x0, y0, w, h, q, t); c.clip(); }
      c.drawImage(img, x0, y0, w, h); } }); }
  /* back(角色, 圖, 參數)：畫在角色「身後」的素材（DOM，插在角色圖之前），跟著角色一起移動。kf＝Web Animations 關鍵影格 */
  function back(side, k, o) { const f = $('bF' + side), img = $('bImg' + side), I = get(k); if (!f || !img || !ready(I)) return null;
    const w = o.w, h = w * I.naturalHeight / I.naturalWidth, ax = o.ax == null ? .5 : o.ax, ay = o.ay == null ? .5 : o.ay, el = document.createElement('div');
    el.className = 'fx196-back';
    el.style.cssText = `position:absolute;left:${o.x - (window.__camTx ? __camTx(side) : 0) - f.offsetLeft - w * ax}px;top:${o.y - f.offsetTop - h * ay}px;width:${w}px;height:${h}px;background:url("${I.src}") center/100% 100% no-repeat;pointer-events:none;transform-origin:${ax * 100}% ${ay * 100}%;opacity:0`;
    f.insertBefore(el, img); const dur = o.dur / (window.BSPEED || 1);
    try { el.animate(o.kf, { duration: dur, easing: o.ease || 'linear', fill: 'forwards' }); } catch (e) { }
    setTimeout(() => el.remove(), dur + 80); return el; }
  /* 畫面上方資訊列的下緣，換算成戰場座標（特效不要飛到資訊列後面） */
  function visTop() { try { const A = $('bArena'), r = A.getBoundingClientRect(), k = r.height / (A.offsetHeight || 1), tb = document.querySelector('#battleScreen .b-top'); return ((tb ? tb.getBoundingClientRect().bottom : r.top) - r.top) / (k || 1); } catch (e) { return 0; } }
  /* 畫面可見寬度，換算成戰場座標（大型素材不要超過畫面） */
  function visW() { try { const A = $('bArena'), r = A.getBoundingClientRect(), k = r.width / (A.offsetWidth || 1); return ($('battleScreen').clientWidth || innerWidth) / (k || 1); } catch (e) { return 9999; } }
  const hit = (A, kind) => { try { moveFighter(A.T, kind || 'recoil'); } catch (e) { } try { shake(); } catch (e) { } };
  const mv = (side, kind) => { try { moveFighter(side, kind); } catch (e) { } };
  const sfx = n => { try { SFX.play(n); } catch (e) { } };

  const VFX = {
    /* ── 凱多「升龍·火焰八卦」：身上竄出火焰 → 火龍從凱多身上昇空 → 弧線俯衝咬向對手 → 爆炸、火柱 ── */
    dragon: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, dist = Math.abs(e.x - f.x), M = Math.max(u, E);
      sfx('ult'); X().tint('#3a0a00', 1.7, .5); mv(A.S, 'float');
      X().glow(f.x, f.y, { color: '#ff7a2a', r: u * .42, life: .5, hold: true }); X().flames(f.x, f.bot - u * .1, { n: 46, jx: u * .28, dy: 0, colors: ['#ff5a2a', '#ffb347', '#ffd26c', '#fff3c4'] });
      X().ring(f.x, f.bot - 4, { r1: u * .6, flat: .25, color: '#ff9a3a', w: 8, life: .6 });
      await fw(240); sfx('whoosh');
      const W = Math.max(dist * 1.05, M * 1.2);
      const P0 = { x: f.x + d * u * .05, y: f.y - u * .1 }, P2 = { x: e.x - d * E * .05, y: e.y - E * .08 }, P1 = { x: (P0.x + P2.x) / 2 - d * dist * .12, y: Math.min(f.top, e.top) - M * .32 };
      /* 最高點不要飛出畫面上方的資訊列：龍身上緣（錨點以上約 0.59 個圖高）留在資訊列下面 */
      { const top = visTop(), minApex = top + W * .479 * AN.dragon.head[1] * .8 + 6, apex = .25 * P0.y + .5 * P1.y + .25 * P2.y; if (apex < minApex) P1.y = Math.min(2 * (minApex - .25 * (P0.y + P2.y)), Math.min(P0.y, P2.y) - M * .05); }
      const T0 = .06, T1 = .5, T2 = .8, LIFE = 1.12; /* 現形 → 昇空到最高點 → 俯衝命中 → 穿過去消散 */
      const prog = t => t < T1 ? .5 * eOut((t - T0) / (T1 - T0)) : .5 + .5 * eIn((t - T1) / (T2 - T1)) + Math.max(0, t - T2) * .9;
      const bz = p => { const k = 1 - p; return { x: k * k * P0.x + 2 * k * p * P1.x + p * p * P2.x, y: k * k * P0.y + 2 * k * p * P1.y + p * p * P2.y }; };
      const tan = p => { p = Math.min(p, 1); const k = 1 - p; return Math.atan2(2 * k * (P1.y - P0.y) + 2 * p * (P2.y - P1.y), 2 * k * (P1.x - P0.x) + 2 * p * (P2.x - P1.x)); };
      const rot = (q, t) => { let th = tan(prog(t)); if (d < 0) { th -= PI; if (th < -PI) th += TAU; } return Math.max(-.95, Math.min(.95, th)); };
      const o = { life: LIFE, w: W, ax: AN.dragon.head[0], ay: AN.dragon.head[1], fx: d > 0, x: (q, t) => bz(prog(t)).x, y: (q, t) => bz(prog(t)).y, r: rot,
        s: (q, t) => .35 + .65 * eOut((t - T0) / (T1 - T0)), a: (q, t) => t < T0 ? 0 : t < T0 + .14 ? (t - T0) / .14 : t > T2 + .06 ? Math.max(0, (LIFE - t) / (LIFE - T2 - .06)) : 1 };
      sp('dragon', o); sp('dragon', Object.assign({}, o, { add: true, a: (q, t) => .28 * o.a(q, t) }));
      /* 龍身經過的火星 */
      for (let i = 1; i <= 4; i++) { await fw(i === 1 ? 150 : 130); const p = bz(prog(.15 + (i - 1) * .13));
        X().particles({ x: p.x, y: p.y, jx: M * .12, jy: M * .08, n: 12, spd: [M * .2, M * .7], life: [.3, .6], size: [3, 7], colors: ['#ff5a2a', '#ffb347', '#ffd26c'], shape: 'spark', add: true, g: -80 }); }
      await fw(250); sfx('explode');
      X().burst(e.x, e.y, { r: E * .55, color: 'rgba(255,120,40,.95)' }); X().flames(e.x, e.bot - E * .15, { n: 90, jx: E * .4, dy: 0, colors: ['#ff5a2a', '#ffb347', '#ffd26c', '#ffffff'] });
      X().ring(e.x, e.bot - 4, { r1: E * 1.2, flat: .25, color: '#ffb347', w: 12, life: .6 }); X().ring(e.x, e.y, { r1: E * .9, color: '#ffd26c', w: 8, life: .45 });
      X().particles({ x: e.x, y: e.y, n: 30, spd: [E * .8, E * 2.4], life: [.35, .8], size: [3, 8], colors: ['#ff5a2a', '#ffb347', '#ffd26c', '#ffffff'], shape: 'spark', add: true, g: 220 });
      X().flash('#ffd9a8', .22, .35); hit(A);
      await fw(180); sfx('heavy'); X().burst(e.x + d * E * .12, e.y - E * .12, { r: E * .4, color: 'rgba(255,170,60,.9)' }); try { shake(); } catch (e2) { }
      await fw(320); },

    /* ── 凱多「酒龍八卦」：紅紫氣焰從腳下炸開，在凱多身後燃燒（素材在立繪後方） ── */
    burst: async A => { const f = A.f, u = f.h; sfx('buff'); X().tint('#2a0410', 1.3, .4); mv(A.S, 'float');
      const b = AN.burst.base;
      back(A.S, 'burst', { x: f.x, y: f.bot - u * .02, w: u * 2.7, ax: b[0], ay: b[1], dur: 1350,
        kf: [{ opacity: 0, transform: 'scale(.45,.12)', easing: 'cubic-bezier(.2,.9,.3,1.25)' }, { opacity: 1, transform: 'scale(1.06,1.1)', offset: .2 }, { opacity: 1, transform: 'scale(1,1)', offset: .3 },
          { opacity: 1, transform: 'scale(1.05,1.07)', offset: .46 }, { opacity: 1, transform: 'scale(.99,1)', offset: .6 }, { opacity: 1, transform: 'scale(1.04,1.06)', offset: .76 }, { opacity: 0, transform: 'scale(1.12,1.22)' }] });
      X().ring(f.x, f.bot - 4, { r1: u * .8, flat: .25, color: '#ff3a5a', w: 10, life: .55 });
      X().particles({ x: f.x, y: f.bot - u * .05, jx: u * .45, n: 26, ang: [-PI / 2 - .5, -PI / 2 + .5], spd: [u * .5, u * 1.5], life: [.5, 1], size: [3, 7], colors: ['#ff3a5a', '#c0306a', '#7a2ad0', '#ffd0d8'], shape: 'spark', add: true, g: -60 });
      await fw(300); sfx('dark'); try { shake(); } catch (e) { }
      X().ring(f.x, f.bot - 4, { r1: u * 1.15, flat: .25, color: '#b03aff', w: 8, life: .5 });
      await fw(380); X().ring(f.x, f.bot - 4, { r1: u * .95, flat: .25, color: '#ff6a7a', w: 6, life: .5 });
      X().particles({ x: f.x, y: f.bot - u * .05, jx: u * .5, n: 16, ang: [-PI / 2 - .4, -PI / 2 + .4], spd: [u * .4, u * 1.2], life: [.5, .9], size: [2, 6], colors: ['#ff3a5a', '#7a2ad0', '#ffd0d8'], shape: 'spark', add: true, g: -60 });
      await fw(560); },

    /* ── 女帝「虜之箭」：身前先浮現大愛心（彈出）→ 愛心箭從愛心向對手射出（由內往外現形）→ 命中、粉紅光爆開 ── */
    heart: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, c0 = AN.heart.c;
      sfx('buff'); X().tint('#3a0a2a', 1.5, .35); mv(A.S, 'float');
      const C = { x: f.x + d * u * .46, y: f.y - u * .12 };                 /* 愛心中心：女帝身前 */
      const reach = Math.abs(e.x - C.x) + E * .3;                          /* 箭尖要超過對手 */
      const W = Math.max(reach / (AN.heart.tip - c0[0]), u * 1.7), T1 = .5, T2 = .8, LIFE = 1.2;
      const R0 = .2, R1 = .86;                                             /* 裁切圓半徑（佔圖寬）：只露出愛心 → 整張 */
      const rad = t => t < T1 ? R0 : lerp(R0, R1, eOut((t - T1) / (T2 - T1)));
      const o = { life: LIFE, w: W, ax: c0[0], ay: c0[1], fx: d < 0, x: C.x, y: (q, t) => C.y - Math.sin(Math.min(t, T1) / T1 * PI) * u * .03,
        s: (q, t) => t < .3 ? .15 + .85 * back3(t / .3) : t < T1 ? 1 + .04 * Math.sin((t - .3) / (T1 - .3) * PI * 2) : 1,
        a: (q, t) => t < .1 ? t / .1 : t > T2 + .12 ? Math.max(0, (LIFE - t) / (LIFE - T2 - .12)) : 1,
        clip: (c, x0, y0, w, h, q, t) => c.arc(x0 + c0[0] * w, y0 + c0[1] * h, rad(t) * w, 0, TAU) };
      sp('heart', o); sp('heart', Object.assign({}, o, { add: true, a: (q, t) => .35 * o.a(q, t) }));
      X().ring(C.x, C.y, { r1: u * .55, color: '#ff7ad8', w: 6, life: .45 });
      X().particles({ x: C.x, y: C.y, n: 14, spd: [u * .2, u * .7], life: [.4, .8], size: [3, 6], colors: ['#ff7ad8', '#ffc0ec', '#ffffff'], shape: 'spark', add: true, g: -40 });
      await fw(T1 * 1000); sfx('whoosh'); sfx('petals');
      X().particles({ x: C.x + d * u * .2, y: C.y, jy: u * .3, n: 22, ang: d > 0 ? [-.35, .35] : [PI - .35, PI + .35], spd: [reach * 1.6, reach * 2.6], life: [.25, .4], size: [2, 5], colors: ['#ff7ad8', '#ffc0ec', '#ffffff'], shape: 'spark', add: true });
      await fw((T2 - T1) * 1000 - 60); sfx('hit');
      X().burst(e.x, e.y - E * .05, { r: E * .45, color: 'rgba(255,110,200,.95)' }); X().ring(e.x, e.y, { r1: E * .9, color: '#ff7ad8', w: 8, life: .45 });
      X().particles({ x: e.x, y: e.y - E * .05, n: 26, spd: [E * .5, E * 1.6], life: [.45, .9], size: [5, 9], colors: ['#ff7ad8', '#ffc0ec', '#ff4fb0'], shape: 'petal', g: 120 });
      X().flash('#ffd0f0', .18, .2); hit(A);
      await fw(420); },

    /* ── 尼卡魯夫「解放之鼓」：金色鼓聲光環在身後展開，隨鼓聲「咚咚、咚咚」脈動（素材在立繪後方） ── */
    drum: async A => { const f = A.f, u = f.h, c0 = AN.drum.c; sfx('drum'); X().tint('#3a2a00', 1.6, .3); mv(A.S, 'float');
      const cy = f.top + u * .46;
      back(A.S, 'drum', { x: f.x, y: cy, w: u * 2.5, ax: c0[0], ay: c0[1], dur: 1650,
        kf: [{ opacity: 0, transform: 'scale(.2) rotate(-14deg)', easing: 'cubic-bezier(.2,.9,.3,1.3)' }, { opacity: 1, transform: 'scale(1.08) rotate(0deg)', offset: .16 }, { opacity: 1, transform: 'scale(1) rotate(0deg)', offset: .24 },
          { opacity: 1, transform: 'scale(1.12) rotate(1deg)', offset: .32 }, { opacity: 1, transform: 'scale(1) rotate(0deg)', offset: .42 },
          { opacity: 1, transform: 'scale(1.12) rotate(-1deg)', offset: .54 }, { opacity: 1, transform: 'scale(1) rotate(0deg)', offset: .64 },
          { opacity: 1, transform: 'scale(1.14) rotate(1deg)', offset: .76 }, { opacity: 1, transform: 'scale(1.02) rotate(0deg)', offset: .86 }, { opacity: 0, transform: 'scale(1.3) rotate(3deg)' }] });
      const beat = () => { sfx('drum'); X().ring(f.x, cy, { r1: u * 1.15, color: '#ffe680', w: 8, life: .45 });
        X().particles({ x: f.x, y: cy, n: 10, spd: [u * .6, u * 1.4], life: [.35, .7], size: [3, 6], colors: ['#fff3a8', '#ffd24a', '#ffffff'], shape: 'spark', add: true }); };
      await fw(400); beat(); try { X().text(f.x + A.d * u * .28, f.top - u * .08, '咚咚咚咚', { size: 38, color: '#ffffff', color2: '#e8a400' }); } catch (e) { }
      await fw(360); beat(); await fw(360); beat(); X().flash('#fff3c4', .2, .18);
      X().particles({ x: f.x, y: f.bot, jx: u * .4, n: 20, ang: [-PI / 2 - .4, -PI / 2 + .4], spd: [u * .4, u * 1.1], life: [.6, 1], size: [3, 6], colors: ['#fff3a8', '#ffd24a', '#ffffff'], shape: 'spark', add: true, g: -50 });
      await fw(520); },

    /* ── 四皇黑鬍子「引發震動」：出拳 → 對手面前的空間像玻璃一樣碎裂（素材瞬間炸開、持續震顫）→ 衝擊波 ── */
    quake: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, c0 = AN.quake.c;
      sfx('whoosh'); X().tint('#0a0618', 1.2, .45); mv(A.S, 'lunge');
      await fw(200); sfx('heavy'); sfx('explode');
      const C = { x: e.x - d * E * .16, y: e.y - E * .06 }, W = Math.max(E * 2.4, u * 1.6), LIFE = 1.05;
      const o = { life: LIFE, w: W, ax: c0[0], ay: c0[1], fx: d < 0, x: (q, t) => C.x + (t < .5 ? Math.sin(t * 95) * W * .006 * (1 - t / .5) : 0), y: (q, t) => C.y + (t < .5 ? Math.cos(t * 83) * W * .005 * (1 - t / .5) : 0),
        s: (q, t) => t < .09 ? .25 + .83 * (t / .09) : t < .16 ? lerp(1.08, 1, (t - .09) / .07) : 1 + .04 * eOut((t - .16) / .8),
        a: (q, t) => t < .03 ? t / .03 : t > .72 ? Math.max(0, (LIFE - t) / (LIFE - .72)) : 1 };
      sp('quake', o); sp('quake', Object.assign({}, o, { add: true, a: (q, t) => (t < .25 ? .6 * (1 - t / .25) : 0) }));
      X().flash('#ffffff', .16, .3); X().ring(C.x, C.y, { r1: W * .6, color: '#ffffff', w: 5, life: .35 }); X().ring(C.x, C.y, { r1: W * .85, color: '#b08cff', w: 6, life: .5 });
      X().particles({ x: C.x, y: C.y, n: 26, spd: [W * .5, W * 1.5], life: [.3, .7], size: [3, 7], colors: ['#ffffff', '#cfe6ff', '#b08cff'], shape: 'spark', add: true, g: 200 });
      try { X().cracks(e.x, e.bot - E * .05, { n: 8, len: E * .9 }); } catch (e2) { }
      hit(A);
      await fw(230); sfx('heavy'); try { shake(); } catch (e2) { } X().ring(C.x, C.y, { r1: W * 1.05, color: '#ff5a6a', w: 5, life: .5 });
      await fw(520); },

    /* ── 佩羅娜「鬼魂網域」：幽靈群從佩羅娜身邊湧出 → 飄向對手 → 繞著對手打轉、穿過身體 ── */
    ghosts: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, c0 = AN.ghosts.c;
      sfx('dark'); X().tint('#120a2a', 1.7, .4); mv(A.S, 'float');
      const VW = visW(), W1 = Math.min(Math.max(E * 1.8, u * 1.6), VW * .62), W0 = Math.min(u * 1.3, W1 * .8), P0 = { x: f.x + d * u * .15, y: f.y - u * .15 }, P1 = { x: e.x, y: e.y - E * .05 }, T1 = .55, LIFE = 1.5;
      const o = { life: LIFE, ax: c0[0], ay: c0[1], fx: d > 0, w: (q, t) => lerp(W0, W1, eOut(t / T1)),
        x: (q, t) => t < T1 ? lerp(P0.x, P1.x, eIO(t / T1)) : P1.x + Math.sin((t - T1) * 5) * E * .1 * d,
        y: (q, t) => (t < T1 ? lerp(P0.y, P1.y, eIO(t / T1)) - Math.sin(cl(t / T1) * PI) * u * .18 : P1.y) + Math.sin(t * 7) * E * .04,
        r: (q, t) => Math.sin(t * 4.2) * .09, s: (q, t) => t < T1 ? .5 + .5 * eOut(t / T1) : 1 + .05 * Math.sin((t - T1) * 9),
        a: (q, t) => t < .15 ? t / .15 * .95 : t > LIFE - .3 ? Math.max(0, (LIFE - t) / .3) : .95 };
      sp('ghosts', o); sp('ghosts', Object.assign({}, o, { add: true, a: (q, t) => .22 * o.a(q, t) }));
      X().ring(f.x, f.bot - 4, { r1: u * .6, flat: .25, color: '#bfe0ff', w: 6, life: .5 });
      X().particles({ x: P0.x, y: P0.y, jx: u * .3, jy: u * .3, n: 14, spd: [u * .1, u * .5], life: [.5, .9], size: [2, 5], colors: ['#ffffff', '#bfe0ff', '#ffc8ec'], shape: 'spark', add: true, g: -30 });
      await fw(T1 * 1000); sfx('whoosh');
      for (let i = 0; i < 3; i++) { sfx(i % 2 ? 'hit' : 'dark'); X().ring(e.x, e.y, { r1: E * (.7 + i * .2), color: i % 2 ? '#ffc8ec' : '#bfe0ff', w: 6, life: .4 });
        X().particles({ x: e.x, y: e.y, jx: E * .3, jy: E * .3, n: 12, spd: [E * .3, E * 1], life: [.3, .7], size: [2, 6], colors: ['#ffffff', '#bfe0ff', '#ffc8ec'], shape: 'spark', add: true, g: -40 });
        hit(A); await fw(210); }
      await fw(300); },

    /* ── 佩羅娜「特大幽靈」：頭頂浮現巨大幽靈 → 朝對手飄去、越來越大 → 罩住對手後膨脹 → 爆炸 ── */
    ghost: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, c0 = AN.ghost.c;
      sfx('ult'); X().tint('#0a0a2a', 1.9, .5); mv(A.S, 'float');
      const VW = visW(), W1 = Math.min(Math.max(E * 2.4, u * 2), VW * .7), W0 = Math.min(u * 1.1, W1 * .6), P0 = { x: f.x + d * u * .1, y: Math.max(f.top - u * .1, visTop() + W0 * .3) }, P1 = { x: e.x - d * E * .1, y: e.y - E * .12 }, T0 = .4, T1 = 1.0, T2 = 1.22, LIFE = 1.42;
      const o = { life: LIFE, ax: c0[0], ay: c0[1], fx: d < 0,
        w: (q, t) => t < T0 ? W0 : t < T1 ? lerp(W0, W1, eIO((t - T0) / (T1 - T0))) : W1,
        x: (q, t) => t < T0 ? P0.x : lerp(P0.x, P1.x, eIO((t - T0) / (T1 - T0))), y: (q, t) => (t < T0 ? P0.y : lerp(P0.y, P1.y, eIO((t - T0) / (T1 - T0)))) + Math.sin(t * 6) * u * .025,
        r: (q, t) => Math.sin(t * 5) * .05 * (d > 0 ? 1 : -1),
        s: (q, t) => t < T0 ? .2 + .8 * back3(t / T0) : t < T1 ? 1 : t < T2 ? 1 + .22 * eIn((t - T1) / (T2 - T1)) + Math.sin(t * 70) * .012 : 1.22 + .7 * eOut((t - T2) / (LIFE - T2)),
        a: (q, t) => t < .12 ? t / .12 : t > T2 ? Math.max(0, 1 - (t - T2) / (LIFE - T2)) : 1 };
      sp('ghost', o); sp('ghost', Object.assign({}, o, { add: true, a: (q, t) => (t > T1 ? .2 + .5 * cl((t - T1) / (T2 - T1)) : .18) * o.a(q, t) }));
      X().ring(P0.x, P0.y, { r1: u * .7, color: '#bfe0ff', w: 6, life: .5 });
      X().particles({ x: P0.x, y: P0.y, jx: u * .3, jy: u * .2, n: 16, spd: [u * .1, u * .5], life: [.5, .9], size: [2, 5], colors: ['#ffffff', '#bfe0ff', '#ffc8ec'], shape: 'spark', add: true, g: -30 });
      await fw(T0 * 1000); sfx('whoosh'); await fw((T2 - T0) * 1000); sfx('explode');
      X().burst(P1.x, P1.y, { r: E * .7, color: 'rgba(190,225,255,.95)' }); X().ring(P1.x, P1.y, { r1: E * 1.5, color: '#ffffff', w: 12, life: .5 }); X().ring(P1.x, P1.y, { r1: E * 1.1, color: '#ffc8ec', w: 8, life: .6 });
      X().particles({ x: P1.x, y: P1.y, n: 34, spd: [E * .7, E * 2.4], life: [.4, .9], size: [3, 8], colors: ['#ffffff', '#bfe0ff', '#ffc8ec'], shape: 'spark', add: true, g: 120 });
      X().flash('#e8f4ff', .22, .45); hit(A);
      await fw(160); sfx('heavy'); try { shake(); } catch (e2) { } await fw(380); },

    /* ── 基德「電磁砲」：砲口聚集磁力光環 → 電磁砲從砲口射向對手（從砲口往對手現形）→ 命中處爆開、光束收細消散 ── */
    rail: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, rg = AN.rail.ring, ht = AN.rail.hit;
      sfx('zap'); X().tint('#2a0418', 1.5, .45); mv(A.S, 'float');
      const M = { x: f.x + d * u * .3, y: f.y - u * .1 }, G = { x: e.x, y: e.y - E * .05 };   /* 砲口、命中點 */
      const len = Math.hypot(G.x - M.x, G.y - M.y), W = len / (rg[0] - ht[0]), ang = Math.atan2(G.y - M.y, G.x - M.x);
      const img = get('rail'), ratio = ready(img) ? img.naturalHeight / img.naturalWidth : .436, SY = Math.max(1, Math.min(2.6, Math.max(E * 1.15, u * .9) / (W * ratio)));
      /* 蓄力：砲口光環＋往砲口吸的電光 */
      X().ring(M.x, M.y, { r0: u * .5, r1: u * .08, color: '#ff4f9a', w: 5, life: .32 }); X().glow(M.x, M.y, { color: '#ff4f9a', r: u * .26, life: .45, hold: true });
      for (let i = 0; i < 5; i++) { const a = Math.random() * TAU, r = u * (.35 + Math.random() * .25); try { X().bolt(M.x + Math.cos(a) * r, M.y + Math.sin(a) * r, M.x, M.y, { color: '#ff7ab8', life: .2 + i * .03, amp: u * .05 }); } catch (e2) { } }
      await fw(210); X().ring(M.x, M.y, { r0: u * .4, r1: u * .06, color: '#ffd0e8', w: 4, life: .22 });
      await fw(170); sfx('thunder'); sfx('explode');
      const T1 = .1, T2 = .52, LIFE = .85;
      const o = { life: LIFE, w: W, ax: rg[0], ay: rg[1], fx: d > 0, x: M.x, y: (q, t) => M.y + (t < T2 ? Math.sin(t * 110) * E * .008 : 0), r: d > 0 ? ang : ang - PI,
        sy: (q, t) => t < T1 ? SY * (.5 + .6 * t / T1) : t < T2 ? SY * (1.1 - .1 * (t - T1) / (T2 - T1)) : SY * lerp(1, .18, eIn((t - T2) / (LIFE - T2))),
        a: (q, t) => t > T2 ? Math.max(0, 1 - (t - T2) / (LIFE - T2)) : 1,
        clip: (c, x0, y0, w, h, q, t) => { const p = eOut(t / T1); c.rect(x0 + w * (1 - p), y0 - h, w * p + 2, h * 3); } };
      sp('rail', o); sp('rail', Object.assign({}, o, { add: true, a: (q, t) => .45 * o.a(q, t) }));
      mv(A.S, 'recoil'); X().flash('#ffd0e8', .16, .4);
      await fw(T1 * 1000);
      X().burst(G.x, G.y, { r: E * .6, color: 'rgba(255,70,150,.95)' }); X().ring(G.x, G.y, { r1: E * 1.3, color: '#ff7ab8', w: 12, life: .5 });
      X().particles({ x: G.x, y: G.y, n: 30, spd: [E * .8, E * 2.6], life: [.3, .8], size: [3, 7], colors: ['#ffffff', '#ff7ab8', '#ff2a6a', '#c01a5a'], shape: 'spark', add: true, g: 160 });
      hit(A);
      await fw(190); sfx('heavy'); try { shake(); } catch (e2) { } X().ring(G.x, G.y, { r1: E * .9, color: '#ffffff', w: 6, life: .4 });
      await fw(470); }
  };

  const keyOf = (actor, skill) => { if (!actor || !skill) return null; const id = skill.copiedFrom && skill.copiedFrom.id ? skill.copiedFrom.id : actor.id; return (MAP[id] && MAP[id][skill.name]) || null; };
  /* 掛在最外層（做法同 fx_imu_v170.js）：其他特效層有些在 DOMContentLoaded 才包上去（fx_v138 主題光環、fx_v140 招牌動畫——凱多的藍色青龍、佩羅娜的小幽靈、
     尼卡的「咚」字——會跟這 8 招的新素材疊在一起），所以這 8 招直接由這裡接手，不再跑通用特效層；其他招式原樣交給內層。 */
  function install() { const cur = window.playChoreo; if (typeof cur !== 'function' || cur.__fx196) return;
    const w = async function (side, actor, idx, skill) { const k = keyOf(actor, skill);
      if (!k || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') return cur.apply(this, arguments);
      try { if (!(await need(k))) return cur.apply(this, arguments);
        FXE.ensure(); const S = side === 'P' ? 'L' : 'R', T = S === 'L' ? 'R' : 'L'; await VFX[k]({ S, T, f: pt(S), t: pt(T), d: S === 'L' ? 1 : -1 });
      } catch (e) { console.warn('fx196', e); return cur.apply(this, arguments); } };
    w.__fx196 = true; w.__fx3 = cur.__fx3; w.__vfx = cur.__vfx; w.__imu170 = cur.__imu170; window.playChoreo = w; try { playChoreo = w; } catch (e) { } }
  install(); addEventListener('DOMContentLoaded', () => setTimeout(install, 0)); addEventListener('load', () => setTimeout(install, 0));
  /* 開戰時先把出場角色會用到的素材載好、解碼好（不在場的角色不下載） */
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { const r = _sb.apply(this, arguments);
    try { install(); const b = typeof battle !== 'undefined' && battle; if (b) { const ids = new Set(); (b.team || []).forEach(f => ids.add(f.id)); (b.enemies || []).forEach(f => ids.add(f.id)); if (b.enemy) ids.add(b.enemy.id); if (b.player) ids.add(b.player.id);
        ids.forEach(id => { if (MAP[id]) Object.values(MAP[id]).forEach(k => { const i = get(k); try { if (i.decode) i.decode().catch(() => { }); } catch (e) { } }); }); } } catch (e) { } return r; };
    try { window.startBattle = startBattle; } catch (e) { } }
  window.__fx196 = { VFX, MAP, pt, keyOf };
})();
