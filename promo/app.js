(() => {
const V = '?v=1';   /* 改圖或影片時加一，避開離線快取的舊檔 */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3), backOut = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

/* ---------- 資料（取自遊戲） ---------- */
const CH = [["east","東海篇","風車村的出航之日"],["alabasta","阿拉巴斯坦篇","被偷走的雨"],["skypiea","空島篇","神之國的鐘聲"],["enies","司法島篇","向世界政府宣戰"],["thriller","恐怖三桅帆船篇","被偷走的影子"],["marineford","頂上戰爭篇","馬林福特的處刑台"],["fishman","魚人島篇","海底一萬公尺的政變"],["dressrosa","德雷斯羅薩篇","愛與熱情與玩具之國"],["wholecake","蛋糕島篇","萬國的婚禮"],["wano","和之國篇","火祭之夜的鬼之島"],["dark","蜂巢島篇","海賊島的英雄"],["egghead","蛋頭島篇","未來島的天才"],["giant","巨人篇","艾爾巴夫的詛咒王子"]];
const CLIPS = { 0: ['isl_east', '東海篇・風車村'], 3: ['story', '劇情對白・每篇都有序章與尾聲'], 6: ['isl_fishman', '魚人島篇・龍宮城'], 9: ['isl_wano', '和之國篇・花之都'] };
const DECO = { 1: ['vortex', 'spin'], 4: ['marine_ship', 'sail'], 7: ['seamonster', 'rise'], 11: ['vortex', 'spin'] };
/* 奧義配色＝遊戲 js/fx_v111.js 的 PRESET；副標＝SUB */
const P = { taboo: { f: ['#ffffff', '#f0e8ff', '#c8b8ff'], s: ['#12002a', '#4a1a8a', '#ffffff'], g: '#c8a8ff' }, magma: { f: ['#fff6a0', '#ffb000', '#ff4a00'], s: ['#2a0030', '#c42d00', '#ffe0a0'], g: '#ff3a00' },
  scorch: { f: ['#ffe9a0', '#ff8a2a', '#c42000'], s: ['#000000', '#6a0000', '#ffb070'], g: '#ff5a1a' }, crimson: { f: ['#7a0000', '#3a0000', '#120000'], s: ['#000000', '#ff2a2a', '#ffffff'], g: '#ff1a1a' },
  void: { f: ['#3a1a5a', '#14001f', '#05000a'], s: ['#000000', '#ffd34a', '#fff0b0'], g: '#b03aff' }, prism: { f: ['#ff7ad9', '#7a8aff', '#5af0ff'], s: ['#14002a', '#ffffff', '#ffd0ff'], g: '#5aa0ff' } };
const EM = [
  ['whitebeard', '白鬍子', '愛德華・紐蓋特', '老爹', 'taboo', '世界最強的男人', 'ult_wb'],
  ['bigmom', 'BIG MOM', '夏洛特・玲玲', '霸海', 'magma', '靈魂與火焰，吞沒大海'],
  ['kaido_v128', '凱多', '百獸海賊團總督', '升龍・火焰八卦', 'scorch', '百獸之王，升龍而起'],
  ['shanks', '紅髮', '紅髮傑克斯', '神避', 'crimson', '霸王之氣，斬開天地', 'ult_shanks'],
  ['blackbeard', '黑鬍子', '馬歇爾・D・汀奇', '假裝認輸', 'void', '黑暗的野心，永無止境'],
  ['luffy_nika', '尼卡魯夫', '第六位皇帝', '甦醒的太陽神', 'prism', '解放的鼓聲，響徹世界', 'ult_nika']];
const FLIP = [];
const MODES = [
  ['勇者之塔', '250 層，每 10 層一位 BOSS', 'img/tower_bg.webp'],
  ['皇帝領海', '隊長連戰、分身、真身，打倒四皇收進船隊', 'img/emperor_logo.webp'],
  ['歌姬挑戰', '跟著 Ado 的歌聲打節奏，擊敗歌姬美音', 'img/uta_stage.webp'],
  ['懸賞金交易所', '用寶藏幣買賣海賊團股票，09:00～22:00 開盤', 'img/exchange_logo.webp'],
  ['奪寶大冒險', '左右槳交替划船，越遠越刺激，沿途搶金幣', 'v/m_runner.mp4'],
  ['登上虛空王座', '三位船員挑戰伊姆完全體，比拚累積傷害', 'img/throne_bg.webp'],
  ['船團', '組船團、一起打船團 BOSS、在留言板集合', 'img/lobby_bg.webp'],
  ['即時對戰', '和好友 1v1／3v3 即時對戰，還能觀戰', 'img/gacha_tavern.webp']];
const RAR = [['UR++', '#ff7ad9'], ['UR+', '#ff9a4a'], ['UR', '#ffd34a'], ['SSR', '#f3d27a'], ['SR', '#c8a8ff'], ['RRR', '#7ad0ff'], ['RR', '#8ae0c0'], ['R', '#9fd0ff'], ['U', '#cfd8e0'], ['C', '#a9b4bf']];
const FACES = 'luffy zoro nami sanji robin franky brook jinbe ace marco hancock mihawk law doflamingo crocodile kuma akainu aokiji kizaru katakuri king kid enel lucci buggy moria perona garp_mf koby_mf uta'.split(' ');
const WC = new WeakMap();
const S = (el, prop, v) => { let c = WC.get(el); if (!c) WC.set(el, c = {}); if (c[prop] !== v) { c[prop] = v; el.style[prop] = v; } };
const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };

/* ---------- 建立畫面 ---------- */
const isles = $('#isles');
CH.forEach(([id, n, sub], i) => {
  isles.insertAdjacentHTML('beforeend', `<div class="isl" data-i="${i}"><div class="ring"></div><div class="disc"><img src="img/ch_${id}.webp${V}" alt="${n}"></div><div class="lab"><small>${String(i + 1).padStart(2, '0')} / 13</small><b>${n}</b><span>${sub}</span></div></div>`);
  if (DECO[i]) { const [img, cls] = DECO[i]; isles.insertAdjacentHTML('beforeend', `<img class="deco ${cls}" data-after="${i}" src="img/${img}.webp${V}" alt="" style="width:${img === 'seamonster' ? 96 : 64}px">`); }
  if (CLIPS[i]) isles.insertAdjacentHTML('beforeend', `<figure class="clip"><video data-src="v/${CLIPS[i][0]}.mp4${V}" muted loop playsinline></video><figcaption><b>實機畫面</b><span>${CLIPS[i][1]}</span></figcaption></figure>`);
});
/* 臉在立繪上的位置（比例），用來讓臉永遠落在畫面上方、不被字擋住 */
const FACE = { whitebeard: [.51, .29], bigmom: [.27, .23], kaido_v128: [.47, .26], shanks: [.43, .36], blackbeard: [.26, .29], luffy_nika: [.71, .18] };
const eArts = $('#eArts'), eTxts = $('#eTxts'), eClips = $('#eClips');
EM.forEach(([img, nm, full, ult, pre, sub, clip], i) => {
  const p = P[pre], rt = i % 2 === 1, vars = `--g:${p.g};--g30:${rgba(p.g, .3)};--g40:${rgba(p.g, .4)};--g60:${rgba(p.g, .6)};--g70:${rgba(p.g, .7)};--f0:${p.f[0]};--f1:${p.f[1]};--f2:${p.f[2]};--s0:${p.s[0]};--s1:${p.s[1]};--s2:${p.s[2]}`;
  eArts.insertAdjacentHTML('beforeend', `<div class="eart" data-k="${i}" style="${vars}"><div class="art-b"><img src="img/${img}.webp${V}" alt="${nm}"></div></div>`);
  eTxts.insertAdjacentHTML('beforeend', `<div class="etxt${rt ? ' rt' : ''}" style="${vars}"><div class="no">四皇 ${i + 1} / 6</div><div class="nm">${nm}</div><div class="full">${full}</div>
    <div class="ult" aria-label="奧義 ${ult}"><i aria-hidden="true">${ult}</i><i aria-hidden="true">${ult}</i><b>${ult}</b></div><div class="sub">${sub}</div></div>`);
  eClips.insertAdjacentHTML('beforeend', clip ? `<div class="uclip${rt ? ' rt' : ''}" style="${vars}"><span>實機奧義演出</span><video data-src="v/${clip}.mp4${V}" muted loop playsinline></video></div>` : '<div class="uclip none"></div>');
});
const fill = (el, list) => { const h = list.map(f => `<img src="img/f/${f}.webp${V}" alt="">`).join(''); el.innerHTML = h + h; };
fill($('#mq1'), FACES.slice(0, 15)); fill($('#mq2'), FACES.slice(15));
$('#ladder').innerHTML = RAR.map(([r, c]) => `<span style="--c:${c}">${r}</span>`).join('');
$('#posters').innerHTML = MODES.map(([t, d, m]) => `<div class="pst"><div class="sway"><div class="w">WANTED</div><div class="ph">${m.endsWith('.mp4') ? `<video data-src="${m}${V}" muted loop playsinline></video>` : `<img src="${m}${V}" alt="">`}</div><b>${t}</b><p>${d}</p></div></div>`).join('');
const tag = $('#tag'); let li = 0;
tag.innerHTML = tag.innerHTML.split('<br>').map(l => [...l].map(c => `<span style="animation-delay:${.3 + (li++) * .06}s">${c}</span>`).join('')).join('<br>');
const tagL = $$('#tag span');
const mq1 = $('#mq1'), mq2 = $('#mq2');

/* ---------- 影片：進入畫面才載入與播放 ---------- */
const pick = src => { const t = document.createElement('video'); return t.canPlayType('video/mp4; codecs="avc1.4D401E"') ? src : src.replace('.mp4', '.webm'); };
/* 同一時間只播一支（手機解碼多支影片會卡） */
const vis = new Map();
const io = new IntersectionObserver(es => { es.forEach(e => { const v = e.target; if (e.isIntersecting && !v.getAttribute('src')) { v.src = pick(v.dataset.src); v.preload = 'auto'; } vis.set(v, e.isIntersecting ? e.intersectionRatio : 0); }); }, { rootMargin: '150px', threshold: [0, .25, .5, .75, 1] });
let playing = null;
function videoTick() { let best = null, br = .2; vis.forEach((r, v) => { const c = WC.get(v.closest('.uclip')), op = c && c.opacity !== undefined ? +c.opacity : 1; const sc = r * op; if (sc > br) { br = sc; best = v; } }); if (best !== playing) { if (playing) playing.pause(); playing = best; if (best) { const p = best.play(); if (p) p.catch(() => {}); } } }
setInterval(videoTick, 400);
$$('video[data-src]').forEach(v => io.observe(v));

/* ---------- 音樂 ---------- */
const bgm = $('#bgm'), music = $('#music');
bgm.addEventListener('click', () => { const on = music.paused; if (on) { music.volume = .55; const p = music.play(); if (p) p.catch(() => {}); } else music.pause(); bgm.classList.toggle('on', on); bgm.setAttribute('aria-pressed', String(on)); bgm.querySelector('span').textContent = on ? '關閉音樂' : '開啟音樂'; });

/* ---------- 版面量測（文件座標），視窗改變時重算 ---------- */
let VH = innerHeight, VW = innerWidth;
const M = new Map();
const docTop = el => { let r = el.getBoundingClientRect(); return r.top + scrollY; };
function measure() {
  VH = innerHeight; VW = innerWidth;
  [['#hero'], ['#throne'], ['#ladder'], ['#crew'], ['#emps'], ['#voyage'], ['#storm'], ['#modes'], ['#sail'], ...$$('.pst').map(e => [e]), ...$$('[data-zone]').map(e => [e])].forEach(([k]) => {
    const el = typeof k === 'string' ? $(k) : k; M.set(el, { top: docTop(el), h: el.offsetHeight });
  });
  buildRoute(); layoutArts(); buildStops();
  MQW = [mq1.scrollWidth / 2, mq2.scrollWidth / 2];
  const sc = M.get($('#storm')); STC = sc ? sc.top + sc.h / 2 : 0;
}
let MQW = [0, 0], STC = 0;
/* 元素在「視窗某條線」之間移動的進度：從 el 頂端碰到 a*VH 開始，到碰到 b*VH 結束 */
const span = (el, sm, a, b) => { const m = M.get(el); if (!m) return 0; const top = m.top - sm; return clamp((a * VH - top) / ((a - b) * VH)); };

/* ---------- 航路：船永遠在畫面中央，沿虛線往下開 ---------- */
const route = $('#route'), trail = $('#trail'), lit = $('#trailLit'), ship = $('#ship');
let table = [], L = 0, isl = [], routeTop = 0, routeH = 0, routeL = 0;
function buildRoute() {
  const rb = route.getBoundingClientRect(), pts = [];
  routeTop = rb.top + scrollY; routeH = rb.height; routeL = rb.left;
  isl = $$('#route .isl').map(el => { const d = el.querySelector('.disc').getBoundingClientRect(); const p = [d.left - rb.left + d.width / 2, d.top - rb.top + d.height / 2]; pts.push(p); return { el, y: p[1], on: el.classList.contains('lit') }; });
  $$('#route .deco').forEach(dc => { const a = isl[+dc.dataset.after], b = isl[+dc.dataset.after + 1]; if (!a || !b) return; dc.style.left = (rb.width / 2 - dc.offsetWidth / 2) + 'px'; dc.style.top = ((a.y + b.y) / 2 - dc.offsetHeight / 2) + 'px'; });
  let d = `M ${rb.width / 2} -40`, prev = [rb.width / 2, -40];
  pts.forEach(p => { const my = (prev[1] + p[1]) / 2; d += ` C ${prev[0]} ${my}, ${p[0]} ${my}, ${p[0]} ${p[1]}`; prev = p; });
  d += ` C ${prev[0]} ${prev[1] + 120}, ${rb.width / 2} ${prev[1] + 120}, ${rb.width / 2} ${rb.height + 40}`;
  trail.setAttribute('d', d); lit.setAttribute('d', d); L = lit.getTotalLength();
  table = []; for (let i = 0; i <= 1200; i++) { const l = L * i / 1200, q = lit.getPointAtLength(l); table.push([q.y, q.x, l]); }
  for (let i = 1; i < table.length; i++) if (table[i][0] < table[i - 1][0]) table[i][0] = table[i - 1][0];
}
function idxAt(y) { let lo = 0, hi = table.length - 1; if (y <= table[0][0]) return 0; if (y >= table[hi][0]) return hi; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (table[m][0] < y) lo = m; else hi = m; } return lo; }
function at(y) { const lo = idxAt(y), hi = Math.min(table.length - 1, lo + 1), a = table[lo], b = table[hi], t = clamp((y - a[0]) / ((b[0] - a[0]) || 1)); return [y, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
const cur = { y: -40, r: 180 };
const tcv = $('#trailCv'), tcx = tcv.getContext('2d'); let trailDrawn = false;
function shipTick(sm, sy) {
  if (!table.length) return;
  const onScreen = routeTop - sy < VH && routeTop + routeH - sy > 0;
  const ty = clamp(VH * .5 + sm - routeTop, -40, routeH + 40);
  cur.y = RM ? ty : lerp(cur.y, ty, .16);
  if (onScreen) {
    const p = at(cur.y), p2 = at(cur.y + 8), ang = Math.atan2(p2[0] - p[0], p2[1] - p[1]) * 180 / Math.PI + 90;
    cur.r += (((ang - cur.r + 540) % 360) - 180) * .12;
    ship.style.transform = `translate3d(${(p[1] - 36).toFixed(1)}px, ${(cur.y - 51).toFixed(1)}px, 0) rotate(${cur.r.toFixed(1)}deg)`;
    /* 走過的航線：只畫畫面內那一段（畫在底層畫布，不重畫整條 SVG） */
    tcx.clearRect(0, 0, W, H);
    const off = routeTop - sy, i0 = idxAt(-off - 20), i1 = idxAt(cur.y);
    if (i1 > i0) { tcx.beginPath(); for (let i = i0; i <= i1; i++) { const q = table[i]; const X = routeL + q[1], Y = off + q[0]; i === i0 ? tcx.moveTo(X, Y) : tcx.lineTo(X, Y); } tcx.lineTo(routeL + p[1], off + cur.y);
      tcx.lineCap = 'round'; tcx.lineJoin = 'round'; tcx.strokeStyle = 'rgba(243,210,122,.28)'; tcx.lineWidth = 10; tcx.stroke(); tcx.strokeStyle = '#f3d27a'; tcx.lineWidth = 4; tcx.stroke(); }
    trailDrawn = true;
    for (const o of isl) { const on = cur.y >= o.y - 24; if (on !== o.on) { o.on = on; o.el.classList.toggle('lit', on); } }
  } else if (trailDrawn) { tcx.clearRect(0, 0, W, H); trailDrawn = false; }
}

/* ---------- 閃光（雷光、奧義） ---------- */
const fl = $('#flash');
function flash(a, col) { if (RM) return; fl.style.background = col; fl.animate([{ opacity: a }, { opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1)' }); }

/* ---------- 環境粒子：每片海域不同，四皇海域打雷（預先畫好的光點圖，手機省力） ---------- */
const cv = $('#amb'), cx = cv.getContext('2d'); let W = 0, H = 0;
const MOBILE = Math.min(innerWidth, innerHeight) < 700;
function size() { const d = Math.min(MOBILE ? 1.5 : 2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; [[cv, cx], [tcv, tcx]].forEach(([c, x]) => { c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); }); }
const ZONES = { sky: { c: '255,250,230', k: 'mote', n: 26 }, sea: { c: '200,240,255', k: 'bubble', n: 30 }, storm: { c: '170,190,230', k: 'rain', n: 90 }, emp: { c: '255,200,120', k: 'ember', n: 44 }, gold: { c: '255,214,120', k: 'gold', n: 40 }, night: { c: '230,220,190', k: 'mote', n: 20 }, void: { c: '200,90,255', k: 'ember', n: 44 }, end: { c: '255,214,120', k: 'gold', n: 44 } };
let zone = 'sky', zEl = null, zcol = ZONES.sky.c; const parts = [];
const SPR = new Map();
function sprite(c, k) { const key = c + k; let s = SPR.get(key); if (s) return s; s = document.createElement('canvas'); s.width = s.height = 32; const g = s.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  if (k === 'bubble') { r.addColorStop(0, `rgba(${c},0)`); r.addColorStop(.55, `rgba(${c},.15)`); r.addColorStop(.75, `rgba(${c},.7)`); r.addColorStop(1, `rgba(${c},0)`); }
  else { r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.18, `rgba(${c},.95)`); r.addColorStop(.45, `rgba(${c},.25)`); r.addColorStop(1, `rgba(${c},0)`); }
  g.fillStyle = r; g.fillRect(0, 0, 32, 32); SPR.set(key, s); return s; }
const hexc = h => { const n = parseInt(h.slice(1), 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; };
function spawn() { const z = ZONES[zone], k = z.k, p = { k, c: zcol, x: Math.random() * W, y: k === 'rain' ? -20 : k === 'mote' ? Math.random() * H : H + 10, life: 0, max: 4 + Math.random() * 5, s: 1 + Math.random() * 2.5, w: Math.random() * 6.28 };
  if (k === 'rain') { p.vx = -130; p.vy = 1100 + Math.random() * 500; p.max = 1.4; } else if (k === 'ember' || k === 'gold') { p.vx = (Math.random() - .5) * 20; p.vy = -(30 + Math.random() * 60); } else if (k === 'bubble') { p.vx = 0; p.vy = -(16 + Math.random() * 30); } else { p.vx = (Math.random() - .5) * 8; p.vy = -(4 + Math.random() * 8); }
  p.img = k === 'rain' ? null : sprite(p.c, k); parts.push(p); }
let bolts = [], nextBolt = 0;
function bolt(big) { const x0 = W * (.15 + Math.random() * .7), seg = [[x0, -10]]; let x = x0, y = -10; const end = H * (.5 + Math.random() * .4); while (y < end) { y += 18 + Math.random() * 30; x += (Math.random() - .5) * 60; seg.push([x, y]); } bolts.push({ seg, t: 0 }); flash(big ? .7 : .3, '#dfe9ff'); }
function drawAmb(dt, now) {
  cx.clearRect(0, 0, W, H);
  if (!RM) { const want = ZONES[zone].n * (MOBILE ? .6 : 1); for (let i = 0; i < 3 && parts.length < want; i++) spawn(); }
  cx.globalCompositeOperation = 'lighter';
  cx.strokeStyle = 'rgba(170,190,230,.3)'; cx.lineWidth = 1; cx.beginPath(); let rain = false;
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life += dt; p.w += dt * 2;
    p.x += (p.vx + (p.k === 'rain' ? 0 : Math.sin(p.w) * 10)) * dt; p.y += p.vy * dt;
    if (p.life > p.max || p.y < -30 || p.y > H + 30) { parts.splice(i, 1); continue; }
    if (p.k === 'rain') { cx.moveTo(p.x, p.y); cx.lineTo(p.x - 4, p.y + 26); rain = true; continue; }
    const a = Math.sin(Math.min(1, p.life / p.max) * Math.PI), sz = p.s * (p.k === 'bubble' ? 5 : 8);
    cx.globalAlpha = a * (p.k === 'bubble' ? .8 : 1); cx.drawImage(p.img, p.x - sz / 2, p.y - sz / 2, sz, sz); }
  cx.globalAlpha = 1; if (rain) cx.stroke();
  if (!RM && (zone === 'storm' || zone === 'end') && now > nextBolt) { bolt(false); nextBolt = now + 1800 + Math.random() * 3200; }
  bolts = bolts.filter(b => (b.t += dt) < .35);
  for (const b of bolts) { const a = 1 - b.t / .35; cx.beginPath(); b.seg.forEach(([x, y], i) => i ? cx.lineTo(x, y) : cx.moveTo(x, y));
    cx.strokeStyle = `rgba(150,180,255,${.35 * a})`; cx.lineWidth = 10; cx.stroke(); cx.strokeStyle = `rgba(235,240,255,${a})`; cx.lineWidth = 2.5; cx.stroke(); }
  cx.globalCompositeOperation = 'source-over';
}

/* ---------- 四皇舞台 ---------- */
const stage = $('#stage'), arts = $$('#eArts .eart'), txts = $$('#eTxts .etxt'), clips = $$('#eClips .uclip'), burst = $('#burst'), shade = $('#shade');
const auraEl = stage.querySelector('.aura'), glowEl = stage.querySelector('.glow'), empsEl = $('#emps');
const artBox = [];
let activeG = null, activeK = -1;
function layoutArts() {
  const land = VW / VH >= 1;
  arts.forEach((el, k) => {
    const img = el.querySelector('img'), key = EM[k][0], [fx, fy] = FACE[key], ar = (img.naturalWidth || 1000) / (img.naturalHeight || 1000);
    const ah = land ? VH * .98 : Math.min(VH * .8, VW * 1.9 / Math.max(ar, .6)), aw = ah * ar;
    const tx = land ? (k % 2 ? .32 : .68) : .5, ty = land ? .34 : .25;   /* 臉要落在畫面的位置 */
    artBox[k] = { x: VW * tx - fx * aw, y: VH * ty - fy * ah, fy: ty };
    el.style.setProperty('--ah', ah + 'px'); el.style.transformOrigin = `${fx * 100}% ${fy * 100}%`;
  });
}
const hits = EM.map(() => false);
function stageTick(sm) {
  const m = M.get(empsEl); if (!m) return;
  if (sm < m.top - VH || sm > m.top + m.h) return;          /* 不在畫面附近就不算 */
  const p = clamp((sm - m.top) / Math.max(1, m.h - VH)), n = EM.length, land = VW / VH >= 1;
  const T = p * (n + .28) - .14;                               /* 第 k 位的區段時間 t = T - k；頭尾都留空，舞台邊緣永遠看不到立繪 */
  let best = -1, bestA = 0;
  arts.forEach((el, k) => {
    const t = T - k, b = artBox[k]; if (!b) return;
    if (t < -.2 || t > 1.2) { S(el, 'opacity', '0'); S(txts[k], 'opacity', '0'); S(clips[k], 'opacity', '0'); if (hits[k]) { hits[k] = false; txts[k].classList.remove('hit'); } return; }
    const a = easeOut(clamp((t + .12) / .32)), o = clamp((t - .8) / .3), side = k % 2 ? -1 : 1;
    const x = b.x + side * (1 - a) * VW * .6 - side * o * VW * .6 - side * clamp((t - .2) / .6) * VW * .03;
    const sc = lerp(1.1, 1, a) + .04 * clamp((t - .2) / .6);
    S(el, 'transform', `translate3d(${x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`);
    const op = RM ? (t > 0 && t < 1 ? 1 : 0) : a * (1 - o); S(el, 'opacity', op.toFixed(3));
    const tt = txts[k], ta = clamp((t - .05) / .2) * (1 - clamp((t - .8) / .18));
    S(tt, 'opacity', ta.toFixed(3)); if (!RM) S(tt, 'transform', (land ? 'translateY(-50%) ' : '') + `translate3d(0, ${((1 - clamp((t - .05) / .2)) * 24).toFixed(1)}px, 0)`);
    const on = t > .22 && t < .9;
    if (on !== hits[k]) { hits[k] = on; tt.classList.remove('hit'); if (on) { void tt.offsetWidth; tt.classList.add('hit'); burst.classList.remove('go'); void burst.offsetWidth; burst.classList.add('go'); flash(.5, EM_G[k]); } }
    const cl = clips[k]; if (!cl.classList.contains('none')) { const ca = clamp((t - .4) / .12) * (1 - clamp((t - .78) / .1)); S(cl, 'opacity', ca.toFixed(3)); if (!RM) S(cl, 'transform', `translate3d(0, ${((1 - ca) * 40).toFixed(1)}px, 0) rotate(${((k % 2 ? 2 : -2) * ca).toFixed(2)}deg)`); }
    if (op > bestA) { bestA = op; best = k; }
  });
  if (best >= 0 && best !== activeK) { activeK = best; activeG = EM_G[best]; stage.style.setProperty('--g30', rgba(activeG, .3)); stage.style.setProperty('--g40', rgba(activeG, .45)); stage.style.setProperty('--fy', (artBox[best] ? artBox[best].fy * 100 : 30) + '%');
    shade.classList.toggle('rt', best % 2 === 1); }
  S(auraEl, 'opacity', (bestA * .9).toFixed(3)); S(glowEl, 'opacity', bestA.toFixed(3));
}
const EM_G = EM.map(e => P[e[4]].g);

/* ---------- 連續背景色：依捲動位置在各海域顏色之間漸變 ---------- */
let STOPS = [];
const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
function buildStops() {
  const g = k => M.get($(k)) || { top: 0, h: 0 };
  const v = g('#voyage'), st = g('#storm'), e = g('#emps'), c = g('#crew'), mo = g('#modes'), th = g('#throne'), sa = g('#sail');
  STOPS = [[0, '#0d5a92'], [v.top, '#0d5a92'], [v.top + v.h * .35, '#0a467b'], [v.top + v.h * .75, '#083762'], [v.top + v.h, '#07294a'], [st.top + st.h * .5, '#060c18'], [e.top + VH, '#050a13'],
    [e.top + e.h, '#050a13'], [c.top + c.h * .45, '#17100a'], [mo.top + mo.h * .5, '#0b1626'], [th.top + VH * .5, '#0b0612'], [th.top + th.h, '#0b0612'], [sa.top + sa.h * .5, '#050a13']].map(([y, c]) => [y, hx(c)]);
  VOY = [v.top - VH * .3, v.top + v.h - VH * .3];
}
let VOY = [0, 0];
const bd = $('#backdrop'), seaFx = $('#seaFx');
function backdropTick(sm) {
  if (!STOPS.length) return; const y = sm + VH * .5; let i = 0; while (i < STOPS.length - 2 && STOPS[i + 1][0] < y) i++;
  const [y0, c0] = STOPS[i], [y1, c1] = STOPS[i + 1], t = clamp((y - y0) / ((y1 - y0) || 1));
  S(bd, 'backgroundColor', `rgb(${c0.map((v, j) => Math.round(lerp(v, c1[j], t))).join(',')})`);
  const inSea = sm > VOY[0] && sm < VOY[1]; if (inSea !== seaFx.classList.contains('on')) seaFx.classList.toggle('on', inSea);
}

/* ---------- 每一幀：捲動位置平滑跟隨，所有捲動動畫依此計算 ---------- */
const heroV = $('.hero-v'), heroLogo = $('.hero-logo'), heroHint = $('.hero-hint'), heroEl = $('#hero'), throneEl = $('#throne'), ladEl = $('#ladder'), modesEl = $('#modes');
const posters = $$('.pst'), lad = $$('#ladder span'), zones = $$('[data-zone]');
const stormC = $('#storm .center'), imu = $('#imu'), imuCol = $('#imuCol'), rays = $('#rays'), thBg = $('.th-bg'), thTxt = $('.th-txt'), who = $('#who'), progI = $('#prog i');
let sm = scrollY, lastY = scrollY, vel = 0, mq = 0, last = performance.now(), DMAX = 1, ladN = -1;
const near = (m, sy, pad = 0) => m && sy > m.top - VH - pad && sy < m.top + m.h + pad;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const sy = scrollY; vel = lerp(vel, (sy - lastY) / Math.max(dt, .001), .2); lastY = sy;
  sm = RM ? sy : lerp(sm, sy, 1 - Math.pow(.00008, dt));   /* 約 0.08 秒追上：跟手，停下時只有很輕的滑動 */
  if (Math.abs(sm - sy) < .3) sm = sy;

  /* 片頭 */
  const hm = M.get(heroEl);
  if (near(hm, sm)) { const hp = clamp((sm - hm.top) / Math.max(1, hm.h - VH));
    if (!RM) {
      S(heroV, 'transform', `scale(${(1 + .45 * hp).toFixed(4)}) translate3d(0, ${(8 * hp).toFixed(2)}%, 0)`);
      S(heroLogo, 'transform', `translate3d(0, ${(-60 * easeOut(hp)).toFixed(2)}%, 0) scale(${(1 - .3 * hp).toFixed(4)})`); S(heroLogo, 'opacity', clamp(1 - hp * 1.8).toFixed(3));
      S(heroHint, 'opacity', clamp(1 - hp * 6).toFixed(3));
      S(tag, 'transform', `translate3d(0, ${(-18 * hp).toFixed(2)}svh, 0)`);
    }
    tagL.forEach((s, i) => { const on = hp > .12 + i * .045; if (on !== s._on) { s._on = on; s.classList.toggle('on', on); } }); }

  /* 四皇舞台（固定在畫面上，六位依序滑入、停留、滑出，不會被切開） */
  stageTick(sm);
  if (STC) { const cy = STC - sy; if (cy > -VH && cy < VH * 2) S(stormC, 'opacity', clamp((cy - VH * .12) / (VH * .25)).toFixed(3)); }

  /* 懸賞單翻正 */
  if (!RM && near(M.get(modesEl), sm)) posters.forEach(p => { const t = span(p, sm, .98, .62), b = backOut(t); S(p, 'transform', `translate3d(0, ${((1 - t) * 40).toFixed(1)}px, 0) rotateX(${(-95 * (1 - b)).toFixed(2)}deg)`); S(p, 'opacity', clamp(t * 2).toFixed(3)); });

  /* 稀有度階梯：由 C 往上一階一階亮 */
  const ln = Math.round(span(ladEl, sm, .9, .45) * lad.length);
  if (ln !== ladN) { ladN = ln; lad.forEach((s, i) => s.classList.toggle('on', i >= lad.length - ln)); }

  /* 虛空王座：剪影與彩色兩張圖交叉淡入（不用濾鏡，手機不會卡） */
  const tm = M.get(throneEl);
  if (near(tm, sm)) { const tp = clamp((sm - tm.top) / Math.max(1, tm.h - VH)), tEnd = 1 - clamp((tp - .88) / .12);
    S(imuCol, 'opacity', Math.pow(tp, 1.6).toFixed(3));
    if (!RM) S(imu, 'transform', `translateX(-50%) scale(${lerp(.92, 1.04, tp).toFixed(4)})`);
    S(imu, 'opacity', tEnd.toFixed(3)); S(rays, 'opacity', (tp * tEnd).toFixed(3)); S(thBg, 'opacity', (.32 * (.4 + .6 * tEnd)).toFixed(3));
    S(thTxt, 'opacity', clamp(1 - (tp - .5) * 2.4).toFixed(3)); if (!RM) S(thTxt, 'transform', `translate3d(0, ${(-40 * clamp((tp - .5) * 2)).toFixed(1)}px, 0)`);
    const wp = clamp((tp - .55) / .3) * tEnd; S(who, 'opacity', wp.toFixed(3)); if (!RM) S(who, 'transform', `scale(${lerp(1.3, 1, easeOut(wp)).toFixed(4)})`); }

  /* 航路與船、背景色 */
  shipTick(sm, sy);
  backdropTick(sm);

  /* 船員跑馬燈：平常慢慢跑，捲越快跑越快 */
  if (near(M.get($('#crew')), sy)) { mq += (40 + Math.min(700, Math.abs(vel) * .5)) * dt * (RM ? 0 : 1);
    if (MQW[0]) mq1.style.transform = `translate3d(${(-(mq % MQW[0])).toFixed(1)}px,0,0)`; if (MQW[1]) mq2.style.transform = `translate3d(${((mq % MQW[1]) - MQW[1]).toFixed(1)}px,0,0)`; }

  /* 目前海域 → 粒子種類 */
  const line = sy + VH * .55; let zn = zones[0];
  for (const z of zones) { const m = M.get(z); if (m && line >= m.top && line < m.top + m.h) zn = z; }
  if (zone === 'emp' && activeG && zcol !== hexc(activeG)) zcol = hexc(activeG);
  if (zn !== zEl) { zEl = zn; zone = zn.dataset.zone; zcol = zone === 'emp' && activeG ? hexc(activeG) : ZONES[zone].c; if (zone === 'storm') setTimeout(() => !RM && bolt(true), 150); }

  S(progI, 'transform', `scaleY(${clamp(sy / DMAX).toFixed(4)})`);
  drawAmb(dt, now);
  requestAnimationFrame(frame);
}
function remeasure() { size(); measure(); DMAX = Math.max(1, document.documentElement.scrollHeight - VH); }
remeasure();
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(remeasure, 120); });
addEventListener('load', () => { remeasure();
  /* 先把大張立繪解碼好，第一次滑到時不會頓一下 */
  const big = [...$$('#eArts img'), imuCol, ...$$('.th-imu img')]; let i = 0; const next = () => { const im = big[i++]; if (!im) return; (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => setTimeout(next, 60)); }; next(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
$$('img').forEach(im => { if (!im.complete) im.addEventListener('load', () => { clearTimeout(window.__mt); window.__mt = setTimeout(remeasure, 150); }, { once: true }); });
requestAnimationFrame(frame);
})();
