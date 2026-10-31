/* 新版 3D 畫面（Three.js）：把原本登島場景用的輕量引擎（E3.Renderer）整個換成 Three.js 版，13 座島一次升級。
   介面與原本完全相同（mesh／draw／sprite／texture／setCamera／project／begin／resize／free），所以劇情、任務、NPC、敵人、寶箱、潛入、小地圖都不用改。
   升級內容：卡通分階光影＋外框描邊、即時陰影、風格化天空與雲、海面（淺灘透色、岸邊浪花、天空反射、太陽高光）、隨風擺動的草地、
   HD-2D 立繪角色（受場景光照、投射剪影陰影）、泛光＋ACES 色調＋調色、多重取樣抗鋸齒。
   設定頁可以關閉（op_r3 = '0'）改回原本的畫面；瀏覽器不支援 WebGL2 時也會自動用原本的畫面。 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* v145 高畫質後製（一次完成，放在泛光之前）：環境遮蔽（牆腳、屋簷下的陰影）、太陽光束、大氣散射與高度霧、遠景柔焦、鏡頭光暈、輕微色差與顆粒 */
const PRO_FS = `uniform sampler2D tDiffuse, tDepth; uniform vec2 uRes, uSunUV; uniform float uNear, uFar, uTime, uSunVis, uFocus, uAO, uRays, uDOF, uScat, uProjY, uHeat; uniform vec3 uSunCol, uSunDir, uFogCol, uCamPos; uniform mat4 uProjInv; uniform mat3 uCamRot; varying vec2 vUv;
float lz(float d){ float z = d*2.-1.; return 2.*uNear*uFar/(uFar+uNear - z*(uFar-uNear)); }
float hsh(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 px = 1./uRes; float asp = uRes.x/uRes.y; float d0 = texture2D(tDepth, vUv).x; bool sky = d0 > .99995; float vz = lz(d0);
  vec2 ca = (vUv - .5) * .0018 * dot(vUv-.5, vUv-.5) * 4.;
  vec2 hu = vUv; if (uHeat > 0.) { float hk = uHeat * smoothstep(18., 70., vz) * (sky ? .5 : 1.); hu += vec2(sin(vUv.y*uRes.y*.09 + uTime*7.) * 1.6, sin(vUv.x*uRes.x*.03 + vUv.y*uRes.y*.11 - uTime*5.) * .9) * px * hk; }   /* 熱浪扭曲：遠景微微晃動 */
  vec3 col = vec3(texture2D(tDiffuse, hu + ca).r, texture2D(tDiffuse, hu).g, texture2D(tDiffuse, hu - ca).b);
  float rnd = hsh(vUv*uRes + fract(uTime)*91.);
  /* 遠景柔焦：只模糊遠方（角色附近保持清晰） */
  float coc = (sky ? .6 : smoothstep(uFocus*3., uFocus*9., vz)) * uDOF;
  if (coc > .02) { vec3 acc = col; float wsum = 1.; for (int i = 0; i < 10; i++) { float a = (float(i) + rnd) * 2.39996; float r = sqrt((float(i) + .5)/10.) * coc * 5.5; vec2 o = vec2(cos(a), sin(a)) * r * px * (uRes.y/720.);
      float sd = texture2D(tDepth, vUv + o).x; float sw = (sd > .99995 || lz(sd) > uFocus*1.5) ? 1. : 0.; acc += texture2D(tDiffuse, vUv + o).rgb * sw; wsum += sw; } col = acc / wsum; }
  /* 環境遮蔽：比較周圍深度，凹處與物件交界變暗 */
  if (!sky && uAO > 0.) { float occ = 0.; float rad = clamp(uProjY * 1.15 / vz, .004, .06);
    for (int i = 0; i < 8; i++) { float a = (float(i) + rnd) * 2.39996, rr = rad * (.35 + float(i)/10.); vec2 o = vec2(cos(a)/asp, sin(a)) * rr; float sz = lz(texture2D(tDepth, vUv + o).x); float df = vz - sz; occ += smoothstep(.03, .35, df) * (1. - smoothstep(1.2, 3.2, df)); }
    col *= 1. - clamp(occ/8., 0., 1.) * uAO * (1. - smoothstep(60., 140., vz)); }
  /* 大氣：朝太陽方向的散射光、低處的薄霧 */
  vec4 vd = uProjInv * vec4(vUv*2.-1., 1., 1.); vec3 dir = normalize(uCamRot * (vd.xyz/vd.w)); float mie = pow(max(dot(dir, uSunDir), 0.), 8.);
  if (!sky) { float dist = vz / max(dot(dir, uCamRot*vec3(0.,0.,-1.)), .2); float fa = 1. - exp(-dist*.006); float wy = uCamPos.y + dir.y*dist; float hf = exp(-max(wy, 0.)*.15) * smoothstep(45., 160., dist);
    col = mix(col, uFogCol, clamp(hf*.22, 0., .3)); col += uSunCol * mie * fa * uScat; }
  /* 太陽光束：沿著往太陽的方向取樣天空，被建築、樹擋住的地方形成光柱 */
  if (uSunVis > 0.) { vec2 dl = (vUv - uSunUV) * (.92/28.); vec2 uv2 = vUv - dl*rnd; float ill = 0., dec = 1.;
    for (int i = 0; i < 28; i++) { uv2 -= dl; float s = texture2D(tDepth, clamp(uv2, 0., 1.)).x > .99995 ? 1. : 0.; ill += s*dec; dec *= .962; }
    ill /= 28.; float fall = 1. - smoothstep(.0, .95, length((vUv - uSunUV)*vec2(asp,1.))); col += uSunCol * ill * fall * uRays * uSunVis;
    /* 鏡頭光暈 */ vec2 c = vec2(.5); vec2 sv = uSunUV - c;
    for (int k = 0; k < 4; k++) { float f = -.35 - float(k)*.42; vec2 gp = c + sv*f; float r = .025 + float(k)*.018; float g = smoothstep(r, r*.4, length((vUv - gp)*vec2(asp,1.))); col += mix(vec3(1.,.75,.45), vec3(.45,.75,1.), float(k)/3.) * g * .06 * uSunVis * uRays; } }
  col += (rnd - .5) * .018;
  gl_FragColor = vec4(col, 1.);
}`;
const OLD = window.E3 && window.E3.Renderer;
const ok = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } })();
const enabled = () => { try { return localStorage.getItem('op_r3') !== '0'; } catch (e) { return true; } };
const lin = v => Math.pow(v, 2.2);
const col3 = a => new THREE.Color().setRGB(a[0], a[1], a[2], THREE.SRGBColorSpace);
const U = { uTime: { value: 0 }, uRim: { value: new THREE.Color(1, .95, .85) }, uRimK: { value: .3 }, uWind: { value: 1 },
  /* v145 高畫質：雲影、淺灘焦散、角色踩草、草浪 */ uCloudOn: { value: 0 }, uCaus: { value: 0 }, uCausAll: { value: 0 }, uPlayer: { value: new THREE.Vector3(0, -999, 0) }, uWindDir: { value: new THREE.Vector2(.8, .6) } };
const CLOUD_GLSL = `uniform float uCloudOn, uTime; float _cloudSh(vec2 p, float t){ float n = _n3(p*.016 + vec2(t*.011, t*.005))*.7 + _n3(p*.045 - vec2(t*.008, -t*.01))*.3; return smoothstep(.46, .7, n) * uCloudOn; }`;
/* 焦散（水底晃動的光紋）：Dave Hoskins 的可平鋪水光演算法簡化版 */
const CAUS_GLSL = `uniform float uCaus, uCausAll; float _caustic(vec2 uv, float t){ vec2 p = mod(uv*6.2832, 6.2832) - 250.; vec2 i = p; float c = 1.; for (int n = 0; n < 3; n++){ float tt = t*(1. - 3.5/float(n+1)); i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x)); c += 1./length(vec2(p.x/(sin(i.x+tt)/.005), p.y/(cos(i.y+tt)/.005))); } c /= 3.; c = 1.17 - pow(c, 1.4); return pow(abs(c), 8.); }`;
const grad = (() => { const t = new THREE.DataTexture(new Uint8Array([72, 72, 72, 255, 150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
/* v125 表面細節：依世界座標的雜訊讓地面、牆面、屋頂有深淺斑駁與細紋（三向投影，牆面不會出現直條紋），取代原本一整片單色的面 */
const DETAIL_GLSL = `float _h3(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float _n3(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(_h3(i),_h3(i+vec2(1,0)),f.x),mix(_h3(i+vec2(0,1)),_h3(i+vec2(1,1)),f.x),f.y); }
float _detail(vec2 p){ return _n3(p*.28)*.45 + _n3(p*1.3+7.1)*.3 + _n3(p*5.7+3.3)*.17 + _h3(floor(p*22.))*.08; }`;
function toon(o = {}) {
  const m = new THREE.MeshToonMaterial({ vertexColors: o.vc !== false, gradientMap: grad, color: o.color || 0xffffff, side: o.side || THREE.FrontSide });
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    if (o.detail) { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;').replace('#include <begin_vertex>', '#include <begin_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;\n' + DETAIL_GLSL + CLOUD_GLSL + CAUS_GLSL).replace('#include <color_fragment>', `#include <color_fragment>
 float _caus = 0.; diffuseColor.rgb *= 1. - .38*_cloudSh(vWP.xz, uTime);
 if (uCaus > 0.) { float uw = smoothstep(.25, -.35, vWP.y) * smoothstep(-8., -1.2, vWP.y); if (uw > 0.) _caus = _caustic(vWP.xz*.09, uTime*.55) * uw * uCaus; float wet = smoothstep(.75, .05, vWP.y) * step(-1.2, vWP.y); diffuseColor.rgb *= 1. - wet*.2*uCaus; }
 if (uCausAll > 0.) _caus = max(_caus, _caustic(vWP.xz*.07 + vWP.y*.02, uTime*.45) * uCausAll * smoothstep(-2., 1.5, vWP.y));
 { vec3 an = abs(normalize(vWN)); an /= (an.x + an.y + an.z); float d = _detail(vWP.xz)*an.y + _detail(vWP.zy + 13.)*an.x + _detail(vWP.xy + 29.)*an.z;
   float k = mix(.76, 1.2, d); float steep = 1. - smoothstep(.55, .85, normalize(vWN).y); float w = _n3(vWP.xz*.06 + 41.) - .5; diffuseColor.rgb *= k * mix(1., .88, steep * an.y) * vec3(1. + w*.14, 1. + w*.04, 1. - w*.12); }`); }
    if (o.grass) sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime, uWind; uniform vec3 uPlayer; uniform vec2 uWindDir; varying float vGy, vGust; varying vec2 vGW;').replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 _wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0); float _k = position.y*position.y*.55;
      float _g = smoothstep(.1, 1., sin(dot(_wp.xz, uWindDir)*.085 - uTime*1.7)); vGust = _g;   /* v145 草浪：一波波的強風掃過草地 */
      float _s = (sin(uTime*1.6 + _wp.x*.35 + _wp.z*.27)*.6 + sin(uTime*2.7 + _wp.x*.9)*.25) * (1. + _g*1.4) + _g*.5; transformed.x += _s*_k*uWind; transformed.z += _s*.6*_k*uWind; vGy = position.y; vGW = _wp.xz;
      { vec2 _d = _wp.xz - uPlayer.xz; float _dl = length(_d); float _in = (1. - smoothstep(.35, 2.1, _dl)) * step(abs(_wp.y - uPlayer.y), 3.); /* v145 角色走過會把草往外壓倒 */
        if (_in > 0.) { vec3 _w = vec3(_d/max(_dl,.001)*.95, -.55) * _in * position.y; mat3 _m = mat3(instanceMatrix); transformed += vec3(dot(_m[0], _w)/dot(_m[0], _m[0]), dot(_m[1], _w)/dot(_m[1], _m[1]), dot(_m[2], _w)/dot(_m[2], _m[2])); } }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform vec3 uRim; uniform float uRimK;${o.grass ? ' varying float vGy, vGust; varying vec2 vGW;\n' + DETAIL_GLSL + CLOUD_GLSL : ''}`)
      .replace('#include <color_fragment>', `#include <color_fragment>${o.grass ? '\n diffuseColor.rgb *= mix(.42, 1.02, clamp(vGy,0.,1.)) * (1. + vGust*.22*clamp(vGy,0.,1.)*uCloudOn) * (1. - .38*_cloudSh(vGW, uTime));' : ''}`)
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n float _rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0); gl_FragColor.rgb += uRim * _rim * uRimK;' + (o.detail ? '\n gl_FragColor.rgb += vec3(.75, .95, 1.) * _caus * .55;' : '')); };
  m.customProgramCacheKey = () => 'e3t' + (o.grass ? 'g' : '') + (o.detail ? 'd' : '');
  return m;
}
function outlineMat(thick) {
  return new THREE.ShaderMaterial({ side: THREE.BackSide, fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uThick: { value: thick }, uCol: { value: new THREE.Color(0x2a1e24) } }]),
    vertexShader: `uniform float uThick;\n#include <fog_pars_vertex>\nvoid main(){ vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); float d = -mvPosition.z; vec3 n = normalize(normalMatrix * normal); mvPosition.xyz += n * uThick * (1.0 + d*.012); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}`,
    fragmentShader: `uniform vec3 uCol;\n#include <fog_pars_fragment>\nvoid main(){ gl_FragColor = vec4(uCol, 1.0);\n#include <fog_fragment>\n}` });
}
const softTex = (a0, a1) => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, `rgba(0,0,0,${a0})`); r.addColorStop(.6, `rgba(0,0,0,${a1})`); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); };
/* 各島的水色：深水、淺灘 */
/* v145 高畫質：每座島的招牌氣氛（太陽高度°、陽光色、強度、整體色調、光束、空氣散射、霧距倍率、熱浪、全島焦散、地面霧、煙柱、光點、閃電） */
const LOOK = {
  east: { el: 35, sun: '#ffe8c8', si: 2.85, tint: [1, 1, 1], rays: .55, scat: .18 },
  alabasta: { sky: ['#6aa6d8', '#f2d29a'], cw: .25, el: 26, sun: '#ffd398', si: 3.05, tint: [1.07, 1, .88], rays: .62, scat: .28, fogK: .8, heat: 1, mist: ['#f0d2a0', 70, .16] },
  skypiea: { el: 42, sun: '#fff6e6', si: 2.7, tint: [1, 1, 1.03], rays: .5, scat: .12, mist: ['#ffffff', 90, .2] },
  enies: { sky: ['#5f9ad8', '#ffe0b4'], el: 30, sun: '#ffe0b0', si: 2.95, tint: [1.04, 1, .94], rays: .72, scat: .22 },
  thriller: { sky: ['#0b1230', '#26304e'], cl: .28, moon: 1, el: 20, sun: '#a8c0ff', si: 1.7, tint: [.88, .96, 1.1], rays: .5, scat: .22, fogK: .75, mist: ['#8a9cac', 150, .26], glow: ['#9effd0', 40, 0] },
  marineford: { sky: ['#6d7a88', '#d9a878'], cl: .75, cw: .3, el: 22, sun: '#ffc48a', si: 2.5, tint: [1.06, .98, .9], rays: .55, scat: .28, fogK: .85, plume: ['#4a4440', 7, 0] },
  fishman: { sky: ['#0a5a8a', '#3ab8c8'], el: 58, sun: '#c8f2ff', si: 2.3, tint: [.94, 1.02, 1.06], rays: .8, scat: .3, caus: .35, mist: ['#5ac8dc', 60, .12], glow: ['#8ff0ff', 46, 2] },
  dressrosa: { sky: ['#3f93ea', '#ffdcaa'], cw: .15, el: 30, sun: '#ffd49c', si: 3.05, tint: [1.06, 1, .92], rays: .58, scat: .22 },
  wholecake: { sky: ['#a6b6f2', '#ffcfe4'], cw: .2, el: 38, sun: '#fff0f2', si: 2.6, tint: [1.03, .99, 1.04], rays: .35, scat: .12, glow: ['#fff0a0', 70, 2] },
  wano: { sky: ['#2e3170', '#ff9468'], cw: .6, cl: .9, el: 11, sun: '#ffa064', si: 2.6, tint: [1.05, .98, .95], rays: .78, scat: .34, mist: ['#e8b8a8', 80, .13], glow: ['#ffb050', 42, 1] },
  dark: { sky: ['#160810', '#5e2016'], cl: .32, cw: .5, moon: .7, el: 18, sun: '#ff9c78', si: 1.45, tint: [1.03, .96, .96], rays: .42, scat: .22, plume: ['#262022', 6, 1], bolt: 1 },
  egghead: { sky: ['#2458c8', '#9ef0ff'], el: 46, sun: '#eaf6ff', si: 2.7, tint: [.98, 1, 1.04], rays: .45, scat: .14, glow: ['#7ff6ff', 56, 2] },
  giant: { sky: ['#5a8ec0', '#dfe8bc'], el: 25, sun: '#ffe4ac', si: 2.85, tint: [1, 1.02, .95], rays: .9, scat: .34, mist: ['#d4e2c8', 200, .3] }
};
/* v145 高畫質：遠景地平線（每座島各自的遠山／台地／雲柱／高塔／巨樹……兩層，越遠越淡） */
const HZN = { east: ['hill', '#4c6a58', 1], alabasta: ['mesa', '#a0784c', 1], skypiea: ['cloud', '#ffffff', 1.3], enies: ['spire', '#5a6478', 1], thriller: ['spike', '#1a1c2c', 1.1],
  marineford: ['fort', '#4a4c58', 1], fishman: ['coral', '#145a70', 1], dressrosa: ['hill', '#5f7a4a', .9], wholecake: ['cake', '#e8a0c0', 1], wano: ['peak', '#3a3c5a', 1.4],
  dark: ['volcano', '#241418', 1.2], egghead: ['tower', '#3a5a88', 1.2], giant: ['tree', '#2c4a30', 1.5] };
function horizonGeo(kind, R, hk, seed) { let s = seed; const rn = () => (s = s * 16807 % 2147483647) / 2147483647; const N = 720, pos = [], hv = [], ht = [], idx = [];
  const ns = []; for (let i = 0; i < 40; i++) ns.push(rn()); const sm = x => { const i = Math.floor(x) % 40, f = x - Math.floor(x), a = ns[(i + 40) % 40], b = ns[(i + 41) % 40], u = f * f * (3 - 2 * f); return a + (b - a) * u; };
  const feats = []; const nf = { spire: 9, tower: 22, fort: 14, coral: 26, cake: 12, volcano: 3, tree: 7, cloud: 14, spike: 30 }[kind] || 0; for (let i = 0; i < nf; i++) feats.push([rn(), .004 + rn() * .02, .4 + rn() * .9]);
  const big = kind === 'peak' ? rn() : -1;
  const H = t => { const x = t * 40; let h;
    switch (kind) {
      case 'mesa': { const q = sm(x * .8); h = q > .55 ? 34 + sm(x * 3) * 8 : 6 + q * 14; break; }
      case 'peak': { h = 20 + Math.pow(Math.abs(sm(x * 1.4) * 2 - 1), .6) * 60 + sm(x * 5) * 10; if (big >= 0) { const d = Math.abs(((t - big + 1.5) % 1) - .5); h = Math.max(h, 150 * Math.max(0, 1 - d * 22)); } break; }
      case 'hill': h = 10 + sm(x) * 26 + sm(x * 3.1) * 8; break;
      default: h = 4 + sm(x) * 10; }
    for (const [c, w, k] of feats) { const d = Math.abs(((t - c + 1.5) % 1) - .5); if (d > w * 3) continue;
      if (kind === 'spire' || kind === 'tower' || kind === 'fort') { if (d < w) h = Math.max(h, (kind === 'fort' ? 26 : kind === 'tower' ? 60 : 90) * k * (kind === 'spire' ? 1 - d / w * .6 : 1)); }
      else if (kind === 'coral' || kind === 'tree' || kind === 'cloud' || kind === 'cake') { const r = w * (kind === 'tree' ? 2.4 : 1.6), tall = { coral: 50, tree: 150, cloud: 90, cake: 46 }[kind] * k; if (d < r) h = Math.max(h, tall * (kind === 'cake' ? (d < r * .8 ? 1 : .6) : Math.sqrt(1 - (d / r) ** 2))); if (kind === 'tree' && d < w * .5) h = Math.max(h, tall * .8); }
      else if (kind === 'volcano') { const r = .03 + w * 1.5; if (d < r) h = Math.max(h, 120 * k * Math.min(1, (1 - d / r) * 1.25) - (d < r * .1 ? 10 : 0)); }
      else if (kind === 'spike') { if (d < w * .5) h = Math.max(h, 70 * k * (1 - d / (w * .5))); } }
    return h * hk; };
  for (let i = 0; i <= N; i++) { const t = i / N, a = t * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), h = H(t % 1); pos.push(c * R, -8, sn * R, c * R, h, sn * R); hv.push(0, 1); ht.push(h, h); if (i < N) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('hv', new THREE.Float32BufferAttribute(hv, 1)); g.setAttribute('ht', new THREE.Float32BufferAttribute(ht, 1)); g.setIndex(idx); return g; }
const WATERC = { east: ['#145e9e', '#3fd0c4'], alabasta: ['#1a6aa0', '#5ad8c8'], skypiea: ['#d8ecff', '#ffffff'], enies: ['#1a4f80', '#3fa8b8'], thriller: ['#1a2a40', '#3a5a6a'], marineford: ['#1a4a78', '#4aa8c0'], fishman: ['#0a3a68', '#2a9ac0'], dressrosa: ['#1a6aa0', '#4fd6c8'], wholecake: ['#3a6ab0', '#7ad8e0'], wano: ['#1a4a68', '#4a9aa8'], dark: ['#102438', '#2a5068'], egghead: ['#1468a8', '#3ad8e0'], giant: ['#1a5a70', '#4ab0b0'] };

class R3 {
  constructor(canvas) {
    this.canvas = canvas; this.low = localStorage.getItem('op_gfx') === 'low'; this.maxDpr = this.low ? .75 : Math.min(devicePixelRatio || 1, 2); this.dpr = this.maxDpr;
    const rd = this.rd = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); rd.shadowMap.enabled = true; rd.shadowMap.type = this.low ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap; rd.toneMapping = THREE.ACESFilmicToneMapping; rd.toneMappingExposure = .95;
    const S = this.scene = new THREE.Scene(); S.fog = new THREE.Fog(0xbfe3f6, 120, 480); this.camera = new THREE.PerspectiveCamera(52, 1, .4, 1600);
    this.hemi = new THREE.HemisphereLight(0xc6dcff, 0x7a8a5a, 1); S.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xfff2dc, 2.6); sun.castShadow = true; const n = this.low ? 1024 : 4096; sun.shadow.mapSize.set(n, n); Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 1, far: 420 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .06; S.add(sun); S.add(sun.target);
    this.mat = toon({ detail: !this.low }); this.olStatic = outlineMat(.03); this.olObj = outlineMat(.04);
    /* 天空 */
    this.SKY = { uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(.4, .8, .3) }, uSunCol: { value: new THREE.Color(1, .95, .85) }, uFog: { value: new THREE.Color() }, uCloud: { value: 1 }, uPro: { value: 0 }, uCloudLit: { value: 1 }, uCloudWarm: { value: 0 }, uMoon: { value: 0 }, uTime: U.uTime };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.SKY,
      vertexShader: `varying vec3 vD; void main(){ vD = normalize((modelMatrix*vec4(position,1.)).xyz - cameraPosition); vec4 p = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); gl_Position = p.xyww; }`,
      fragmentShader: `uniform vec3 uZen, uHor, uSun, uSunCol, uFog; uniform float uTime, uCloud, uPro, uCloudLit, uCloudWarm, uMoon; varying vec3 vD;
        float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); } float ns(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y); }
        float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*ns(p); p=p*2.03+vec2(17.1,9.3); a*=.5; } return s; }
        void main(){ vec3 d = normalize(vD); float h = max(d.y, 0.); vec3 col = mix(uHor, uZen, pow(h, .5)); float sd = max(dot(d, normalize(uSun)), 0.); col += uSunCol*(pow(sd, 1200.)*6. + pow(sd, 10.)*.25);
          if (uPro > .5) { col = mix(uHor, uZen*.78, pow(h, .38)); col += uSunCol*(pow(sd, 1600.)*8. + pow(sd, 14.)*.18); }   /* v145：天頂更藍、太陽周圍暖光 */
          if (d.y > 0. && uCloud > 0. && uPro > .5) {   /* v145 立體積雲：地平線一帶大朵積雲（受光面亮、底部偏藍灰），高空薄卷雲 */
            vec2 cp = d.xz/(d.y+.06)*.55 + vec2(uTime*.006, uTime*.002); vec2 so = normalize(uSun.xz + 1e-4)*.06;
            float band = smoothstep(.55, .04, d.y); float n = fbm(cp*.8) + band*.28 - .12; float sh = smoothstep(.5, .66, n)*smoothstep(0., .05, d.y)*uCloud;
            float n2 = fbm(cp*.8 + so); float lit = clamp((n - n2)*5. + .55, 0., 1.); vec3 cc = mix(mix(uHor, vec3(.55,.62,.78), .55), vec3(.93,.92,.9), lit) + uSunCol*pow(sd, 6.)*.25*lit; cc = mix(cc, cc*(uSunCol*.9 + .25), uCloudWarm) * uCloudLit;
            col = mix(col, cc, sh);
            float ci = fbm(vec2(cp.x*.35, cp.y*2.2) + 9.)*smoothstep(.15, .5, d.y); col = mix(col, vec3(uCloudLit), smoothstep(.55, .8, ci)*.35*uCloud*(1.-sh)); }
          if (uMoon > 0.) { col += vec3(.45,.55,.8)*pow(sd, 40.)*.3*uMoon; col = mix(col, vec3(.88,.91,1.)*(.82 + .18*ns(d.xz*160.)), smoothstep(.99935, .9996, sd)*uMoon); }   /* 夜晚的島：月亮 */
          else if (d.y > 0. && uCloud > 0.) { vec2 cp = d.xz/(d.y+.1)*.6 + vec2(uTime*.01, uTime*.004); float c = fbm(cp*1.2); c = smoothstep(.5, .74, c)*smoothstep(0., .2, d.y)*uCloud; float lit = smoothstep(.4, .85, fbm(cp*1.2 + normalize(uSun).xz*.1)); col = mix(col, mix(uHor*.85 + .08, vec3(1.), lit*.7+.3), c*.9); }
          col = mix(col, uFog, smoothstep(.1, 0., d.y)*.7); gl_FragColor = vec4(col, 1.); }` }));
    this.sky.renderOrder = -1; S.add(this.sky);
    /* 後製 */
    this.pro = !this.low;   /* v145：高畫質才開啟新後製；省電維持原本畫面 */
    const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: this.low ? 0 : 4 }); if (this.pro) rt.depthTexture = new THREE.DepthTexture(2, 2, THREE.UnsignedIntType);
    this.composer = new EffectComposer(rd, rt); this.composer.addPass(new RenderPass(S, this.camera));
    if (this.pro) { const PU = this.PU = { tDiffuse: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uSunUV: { value: new THREE.Vector2() }, uNear: { value: .4 }, uFar: { value: 1600 }, uTime: U.uTime, uSunVis: { value: 0 }, uFocus: { value: 20 }, uAO: { value: .55 }, uRays: { value: .55 }, uDOF: { value: 1 }, uScat: { value: .3 }, uProjY: { value: 1 }, uHeat: { value: 0 },
        uSunCol: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3() }, uFogCol: { value: new THREE.Color() }, uCamPos: { value: new THREE.Vector3() }, uProjInv: { value: new THREE.Matrix4() }, uCamRot: { value: new THREE.Matrix3() } };
      const pm = new THREE.ShaderMaterial({ uniforms: PU, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: PRO_FS, depthTest: false, depthWrite: false });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pm), qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); quad.frustumCulled = false; qs.add(quad);
      this.composer.addPass({ enabled: true, needsSwap: true, clear: false, renderToScreen: false, setSize() { }, dispose() { }, render(r, wb, rb) { PU.tDiffuse.value = rb.texture; PU.tDepth.value = rb.depthTexture; r.setRenderTarget(this.renderToScreen ? null : wb); r.render(qs, qc); } }); }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .35, .6, .92); this.composer.addPass(this.bloom);
    this.grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uSat: { value: 1.15 }, uCon: { value: 1.06 }, uVig: { value: .3 }, uFlash: { value: 0 }, uSplit: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) } }, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uSat, uCon, uVig, uFlash, uSplit; uniform vec3 uTint; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); c.rgb *= uTint; float l = dot(c.rgb, vec3(.2126,.7152,.0722)); c.rgb *= mix(vec3(1.), mix(vec3(.9,.98,1.1), vec3(1.07,1.,.9), smoothstep(.05,.7,l)), uSplit); c.rgb = mix(vec3(l), c.rgb, uSat); c.rgb = max(vec3(0.), (c.rgb-.18)*uCon+.18); vec2 q = vUv-.5; c.rgb *= 1. - dot(q,q)*uVig; c.rgb += vec3(uFlash); gl_FragColor = c; }` });
    this.composer.addPass(this.grade); this.composer.addPass(new OutputPass());
    this.handles = new Set(); this.tex = new Map(); this.sprPools = new Map(); this.shPool = { list: [], used: 0 }; this.env = {}; this.time = 0; this.flash = 0; this.island = new THREE.Group(); S.add(this.island);
    this.contact = softTex(.55, .25); this.aspect = 1.6; this.eye = [0, 10, 20]; this.target = [0, 0, 0];
  }
  /* ---------- 與原本引擎相同的介面 ---------- */
  resize() { const c = this.canvas, w = Math.max(1, c.clientWidth), h = Math.max(1, c.clientHeight); if (this._w === w && this._h === h && this._d === this.dpr) return; this._w = w; this._h = h; this._d = this.dpr; this.rd.setPixelRatio(this.dpr); this.rd.setSize(w, h, false); this.composer.setPixelRatio(this.dpr); this.composer.setSize(w, h); this.aspect = w / h; }
  mesh(b) { const n = b.count; if (!n) return { n: 0 }; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
    /* v125：地形（Builder.smooth 範圍）改用平滑法線，山坡不再一格一格的 */
    const nrm = (b.smooth && b.smooth.length) ? Float32Array.from(b.n) : b.n;
    if (b.smooth && b.smooth.length) b.smooth.forEach(([s0, s1]) => { const acc = new Map(), key = i => Math.round(b.p[i * 3] * 50) + ',' + Math.round(b.p[i * 3 + 2] * 50);
      for (let i = s0; i < s1; i++) { const k = key(i); let a = acc.get(k); if (!a) acc.set(k, a = [0, 0, 0]); a[0] += b.n[i * 3]; a[1] += b.n[i * 3 + 1]; a[2] += b.n[i * 3 + 2]; }
      for (let i = s0; i < s1; i++) { const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; nrm[i * 3] = a[0] / l; nrm[i * 3 + 1] = a[1] / l; nrm[i * 3 + 2] = a[2] / l; } });
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); const c = new Float32Array(b.c.length); for (let i = 0; i < c.length; i++) c[i] = lin(b.c[i]); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeBoundingSphere();
    const h = { geo: g, n, pool: [], used: 0, big: n > 20000 }; this.handles.add(h); return h; }
  free(h) { if (!h || !h.geo) return; h.pool.forEach(o => { this.scene.remove(o); if (o.material !== this.mat && o.material.dispose) o.material.dispose(); }); h.geo.dispose(); this.handles.delete(h); }
  texture(url) { if (this.tex.has(url)) return this.tex.get(url); const rec = { ready: false, w: 1, h: 1 }; rec.t = new THREE.TextureLoader().load(url, t => { rec.ready = true; rec.w = t.image.naturalWidth || t.image.width; rec.h = t.image.naturalHeight || t.image.height; }); rec.t.colorSpace = THREE.SRGBColorSpace; rec.t.anisotropy = 8; rec.t.generateMipmaps = false; rec.t.minFilter = THREE.LinearFilter; /* 立繪不做 mipmap，避免遠看變糊 */ this.tex.set(url, rec); return rec; }
  setCamera(eye, target, fov) { this.eye = eye; this.target = target; { const dx = target[0] - eye[0], dz = target[2] - eye[2], l = Math.hypot(dx, dz) || 1; this.right = [-dz / l, 0, dx / l]; } const c = this.camera; c.fov = (fov || .9) * 180 / Math.PI * 1.05; c.aspect = this.aspect; c.position.set(eye[0], eye[1], eye[2]); c.lookAt(target[0], target[1], target[2]); c.updateProjectionMatrix(); c.updateMatrixWorld(); }
  project(x, y, z) { const v = new THREE.Vector3(x, y, z).applyMatrix4(this.camera.matrixWorldInverse); const d = -v.z; if (d <= .1) return null; v.applyMatrix4(this.camera.projectionMatrix); return { x: (v.x * .5 + .5) * this.canvas.clientWidth, y: (1 - (v.y * .5 + .5)) * this.canvas.clientHeight, d }; }
  begin() { this.handles.forEach(h => { for (let i = 0; i < h.pool.length; i++) h.pool[i].visible = false; h.used = 0; }); this.sprPools.forEach(p => { p.list.forEach(o => { o.visible = false; }); p.used = 0; }); this.shPool.list.forEach(o => { o.visible = false; }); this.shPool.used = 0;
    if (!this._queued) { this._queued = true; queueMicrotask(() => { this._queued = false; this.flush(); }); } }
  draw(h, model, opts) {
    if (!h || !h.n || h.skip) return; opts = opts || {};
    if (opts.wave && this.water) return;                 /* 海面改用新的水面 */
    if (opts.mat === 3) return;                           /* 天空改用新的天空 */
    let o = h.pool[h.used];
    if (!o) { const alpha = !!opts.alpha;
      if (alpha) o = new THREE.Mesh(h.geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true }));
      else { o = new THREE.Mesh(h.geo, this.mat); o.castShadow = true; o.receiveShadow = true; if (!opts.noOutline && !h.big) { const ol = new THREE.Mesh(h.geo, this.olObj); ol.matrixAutoUpdate = false; o.add(ol); } if (opts.noCull) o.material = this.matDS || (this.matDS = toon({ side: THREE.DoubleSide, detail: !this.low })); }
      o.matrixAutoUpdate = false; o.userData.alpha = alpha; h.pool.push(o); this.scene.add(o); }
    h.used++; o.visible = true;
    if (model) o.matrix.fromArray(model); else o.matrix.identity(); o.matrixWorldNeedsUpdate = true;
    const t = opts.tint;
    if (o.userData.alpha) { o.material.color.setRGB(t ? t[0] : 1, t ? t[1] : 1, t ? t[2] : 1, THREE.SRGBColorSpace); o.material.opacity = t ? t[3] : .5; }
    else if (t && (t[0] !== 1 || t[1] !== 1 || t[2] !== 1)) { if (!o.userData.own) { o.material = toon({ side: opts.noCull ? THREE.DoubleSide : THREE.FrontSide, detail: !this.low }); o.userData.own = true; } o.material.color.setRGB(t[0], t[1], t[2], THREE.SRGBColorSpace); }
  }
  sprite(url, x, y, z, w, h, opts) {
    opts = opts || {};
    if (opts.shadow && this.shPool.used === 0) { const P0 = this._pl || (this._pl = { x: x, y: y, z: z, mv: 0 }); P0.mv = Math.hypot(x - P0.x, z - P0.z); P0.x = x; P0.y = y; P0.z = z; }   /* v145：第一個影子就是玩家（踩草、揚塵用） */
    if (opts.shadow) { let o = this.shPool.list[this.shPool.used]; if (!o) { o = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.contact, transparent: true, depthWrite: false, fog: true })); o.renderOrder = 3; this.shPool.list.push(o); this.scene.add(o); }
      this.shPool.used++; o.visible = true; o.position.set(x, y + .06, z); o.scale.set(w * .62, 1, h * .62); return null; }
    const rec = this.texture(url); if (!rec.ready) return rec;
    let P = this.sprPools.get(url); if (!P) { P = { list: [], used: 0 }; this.sprPools.set(url, P); }
    let o = P.list[P.used];
    if (!o) { const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, .5, 0); const nr = geo.attributes.normal; for (let i = 0; i < nr.count; i++) nr.setXYZ(i, 0, .75, .66);
      const m = new THREE.MeshLambertMaterial({ map: rec.t, alphaTest: .5, side: THREE.DoubleSide, transparent: true, depthWrite: true }); m.toneMapped = false; m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uRim; uniform float uRimK;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.rgb = mix(gl_FragColor.rgb * (1.0 + uRim*.1), diffuseColor.rgb * (.9 + uRim*.12), .6);'); };
      o = new THREE.Mesh(geo, m); o.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: rec.t, alphaTest: .4 }); o.castShadow = true; o.receiveShadow = false; P.list.push(o); this.scene.add(o); }
    P.used++; o.visible = true; o.position.set(x, y, z); o.scale.set(w * (opts.flip ? -1 : 1), h, 1); o.rotation.y = Math.atan2(this.eye[0] - x, this.eye[2] - z);
    const t = opts.tint; o.material.color.setRGB(t ? t[0] : 1, t ? t[1] : 1, t ? t[2] : 1); o.material.emissive.setScalar(opts.glow || 0); o.material.opacity = t && t[3] < 1 ? t[3] : 1;
    return rec;
  }
  /* ---------- 新增：載入島嶼時建立水面與草地 ---------- */
  setIsland(S, chapter) {
    this.island.clear(); this.water = null; if (S.cloud) S.cloud.skip = true; /* 舊的方塊雲改由新天空的雲取代 */ const id = chapter.id, E = chapter.env, R0 = 170, N = 256;
    const hd = new Float32Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) hd[j * N + i] = S.H(-R0 + i / (N - 1) * R0 * 2, -R0 + j / (N - 1) * R0 * 2);
    const hTex = new THREE.DataTexture(hd, N, N, THREE.RedFormat, THREE.FloatType); hTex.minFilter = hTex.magFilter = THREE.LinearFilter; hTex.needsUpdate = true;
    const wc = WATERC[id] || ['#145e9e', '#3fd0c4'], cloudSea = id === 'skypiea';
    if (!this.nTex) { this.nTex = new THREE.TextureLoader().load('vendor/three/textures/waternormals.jpg'); this.nTex.wrapS = this.nTex.wrapT = THREE.RepeatWrapping; }
    this.WU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uH: { value: null }, uN: { value: null }, uR: { value: R0 }, uSun: { value: new THREE.Vector3(.4, .8, .3) }, uSunCol: { value: new THREE.Color(1, .95, .85) }, uDeep: { value: new THREE.Color(wc[0]) }, uShallow: { value: new THREE.Color(wc[1]) }, uSkyA: { value: new THREE.Color() }, uSkyB: { value: new THREE.Color() }, uCloudSea: { value: cloudSea ? 1 : 0 } }]);
    this.WU.uH.value = hTex; this.WU.uN.value = this.nTex; this.WU.uTime = U.uTime; this.WU.uCloudOn = U.uCloudOn;
    const w = new THREE.Mesh(new THREE.PlaneGeometry(R0 * 6, R0 * 6, this.low ? 96 : 220, this.low ? 96 : 220).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: this.WU, transparent: true, fog: true,
      vertexShader: `uniform float uTime; varying vec3 vW; varying float vWave;\n#include <fog_pars_vertex>\nvoid main(){ vec3 p = position; float t = uTime; float w = sin(p.x*.16+t*1.1)*.2 + sin(p.z*.21-t*.9)*.16 + sin((p.x+p.z)*.43+t*1.8)*.06; p.y += w; vWave = w; vec4 wp = modelMatrix*vec4(p,1.); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;\n#include <fog_vertex>\n}`,
      fragmentShader: `uniform sampler2D uH, uN; uniform float uR, uTime, uCloudSea, uCloudOn; uniform vec3 uSun, uSunCol, uDeep, uShallow, uSkyA, uSkyB; varying vec3 vW; varying float vWave;\n#include <fog_pars_fragment>
        float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); } float ns(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y); }
        void main(){ vec2 uv = (vW.xz + uR) / (uR*2.); float g = (uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.) ? -14. : texture2D(uH, uv).r; float depth = vW.y - g;
          vec3 n1 = texture2D(uN, vW.xz*.035 + vec2(uTime*.012, uTime*.008)).xzy*2.-1.; vec3 n2 = texture2D(uN, vW.xz*.09 - vec2(uTime*.02, -uTime*.01)).xzy*2.-1.; vec3 n = normalize(vec3(0.,1.,0.) + (n1+n2)*vec3(.35,0.,.35));
          vec3 v = normalize(cameraPosition - vW); float fr = pow(1. - max(dot(n, v), 0.), 4.);
          vec3 base = mix(uShallow, uDeep, smoothstep(.3, 7., depth)); vec3 refl = mix(uSkyB, uSkyA, clamp(reflect(-v, n).y*1.6, 0., 1.)); vec3 col = mix(base, refl, fr*.7);
          if (uCloudSea > .5) { col = mix(vec3(.95,.97,1.), vec3(1.), ns(vW.xz*.05 + uTime*.02)); col *= .9 + .1*ns(vW.xz*.3); }
          col += smoothstep(.55, .9, ns(vW.xz*.9 + n.xz*3. + uTime*.3)) * smoothstep(3., .4, depth) * .22 * (1. - uCloudSea);
          vec3 hv = normalize(uSun + v); float sp = pow(max(dot(n, hv), 0.), 300.); col += uSunCol * smoothstep(.25, .45, sp) * 1.5 * (1. - uCloudSea);
          { vec2 gc = floor(vW.xz*5.); float tw = hs(gc + floor(uTime*6. + hs(gc)*6.)); col += uSunCol * step(.975, tw) * pow(max(dot(n, hv), 0.), 24.) * 2.4 * (1. - uCloudSea) * smoothstep(1., 3., depth); }   /* v145：陽光下的水面閃爍 */
          float foam = smoothstep(1.2, .0, depth) * (.55 + .45*ns(vW.xz*1.4 + uTime*.7)); float edge = smoothstep(.18, .0, abs(depth - .55 - sin(uTime*1.3 + vW.x*.2)*.25)) * .7; foam = max(foam, edge*smoothstep(2.5,.2,depth)); foam += smoothstep(.16,.24,vWave)*.18;
          col = mix(col, vec3(1.), clamp(foam, 0., 1.)*.85); float a = clamp(mix(.55, .97, smoothstep(0., 3.5, depth)) + foam + uCloudSea, 0., 1.);
          col *= 1. - .25*uCloudOn*smoothstep(.46, .7, ns(vW.xz*.016 + vec2(uTime*.011, uTime*.005))*.7 + ns(vW.xz*.045 - vec2(uTime*.008, -uTime*.01))*.3);
          gl_FragColor = vec4(col, a);\n#include <fog_fragment>\n}` }));
    w.renderOrder = 2; this.island.add(w); this.water = w;
    /* 草地：地面是綠色系的島才長草 */
    const gr = E.ground ? new THREE.Color(E.ground) : null, green = gr && gr.g > gr.r * 1.05 && gr.g > gr.b; this.grass = null;
    if (green && !this.low) { const blade = new THREE.PlaneGeometry(.14, 1, 1, 4); blade.translate(0, .5, 0); const bp = blade.attributes.position; for (let i = 0; i < bp.count; i++) { const y = bp.getY(i); bp.setX(i, bp.getX(i) * (1 - y * .85)); bp.setZ(i, y * y * .18); } const nr = blade.attributes.normal; for (let i = 0; i < nr.count; i++) nr.setXYZ(i, 0, 1, 0);
      const NG = 95000, gm = new THREE.InstancedMesh(blade, toon({ vc: false, grass: true, side: THREE.DoubleSide }), NG); gm.receiveShadow = true; const Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(); let n = 0;
      const base = gr.clone().multiplyScalar(1.05), tip = gr.clone().lerp(new THREE.Color('#d8f080'), .4), path = (chapter.layout && chapter.layout.path) || [], obs = S.obstacles || [];
      const pd = (x, z) => { let d = 1e9; for (let i = 0; i < path.length - 1; i++) { const a = path[i], b = path[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1))); d = Math.min(d, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); } return d; };
      let sd = 777; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647; const dry = gr.clone().lerp(new THREE.Color('#c8b878'), .5);
      const vh = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); }, vn = (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz); return (vh(i, j) * (1 - u) + vh(i + 1, j) * u) * (1 - w) + (vh(i, j + 1) * (1 - u) + vh(i + 1, j + 1) * u) * w; }, patch = (x, z) => vn(x * .09, z * .09) * .65 + vn(x * .3, z * .3) * .35;
      for (let k = 0; k < 400000 && n < NG; k++) { const x = (rnd() - .5) * 200, z = (rnd() - .5) * 200, h = S.H(x, z); if (h < 1.2) continue; const sl = Math.abs(S.H(x + .7, z) - h) + Math.abs(S.H(x, z + .7) - h); if (sl > .6 || pd(x, z) < 3.2 || obs.some(o => Math.hypot(x - o[0], z - o[1]) < o[2] * .8)) continue;
        const pt = patch(x, z); e.set(0, rnd() * 6.28, 0); q.setFromEuler(e); Mx.compose(new THREE.Vector3(x, h - .05, z), q, new THREE.Vector3(.8 + rnd() * .5, (.5 + rnd() * .75) * (.8 + pt * .5), 1)); gm.setMatrixAt(n, Mx); c.copy(base).lerp(tip, rnd() * .6 + pt * .4).lerp(dry, Math.max(0, .55 - pt) * .5); gm.setColorAt(n, c); n++; } /* v125：草地分成一片片深淺、高低不同的草叢 */
      gm.count = n; gm.instanceMatrix.needsUpdate = true; if (gm.instanceColor) gm.instanceColor.needsUpdate = true; this.island.add(gm); this.grass = gm; }
    /* 煙囪冒煙 */
    if ((S.chimneys || []).length) { const pos = [], sdA = []; S.chimneys.forEach(p => { for (let i = 0; i < 12; i++) { pos.push(p[0], p[1], p[2]); sdA.push(i / 12 + Math.random() * .05); } }); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.Float32BufferAttribute(sdA, 1));
      this.island.add(new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: U.uTime, uTex: { value: this.puff || (this.puff = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.5, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })()) } },
        vertexShader: `attribute float seed; uniform float uTime; varying float vA; void main(){ float t = fract(uTime*.08 + seed); vec3 p = position + vec3(t*2.5 + sin(t*6.+seed*20.)*.4, t*7., t); vA = (1.-t)*smoothstep(0.,.1,t)*.5; vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = (1.2 + t*3.5)*300./-mv.z; }`,
        fragmentShader: `uniform sampler2D uTex; varying float vA; void main(){ gl_FragColor = vec4(vec3(.96), texture2D(uTex, gl_PointCoord).a*vA); }` }))); }
    this.dark = id === 'dark' || id === 'thriller'; /* 先算好，避免第一次進暗色島時光點顏色沿用上一座島 */
    /* v100：各島的環境飄落物（和之國櫻花、阿拉巴斯坦風沙、蜂巢島火星、魚人島氣泡……），讓遠景有空氣感 */
    { const AMB = { east: ['#ffffff', 140, -.5, .5, 1], alabasta: ['#e8c38a', 380, -.25, .55, 0], skypiea: ['#ffffff', 160, -.35, .9, 1], enies: ['#d8e6ff', 160, -.6, .5, 0], thriller: ['#9aa29a', 260, -.3, .7, 0],
        marineford: ['#ffd9a0', 200, .5, .45, 0], fishman: ['#bff0ff', 260, 1.2, .55, 2], dressrosa: ['#ffd84a', 200, -.6, .55, 1], wholecake: ['#ff9ad2', 240, -.7, .55, 1], wano: ['#ffb7cf', 340, -.9, .7, 1],
        dark: ['#ff8a3a', 300, 1.1, .45, 3], egghead: ['#7ff6ff', 220, .6, .45, 3], giant: ['#9cc46a', 260, -.7, .75, 1] }[id];
      if (AMB) { const [col, cnt, vy, sz, kind] = AMB, NA = this.low ? Math.round(cnt * .45) : cnt, pos = [], sdC = []; let s4 = 1357; const rn = () => (s4 = s4 * 16807 % 2147483647) / 2147483647;
        for (let i = 0; i < NA; i++) { const x = (rn() - .5) * 170, z = (rn() - .5) * 170; pos.push(x, Math.max(0, S.H(x, z)), z); sdC.push(rn()); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.Float32BufferAttribute(sdC, 1));
        const pts = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true, blending: kind === 3 ? THREE.AdditiveBlending : THREE.NormalBlending,
          uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: new THREE.Color(col) }, uVy: { value: vy }, uSz: { value: sz }, uKind: { value: kind } }]),
          vertexShader: `attribute float seed; uniform float uTime, uVy, uSz; varying float vA, vR;\n#include <fog_pars_vertex>\nvoid main(){ float H = 22.; float t = uTime*abs(uVy) + seed*H; float y = uVy < 0. ? H - mod(t, H) : mod(t, H); float k = uTime*.4 + seed*31.;
            vec3 p = position + vec3(sin(k)*2.2 + uTime*.35*(seed-.3), y, cos(k*.8)*2.2); vA = smoothstep(0., 2., y) * smoothstep(H, H - 4., y); vR = uTime*(1.5 + seed*2.) + seed*9.;
            vec4 mvPosition = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mvPosition; gl_PointSize = uSz*(.7 + seed*.6)*220./-mvPosition.z;\n#include <fog_vertex>\n}`,
          fragmentShader: `uniform vec3 uCol; uniform float uKind; varying float vA, vR;\n#include <fog_pars_fragment>\nvoid main(){ vec2 c = gl_PointCoord - .5; float a;
            if (uKind > 2.5) { a = smoothstep(.5, 0., length(c)); a *= a; }
            else if (uKind > 1.5) { float r = length(c); a = smoothstep(.5, .42, r) * (.35 + smoothstep(.3, .46, r)); }
            else if (uKind > .5) { float cs = cos(vR), sn = sin(vR); vec2 q = mat2(cs, -sn, sn, cs) * c; q.y *= 2.2; a = smoothstep(.5, .36, length(q)); }
            else { a = smoothstep(.5, .1, length(c)) * .6; }
            gl_FragColor = vec4(uCol, a*vA*.85); if (gl_FragColor.a < .01) discard;\n#include <fog_fragment>\n}` }));
        pts.material.uniforms.uTime = U.uTime; pts.frustumCulled = false; pts.renderOrder = 3; this.island.add(pts); } }
    /* 空中的光點與綠色島的小花 */
    { const pos = [], sdB = []; let sd2 = 99; const rn = () => (sd2 = sd2 * 16807 % 2147483647) / 2147483647; for (let i = 0; i < 260; i++) { const x = (rn() - .5) * 150, z = (rn() - .5) * 150, h = S.H(x, z); if (h < 0) continue; pos.push(x, h + .8 + rn() * 4, z); sdB.push(rn()); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.Float32BufferAttribute(sdB, 1)); const mc = id === 'fishman' ? new THREE.Color(.6, .9, 1) : this.dark || id === 'thriller' ? new THREE.Color(.75, 1, .45) : new THREE.Color(1, .92, .6);
      this.island.add(new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: U.uTime, uTex: { value: this.puff || (this.puff = this.contact) }, uCol: { value: mc } },
        vertexShader: `attribute float seed; uniform float uTime; varying float vA; void main(){ float t = uTime*.3 + seed*6.28; vec3 p = position + vec3(sin(t)*2., sin(t*1.7), cos(t*.8)*2.); vA = .35+.35*sin(uTime*2.+seed*40.); vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = (.6+seed)*90./-mv.z; }`,
        fragmentShader: `uniform sampler2D uTex; uniform vec3 uCol; varying float vA; void main(){ gl_FragColor = vec4(uCol*1.6, texture2D(uTex, gl_PointCoord).a*vA); }` }))); }
    if (green) { const fl = new THREE.IcosahedronGeometry(.13, 0), FN = this.low ? 800 : 3000, fm = new THREE.InstancedMesh(fl, toon({ vc: false }), FN), FC = ['#ffffff', '#ffe14a', '#ff8ab0', '#b08aff', '#ff9a5a'].map(c => new THREE.Color(c)), Mx = new THREE.Matrix4(), path = (chapter.layout && chapter.layout.path) || []; let n = 0, sd3 = 4242; const rn = () => (sd3 = sd3 * 16807 % 2147483647) / 2147483647;
      for (let k = 0; k < 60000 && n < FN; k++) { const x = (rn() - .5) * 180, z = (rn() - .5) * 180, h = S.H(x, z); if (h < 1.3) continue; if (Math.abs(S.H(x + .7, z) - h) > .4) continue; if (path.some((p, i) => i < path.length - 1 && Math.hypot(x - p[0], z - p[1]) < 4)) continue; Mx.makeTranslation(x, h + .35 + rn() * .35, z); fm.setMatrixAt(n, Mx); fm.setColorAt(n, FC[(rn() * 5) | 0]); n++; }
      fm.count = n; if (fm.instanceColor) fm.instanceColor.needsUpdate = true; this.island.add(fm); }
    /* v125：地面小石子與碎石（所有島；避開道路與水裡），讓地面不再空蕩 */
    if (!this.low && id !== 'skypiea') { const PN = 2600, rg = new THREE.DodecahedronGeometry(1, 0), pm = new THREE.InstancedMesh(rg, toon({ vc: false }), PN), Mx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(), gcol = E.ground ? new THREE.Color(E.ground) : new THREE.Color('#8a8a7a');
      const RC = [new THREE.Color('#8e8a80'), new THREE.Color('#a49a88'), new THREE.Color('#6e6a64'), gcol.clone().multiplyScalar(.62)], path = (chapter.layout && chapter.layout.path) || []; let n = 0, s5 = 2468; const rn = () => (s5 = s5 * 16807 % 2147483647) / 2147483647;
      for (let k = 0; k < 40000 && n < PN; k++) { const x = (rn() - .5) * 190, z = (rn() - .5) * 190, h = S.H(x, z); if (h < .25) continue; const nearPath = path.some((p, i) => i < path.length - 1 && Math.hypot(x - p[0], z - p[1]) < 2.4); if (nearPath && rn() < .7) continue;
        const sz = rn() < .9 ? .06 + rn() * .14 : .2 + rn() * .3; e.set(rn() * 3, rn() * 6.28, rn() * 3); q.setFromEuler(e); Mx.compose(new THREE.Vector3(x, h - sz * .35, z), q, new THREE.Vector3(sz * (1 + rn() * .6), sz * (.55 + rn() * .4), sz * (1 + rn() * .5))); pm.setMatrixAt(n, Mx); pm.setColorAt(n, c.copy(RC[(rn() * 4) | 0]).multiplyScalar(.85 + rn() * .3)); n++; }
      pm.count = n; pm.castShadow = false; pm.receiveShadow = true; if (pm.instanceColor) pm.instanceColor.needsUpdate = true; this.island.add(pm); }
    this.chapterId = id; this.dark = id === 'dark' || id === 'thriller';
    /* v145：各島招牌氣氛粒子（地面霧、煙柱、燈籠／鬼火／光點） */
    this.look = this.pro ? LOOK[id] || LOOK.east : null;
    if (this.look) { const L = this.look, path = (chapter.layout && chapter.layout.path) || []; let s6 = 8642; const rn = () => (s6 = s6 * 16807 % 2147483647) / 2147483647;
      const land = (minH, avoid) => { for (let k = 0; k < 400; k++) { const x = (rn() - .5) * 160, z = (rn() - .5) * 160, h = S.H(x, z); if (h < minH) continue; if (avoid && path.some(p => Math.hypot(x - p[0], z - p[1]) < avoid)) continue; return [x, h, z]; } return [0, 0, 0]; };
      const soft = this.puff || this.contact;
      { const Z = HZN[id]; if (Z) { const [kind, col, hk] = Z; [[640, .42, 0], [900, .7, 1]].forEach(([Rr, k, layer]) => { const g = horizonGeo(kind, Rr, hk * (layer ? 1.5 : 1), 777 + layer * 31 + id.length * 7);
          const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ side: THREE.DoubleSide, fog: false, depthWrite: true, uniforms: { uCol: { value: new THREE.Color(col) }, uFog: this.SKY.uFog, uSun: this.SKY.uSun, uSunCol: this.SKY.uSunCol, uK: { value: k + (kind === 'cloud' ? -.15 : 0) }, uGlow: { value: kind === 'volcano' ? 1 : 0 }, uTime: U.uTime, uCloud: { value: kind === 'cloud' ? 1 : 0 } },
            vertexShader: `attribute float hv, ht; varying float vH, vT; varying vec3 vP; void main(){ vH = hv; vT = ht; vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
            fragmentShader: `uniform vec3 uCol, uFog, uSun, uSunCol; uniform float uK, uGlow, uTime, uCloud; varying float vH, vT; varying vec3 vP; void main(){ vec3 d = normalize(vec3(vP.x, 0., vP.z)); float lit = max(dot(d, normalize(vec3(uSun.x, 0., uSun.z))), 0.);
              vec3 c = uCol * (uCloud > .5 ? .82 + .2*vH : .78 + .3*vH) + uSunCol*pow(lit, 3.)*.22*(uCloud > .5 ? 1.6 : 1.); float k = clamp(uK + (1. - vH)*.28, 0., 1.); c = mix(c, uFog, k);
              if (uGlow > 0.) { float hot = (.6 + .4*sin(uTime*2. + vP.x*.05)); c += vec3(1., .3, .06)*hot*smoothstep(vT*.8, vT, vP.y)*smoothstep(90., 140., vT)*1.3; }
              gl_FragColor = vec4(c, 1.); }` }));
          m.renderOrder = -1; m.frustumCulled = false; this.island.add(m); }); } }
      if (L.mist) { const [mc, mn, ma] = L.mist, pos = [], sd = []; for (let i = 0; i < mn; i++) { const q = land(-1, 0); pos.push(q[0], Math.max(q[1], 0) + .4 + rn() * 1.6, q[2]); sd.push(rn()); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.Float32BufferAttribute(sd, 1));
        const m = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: new THREE.Color(mc) }, uA: { value: ma }, uTex: { value: soft } }]),
          vertexShader: `attribute float seed; uniform float uTime; varying float vA;\n#include <fog_pars_vertex>\nvoid main(){ float k = uTime*.05 + seed*6.28; vec3 p = position + vec3(sin(k)*3., sin(k*1.3)*.25, cos(k*.7)*3.); vec4 mvPosition = modelViewMatrix*vec4(p,1.); float d = -mvPosition.z; vA = smoothstep(2., 9., d) * (.6 + .4*sin(uTime*.3 + seed*20.)); gl_Position = projectionMatrix*mvPosition; gl_PointSize = (9. + seed*8.)*300./d;\n#include <fog_vertex>\n}`,
          fragmentShader: `uniform vec3 uCol; uniform float uA; uniform sampler2D uTex; varying float vA;\n#include <fog_pars_fragment>\nvoid main(){ float r = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., r); a = a*(.35 + .65*a)*uA*vA; if (a < .004) discard; gl_FragColor = vec4(uCol, a);\n#include <fog_fragment>\n}` }));
        m.material.uniforms.uTime = U.uTime; m.frustumCulled = false; m.renderOrder = 5; this.island.add(m); }
      if (L.plume) { const [pc, pn, hot] = L.plume, PER = 26, pos = [], sd = [], ph = []; for (let i = 0; i < pn; i++) { const q = land(1, 6); for (let j = 0; j < PER; j++) { pos.push(q[0], q[1], q[2]); sd.push(j / PER); ph.push(rn()); } }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.Float32BufferAttribute(sd, 1)); g.setAttribute('ph', new THREE.Float32BufferAttribute(ph, 1));
        const m = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: new THREE.Color(pc) }, uHot: { value: hot } }]),
          vertexShader: `attribute float seed, ph; uniform float uTime; varying float vT, vH;\n#include <fog_pars_vertex>\nvoid main(){ float t = fract(seed + uTime*.045 + ph*.37); vT = t; vec3 p = position + vec3(sin(t*5. + ph*9.)*t*2.5 + t*t*9., t*26., cos(t*4. + ph*7.)*t*2.); vec4 mvPosition = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mvPosition; gl_PointSize = (2.5 + t*11.)*300./-mvPosition.z;\n#include <fog_vertex>\n}`,
          fragmentShader: `uniform vec3 uCol; uniform float uHot; varying float vT;\n#include <fog_pars_fragment>\nvoid main(){ float r = length(gl_PointCoord - .5); float a = smoothstep(.5, .1, r) * smoothstep(0., .08, vT) * (1. - vT) * .55; if (a < .01) discard; vec3 c = mix(uCol, vec3(1., .45, .12)*1.6, uHot*smoothstep(.25, 0., vT)); gl_FragColor = vec4(c, a);\n#include <fog_fragment>\n}` }));
        m.material.uniforms.uTime = U.uTime; m.frustumCulled = false; m.renderOrder = 5; this.island.add(m); }
      if (L.glow) { const [gc, gn, kind] = L.glow, pos = [], sd = []; for (let i = 0; i < gn; i++) { const q = kind === 1 && path.length > 1 ? (() => { const p = path[(rn() * (path.length - 1)) | 0], a = rn() * 6.28, x = p[0] + Math.cos(a) * 3.2, z = p[1] + Math.sin(a) * 3.2; return [x, Math.max(0, S.H(x, z)), z]; })() : land(0, 0);
          pos.push(q[0], q[1] + (kind === 1 ? 2.2 : 1 + rn() * (kind === 2 ? 6 : 2.5)), q[2]); sd.push(rn()); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.Float32BufferAttribute(sd, 1));
        const m = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uCol: { value: new THREE.Color(gc) }, uKind: { value: kind } },
          vertexShader: `attribute float seed; uniform float uTime, uKind; varying float vA; void main(){ float t = uTime + seed*40.; vec3 p = position; if (uKind < .5) p += vec3(sin(t*.5)*1.5, sin(t*1.3)*.6, cos(t*.4)*1.5); else if (uKind > 1.5) p += vec3(sin(t*.3)*.8, sin(t*.9)*.8, cos(t*.35)*.8);
            vA = uKind > .5 && uKind < 1.5 ? .75 + .25*sin(t*9.)*sin(t*3.7) : .45 + .45*sin(t*1.7); vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = (uKind > .5 && uKind < 1.5 ? 4.2 : uKind > 1.5 ? 1.3 : 2.6)*(.7 + seed*.6)*220./-mv.z; }`,
          fragmentShader: `uniform vec3 uCol; varying float vA; void main(){ float r = length(gl_PointCoord - .5); float a = exp(-r*r*28.) + exp(-r*r*120.)*.8; gl_FragColor = vec4(uCol*1.5, a*vA*.9); }` }));
        m.material.uniforms.uTime = U.uTime; m.frustumCulled = false; m.renderOrder = 6; this.island.add(m); } }
    /* v145：角色走路揚起的塵土（地面顏色） */
    if (this.pro) { const DN = 48, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(DN * 3).fill(-999), 3)); g.setAttribute('birth', new THREE.Float32BufferAttribute(new Float32Array(DN).fill(-99), 1));
      const dc = gr ? gr.clone().lerp(new THREE.Color('#e8dcc0'), .55) : new THREE.Color('#d8cdb0'); if (id === 'alabasta' || id === 'egghead') dc.set('#f0dcb0');
      const dm = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: dc }, uTex: { value: this.puff || this.contact } }]),
        vertexShader: `attribute float birth; uniform float uTime; varying float vA;\n#include <fog_pars_vertex>\nvoid main(){ float a = uTime - birth; float k = clamp(a/1.1, 0., 1.); vec3 p = position + vec3(0., k*.9, 0.); vA = (1.-k)*smoothstep(0., .08, a)*.55; vec4 mvPosition = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mvPosition; gl_PointSize = (.6 + k*1.6)*260./-mvPosition.z;\n#include <fog_vertex>\n}`,
        fragmentShader: `uniform vec3 uCol; uniform sampler2D uTex; varying float vA;\n#include <fog_pars_fragment>\nvoid main(){ float a = smoothstep(.5, .05, length(gl_PointCoord - .5)) * vA; if (a < .01) discard; gl_FragColor = vec4(uCol, a);\n#include <fog_fragment>\n}` }));
      dm.material.uniforms.uTime = U.uTime; dm.frustumCulled = false; dm.renderOrder = 4; this.island.add(dm); this.dust = { m: dm, n: DN, i: 0, last: 0 }; } else this.dust = null;
  }
  /* v145 高畫質：每一幀更新後製與互動參數 */
  proTick(sd, fog) {
    const id = this.chapterId, cam = this.camera, PU = this.PU, pl = this._pl;
    U.uCloudOn.value = id === 'fishman' ? 0 : id === 'skypiea' ? .45 : 1; U.uCaus.value = id === 'skypiea' ? 0 : 1;
    if (pl) U.uPlayer.value.set(pl.x, pl.y, pl.z);
    PU.uRes.value.set(this.rd.domElement.width, this.rd.domElement.height); PU.uNear.value = cam.near; PU.uFar.value = cam.far; PU.uProjInv.value.copy(cam.projectionMatrixInverse); PU.uCamRot.value.setFromMatrix4(cam.matrixWorld); PU.uCamPos.value.copy(cam.position); PU.uProjY.value = cam.projectionMatrix.elements[5] * .5;
    PU.uSunDir.value.copy(sd); PU.uSunCol.value.copy(this.sun.color).multiplyScalar(this.dark ? .5 : 1); PU.uFogCol.value.copy(fog);
    { const t = this.target, e = this.eye; PU.uFocus.value = Math.hypot(t[0] - e[0], t[1] - e[1], t[2] - e[2]); }
    this.grade.uniforms.uSplit.value = 1; this.bloom.strength = .45; this.bloom.threshold = Math.max(this.bloom.threshold, 1.02); this.SKY.uPro.value = 1;
    this.grade.uniforms.uSat.value = 1.22; this.grade.uniforms.uCon.value = (id === 'skypiea' || id === 'wholecake') ? 1.16 : 1.1; this.grade.uniforms.uVig.value = .42;
    const LK = this.look || LOOK.east; PU.uRays.value = LK.rays; PU.uScat.value = LK.scat; PU.uAO.value = id === 'skypiea' ? .35 : .6; PU.uHeat.value = LK.heat || 0; U.uCausAll.value = LK.caus || 0; this.grade.uniforms.uTint.value.setRGB(...LK.tint);
    if (LK.bolt) { const now = U.uTime.value; if (!this._bolt || now > this._bolt.next) this._bolt = { t: now, next: now + 5 + Math.random() * 7 }; const a = now - this._bolt.t, f = a < .07 ? 1 : a < .16 ? .15 : a < .24 ? .8 : Math.max(0, 1 - (a - .24) * 3.5) * .6; this.grade.uniforms.uFlash.value += f * .22; this.hemi.intensity += f * 1.4; }   /* 蜂巢島：遠方閃電 */
    { const mob = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700, strained = this.dpr <= .66; PU.uDOF.value = mob || strained ? 0 : 1; if (strained) PU.uAO.value = 0; }   /* 手機不做遠景柔焦；畫質已被自動降到最低時再關環境遮蔽 */
    const sp = cam.position.clone().addScaledVector(sd, 1000).project(cam), fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
    const front = fwd.dot(sd); PU.uSunUV.value.set(sp.x * .5 + .5, sp.y * .5 + .5);
    PU.uSunVis.value = front <= 0 ? 0 : Math.max(0, 1 - Math.max(Math.abs(sp.x), Math.abs(sp.y)) / 1.6) * Math.min(1, front * 3);
    const D = this.dust; if (D && pl) { const now = U.uTime.value; if (pl.mv > .02 && now - D.last > .085) { D.last = now; const pa = D.m.geometry.attributes.position, ba = D.m.geometry.attributes.birth;
        for (let k = 0; k < 2; k++) { const j = D.i++ % D.n; pa.setXYZ(j, pl.x + (Math.random() - .5) * 1.1, pl.y + .15, pl.z + (Math.random() - .5) * 1.1); ba.setX(j, now + k * .03); } pa.needsUpdate = ba.needsUpdate = true; } }
    
  }
  flush() {
    const e = this.env; if (!e || !e.fog) return; this.resize(); this.time = this.time || 0; U.uTime.value = this.time;
    const fog = col3(e.fog), sky = col3(e.sky), gnd = col3(e.ground), sd = new THREE.Vector3(...(e.sun || [.4, .8, .3])).normalize();
    const LK = this.pro ? this.look || LOOK.east : null; if (LK && LK.sky) { sky.lerp(new THREE.Color(LK.sky[0]), .85); fog.lerp(new THREE.Color(LK.sky[1]), .7); } if (this.pro) { const el = LK.el * Math.PI / 180, hz = Math.hypot(sd.x, sd.z) || 1; sd.set(sd.x / hz * Math.cos(el), Math.sin(el), sd.z / hz * Math.cos(el)); }   /* v145：太陽壓低到約 35 度，影子拉長、看得到光束 */
    this.scene.fog.color.copy(fog); this.scene.fog.near = (e.fogR ? e.fogR[0] : 60) * 1.5; this.scene.fog.far = (e.fogR ? e.fogR[1] : 260) * 2;
    this.hemi.color.copy(sky).lerp(new THREE.Color(1, 1, 1), .35); this.hemi.groundColor.copy(gnd); this.hemi.intensity = this.dark ? .8 : 1;
    this.sun.intensity = this.dark ? 1.6 : 2.6; this.sun.color.set(this.dark ? 0xb8c4ff : 0xfff2dc);
    if (LK) { this.sun.intensity = LK.si; this.sun.color.set(LK.sun); U.uRimK.value = this.dark ? .36 : .42; if (LK.fogK) { this.scene.fog.near *= LK.fogK; this.scene.fog.far *= LK.fogK; } } else U.uRimK.value = .3;   /* v145：暖陽冷影 */
    U.uRim.value.copy(this.sun.color);
    this.SKY.uZen.value.copy(sky).multiplyScalar(this.dark ? .55 : .8); this.SKY.uHor.value.copy(fog); this.SKY.uFog.value.copy(fog); this.SKY.uSun.value.copy(sd); this.SKY.uSunCol.value.copy(this.sun.color); this.SKY.uCloud.value = this.chapterId === 'fishman' ? 0 : 1; this.SKY.uCloudLit.value = LK && LK.cl || 1; this.SKY.uCloudWarm.value = LK && LK.cw || 0; this.SKY.uMoon.value = LK && LK.moon || 0;
    if (this.WU) { this.WU.uSun.value.copy(sd); this.WU.uSunCol.value.copy(this.sun.color); this.WU.uSkyA.value.copy(this.SKY.uZen.value); this.WU.uSkyB.value.copy(fog); }
    const tg = new THREE.Vector3(...this.target); this.sun.target.position.copy(tg); this.sun.position.copy(tg).addScaledVector(sd, 180); this.sky.position.copy(this.camera.position);
    { const bright = this.chapterId === 'skypiea' || this.chapterId === 'wholecake'; this.rd.toneMappingExposure = bright ? .8 : .95; this.bloom.threshold = bright ? 1.1 : .92; this.grade.uniforms.uCon.value = bright ? 1.14 : 1.06; } /* 白色雲海的島：降低曝光、提高對比，避免一片白 */
    this.grade.uniforms.uFlash.value = this.flash || 0; if (this.grass) this.grass.visible = true;
    if (this.pro) this.proTick(sd, fog);
    this.composer.render();
  }
}
if (window.E3 && ok && enabled()) { try { window.E3_HD = localStorage.getItem('op_gfx') !== 'low'; } catch (e) { window.E3_HD = true; } /* v125：地形加倍與平滑、圓形物件分段變多（engine3d.js Builder） */
  window.E3.Renderer = R3; window.E3.Renderer3 = R3; window.E3.RendererOld = OLD;
  /* 載入島嶼時，讓新渲染器建立水面與草地 */
  if (window.World) { const L = window.World.prototype.load; window.World.prototype.load = function (ch, pid, st) { const r = L.apply(this, arguments); if (this.r && this.r.setIsland) this.r.setIsland(this.scene, ch); return r; }; }
}
window.__R3 = { ok, enabled: enabled() };
