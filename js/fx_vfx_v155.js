/* v155 戰鬥特效升級：使用 00GameDevs（https://00gamedevs.com/，MIT 授權）的 Three.js 特效，取代 fx3d_v145 的命中粒子爆發。
   使用者 11/04：「把裡面不錯的素材拿出來優化我們的技能特效；先從相關的開始升級替換」。
   ‧ 素材：vendor/vfx00/vfx00.js（各款共用的執行期＋預設，第一次進戰鬥才載入；SHA-256 與版本記在 vfx00.meta.json）。
   ‧ 畫布 #bVFX 疊在 #bPGL 上方，透視鏡頭對著 z=0 平面：畫面像素 ↔ 世界座標的比例依角色立繪高度換算，特效大小跟著角色走。
   ‧ 對應（依角色的命中主題 CHAR_FX／屬性）：劍＝蒼刃迴斬（奧義加裂空迴斬）、拳／霸氣／震動＝揚塵震波＋雷弧綻爆、火＝白熱炎爆（奧義加翻湧炎潮）、
     冰＝裂晶霜爆（奧義霜矛落陣）、雷＝渦雷落擊、水＝翻浪衝潮、闇／影＝雷弧綻爆（奧義渦光黑洞）、砂＝飛砂風旋、光／超能＝雷弧綻爆；
     輔助技：回復＝療光法陣、閃避／護盾＝稜晶護壁。沒對應到的主題照舊用 fx3d_v145 的粒子。
   ‧ 開關跟 fx3d_v145 相同（技能特效「高」且畫質不是「省電」）；同時最多 6 個（手機 4 個）特效，超過就先收掉最舊的。 */
(function () {
  const $ = id => document.getElementById(id);
  const MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAP = MOB ? 4 : 6, R = (a, b) => a + Math.random() * (b - a);
  let T = null, V = null, loading = null, rd = null, sc = null, cam = null, cv = null, raf = 0, last = 0;
  const live = [];
  const enabled = () => !!(window.FX3D && FX3D.enabled && FX3D.enabled()) && !RM;
  /* 和之國篇三位：自訂命中主題與配色 */
  if (typeof CHAR_FX !== 'undefined') Object.assign(CHAR_FX, {
    zoro_wano: CHAR_FX.zoro_wano || ['sword', 'sword', ['#ffffff', '#e8c8ff', '#9a4aff', '#1a0a3a']],
    luffy_wano: CHAR_FX.luffy_wano || ['haki', 'haki', ['#ffffff', '#ffd8d0', '#ff3a4a', '#2a0508']],
    sanji_wano: CHAR_FX.sanji_wano || ['fire', 'inferno', ['#ffffff', '#bfe8ff', '#3a7fff', '#0a1a5a']] });

  /* 主題 → [一般命中, 奧義命中] 的特效清單。每項：[素材 id, 選項, 擺法]；擺法 g=從腳下往上長、s=斬擊（立起來的刀光圈）、c=中心 */
  const MAP = {
    sword: [[['azure-sweep', {}, 's']], [['spatial-sweep', { size: 1.25 }, 's'], ['azure-sweep', { size: 1.1 }, 's']]],
    fist: [[['energy-burst', { size: 1.2, color: '#ffb46a' }, 'g'], ['shockwave', { size: .8 }, 'g']], [['energy-burst', { size: 1.7, color: '#ffb46a' }, 'g'], ['shockwave', { size: 1.3 }, 'g']]],
    haki: [[['energy-burst', { size: 1.3 }, 'g']], [['energy-burst', { size: 1.8 }, 'g'], ['shockwave', { size: 1.3 }, 'g']]],
    quake: [[['shockwave', { size: 1.15 }, 'g']], [['shockwave', { size: 1.5 }, 'g'], ['magma-fissure', { color: '#ffd0a0' }, 'g']]],
    fire: [[['fire-explosion', { size: 1 }, 'g']], [['fire-explosion', { size: 1.35 }, 'g'], ['flame-surge', { size: 1.7 }, 'g']]],
    ice: [[['ice-shatter', { size: 2 }, 'g']], [['frost-lance-rain', {}, 'g'], ['ice-shatter', { size: 2.4 }, 'g']]],
    bolt: [[['thunder-strike', { size: 1.2 }, 'g']], [['thunder-strike', { size: 1.6 }, 'g'], ['energy-burst', { size: 1.5 }, 'g']]],
    water: [[['tidal-surge', { size: 1.1 }, 'g']], [['tidal-surge', { size: 1.5 }, 'g']]],
    dark: [[['energy-burst', {}, 'g']], [['black-hole', { size: .8 }, 'c', 1.4]]],
    shadow: [[['energy-burst', {}, 'g']], [['black-hole', { size: .8 }, 'c', 1.4]]],
    sand: [[['dust-devil', { size: .8 }, 'g', .9]], [['dust-devil', { size: 1.1 }, 'g', 1.3], ['shockwave', {}, 'g']]],
    light: [[['energy-burst', {}, 'g']], [['energy-burst', { size: 1.35 }, 'g'], ['shockwave', { size: 1.2, color: '#fff2b0' }, 'g']]],
    psy: [[['energy-burst', {}, 'g']], [['energy-burst', { size: 1.35 }, 'g'], ['shockwave', { size: 1.1 }, 'g']]]
  };
  /* 這些主題的原色比較好看，不套角色配色（火、冰、雷、水、砂、震動的塵土） */
  const KEEP = { fire: 1, ice: 1, water: 1, sand: 1, quake: 1 };

  function load() {
    if (V || loading || !enabled()) return loading;
    loading = Promise.all([import('three'), import(new URL('vendor/vfx00/vfx00.js?v=155', document.baseURI).href)]).then(([t, v]) => { T = t; V = v; init(); }).catch(e => { console.warn('00GameDevs 特效載入失敗', e); V = null; });
    return loading;
  }
  function init() {
    cv = document.createElement('canvas'); cv.id = 'bVFX'; cv.className = 'b-canvas b-pgl b-vfx'; cv.setAttribute('aria-hidden', 'true');
    const ref = $('bPGL') || $('bBloom') || $('bCanvas'); ref.insertAdjacentElement('afterend', cv);
    rd = new T.WebGLRenderer({ canvas: cv, antialias: !MOB, alpha: true, premultipliedAlpha: true }); rd.setClearColor(0x000000, 0);
    rd.outputColorSpace = T.SRGBColorSpace; rd.toneMapping = T.NoToneMapping;
    sc = new T.Scene(); cam = new T.PerspectiveCamera(30, 1, .1, 400);
    /* 預先編譯著色器：第一次命中時才編譯會卡一下，所以載入後趁空檔先把會用到的款式各建一次、編譯完就釋放 */
    setTimeout(() => { try { const ids = [...new Set(Object.values(MAP).flatMap(m => m.flat().map(x => x[0])).concat(['healing-field', 'prism-guard']))], tmp = new T.Scene(), made = [];
      ids.forEach(id => { try { const f = V.make(id, {}); f.update(.016); tmp.add(f.group); made.push(f); } catch (e) { } });
      cam.position.set(0, 0, 10); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix(); (rd.compileAsync ? rd.compileAsync(tmp, cam) : Promise.resolve(rd.compile(tmp, cam))).catch(() => { }).finally(() => made.forEach(f => { try { tmp.remove(f.group); f.dispose(); } catch (e) { } }));
      cam.userData.W = 0; } catch (e) { } }, 400);
  }
  /* 換算：每公尺幾個畫面像素＝角色立繪高度 / 5.5（特效素材以公尺為單位，命中爆發約 1.5～4 公尺寬） */
  function unit(side) { try { const img = $('bImg' + side), f = $('bF' + side); const s = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1, g = FX3D.geo(); return Math.max(14, img.offsetHeight * s * g.S / 5.5); } catch (e) { return 40; } }
  function size(W, H) {
    const dpr = Math.min(MOB ? 1.25 : 1.75, devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { rd.setPixelRatio(dpr); rd.setSize(W, H, false); }
    const g = FX3D.geo(), st = cv.style, px = v => v.toFixed(2) + 'px', key = [g.OX, g.OY, g.S, W, H].map(v => v.toFixed(2)).join();
    if (cv.__k !== key) { cv.__k = key; st.right = st.bottom = 'auto'; st.left = px(-g.OX / g.S); st.top = px(-g.OY / g.S); st.width = px(W / g.S); st.height = px(H / g.S); }
  }
  /* 鏡頭：z=0 平面上 1 公尺＝U 像素；畫面左上角是 (0,0) */
  function setCam(W, H, U) { const f = T.MathUtils.degToRad(cam.fov), D = H / (U * 2 * Math.tan(f / 2)); cam.aspect = W / H; cam.position.set(W / 2 / U, -H / 2 / U, D); cam.lookAt(W / 2 / U, -H / 2 / U, 0); cam.updateProjectionMatrix(); cam.userData.U = U; }
  function spawn(id, opt, mode, x, y, U, life) {
    if (!V.PRESETS[id]) return;
    while (live.length >= CAP) { const o = live.shift(); try { sc.remove(o.fx.group); o.fx.dispose(); } catch (e) { } }
    const fx = V.make(id, opt), gr = fx.group, k = U / cam.userData.U;
    let X = x / cam.userData.U, Y = -y / cam.userData.U;
    if (mode === 'g') { Y -= 1.5 * k; gr.rotation.x = .32; }               /* 從角色腳邊往上長，稍微俯看 */
    else if (mode === 's') { gr.rotation.x = 1.18; gr.rotation.z = R(-.5, .5); gr.rotation.y = R(-.3, .3); }  /* 刀光圈立起來，斜斜劃過 */
    else gr.rotation.x = .9;
    gr.position.set(X, Y, 0); gr.scale.setScalar(k);
    sc.add(gr); live.push({ fx, t: 0, stopAt: life || 0, stopped: false });
    wake();
  }
  function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function loop(now) {
    raf = 0; const dt = Math.min(.05, (now - last) / 1000) * (window.BSPEED || 1); last = now;
    const scr = $('battleScreen'); if (!scr || !rd) return;
    const g = FX3D.geo(), W = Math.max(1, Math.round(g.SW)), H = Math.max(1, Math.round(g.SH)); size(W, H);
    if (Math.abs(cam.aspect - W / H) > .001 || !cam.userData.W || cam.userData.W !== W) { setCam(W, H, cam.userData.U || 40); cam.userData.W = W; }
    for (let i = live.length - 1; i >= 0; i--) { const o = live[i]; o.t += dt; try { if (o.stopAt && !o.stopped && o.t > o.stopAt) { o.stopped = true; o.fx.stop(); } o.fx.update(dt); } catch (e) { o.dead = true; }
      if (o.dead || o.fx.finished || o.t > 8) { try { sc.remove(o.fx.group); o.fx.dispose(); } catch (e) { } live.splice(i, 1); } }
    rd.render(sc, cam);
    if (live.length) raf = requestAnimationFrame(loop); else rd.clear();
  }
  const themeOf = cur => cur.theme || 'fist';
  const colorOf = (actor, th) => { try { const C = typeof CHAR_FX !== 'undefined' && actor && CHAR_FX[actor.id]; const P = (C && C[2]) || (FX3D.pal ? FX3D.pal(th) : null); return P ? P[2] : null; } catch (e) { return null; } };
  /* 命中：fx3d_v145 的 showDamage 掛勾呼叫；回傳 true 表示由這一層接手（fx3d 就不放原本的粒子爆發） */
  function hit(side, cur, big, x, y) {
    if (!V || !rd || !enabled() || !cur) return false;
    const th = themeOf(cur), M = MAP[th]; if (!M) return false;
    const U = unit(side); if (!cam.userData.W) { const g = FX3D.geo(); setCam(Math.round(g.SW), Math.round(g.SH), U); cam.userData.W = Math.round(g.SW); }
    if (!cam.userData.U) cam.userData.U = U;
    const ult = cur.ult && !cur.vfxUlt; if (ult) cur.vfxUlt = true;
    const list = ult ? M[1] : M[0], col = KEEP[th] ? null : colorOf(cur.actor, th);
    list.forEach(([id, o, mode, life], i) => setTimeout(() => spawn(id, Object.assign(col ? { color: col } : {}, o, big && !ult ? { size: (o.size || 1) * 1.15 } : {}), mode, x + (i ? R(-12, 12) : 0), y, U, life), i * 70));
    return true;
  }
  /* 輔助技：回復放療光法陣，閃避／護盾放稜晶護壁（在施放者身上） */
  function cast(side, skill) {
    if (!V || !rd || !enabled() || !skill || skill.type !== 'support') return;
    const e = skill.effect || {}, heal = e.healRatio || e.heal || e.regen, guard = e.dodgeTurns || e.shield || e.shieldRatio || e.selfBuffDef > 0;
    const id = heal ? 'healing-field' : guard ? 'prism-guard' : null; if (!id) return;
    try { const [x, y] = FX3D.pt(side), U = unit(side), g = FX3D.geo(); if (!cam.userData.W) { setCam(Math.round(g.SW), Math.round(g.SH), U); cam.userData.W = Math.round(g.SW); }
      spawn(id, { size: heal ? .9 : .8 }, heal ? 'c' : 'g', x, heal ? y + U * .9 : y, U, heal ? 1.4 : 1.1); } catch (e) { }
  }
  function hook() {
    if (typeof window.playChoreo === 'function' && !window.playChoreo.__vfx) { const _p = window.playChoreo; window.playChoreo = function (side, actor, idx, skill) { if (!V) load(); else try { cast(side === 'P' ? 'L' : 'R', skill); } catch (e) { } return _p.apply(this, arguments); }; window.playChoreo.__vfx = true; }
  }
  window.VFX00 = { load, hit, cast, get ready() { return !!(V && rd); }, live: () => live.length };
  window.addEventListener('load', () => setTimeout(hook, 30));
  if (typeof window.startBattle === 'function') { const _sb = window.startBattle; window.startBattle = function () { load(); if (live.length) { live.splice(0).forEach(o => { try { sc.remove(o.fx.group); o.fx.dispose(); } catch (e) { } }); if (rd) rd.clear(); } return _sb.apply(this, arguments); }; /* 新的一場戰鬥：清掉殘留特效 */ }
})();
