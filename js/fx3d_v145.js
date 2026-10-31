/* v145 戰鬥特效 3D 層（Three.js / WebGL2）：
   ① 背景層 #bGL：戰鬥背景改用 GPU 繪製——命中時衝擊波扭曲背景（含色差）、奧義時鏡頭推近＋放射模糊、依招式屬性打光、火系熱浪。
   ② 粒子層 #bPGL：GPU 粒子（一次最多數千顆），依屬性有火星與火焰、冰晶、電火花、水珠與氣泡、暗黑煙霧、光點、花瓣、碎石與煙塵、斬擊光痕。
   ③ 奧義最後一擊的「衝擊格」（黑白反轉兩格）、出招殘影、受擊全身閃白。
   原本的 2D 特效（fx.js、fx_v138.js、各角色編排）照常播放，這一層疊加在上面。
   開關：技能特效「高」（op_fxpro）且畫質不是「省電」（op_gfx）才開；不支援 WebGL2 時自動不開。Three.js 在第一次進戰鬥時才載入。 */
(function () {
  const ok = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } })();
  const enabled = () => { try { return ok && localStorage.getItem('op_fxpro') !== '0' && localStorage.getItem('op_gfx') !== 'low'; } catch (e) { return ok; } };
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700;
  const $ = id => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
  const THEME = { '火': 'fire', '冰': 'ice', '雷電': 'bolt', '水': 'water', '魚人': 'water', '闇': 'dark', '超能': 'psy', '龍': 'psy', '自然': 'nature', '格鬥': 'fist', '獸': 'fist', '巨人': 'fist' };
  const COLT = { blue: 'ice', gold: 'light', red: 'fire', purple: 'dark', green: 'nature' };
  const PAL0 = { fire: ['#fff3c0', '#ffb02e', '#ff4a1a', '#7a1200'], ice: ['#ffffff', '#c8f4ff', '#6fd3ff', '#1a5aa8'], bolt: ['#ffffff', '#fff27a', '#ffd23b', '#6a8aff'], water: ['#ffffff', '#bfeaff', '#3fa8ff', '#0a3a8a'], dark: ['#f0d0ff', '#b05aff', '#5a1a9a', '#120018'], light: ['#ffffff', '#fff6c8', '#ffd86a', '#8a6a1a'], fist: ['#ffffff', '#ffe0a0', '#ff8a3a', '#5a2a0a'] };
  const pal = th => (window.__FXPAL && __FXPAL[th]) || PAL0[th] || PAL0.fist;
  const themeOf = f => { const C = f && typeof CHAR_FX !== 'undefined' && CHAR_FX[f.id]; if (C) return C[0]; for (const x of (f && f.types) || []) if (THEME[x]) return THEME[x]; return 'fist'; };
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  let T = null, loading = null, rd = null, prd = null, bgM = null, bgS = null, cam = null, pS = null, pCam = null, ADD = null, NRM = null;
  const MAXP = MOB ? 1400 : 3200;
  /* ---------- 載入 ---------- */
  function load() { if (T || loading || !enabled()) return loading; loading = import('three').then(m => { T = m; init(); }).catch(e => { console.warn('戰鬥 3D 特效載入失敗', e); }); return loading; }

  /* ---------- ① 背景層 ---------- */
  const BG_FS = `uniform sampler2D tBg; uniform vec2 uRes, uImg, uZC; uniform float uTime, uDim, uSat, uZoom, uRad, uTintK, uHaze, uReady; uniform vec3 uTint; uniform vec4 uW[4]; varying vec2 vUv;
    vec2 cover(vec2 uv){ float sa = uRes.x/uRes.y, ia = uImg.x/uImg.y; vec2 s = sa > ia ? vec2(1., ia/sa) : vec2(sa/ia, 1.); return (uv - .5)*s + .5; }
    float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); } float ns(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y); }
    void main(){ vec2 asp = vec2(uRes.x/uRes.y, 1.); vec2 uv = vUv; vec2 off = vec2(0.); float ca = 0.;
      for (int i = 0; i < 4; i++) { vec4 w = uW[i]; float age = uTime - w.z; if (w.w <= 0. || age < 0. || age > .9) continue; float r = age*1.35, d = length((uv - w.xy)*asp), k = exp(-pow((d - r)/.07, 2.)) * w.w * (1. - age/.9); off += normalize((uv - w.xy)*asp + 1e-5) * k * .035; ca += k; }
      if (uHaze > 0.) off += vec2(ns(uv*8. + vec2(0., -uTime*2.)) - .5, ns(uv*7. + vec2(uTime, -uTime*1.6)) - .5) * .012 * uHaze;
      uv = uZC + (uv + off - uZC) / uZoom;
      vec3 col = vec3(0.); float n = uRad > .001 ? 8. : 1.;
      for (int i = 0; i < 8; i++) { if (float(i) >= n) break; vec2 su = uZC + (uv - uZC) * (1. - uRad*float(i)/8.*.12); vec2 cu = cover(su);
        col += vec3(texture2D(tBg, cover(su + vec2(ca*.006, 0.))).r, texture2D(tBg, cu).g, texture2D(tBg, cover(su - vec2(ca*.006, 0.))).b); }
      col /= n; float l = dot(col, vec3(.299,.587,.114)); col = mix(vec3(l), col, uSat) * uDim;
      col = mix(col, col*(.55 + uTint*.75), uTintK); vec2 q = vUv - .5; col *= 1. - dot(q, q)*.5;
      gl_FragColor = vec4(col * uReady, uReady); }`;
  const BU = {};
  function initBg() {
    const scr = $('battleScreen'), cv = document.createElement('canvas'); cv.id = 'bGL'; cv.className = 'b-gl'; cv.setAttribute('aria-hidden', 'true'); $('bBg').insertAdjacentElement('afterend', cv);
    rd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }); rd.setClearColor(0x000000, 0);
    Object.assign(BU, { tBg: { value: null }, uRes: { value: new T.Vector2(1, 1) }, uImg: { value: new T.Vector2(16, 9) }, uZC: { value: new T.Vector2(.5, .5) }, uTime: { value: 0 }, uDim: { value: .66 }, uSat: { value: 1.1 }, uZoom: { value: 1 }, uRad: { value: 0 }, uTintK: { value: 0 }, uHaze: { value: 0 }, uReady: { value: 0 }, uTint: { value: new T.Color(1, 1, 1) }, uW: { value: [0, 1, 2, 3].map(() => new T.Vector4(0, 0, -9, 0)) } });
    bgM = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ uniforms: BU, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: BG_FS, transparent: true, depthTest: false }));
    bgS = new T.Scene(); bgS.add(bgM); cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    /* 背景圖換了就重新載入（battle.js 設定 #bBg 的 background-image） */
    const sync = () => { const m = /url\(["']?([^"')]+)["']?\)/.exec($('bBg').style.backgroundImage || ''); const url = m && m[1]; if (!url || url === BS.url) return; BS.url = url; BU.uReady.value = 0; $('battleScreen').classList.remove('gl-bg');
      new T.TextureLoader().load(url, t => { if (BS.url !== url) return; t.colorSpace = T.SRGBColorSpace; t.minFilter = T.LinearFilter; t.generateMipmaps = false; if (BU.tBg.value) BU.tBg.value.dispose(); BU.tBg.value = t; BU.uImg.value.set(t.image.width, t.image.height); BU.uReady.value = 1; $('battleScreen').classList.add('gl-bg'); wake(); }); };
    new MutationObserver(sync).observe($('bBg'), { attributes: true, attributeFilter: ['style'] }); sync();
    new MutationObserver(() => wake()).observe(scr, { attributes: true, attributeFilter: ['class'] });
  }
  const BS = { url: '', zoom: 1, zT: 1, rad: 0, rT: 0, tint: [1, 1, 1], tK: 0, tT: 0, haze: 0, hT: 0, zc: [.5, .5], waves: 0 };

  /* ---------- ② 粒子層：每顆粒子是一個面片（可拉長成光痕、旋轉、換形狀） ---------- */
  const P_VS = `attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; varying vec2 vUv; varying vec4 vCol; varying float vShape;
    void main(){ vUv = uv; vCol = vec4(iC.rgb, iB.w); vShape = iC.w; vec2 p = position.xy; p.x *= iB.y; float c = cos(iB.z), s = sin(iB.z); p = mat2(c, s, -s, c) * p * iB.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(iA.xy + p, 0., 1.); }`;
  const P_FS = `varying vec2 vUv; varying vec4 vCol; varying float vShape; void main(){ vec2 q = vUv*2. - 1.; float r = length(q); float a;
      if (vShape < .5) { a = exp(-r*r*4.5) + smoothstep(.22, 0., r)*.9; }                                   /* 光點 */
      else if (vShape < 1.5) { a = exp(-q.y*q.y*18.) * smoothstep(1., .2, abs(q.x)) * (1. + smoothstep(.5, 1., q.x)); }   /* 光痕（往前方較亮） */
      else if (vShape < 2.5) { a = smoothstep(1., .9, abs(q.x) + abs(q.y)) * (.55 + .45*(1. - abs(q.x))) ; }       /* 冰晶 */
      else if (vShape < 3.5) { a = smoothstep(.12, 0., abs(r - .8)) + smoothstep(.95, .0, r)*.12; }           /* 圓環（衝擊波、氣泡） */
      else if (vShape < 4.5) { a = smoothstep(1., .1, r) * .55; }                                               /* 煙霧 */
      else if (vShape < 5.5) { vec2 k = q*vec2(1., 2.); a = smoothstep(1., .75, length(k)); }                  /* 花瓣、葉片 */
      else if (vShape < 6.5) { a = smoothstep(1., .85, max(abs(q.x), abs(q.y))) ; }                             /* 碎石 */
      else { float st = max(exp(-q.x*q.x*60.)*smoothstep(1., 0., abs(q.y)), exp(-q.y*q.y*60.)*smoothstep(1., 0., abs(q.x))); a = st + exp(-r*r*8.)*.6; }  /* 十字星光 */
      gl_FragColor = vec4(vCol.rgb * a * vCol.a, a * vCol.a); if (gl_FragColor.a < .003) discard; }`;
  const PS = { list: [], free: [] };
  function mkLayer(blend) {
    const g = new T.InstancedBufferGeometry(); g.copy(new T.PlaneGeometry(1, 1)); g.instanceCount = 0;
    const A = new T.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4), B = new T.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4), C = new T.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4);
    [A, B, C].forEach(x => x.setUsage(T.DynamicDrawUsage)); g.setAttribute('iA', A); g.setAttribute('iB', B); g.setAttribute('iC', C);
    const m = new T.Mesh(g, new T.ShaderMaterial({ vertexShader: P_VS, fragmentShader: P_FS, transparent: true, depthTest: false, depthWrite: false, premultipliedAlpha: true,
      blending: blend === 'add' ? T.CustomBlending : T.NormalBlending, blendSrc: T.OneFactor, blendDst: blend === 'add' ? T.OneFactor : T.OneMinusSrcAlphaFactor }));
    m.frustumCulled = false; pS.add(m); return { m, g, A, B, C };
  }
  function initP() {
    const cv = document.createElement('canvas'); cv.id = 'bPGL'; cv.className = 'b-canvas b-pgl'; cv.setAttribute('aria-hidden', 'true');
    const ref = $('bBloom') || $('bCanvas'); ref.insertAdjacentElement('afterend', cv);
    prd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, premultipliedAlpha: true }); prd.setClearColor(0x000000, 0);
    pS = new T.Scene(); pCam = new T.OrthographicCamera(0, 1, 0, 1, -1, 1); NRM = mkLayer('normal'); ADD = mkLayer('add');
  }
  function init() { try { initBg(); initP(); window.FX3D.ready = true; } catch (e) { console.warn('戰鬥 3D 特效初始化失敗', e); window.FX3D.ready = false; } }

  /* 座標：特效以「畫面座標」（#battleScreen 內的像素）計算 */
  let geo = { S: 1, OX: 0, OY: 0, SW: 1, SH: 1 };
  function measure() { const A = $('bArena'), scr = $('battleScreen'); if (!A || !scr) return; const aR = A.getBoundingClientRect(), sR = scr.getBoundingClientRect(); geo = { S: aR.width / (A.offsetWidth || 1), OX: aR.left - sR.left, OY: aR.top - sR.top, SW: sR.width, SH: sR.height }; }
  const toScr = p => [p.x * geo.S + geo.OX, p.y * geo.S + geo.OY];
  const pt = side => { measure(); try { return toScr(fighterPoint(side)); } catch (e) { return [geo.SW * (side === 'L' ? .3 : .7), geo.SH * .5]; } };

  /* 粒子：x y vx vy 大小 長寬比 角度 角速度 顏色 透明度 形狀 壽命 阻力 重力 長大 加法混合 */
  function emit(o) { if (PS.list.length >= MAXP * 2 - 10) return; PS.list.push(Object.assign({ t: 0, vx: 0, vy: 0, s: 20, g: 0, drag: 0, grow: 0, rot: 0, vr: 0, st: 1, a: 1, shape: 0, add: true, life: .5, flick: 0, stretch: 0 }, o)); }
  function spark(x, y, c, n, sp, o) { for (let i = 0; i < n; i++) { const a = R(0, TAU), v = R(sp[0], sp[1]); emit(Object.assign({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - R(0, 150), s: R(10, 22), shape: 1, stretch: .022, col: c, life: R(.25, .6), drag: 3.2, g: 900 }, o)); } }
  function glow(x, y, c, s, life, o) { emit(Object.assign({ x, y, s, col: c, life, shape: 0, grow: -.2 }, o)); }
  function ring(x, y, c, s0, s1, life, o) { emit(Object.assign({ x, y, s: s0, s1, col: c, life, shape: 3, ring: true }, o)); }

  /* ---------- 屬性爆發 ---------- */
  function impact(x, y, th, big, side) {
    const P = pal(th).map(hex), W = [1, 1, 1], k = big ? 1.15 : .9, n = v => Math.round(v * k * (MOB ? .65 : 1));
    glow(x, y, W, big ? 170 : 120, .16, { a: .8 }); glow(x, y, P[2], big ? 300 : 210, .3, { grow: .4, a: .55 }); ring(x, y, mix(P[1], W, .3), 40, big ? 480 : 320, big ? .5 : .4, { a: .75 }); if (big) ring(x, y, P[2], 30, 760, .65, { a: .45 });
    spark(x, y, mix(P[1], W, .25), n(50), [380, big ? 1400 : 950]);
    const fx = {
      fire() { for (let i = 0; i < n(36); i++) emit({ x: x + R(-60, 60), y: y + R(-40, 40), vx: R(-90, 90), vy: R(-320, -90), s: R(14, 30), col: mix(P[1], P[2], Math.random()), life: R(.6, 1.2), shape: 0, flick: 1, drag: 1, g: -60 });
        for (let i = 0; i < n(14); i++) emit({ x: x + R(-50, 50), y: y + R(-30, 30), vx: R(-60, 60), vy: R(-220, -60), s: R(60, 120), grow: 1.4, col: mix(P[2], P[3], .3), life: R(.5, .9), shape: 4, drag: 1.4 }); },
      ice() { for (let i = 0; i < n(34); i++) { const a = R(0, TAU), v = R(240, 820); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, s: R(14, 34), st: R(.45, .7), rot: R(0, TAU), vr: R(-12, 12), col: mix(P[1], W, .5), life: R(.6, 1.1), shape: 2, drag: 2, g: 1100 }); }
        for (let i = 0; i < n(8); i++) emit({ x: x + R(-60, 60), y: y + R(-40, 40), vx: R(-40, 40), vy: R(-50, 10), s: R(90, 160), grow: 1, col: P[1], a: .45, life: R(.7, 1.1), shape: 4, add: false }); },
      bolt() { for (let b = 0; b < (big ? 4 : 2); b++) { let px = x, py = y; const a0 = R(0, TAU), L = R(160, 380); for (let i = 0; i < 18; i++) { const t = i / 17; px = x + Math.cos(a0) * L * t + R(-26, 26); py = y + Math.sin(a0) * L * t + R(-26, 26); glow(px, py, i % 3 ? P[2] : W, R(16, 30), R(.12, .22), { flick: 1 }); } }
        spark(x, y, mix(P[1], W, .5), n(60), [700, 1800], { life: R(.15, .3), stretch: .03 }); },
      water() { for (let i = 0; i < n(60); i++) { const a = R(-Math.PI, 0), v = R(300, 900); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(8, 18), st: .7, col: mix(P[1], W, .4), life: R(.6, 1), shape: 0, drag: .8, g: 1500 }); }
        for (let i = 0; i < n(14); i++) emit({ x: x + R(-80, 80), y: y + R(-50, 50), vx: R(-30, 30), vy: R(-160, -60), s: R(14, 36), col: P[1], life: R(.8, 1.4), shape: 3, flick: 0 }); ring(x, y, P[2], 60, 520, .6, { st: .45 }); },
      dark() { for (let i = 0; i < n(16); i++) emit({ x: x + R(-60, 60), y: y + R(-50, 50), vx: R(-80, 80), vy: R(-140, -20), s: R(80, 170), grow: 1.2, col: [.06, .0, .1], a: .75, life: R(.6, 1.1), shape: 4, add: false, drag: 1.5 });
        for (let i = 0; i < n(40); i++) { const a = R(0, TAU), v = R(80, 420); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, s: R(16, 34), col: mix(P[1], P[2], Math.random()), life: R(.6, 1.2), shape: 0, drag: 2.2, g: -120, flick: 1 }); } },
      light() { for (let i = 0; i < n(36); i++) { const a = R(0, TAU), v = R(120, 600); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(20, 48), rot: R(0, 1), vr: R(-3, 3), col: mix(P[1], W, .5), life: R(.5, 1), shape: 7, drag: 2.6 }); } },
      nature() { for (let i = 0; i < n(32); i++) { const a = R(0, TAU), v = R(160, 620); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, s: R(14, 26), rot: R(0, TAU), vr: R(-9, 9), col: mix(P[1], P[2], Math.random()), life: R(.9, 1.5), shape: 5, drag: 2.4, g: 260, add: false }); } },
      fist() { const gy = y + R(60, 110); for (let i = 0; i < n(28); i++) { const a = R(-Math.PI * .95, -Math.PI * .05), v = R(300, 950); emit({ x, y: gy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(8, 22), rot: R(0, TAU), vr: R(-10, 10), col: mix(P[3], [.55, .45, .35], .5), life: R(.6, 1.1), shape: 6, g: 2000, drag: .4, add: false }); }
        for (let i = 0; i < n(12); i++) emit({ x: x + R(-90, 90), y: gy + R(-10, 20), vx: R(-160, 160), vy: R(-80, -10), s: R(90, 170), grow: 1.3, col: [.62, .56, .5], a: .5, life: R(.8, 1.3), shape: 4, add: false, drag: 2 }); },
      sword() { const a = R(-.7, .7); for (let i = 0; i < 3; i++) { emit({ x: x + R(-30, 30), y: y + (i - 1) * 46, s: big ? 820 : 640, st: .05, rot: a + (i - 1) * .14, col: mix(P[2], W, .5), life: .32, shape: 1 }); emit({ x: x + R(-30, 30), y: y + (i - 1) * 46, s: big ? 900 : 700, st: .12, rot: a + (i - 1) * .14, col: P[2], a: .45, life: .38, shape: 1 }); }
        spark(x, y, W, n(70), [600, 1600], { life: R(.15, .35) }); this.fist(); },
      haki() { this.dark(); this.bolt(); },
    };
    const alias = { psy: 'light', sand: 'fist', quake: 'fist', poison: 'dark', shadow: 'dark', thread: 'sword', haki: 'haki' };
    try { (fx[th] || fx[alias[th]] || fx.fist).call(fx); } catch (e) { }
    /* 背景：衝擊波扭曲＋屬性閃光 */
    if (BU.uW && !RM) { const w = BU.uW.value[BS.waves++ % 4]; w.set(x / geo.SW, 1 - y / geo.SH, BU.uTime.value, big ? 1.25 : .85); BS.punch = Math.max(BS.punch || 0, big ? .07 : .045); BS.pc = [x / geo.SW, 1 - y / geo.SH]; }   /* 背景震推 */
    BS.tint = pal(th).map(hex)[2]; BS.tK = Math.max(BS.tK, big ? .5 : .3); BS.tT = 0;
    if (side) silhouette(side);
    wake();
  }

  /* 受擊閃白：用立繪當遮罩的白色剪影，不動到原本立繪的濾鏡動畫 */
  function silhouette(side) { const f = $('bF' + side), img = $('bImg' + side); if (!f || !img || !img.src) return; let s = f.querySelector('.fx3-sil');
    if (!s) { s = document.createElement('i'); s.className = 'fx3-sil'; f.appendChild(s); }
    Object.assign(s.style, { left: img.offsetLeft + 'px', top: img.offsetTop + 'px', width: img.offsetWidth + 'px', height: img.offsetHeight + 'px', webkitMaskImage: `url("${img.src}")`, maskImage: `url("${img.src}")`, transform: getComputedStyle(img).transform === 'none' ? '' : getComputedStyle(img).transform });
    s.getAnimations().forEach(a => a.cancel()); s.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 170, easing: 'ease-out' }); }

  /* 出招殘影 */
  function ghosts(side, col) { if (RM) return; const img = $('bImg' + side), scr = $('battleScreen'); if (!img || !scr) return; const sR = scr.getBoundingClientRect(); let k = 0;
    const tick = () => { if (k++ > 8) return; const r = img.getBoundingClientRect(); if (r.width > 4) { const g = img.cloneNode(); g.removeAttribute('id'); g.className = 'fx3-ghost'; Object.assign(g.style, { left: r.left - sR.left + 'px', top: r.top - sR.top + 'px', width: r.width + 'px', height: r.height + 'px', filter: `brightness(1.7) drop-shadow(0 0 10px ${col})` });
      scr.appendChild(g); g.animate([{ opacity: .42 }, { opacity: 0 }], { duration: 320, easing: 'ease-out' }).onfinish = () => g.remove(); } setTimeout(tick, 48 / (window.BSPEED || 1)); }; tick(); }

  /* 奧義最後一擊：黑白衝擊格 */
  function impactFrame() { if (RM) return; const s = $('battleScreen'); s.classList.add('fx3-if1'); setTimeout(() => { s.classList.remove('fx3-if1'); s.classList.add('fx3-if2'); }, 70); setTimeout(() => s.classList.remove('fx3-if2'), 150); }

  /* 奧義蓄力：粒子往施放者聚集、鏡頭推近、背景染色 */
  function charge(side, th, ult) { const [x, y] = pt(side), P = pal(th).map(hex), N = (ult ? 90 : 30) * (MOB ? .6 : 1);
    for (let i = 0; i < N; i++) { const a = R(0, TAU), d = R(180, ult ? 520 : 300), life = R(.45, .8); emit({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: -Math.cos(a) * d / life, vy: -Math.sin(a) * d / life, s: R(12, 26), shape: 1, stretch: .012, col: mix(P[1], [1, 1, 1], .4), life, t: -R(0, ult ? .35 : .15) }); }
    glow(x, y, P[2], ult ? 300 : 180, ult ? 1 : .5, { grow: .3, a: .5 }); if (ult) { ring(x, y, P[2], 700, 60, .8, { a: .6 }); BS.zT = 1.09; BS.rT = 1; BS.zc = [x / geo.SW, 1 - y / geo.SH]; BS.hT = th === 'fire' ? 1 : 0; }
    BS.tint = P[2]; BS.tK = Math.max(BS.tK, ult ? .45 : .2); BS.tT = 0; wake(); }



  /* ---------- v145 第二輪：鏡頭推近、命中停格、奧義氣場、地面焦痕、畫面邊緣屬性光 ---------- */
  let dolly = null;
  /* 疊加在原本的鏡頭縮放（--cam、--camY）之上，以角色位置為中心推近 */
  let dollyT = '';
  function camPush(side, s, ms) { if (RM) return; const a = $('bArena'); if (!a) return; let p; try { p = fighterPoint(side); } catch (e) { p = null; } if (!p) return;
    const cs = getComputedStyle(a), ox = parseFloat(cs.transformOrigin) || a.offsetWidth / 2, oy = parseFloat(cs.transformOrigin.split(' ')[1]) || a.offsetHeight, dx = p.x - ox, dy = p.y - oy;
    const to = `translate(${dx}px, ${dy}px) scale(${s}) translate(${-dx}px, ${-dy}px)`, from = dollyT || 'translate(0px, 0px) scale(1) translate(0px, 0px)';
    if (dolly) dolly.cancel(); dollyT = to; dolly = a.animate([{ transform: from }, { transform: to }], { duration: ms, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards', composite: 'add' }); }
  function camRelease(ms) { if (!dolly) return; const a = $('bArena'), from = dollyT; dolly.cancel(); dolly = null; dollyT = '';
    a.animate([{ transform: from }, { transform: 'translate(0px, 0px) scale(1) translate(0px, 0px)' }], { duration: ms || 420, easing: 'cubic-bezier(.3,0,.2,1)', composite: 'add' }); }
  function hitStop(ms) { if (RM) return; const s = $('battleScreen'); s.classList.add('fx3-stop'); stopUntil = performance.now() + ms; setTimeout(() => s.classList.remove('fx3-stop'), ms); }
  let stopUntil = 0;
  function aura2(side, th) { if (RM) return; const f = $('bF' + side), img = $('bImg' + side); if (!f || !img || !img.src) return; const col = toHex(pal(th).map(hex)[2]); let a = f.querySelector('.fx3-aura');
    if (!a) { a = document.createElement('i'); a.className = 'fx3-aura'; f.insertBefore(a, img); }
    Object.assign(a.style, { left: img.offsetLeft + 'px', top: img.offsetTop + 'px', width: img.offsetWidth + 'px', height: img.offsetHeight + 'px', background: col, webkitMaskImage: `url("${img.src}")`, maskImage: `url("${img.src}")`, transform: (getComputedStyle(img).transform === 'none' ? '' : getComputedStyle(img).transform) });
    a.getAnimations().forEach(x => x.cancel()); a.animate([{ opacity: 0, scale: '1' }, { opacity: .9, scale: '1.05', offset: .25 }, { opacity: .55, scale: '1.08', offset: .6 }, { opacity: .85, scale: '1.06', offset: .8 }, { opacity: 0, scale: '1.12' }], { duration: 1500 / (window.BSPEED || 1), easing: 'ease-out' }); }
  function scorch(x, y, th) { const P = pal(th).map(hex), gy = y + 105; emit({ x, y: gy, s: 340, st: .26, col: [.04, .03, .03], a: .55, life: 1.8, shape: 4, add: false });
    emit({ x, y: gy, s: 260, st: .22, col: mix(P[2], [1, 1, 1], .2), a: .7, life: .9, shape: 0, grow: .3 });
    for (let i = 0; i < 10; i++) { const a = R(-Math.PI, Math.PI); emit({ x: x + Math.cos(a) * 50, y: gy + Math.sin(a) * 12, s: R(70, 150), st: .05, rot: Math.atan2(Math.sin(a) * .26, Math.cos(a)), col: [.05, .04, .04], a: .6, life: 1.6, shape: 1, add: false }); } }
  function edge(th) { const P = pal(th).map(hex), D = Math.hypot(geo.SW, geo.SH); ring(geo.SW / 2, geo.SH / 2, P[2], D * .62, D * .52, .7, { a: .65 }); ring(geo.SW / 2, geo.SH / 2, mix(P[1], [1, 1, 1], .3), D * .58, D * .5, .5, { a: .5 }); }

  /* ---------- v145 奧義強化 ---------- */
  const toHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
  /* 蓄力：腳下光圈＋屬性能量往上竄（約 1 秒） */
  function aura(side, th) { if (RM) return; const [x, y] = pt(side), P = pal(th).map(hex), W = [1, 1, 1], n = MOB ? 4 : 8; let k = 0;
    const tick = () => { if (k++ > 18 || !cur) return; const fy = y + 110;
      for (let i = 0; i < n; i++) emit({ x: x + R(-80, 80), y: fy + R(-10, 10), vx: R(-25, 25), vy: R(-760, -360), s: R(12, 24), shape: 1, stretch: .016, col: mix(P[i % 2 ? 1 : 2], W, .3), life: R(.35, .6), drag: .6 });
      if (k % 3 === 1) { glow(x, fy, P[2], 340, .3, { st: .3, a: .55 }); ring(x, fy, mix(P[1], W, .3), 60, 300, .45, { st: .3, a: .6 }); }
      wake(); setTimeout(tick, 50 / (window.BSPEED || 1)); }; tick(); }
  /* 終結一擊：集中線＋三重衝擊波＋光柱＋屬性風暴＋餘燼 */
  function finisher(x, y, th) { const P = pal(th).map(hex), W = [1, 1, 1], D = Math.hypot(geo.SW, geo.SH), N = MOB ? 40 : 72;
    for (let i = 0; i < N; i++) { const a = R(0, TAU), d = R(.22, .42) * D; emit({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, s: R(.25, .5) * D, st: R(.012, .03), rot: a, col: i % 3 ? W : mix(P[1], W, .4), a: R(.5, .9), life: R(.22, .38), shape: 1 }); }
    glow(x, y, W, 460, .22, { a: .95 }); glow(x, y, P[2], 900, .5, { grow: .3, a: .5 });
    [0, 90, 180].forEach((t, i) => setTimeout(() => { ring(x, y, i === 1 ? W : mix(P[1 + (i > 1)], W, .25), 60, D * (.55 + i * .18), .55 + i * .1, { a: .8 - i * .15 }); wake(); }, t / (window.BSPEED || 1)));
    emit({ x, y: y - geo.SH * .1, s: geo.SH * 1.6, st: .06, rot: Math.PI / 2, col: mix(P[2], W, .5), a: .85, life: .42, shape: 1 }); emit({ x, y: y - geo.SH * .1, s: geo.SH * 1.7, st: .16, rot: Math.PI / 2, col: P[2], a: .45, life: .55, shape: 1 });
    scorch(x, y, th); edge(th); hitStop(90);
    impact(x, y, th, true); setTimeout(() => impact(x + R(-90, 90), y + R(-60, 40), th, true), 120 / (window.BSPEED || 1)); setTimeout(() => impact(x + R(-120, 120), y + R(-80, 60), th, true), 260 / (window.BSPEED || 1));
    let k = 0; const ember = () => { if (k++ > 26) return; for (let i = 0; i < (MOB ? 3 : 5); i++) emit({ x: x + R(-.35, .35) * geo.SW, y: y + R(-.2, .3) * geo.SH, vx: R(-30, 30), vy: R(-90, -30), s: R(8, 18), col: mix(P[1], P[2], Math.random()), life: R(.8, 1.5), flick: 1, drag: .5 }); wake(); setTimeout(ember, 55); }; setTimeout(ember, 200);
    if (BU.uW && !RM) { BS.punch = .11; BS.pc = [x / geo.SW, 1 - y / geo.SH]; BS.rad = Math.max(BS.rad, 1.4); }
    BS.tint = P[2]; BS.tK = .7; BS.tT = 0; wake(); }

  /* ---------- 迴圈：有東西在動才畫 ---------- */
  let raf = 0, last = 0, t0 = performance.now();
  function wake() { if (!raf && window.FX3D.ready) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function loop(now) {
    raf = 0; const dt = now < stopUntil ? 0 : Math.min(.05, (now - last) / 1000) * (window.BSPEED || 1); last = now; BU.uTime.value = (now - t0) / 1000;
    const scr = $('battleScreen'); if (!scr || scr.classList.contains('hidden')) { PS.list.length = 0; return; }
    measure(); const dpr = Math.min(MOB ? 1.25 : 1.75, devicePixelRatio || 1), W = Math.max(1, Math.round(geo.SW)), H = Math.max(1, Math.round(geo.SH));
    /* 背景 */
    const foc = scr.classList.contains('fxp-focus'); BS.zoom += (BS.zT - BS.zoom) * Math.min(1, dt * 5); BS.rad += (BS.rT - BS.rad) * Math.min(1, dt * 6); BS.tT += dt; BS.tK *= Math.pow(.18, dt); BS.haze += (BS.hT - BS.haze) * Math.min(1, dt * 3);
    if (rd.domElement.width !== Math.round(W * dpr)) { rd.setPixelRatio(dpr); rd.setSize(W, H, false); } BU.uRes.value.set(W, H); BU.uDim.value = foc ? .5 : .66; BU.uSat.value = foc ? .8 : 1.1; BS.punch = (BS.punch || 0) * Math.pow(.004, dt); const pz = BS.punch || 0, zc = BS.zT > 1.01 ? BS.zc : (BS.pc || BS.zc); BU.uZoom.value = BS.zoom + pz; BU.uRad.value = Math.max(BS.rad, pz * 8); BU.uZC.value.set(zc[0], zc[1]); BU.uTint.value.setRGB(...BS.tint); BU.uTintK.value = BS.tK; BU.uHaze.value = BS.haze;
    rd.render(bgS, cam);
    /* 粒子 */
    const pc = prd.domElement; if (pc.width !== Math.round(W * dpr) || pc.height !== Math.round(H * dpr)) { prd.setPixelRatio(dpr); prd.setSize(W, H, false); }
    { const st = pc.style, px = v => v.toFixed(2) + 'px', key = [geo.OX, geo.OY, geo.S, W, H].map(v => v.toFixed(2)).join(); if (pc.__k !== key) { pc.__k = key; st.right = st.bottom = 'auto'; st.left = px(-geo.OX / geo.S); st.top = px(-geo.OY / geo.S); st.width = px(W / geo.S); st.height = px(H / geo.S); } }   /* 跟 fx.js 一樣：畫布反向放大蓋滿畫面 */
    pCam.right = W; pCam.bottom = H; pCam.updateProjectionMatrix();
    let na = 0, nn = 0; const live = [];
    for (const p of PS.list) { p.t += dt; if (p.t < 0) { live.push(p); continue; } if (p.t > p.life) continue; live.push(p);
      const k = p.t / p.life; p.vx *= Math.exp(-p.drag * dt); p.vy = p.vy * Math.exp(-p.drag * dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      let s = p.ring ? p.s + (p.s1 - p.s) * (1 - Math.pow(1 - k, 3)) : p.s * (1 + p.grow * k), st = p.st, rot = p.rot;
      if (p.shape === 1 && p.stretch) { const v = Math.hypot(p.vx, p.vy); st = Math.max(.08, 1 / (1 + v * p.stretch)); s = p.s / st * .5; rot = Math.atan2(p.vy, p.vx); }
      let a = p.a * (p.add ? .82 : 1) * (p.ring ? 1 - k : Math.min(1, k * 8) * (1 - k * k)); if (p.flick) a *= .6 + .4 * Math.sin(p.t * 40 + p.x);
      const L = p.add ? ADD : NRM, i = p.add ? na++ : nn++; if (i >= MAXP) continue;
      L.A.array.set([p.x, p.y, 0, 0], i * 4); L.B.array.set([s, st, rot, a], i * 4); L.C.array.set([p.col[0], p.col[1], p.col[2], p.shape], i * 4); }
    PS.list = live;
    [[ADD, na], [NRM, nn]].forEach(([L, c]) => { L.g.instanceCount = Math.min(c, MAXP); L.A.needsUpdate = L.B.needsUpdate = L.C.needsUpdate = true; });
    prd.render(pS, pCam);
    const busy = PS.list.length || (BS.punch || 0) > .001 || Math.abs(BS.zoom - BS.zT) > .002 || BS.rad > .01 || BS.tK > .01 || BS.haze > .01 || BU.uW.value.some(w => w.w > 0 && BU.uTime.value - w.z < .9) || foc !== BS.foc;
    BS.foc = foc; if (busy) raf = requestAnimationFrame(loop);
  }

  /* ---------- 掛到原本的戰鬥流程 ---------- */
  let cur = null;   /* 目前出招：{ side, theme, ult, hitDone } */
  function hook() {
    /* 命中：以「傷害數字跳出」為準（奧義編排不一定會呼叫 hitFX）；多段攻擊每 0.11 秒最多一次，奧義第一下加衝擊格 */
    if (typeof window.showDamage === 'function' && !window.showDamage.__fx3) { const _d = window.showDamage; let lastT = 0; window.showDamage = function (side, amount) { const r = _d.apply(this, arguments);
        if (window.FX3D.ready && enabled() && cur && cur.side !== side) try { const now = performance.now(), F = side === 'L' ? battle.player : battle.enemy, big = cur.ult || amount > (F ? F.maxHp * .12 : 1e9);
          if (big && cur.ult && !cur.hitDone) { cur.hitDone = true; impactFrame(); lastT = now; const [fx0, fy0] = pt(side); finisher(fx0, fy0, cur.theme); camPush(side, 1.1, 90); setTimeout(() => camRelease(520), 260 / (window.BSPEED || 1)); }
          else if (big && !cur.ult && now - lastT > 110) hitStop(55);
          if (now - lastT > 110 / (window.BSPEED || 1)) { lastT = now; const [x, y] = pt(side); impact(x, y, cur.theme, big, side); } } catch (e) { }
        return r; }; window.showDamage.__fx3 = true; }
    if (typeof window.playChoreo === 'function' && !window.playChoreo.__fx3) { const _p = window.playChoreo; window.playChoreo = async function (side, actor, idx, skill) {
        if (!window.FX3D.ready || !enabled()) { load(); return _p.apply(this, arguments); }
        const S = side === 'P' ? 'L' : 'R', ult = !!(skill && skill.ultimate), th = themeOf(actor), col = pal(th)[2]; cur = { side: S, theme: th, ult, hitDone: false };
        try { charge(S, th, ult); if (!(skill && skill.type === 'support')) ghosts(S, col); if (ult) { aura(S, th); aura2(S, th); camPush(S, 1.06, 650 / (window.BSPEED || 1)); setTimeout(() => { if (cur && !cur.hitDone) camRelease(600); }, 1300 / (window.BSPEED || 1)); } } catch (e) { }
        /* 奧義期間：全白閃光改成屬性色、強度壓低，避免畫面整片白、看不到特效 */
        const XX = typeof X !== 'undefined' ? X : null, _fl = XX && XX.flash, tf = toHex(mix(pal(th).map(hex)[1], [1, 1, 1], .35));
        if (ult && _fl && !RM) XX.flash = function (c, life, a) { let w = false; if (typeof c === 'string' && /^#?[0-9a-f]{3,6}$/i.test(c)) { const h = c.replace('#', ''), f = h.length === 3 ? h.split('').map(v => v + v).join('') : h; const v = hex('#' + f); w = Math.min(...v) > .82; } else if (c === 'white') w = true;
          return _fl.call(this, w ? tf : c, life, w ? Math.min(a || .7, .42) : a); };
        try { return await _p.apply(this, arguments); } finally { if (ult && _fl) XX.flash = _fl; camRelease(360); cur = null; BS.zT = 1; BS.rT = 0; BS.hT = 0; wake(); } }; window.playChoreo.__fx3 = true; }
  }
  window.FX3D = { ready: false, load, impact: (s, th, big) => { const [x, y] = pt(s); impact(x, y, th, big, s); }, charge, impactFrame, enabled };
  window.addEventListener('load', () => { setTimeout(hook, 0); });
  /* 第一次進戰鬥時載入 Three.js（之後一直保留） */
  if (typeof window.startBattle === 'function') { const _sb = window.startBattle; window.startBattle = function () { load(); const r = _sb.apply(this, arguments); setTimeout(wake, 0); return r; }; }
})();
