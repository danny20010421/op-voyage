/* v104 技能動畫精緻化：
   1) 沒有專屬編排的招式：加上「蓄力 → 命中瞬間的衝擊幀 → 衝擊波與碎屑」三段，輔助招式加上上升光柱。
   2) 補上新角色與缺少的招式動作（巨人重擊、斬擊、燒傷、解放……）及奧義主題。
   3) 會換立繪的第 5 招（不死鳥、尼德霍格；之後有變身立繪的角色會自動套用）不播技能動畫，直接以變身演出切換立繪（在 battle.js 判斷）。
   載入順序：fx_ult.js 之後。 */
(function () {
  if (typeof window.playChoreo !== 'function' || !window.ANIMA_FX) return;
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const TYPE_COL = { '火': ['#ff7a2a', '#ffd26c'], '冰': ['#9fe6ff', '#3a8ad0'], '雷電': ['#ffe070', '#c9973a'], '闇': ['#a05ad8', '#3a0a4a'], '水': ['#5ab0e0', '#e8f6ff'], '獸': ['#e0a060', '#8a5a2a'], '超能': ['#ff7ad9', '#7a3ab8'], '格鬥': ['#ffffff', '#c9973a'], '自然': ['#8ad86a', '#3a8a2a'], '龍': ['#7a9aff', '#2a3aa8'], '魚人': ['#4fd6c8', '#1a6a8a'], '巨人': ['#d8b48a', '#8a6a3a'] };
  const colOf = id => { const c = CHARACTERS[id]; return (c && TYPE_COL[c.types[0]]) || ['#ffffff', '#c9973a']; };
  /* 缺少的招式動作對應 */
  Object.assign(ANIMA_FX, { release: 'dark', slash: 'slash', burn: 'fire', ashura: 'slash', judgment: 'bolt', beam: 'light', hammer: 'quake', world: 'quake', thunderfive: 'bolt', rokushiki: 'dash', tobishigan: 'shigan', snake: 'whip', limbs: 'barrage', gear2: 'dash', collier: 'punch', diable: 'fire', hakke: 'punch', narukabura: 'bolt', seaking: 'wave', dry: 'storm', sandtrap: 'storm', sandtriple: 'slash', sandstorm: 'storm', transform: 'haki', awaken: 'haki', revive: 'heal', demonflower: 'petals' });
  /* 新的專用動作：巨人重擊（從上方砸下） */
  const CUSTOM = {
    gigante: async (A, c, n) => { SFX.play('whoosh'); moveFighter(A.S, 'stomp'); X.glow(A.f.x, A.f.y - 40, { color: c[0], r: 150, life: .4 }); await wait(260);
      SFX.play('heavy'); X.flash('#ffffff', .22, .2); shake(); X.burst(A.t.x, A.t.y + 20, { r: 210, color: c[0] }); X.cracks(A.t.x, A.t.y + 60, { n: 9, len: 240, color: c[1] });
      X.puffs(A.t.x, A.t.y + 70, { n: 14, rad: 170, life: 1, color: '#e8dcc8' }); X.particles({ x: A.t.x, y: A.t.y + 40, n: 26, spd: [180, 460], ang: [-2.9, -.25], life: [.5, .9], size: [4, 9], colors: ['#8a7a6a', '#c8b89a', c[0]], g: 900 });
      X.text(A.t.x, A.t.y - 150, n, { size: 52, color: '#ffffff', color2: c[1] }); }
  };
  /* 精緻化外層 */
  const charge = async (A, c) => { X.glow(A.f.x, A.f.y - 10, { color: c[0], r: 120, life: .32 }); X.ring(A.f.x, A.f.y, { r1: 150, color: c[0], w: 4, life: .28 }); X.particles({ x: A.f.x, y: A.f.y + 40, n: 12, spd: [60, 160], ang: [-2.2, -.9], life: [.25, .45], size: [2, 5], colors: ['#ffffff', c[0]], shape: 'spark', add: true }); await wait(150); };
  const impact = (A, c, big) => { X.flash('#ffffff', big ? .24 : .14, .16); X.ring(A.t.x, A.t.y, { r1: big ? 240 : 170, color: c[0], w: big ? 9 : 6, life: .34 }); X.ring(A.t.x, A.t.y, { r1: big ? 150 : 110, color: '#ffffff', w: 3, life: .22 });
    X.particles({ x: A.t.x, y: A.t.y, n: big ? 26 : 16, spd: [180, 460], ang: [-3.1, .1], life: [.3, .7], size: [2, 6], colors: ['#ffffff', c[0], c[1]], shape: 'spark', add: true, g: 420 }); if (big) shake(); };
  const rise = (A, c) => { X.particles({ x: A.f.x, y: A.f.y + 70, n: 22, spd: [80, 200], ang: [-1.9, -1.25], life: [.6, 1], size: [3, 7], colors: ['#ffffff', c[0]], shape: 'spark', add: true }); X.ring(A.f.x, A.f.y + 60, { r1: 130, color: c[0], w: 4, life: .5 }); };
  const _pc = window.playChoreo;
  window.playChoreo = async function (side, actor, idx, skill) {
    const src = skill && skill.copiedFrom ? skill.copiedFrom : { id: actor.id, idx };
    const own = typeof CHOREO !== 'undefined' && src.idx >= 0 && CHOREO[src.id] && CHOREO[src.id][src.idx];
    if (own || !skill || skill.ultimate || typeof X === 'undefined' || typeof FXE === 'undefined') return _pc.apply(this, arguments);
    FXE.ensure(); const S = side === 'P' ? 'L' : 'R', T2 = side === 'P' ? 'R' : 'L', A = { S, T: T2, f: fighterPoint(S), t: fighterPoint(T2), d: S === 'L' ? 1 : -1 }, c = colOf(actor.id);
    const atk = skill.type === 'attack', big = atk && (skill.power >= 140 || (skill.effect && (skill.effect.randomMultiplierRange || skill.effect.multiHitNormal)));
    try {
      if (atk) await charge(A, c);
      if (CUSTOM[skill.anima]) await CUSTOM[skill.anima](A, c, skill.name); else await _pc.apply(this, arguments);
      if (atk) impact(A, c, big); else rise(A, c);
    } catch (e) { console.warn(e); }
  };
  /* 新角色與缺少的奧義主題（已有專屬編排的不覆蓋） */
  /* 角色擴充檔（roster_v89～v103）在這個檔案之後才載入，所以等頁面載入完成再套用 */
  window.addEventListener('DOMContentLoaded', () => { const U = window.ULT_FX; if (U) {
    const MORE = { law_w: ['room', { c1: '#4fb4ff', c2: '#e8f6ff', t2: '#1a5ab0' }], weevil: ['quake', { c1: '#ffe070', c2: '#c9973a' }], blackbeard_w: ['dark', { c1: '#7a3ab8', c2: '#c58bff', bg: '#0a0012' }],
      mihawk_w: ['sword', { c1: '#c8322b', c2: '#ff7a9a', t1: '#ffffff', t2: '#6a0a1a' }], burgess: ['giant', { c1: '#e0a050', c2: '#8a5a2a', t1: '#fff0d8', t2: '#8a4a0a', hit: true }], vasco: ['fire', { c1: '#ffb030', c2: '#ffe08a', bg: '#2a1400' }],
      dorry: ['giant', { c1: '#5a8aff', c2: '#c9973a', hit: true }], brogy: ['giant', { c1: '#ffcf5a', c2: '#c84a2a', hit: true }], brook: ['ice', { c1: '#c8e8ff', c2: '#5a8ad0' }], jinbe: ['fist', { c1: '#5ab0e0', c2: '#1a4a8a' }],
      coby0: ['fist', { c1: '#ffe070', c2: '#3a6ab0' }], koby_mf: ['fist', { c1: '#ffffff', c2: '#3a6ab0' }], koby_hc: ['fist', { c1: '#9ad0ff', c2: '#2a4a8a' }], makino: ['heal', { c1: '#ffd26c', c2: '#c9973a' }],
      koza: ['fist', { c1: '#e0a060', c2: '#8a5a2a' }], wiper: ['quake', { c1: '#ffe0a0', c2: '#c86a0a' }], kinemon: ['sword', { c1: '#ff7a2a', c2: '#ffd26c', t2: '#8a2a0a' }], tama: ['toy', {}], king: ['fire', { c1: '#ff5a1a', c2: '#ffe08a', bg: '#2a0800' }] };
    [U.ULT, MORE].forEach(MAP => Object.entries(MAP).forEach(([id, [k, o]]) => { const ch = CHARACTERS[id]; if (!ch || !U.T[k] || !ch.skills.length) return; const i = ch.skills.length >= 5 ? 4 : ch.skills.length - 1; CHOREO[id] = CHOREO[id] || [];
      if (CHOREO[id][i]) return; const name = ch.skills[i].name; CHOREO[id][i] = async A => { try { await U.T[k](A, o, name); } catch (e) { console.warn(e); } }; }));
  } });
  /* 變身招式判斷（battle.js 使用）：第 5 招本身會換立繪的，不播奧義過場與技能動畫 */
  window.isTransformSkill = s => !!(s && s.ultimate && s.effect && (s.effect.formImage || (s.effect.phoenixForm && s.effect.phoenixForm.image))); /* 只有真的會換立繪的才算（目前：洛基尼德霍格、馬爾科不死鳥）；尼卡覺醒沒有換立繪，維持奧義動畫 */
  /* 變身演出：光芒收束 → 立繪切換瞬間白光 → 光環擴散 */
  window.transformFx = async function (side, actor, skill, phase) {
    if (typeof X === 'undefined' || typeof FXE === 'undefined') return; FXE.ensure(); const S = side === 'P' ? 'L' : 'R', p = fighterPoint(S), c = colOf(actor.id);
    if (phase === 'before') { SFX.play('buff'); X.particles({ x: p.x, y: p.y, n: 40, spd: [-260, -90], life: [.5, .8], size: [3, 7], colors: ['#ffffff', c[0]], shape: 'spark', add: true }); X.glow(p.x, p.y - 20, { color: c[0], r: 220, life: .7, hold: true }); await wait(520); }
    else { SFX.play('ult'); X.flash('#ffffff', .55, .35); X.ring(p.x, p.y, { r1: 360, color: c[0], w: 10, life: .6 }); X.ring(p.x, p.y, { r1: 240, color: '#ffffff', w: 4, life: .45 }); X.particles({ x: p.x, y: p.y, n: 50, spd: [160, 420], life: [.5, 1], size: [3, 8], colors: ['#ffffff', c[0], c[1]], shape: 'spark', add: true }); await wait(420); }
  };
})();
