/* 遊戲說明（v97）：屬性克制、戰鬥說明、遊戲介紹。設定頁與手機選單都可以打開。 */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const chip = t => `<span class="hp-type" style="--t:${(typeof TYPE_COLORS !== 'undefined' && TYPE_COLORS[t]) || '#888'}">${esc(t)}</span>`;
  function typePane() {
    const C = typeof TYPE_CHART !== 'undefined' ? TYPE_CHART : {}, types = Object.keys(typeof TYPE_COLORS !== 'undefined' ? TYPE_COLORS : C);
    const up = (GAME_SETTINGS.typeUp || 1.25), dn = (GAME_SETTINGS.typeDown || .8);
    const rows = types.map(t => { const beats = C[t] || [], weak = types.filter(u => (C[u] || []).includes(t)); return `<tr><th>${chip(t)}</th><td>${beats.map(chip).join('') || '<em>—</em>'}</td><td>${weak.map(chip).join('') || '<em>—</em>'}</td></tr>`; }).join('');
    return wheelHTML() + `<div class="hp-lead"><p>每位角色有 1～2 個屬性。攻擊時比較雙方的屬性：</p>
      <ul><li><b class="hp-up">克制</b>：我方任一屬性克制對方任一屬性 → 造成的傷害 <b>×${up}</b></li><li><b class="hp-dn">被克制</b>：對方的屬性克制我方 → 造成的傷害 <b>×${dn}</b></li><li><b>互相克制或沒有關係</b> → 傷害不變（×1）</li></ul>
      <p class="hp-tip">戰鬥畫面上方的屬性列會即時顯示目前的克制關係：<b class="hp-up">克制</b>、<b class="hp-dn">微弱</b>。換上克制對手的船員，是打贏強敵最簡單的方法。</p></div>
      <div class="hp-tablewrap"><table class="hp-table"><thead><tr><th>屬性</th><th>克制（傷害 ×${up}）</th><th>被這些屬性克制</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="hp-tip">三角關係：格鬥 → 闇 → 超能 → 格鬥；火 → 冰 → 水 → 火。</p>`;
  }
  /* v102：屬性克制輪盤（點屬性看動態箭頭；切換「進攻／防守」） */
  let wSel = null, wMode = 'atk';
  function wheelHTML() {
    const C = typeof TYPE_CHART !== 'undefined' ? TYPE_CHART : {}, types = Object.keys(typeof TYPE_COLORS !== 'undefined' ? TYPE_COLORS : C);
    const up = (GAME_SETTINGS.typeUp || 1.25), dn = (GAME_SETTINGS.typeDown || .8); if (!wSel || !types.includes(wSel)) wSel = types[0];
    const mult = (a, b) => { const u = (C[a] || []).includes(b), d = (C[b] || []).includes(a); return u && !d ? up : d && !u ? dn : 1; };
    const N = types.length, R = 138, cx = 180, cy = 180, pos = types.map((t, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / N; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
    const col = t => TYPE_COLORS[t] || '#888';
    let arrows = '', k = 0;
    types.forEach((t, i) => { const m = wMode === 'atk' ? mult(wSel, t) : mult(t, wSel); if (m === 1) return;
      const good = wMode === 'atk' ? m > 1 : m < 1, cls = m > 1 ? 'up' : 'dn', [x, y] = pos[i], dx = x - cx, dy = y - cy, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      let [x1, y1, x2, y2] = [cx + ux * 40, cy + uy * 40, x - ux * 26, y - uy * 26]; if (wMode === 'def') [x1, y1, x2, y2] = [x2, y2, x1, y1];
      const lx = cx + ux * 84 - uy * 11, ly = cy + uy * 84 + ux * 11;
      arrows += `<g class="tw-ar ${cls} ${good ? 'good' : 'bad'}" style="--d:${(k++) * .06}s"><line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" pathLength="100" marker-end="url(#tw-${cls})"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}">×${m}</text></g>`; });
    const nodes = types.map((t, i) => { const [x, y] = pos[i], m = wMode === 'atk' ? mult(wSel, t) : mult(t, wSel); return `<g class="tw-n ${t === wSel ? 'sel' : ''} ${m > 1 ? 'up' : m < 1 ? 'dn' : ''}" data-t="${t}" tabindex="0" role="button" aria-label="${t}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" style="--t:${col(t)}"/><text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}">${t}</text></g>`; }).join('');
    const beats = types.filter(t => mult(wSel, t) > 1), weak = types.filter(t => mult(t, wSel) > 1);
    return `<section class="tw"><div class="tw-top"><div class="tw-mode" role="tablist"><button data-m="atk" class="${wMode === 'atk' ? 'on' : ''}">進攻關係</button><button data-m="def" class="${wMode === 'def' ? 'on' : ''}">防守關係</button></div>
      <div class="tw-legend"><span class="up">克制 ×${up}</span><span class="dn">微弱 ×${dn}</span><span class="no">無關係 ×1</span></div></div>
      <svg class="tw-svg" viewBox="0 0 360 360" role="img" aria-label="屬性克制輪盤"><defs><marker id="tw-up" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ff5a6a"/></marker><marker id="tw-dn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#4fd6ff"/></marker></defs>
        <circle class="tw-ring" cx="180" cy="180" r="${R}"/>${arrows}<g class="tw-c"><circle cx="180" cy="180" r="34" style="--t:${col(wSel)}"/><text x="180" y="176">${wSel}</text><text class="tw-sub" x="180" y="193">${wMode === 'atk' ? '攻擊時' : '被攻擊時'}</text></g>${nodes}</svg>
      <p class="tw-sum">${wMode === 'atk' ? `<b>${wSel}</b> 攻擊 ${beats.map(chip).join('') || '—'} 時傷害 <b class="hp-up">×${up}</b>；攻擊 ${weak.map(chip).join('') || '—'} 時傷害 <b class="hp-dn">×${dn}</b>。` : `${weak.map(chip).join('') || '—'} 攻擊 <b>${wSel}</b> 時傷害 <b class="hp-up">×${up}</b>；${beats.map(chip).join('') || '—'} 攻擊 <b>${wSel}</b> 時傷害 <b class="hp-dn">×${dn}</b>。`}點外圈的屬性可以切換。</p></section>`;
  }
  function bindWheel(root) { root.querySelectorAll('.tw-n').forEach(g => { const go = () => { wSel = g.dataset.t; render(); }; g.onclick = go; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
    root.querySelectorAll('.tw-mode button').forEach(b => b.onclick = () => { wMode = b.dataset.m; render(); }); }
  const sec = (h, items) => `<section class="hp-sec"><h4>${h}</h4><ul>${items.map(x => `<li>${x}</li>`).join('')}</ul></section>`;
  function battlePane() {
    return sec('回合與出手', ['每回合有 20 秒選擇技能，時間到會自動出招。', '速度比較快的一方先出手；部分技能有「先制」效果。', '出戰陣容最多 3 位，被擊倒時換下一位上場，體力與技能次數會延續。']) +
      sec('技能', ['每個技能有使用次數（PP），用完就不能再用；等級越高，部分技能的次數越多。', '「奧義」是最強的技能，次數很少，要留在關鍵時刻。', '戰鬥中可以使用道具（每場最多 3 個）：回復體力、補充技能次數、提升能力。']) +
      sec('能力與狀態', ['攻擊、防禦、速度可以提升或下降，每一階約 ±10%（速度 ±5%），最多 ±6 階。', '異常狀態：麻痺／暈眩（無法攻擊）、恐懼、冰凍、燒傷與流血（每回合扣血）、破防（受到的傷害增加）、虛弱（受到 1.2～1.5 倍傷害）。', '「免疫」狀態可以擋下異常；「護盾」會先吸收傷害。']) +
      sec('變強的方法', ['升級：戰鬥、任務、經驗書都能獲得經驗；未上陣的船員也會分到一部分。', '羈絆：收集指定的船員並一起上陣，獲得體力、傷害、防禦、速度或減傷加成。', '稀有度：UR++ ＞ UR+ ＞ UR ＞ SSR ＞ SR ＞ RRR ＞ RR ＞ R ＞ U ＞ C。']);
  }
  function gamePane() {
    return sec('主線篇章', ['從東海出發，一路航向艾爾巴夫，共 13 個篇章。', '在島上和 NPC 對話、完成任務，最後挑戰 BOSS；通關後可能獲得新船員。', '島上可以跳躍（空白鍵或「跳」按鈕）、爬樓梯、走橋、走進建築。', '手機發燙或卡頓時，可以在設定把畫質切換成「省電」。']) +
      sec('冒險', ['勇者之塔：250 層的連續挑戰，每 10 層一位 BOSS（只會出現 RRR 以上的角色）。', '皇帝領海：連戰四皇的隊長，最後挑戰四皇真身，勝利就能讓四皇加入。集齊 6 位四皇後開放「洛克斯挑戰」（展示頁下方）：六皇連戰 → 羅傑與卡普 → 洛克斯的兩個分身 → 洛克斯真身，通過後洛克斯（UR++）直接加入。', '奪寶大冒險：左右交替划槳前進，閃避障礙、收集金幣；2200 公尺後難度固定。', '登上虛空王座：終極挑戰。', '歌姬挑戰：跟著歌曲的節奏打音符，擊敗 BOSS 美音；每首歌第一次拿到 S 以上評分得 20 片美音碎片，集滿 100 片合成美音。']) +
      sec('夥伴', ['懸賞處召喚：抽船員與道具；限定召喚可以集碎片換角色。', '船團：和其他玩家一起挑戰船團 BOSS。', '好友：送禮、留言、好友對戰（好友對戰沒有獎勵）。']) +
      sec('小提醒', ['記得定期「匯出存檔」，換手機或清除瀏覽器資料時才不會遺失進度；登入帳號可以使用雲端存檔。', '設定頁可以調整畫質、戰鬥速度、音樂，以及重新觀看新手教學。']);
  }
  let el = null, tab = 'type';
  function render() { const T = [['type', '屬性克制'], ['battle', '戰鬥說明'], ['game', '遊戲介紹']]; el.querySelector('.hp-tabs').innerHTML = T.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-k="${k}">${l}</button>`).join('');
    el.querySelector('.hp-body').innerHTML = tab === 'type' ? typePane() : tab === 'battle' ? battlePane() : gamePane(); if (!render.__keep) el.querySelector('.hp-body').scrollTop = 0;
    el.querySelectorAll('.hp-tabs button').forEach(b => b.onclick = () => { tab = b.dataset.k; render(); }); if (tab === 'type') bindWheel(el); }
  window.openHelp = function (t) {
    if (!el) { el = document.createElement('div'); el.className = 'modal'; el.id = 'helpModal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', '遊戲說明');
      el.innerHTML = '<div class="modal-card hp-card"><header class="hp-head"><h3>遊戲說明</h3><button class="icon-btn" data-close aria-label="關閉">✕</button></header><nav class="hp-tabs" role="tablist"></nav><div class="hp-body"></div></div>';
      document.body.appendChild(el); el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-close]')) closeModal('helpModal'); }); }
    tab = t || tab; render(); openModal('helpModal');
  };
})();
