/* v111 奧義過場：不顯示立繪，改為「標題字＋副標」的特效字（參考遊戲招式標題設計）。
   每位角色有自己的配色風格（PRESET）與副標（SUB）；沒有設定的依屬性自動挑選。
   會換立繪的奧義（不死鳥、尼德霍格）在變身演出時也顯示同樣的標題字。載入順序：fx_v105／v106 之後。 */
(function () {
  const PRESET = { /* 字的漸層 f1→f3、三層描邊（外→內）、光暈、背景特效 */
    blaze:     { f: ['#ffffff', '#ffe14a', '#ff8a00'], s: ['#2a0000', '#d40000', '#ffd0a0'], g: '#ff6a00', fx: ['orb', 'flare', 'embers'] },
    crimson:   { f: ['#7a0000', '#3a0000', '#120000'], s: ['#000000', '#ff2a2a', '#ffffff'], g: '#ff1a1a', fx: ['ring', 'flare'] },
    goldflame: { f: ['#fffbd0', '#ffc400', '#ff6a00'], s: ['#000000', '#b31200', '#ffe9a0'], g: '#ff8a00', fx: ['swirl', 'embers'] },
    prism:     { f: ['#ff7ad9', '#7a8aff', '#5af0ff'], s: ['#14002a', '#ffffff', '#ffd0ff'], g: '#5aa0ff', fx: ['xflare', 'sparks'] },
    magma:     { f: ['#fff6a0', '#ffb000', '#ff4a00'], s: ['#2a0030', '#c42d00', '#ffe0a0'], g: '#ff3a00', fx: ['orb', 'cracks', 'embers'] },
    scorch:    { f: ['#ffe9a0', '#ff8a2a', '#c42000'], s: ['#000000', '#6a0000', '#ffb070'], g: '#ff5a1a', fx: ['embers', 'flare'] },
    abyss:     { f: ['#f0ffd8', '#4bff2a', '#0a8a00'], s: ['#000000', '#0a3a00', '#c8ffb0'], g: '#3aff3a', fx: ['ring', 'sparks'] },
    chroma:    { f: ['#fff04a', '#3aff8a', '#ff3ad0'], s: ['#000000', '#ffffff', '#1a0030'], g: '#ffffff', fx: ['bolts', 'sparks'] },
    void:      { f: ['#3a1a5a', '#14001f', '#05000a'], s: ['#000000', '#ffd34a', '#fff0b0'], g: '#b03aff', fx: ['swirl', 'flare'] },
    taboo:     { f: ['#ffffff', '#f0e8ff', '#c8b8ff'], s: ['#12002a', '#4a1a8a', '#ffffff'], g: '#c8a8ff', fx: ['bolts', 'xflare'] },
    frost:     { f: ['#ffffff', '#c8f4ff', '#5ac8ff'], s: ['#001a3a', '#1a6ad0', '#ffffff'], g: '#5ad0ff', fx: ['xflare', 'sparks'] },
    ocean:     { f: ['#f0fdff', '#5ad0ff', '#1a7ad0'], s: ['#001030', '#0a3a8a', '#d0f4ff'], g: '#3ab0ff', fx: ['ring', 'sparks'] },
    thunder:   { f: ['#fffbe0', '#ffe04a', '#ffaa00'], s: ['#0a0020', '#3a2a8a', '#fff7c0'], g: '#ffe04a', fx: ['bolts', 'flare'] },
    love:      { f: ['#ffffff', '#ffb0d8', '#ff4aa0'], s: ['#2a0018', '#c4206a', '#ffe0f0'], g: '#ff5ab0', fx: ['orb', 'sparks'] }
  };
  /* 角色 → [風格, 副標] */
  const SUB = {
    luffy0: ['blaze', '橡膠的身體，燃燒起來吧！'], zoro: ['void', '鬼氣纏身，九刀齊出'], sanji: ['goldflame', '燃燒的右腳，踢碎一切'],
    robin: ['prism', '千萬朵花，綻放成巨人'], franky: ['thunder', 'SUPER！鋼鐵將軍出擊'], brook: ['frost', '來自黃泉的冰冷靈魂'],
    jinbe: ['ocean', '順著海流，摔向深淵'], luffy: ['prism', '解放的鼓聲，響徹世界'], koby_mf: ['taboo', '一個新兵拚命的吶喊'],
    garp_mf: ['blaze', '海軍英雄的拳頭'], akainu: ['magma', '徹底的正義，燒盡一切'], aokiji: ['frost', '連大海都要凍結'],
    kizaru: ['thunder', '以光速，降下神罰'], magellan: ['abyss', '地獄之毒，審判一切'], lucci: ['crimson', '暗殺之豹，回歸本能'],
    garp_hc: ['blaze', '貫穿銀河的拳骨'], koby_hc: ['thunder', '以正義之名，筆直揮出'], mihawk: ['crimson', '這一刀，斬斷一切'],
    crocodile: ['scorch', '吞沒一切的沙漠風暴'], doflamingo: ['love', '無處可逃的絲線牢籠'], kuma: ['taboo', '所有痛苦，由我承受'],
    moria: ['void', '千百道影子，歸於一身'], law: ['ocean', '手術室裡，我說了算'], hancock: ['love', '美麗，就是一切的理由'],
    kuma_eh: ['prism', '為了女兒，跨越天際'], law_w: ['ocean', 'ROOM 之中，一刺貫心'], weevil: ['goldflame', '老爹的力量，在我手中'],
    blackbeard_w: ['void', '黑暗，吞噬一切'], mihawk_w: ['crimson', '頂點之劍，無人能及'], ace: ['blaze', '燃燒吧，火拳的意志'], king: ['blaze', '露娜莉亞之火，焚盡天空'], luffy_nika: ['prism', '解放的鼓聲，響徹世界'],
    marco: ['ocean', '青藍之炎，永不熄滅'], katakuri: ['chroma', '我已看見你的未來'], catarina: ['abyss', '九尾狐火，變幻無常'],
    burgess: ['scorch', '冠軍的力量，粉碎大地'], vasco: ['goldflame', '一口烈酒，化為火柱'], shanks: ['crimson', '霸王之氣，斬開天地'],
    blackbeard: ['void', '黑暗的野心，永無止境'], buggy: ['chroma', '盛大的表演，開始了！'], whitebeard: ['taboo', '世界最強的男人'],
    bigmom: ['magma', '靈魂與火焰，吞沒大海'], kaido: ['scorch', '百獸之王，升龍而起'], vivi: ['ocean', '為了這個國家，我不會逃'],
    koza: ['scorch', '為了沙漠中的綠洲'], enel: ['thunder', '神，降下雷霆'], wiper: ['blaze', '以生命為代價的一擊'],
    perona: ['love', '巨大幽靈，降臨'], hody: ['abyss', '新魚人的憤怒'], shirahoshi: ['ocean', '海王類，回應我的呼喚'],
    monet: ['frost', '白色的世界，靜靜凍結'], sugar: ['love', '變成玩具，忘掉一切'], kid: ['crimson', '磁力的極致，粉碎一切'],
    kinemon: ['goldflame', '狐火流，斬斷火焰'], yamato: ['frost', '繼承御田之名'], vegapunk: ['thunder', '人類最後的希望之火'],
    york: ['chroma', '天龍人的命令'], loki: ['taboo', '詛咒的王子，覺醒了'], dorry: ['blaze', '艾爾巴夫戰士的驕傲'],
    brogy: ['scorch', '百年決鬥的終結一擊'], imu: ['void', '世界之王，降臨']
  };
  const BY_TYPE = { '火': 'blaze', '冰': 'frost', '雷電': 'thunder', '闇': 'void', '水': 'ocean', '魚人': 'ocean', '自然': 'scorch', '獸': 'abyss', '龍': 'scorch', '巨人': 'blaze', '超能': 'prism', '格鬥': 'crimson' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function host() { let el = document.getElementById('bUlt'); if (!el) { el = document.createElement('div'); el.id = 'bUlt'; el.className = 'ut'; el.setAttribute('aria-live', 'polite'); const bs = document.getElementById('battleScreen') || document.body; bs.appendChild(el); } return el; }
  const layers = (t, n) => Array.from({ length: n }, (_, i) => `<span class="l l${i + 1}">${t}</span>`).join('');
  const BOLT = '<svg class="ut-bolts" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path d="M80 40 L230 210 L180 230 L330 420 L290 430 L420 590"/><path d="M930 20 L800 190 L850 205 L700 380 L745 395 L610 580"/><path d="M500 0 L470 120 L520 130 L440 260"/></svg>';
  function render(actor, skill, side, dur) {
    const [pk, sub] = SUB[actor.id] || [BY_TYPE[(CHARACTERS[actor.id] || {}).types ? CHARACTERS[actor.id].types[0] : ''] || 'blaze', ''], P = PRESET[pk] || PRESET.blaze;
    const name = esc(skill.name), len = Array.from(skill.name).length, fs = Math.max(42, Math.min(150, 980 / Math.max(3.2, len)));
    const el = host();
    el.style.cssText = `--f1:${P.f[0]};--f2:${P.f[1]};--f3:${P.f[2]};--o:${P.s[0]};--s2:${P.s[1]};--s3:${P.s[2]};--g:${P.g};--fs:min(${fs}px,${(fs / 9.6).toFixed(2)}vw);--dur:${dur}ms`;
    const fx = P.fx.map(k => k === 'bolts' ? BOLT : k === 'embers' || k === 'sparks' ? `<div class="ut-${k}">${'<i></i>'.repeat(16)}</div>` : `<div class="ut-${k}"></div>`).join('');
    el.innerHTML = `<div class="ut-dim"></div>${fx}<div class="ut-title"><div class="ut-sub">${sub ? layers(esc(sub), 3) : ''}</div><div class="ut-main">${layers(name, 4)}</div><div class="ut-who">${esc(actor.name)}</div></div>`;
    el.className = `ut ut-p-${pk} ${side === 'P' ? 'me' : 'foe'}`; void el.offsetWidth; el.classList.add('show');
    el.querySelectorAll('.ut-embers i,.ut-sparks i').forEach((d, i) => { const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 45; d.style.cssText = `--dx:${(Math.cos(a) * r).toFixed(1)}vw;--dy:${(Math.sin(a) * r * .6).toFixed(1)}vh;--dl:${(Math.random() * .25).toFixed(2)}s;--sz:${(3 + Math.random() * 6).toFixed(1)}px`; });
    return el;
  }
  window.ultTitle = function (actor, skill, side, dur) { const el = render(actor, skill, side, dur || 1400); clearTimeout(el.__t); el.__t = setTimeout(() => el.classList.remove('show'), dur || 1400); };
  cutIn = function (actor, skill, side) { return new Promise(res => { const D = 1450; render(actor, skill, side, D); const el = host(); if (typeof shake === 'function') setTimeout(shake, 180); clearTimeout(el.__t); el.__t = setTimeout(() => { el.classList.remove('show'); res(); }, D); }); };
  window.cutIn = cutIn;
  /* 變身奧義：在變身演出時也顯示標題字 */
  if (typeof window.transformFx === 'function') { const _tf = window.transformFx; window.transformFx = async function (side, actor, skill, phase) { if (phase === 'before') window.ultTitle(actor, skill, side, 1300); return _tf.apply(this, arguments); }; }
  window.ULT_TITLE = { PRESET, SUB };
})();
