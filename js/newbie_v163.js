/* v163 新手流程整理：
   ① 選好入門船員後直接回到大廳，新手 SR 拉霸疊在大廳上（不再停在懸賞處）；拉霸、七日之約、新手導覽依序一次只出現一個。
   ② 新手拉霸重做：必定抽到一位尚未擁有的 SR 船員（沒有 SR 可抽時才改從其他未擁有的船員抽），LV 100 加入。
      版面：標題列（關閉鈕不壓字）→ 一句說明 → 三格轉輪（單排、頭部優先）→「這次可能抽到」→ 主按鈕；
      揭曉：整張卡換成角色立繪（完整顯示、頭部在上）、稀有度、名字，告訴玩家去哪裡看，兩個按鈕。
   ③ 沿用 #slotModal 與 slotSpin／slotResult／reel0～2 這些 id（舊的 openSlot 被其他檔案包住時也不會壞）。 */
(function () {
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion'); } catch (e) { return false; } };
  let fromStarter = false, busy = false, target = null;

  /* ---------- 抽獎池：未擁有的 SR 船員 ---------- */
  function srPool() {
    const all = unownedChars(), R = typeof CHAR_RARITY !== 'undefined' ? CHAR_RARITY : {};
    const sr = all.filter(id => R[id] === 'SR');
    return sr.length ? sr : all;
  }
  const rarOf2 = id => (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[id]) || 'SR';
  const preload = src => { try { const i = new Image(); i.decoding = 'async'; i.src = src; } catch (e) { } };

  /* ---------- 版面 ---------- */
  function build() {
    const M = $('slotModal'); if (!M || M.dataset.v163) return M; M.dataset.v163 = '1'; M.classList.add('nb-modal');
    M.innerHTML = `<div class="modal-card nb-card" role="document">
      <header class="nb-head"><div class="nb-ttl"><small>新手福利・只有一次</small><h2 id="slotTitle">新手 SR 拉霸</h2></div><button class="icon-btn sm nb-x" id="nbClose" aria-label="關閉">×</button></header>
      <div class="nb-stage" id="nbStage">
        <p class="nb-lead">免費拉一次，必定獲得一位 <b>SR 船員</b>，直接以 <b>LV&nbsp;100</b> 加入！</p>
        <div class="nb-machine"><div class="nb-reels">${[0, 1, 2].map(r => `<div class="nb-reel"><div class="nb-strip" id="reel${r}"></div></div>`).join('')}<i class="nb-line" aria-hidden="true"></i></div></div>
        <div class="nb-pool"><small>這次可能抽到</small><div class="nb-pool-row" id="nbPool"></div></div>
        <footer class="nb-foot"><button class="btn-gold big nb-go" id="slotSpin">拉下拉桿・免費抽 1 次</button></footer>
      </div>
      <div class="nb-reveal" id="slotResult" aria-live="polite"></div>
      <div class="coin-burst nb-coins" id="coinBurst" aria-hidden="true"></div>
      <i class="slot" hidden></i><button id="slotLever" hidden aria-hidden="true" tabindex="-1"></button>
    </div>`;
    $('nbClose').onclick = () => closeModal('slotModal');
    $('slotSpin').onclick = spin; $('slotLever').onclick = spin;
    /* 視窗關掉（按 ×、點背景、Esc）：新手流程中就回到大廳 */
    let was = false; new MutationObserver(() => { const on = M.classList.contains('show'); if (on) { was = true; return; } if (!was) return; if (busy) { M.classList.add('show'); return; } was = false; onClosed(); }).observe(M, { attributes: true, attributeFilter: ['class'] });
    return M;
  }
  const cell = id => `<div class="nb-cell"><img src="${CHARACTERS[id].avatar}" alt="" draggable="false"></div>`;
  function strip(el, ids) { el.innerHTML = ids.map(cell).join(''); el.style.transform = 'translateY(0)'; }

  function open() {
    if (SAVE.data.freeDraw) { toast('新手拉霸已經使用過了'); return; }
    const pool = srPool(); if (!pool.length) { toast('所有船員都已經到齊了！'); return; }
    build(); busy = false; target = null;
    $('nbStage').hidden = false; $('slotResult').innerHTML = ''; $('slotModal').classList.remove('nb-done', 'nb-spin');
    const go = $('slotSpin'); go.disabled = false; go.textContent = '拉下拉桿・免費抽 1 次';
    [0, 1, 2].forEach(r => strip($('reel' + r), [0, 1, 2].map(k => pool[(k + r) % pool.length])));
    $('nbPool').innerHTML = pool.slice(0, 8).map(id => `<span class="nb-pc" title="${CHARACTERS[id].name}"><img src="${CHARACTERS[id].avatar}" alt=""><b>${CHARACTERS[id].name}</b></span>`).join('');
    pool.forEach(id => preload(CHARACTERS[id].image));
    openModal('slotModal');
  }

  async function spin() {
    if (busy || SAVE.data.freeDraw) return; const pool = srPool(); if (!pool.length) return;
    busy = true; target = pool[Math.floor(Math.random() * pool.length)]; preload(CHARACTERS[target].image);
    const go = $('slotSpin'); go.disabled = true; go.textContent = '轉動中…'; $('slotModal').classList.add('nb-spin');
    const R = reduce(), N = R ? 6 : 22, H = ($('reel0').querySelector('.nb-cell') || {}).offsetHeight || 96;
    const tick = setInterval(() => { try { SFX.play('blip'); } catch (e) { } }, 100);
    const anims = [0, 1, 2].map(r => {
      const ids = []; for (let i = 0; i < N; i++) ids.push(pool[Math.floor(Math.random() * pool.length)]); ids[N - 2] = target;
      const el = $('reel' + r); strip(el, ids);
      const end = -(N - 3) * H, dur = R ? 300 : 1100 + r * 450;
      return el.animate([{ transform: 'translateY(0)', easing: 'cubic-bezier(.4,0,.9,.6)' }, { transform: `translateY(${end - 10}px)`, offset: .92, easing: 'ease-out' }, { transform: `translateY(${end}px)` }], { duration: dur, fill: 'forwards' })
        .finished.then(() => { try { SFX.play('punch'); } catch (e) { } const c = el.children[N - 2]; if (c) c.classList.add('hit'); });
    });
    await Promise.all(anims); clearInterval(tick);
    /* 給獎：先存檔再演出，避免演出中關閉造成沒拿到 */
    SAVE.data.freeDraw = true; addCrew(target, MAX_LV); SAVE.save();
    try { if (window.gachaLog) gachaLog('新手召喚', [{ char: target, lv: MAX_LV }]); } catch (e) { }
    try { updateGachaBtns(); } catch (e) { }
    $('slotModal').classList.add('nb-hit');
    setTimeout(reveal, R ? 0 : 500);
  }

  function reveal() {
    const c = CHARACTERS[target], r = rarOf2(target), M = $('slotModal');
    M.classList.remove('nb-spin', 'nb-hit'); M.classList.add('nb-done'); $('nbStage').hidden = true;
    try { SFX.play('rare'); AUDIO.sfx('ult'); } catch (e) { }
    const tone = window.GCARD ? GCARD.tone(r) : '#c58bff';
    $('slotResult').innerHTML = `<div class="nb-rv" style="--tc:${tone}">
      <small class="nb-rv-k">恭喜獲得</small>
      <div class="nb-rv-art"><i class="nb-rv-glow" aria-hidden="true"></i><img src="${c.image}" alt="${c.name}" draggable="false"></div>
      <div class="nb-rv-name"><span class="rar c-rar r-${r}">${r}</span><h3>${c.name}</h3></div>
      <p class="nb-rv-sub">${c.title}・LV 100</p>
      <p class="nb-rv-tip">已經放進角色背包，之後在大廳下方「船員」就能查看與培養。</p>
      <div class="nb-rv-btns"><button class="btn-gold big" data-sl="lead">讓他擔任先鋒</button><button class="btn-ghost big" data-sl="bag">先放在背包</button></div>
    </div>`;
    if (typeof coinBurst === 'function' && !reduce()) { coinBurst($('coinBurst'), 40); try { SFX.play('coin'); } catch (e) { } }
    $('slotResult').querySelectorAll('[data-sl]').forEach(b => b.onclick = () => {
      if (b.dataset.sl === 'lead') { lineupAdd(target, true); SAVE.save(); }
      const name = c.name, lead = b.dataset.sl === 'lead';
      closeModal('slotModal');
      setTimeout(() => toast(lead ? `${name} 成為先鋒！` : `${name} 已放進背包`, 'gold'), 300);
    });
    busy = false;
  }

  /* 視窗關閉後：新手流程中回到大廳；大廳重畫（先鋒換人） */
  function onClosed() {
    if (busy) return;
    const back = fromStarter; fromStarter = false;
    if (back && typeof currentScreen !== 'undefined' && currentScreen !== 'modeScreen' && typeof openModes === 'function') openModes();
    else if (typeof currentScreen !== 'undefined' && currentScreen === 'modeScreen' && window.renderLobby) try { renderLobby(); } catch (e) { }
    if (!SAVE.data.freeDraw && back) setTimeout(() => toast('新手 SR 拉霸還沒用，之後可以到「召喚」領取'), 500);
  }

  /* ---------- 選好入門船員：直接回大廳，拉霸疊在大廳上 ---------- */
  function confirmStarter2() {
    STARTERS.forEach(id => addCrew(id, 1));
    SAVE.data.lineup = [pickChar, ...STARTERS.filter(x => x !== pickChar)].slice(0, GAME_SETTINGS.lineupMax); syncLeader(); SAVE.save();
    closeModal('charModal');
    if (typeof openModes === 'function') openModes();
    if (!SAVE.data.freeDraw && srPool().length) { fromStarter = true; setTimeout(open, 450); }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.openSlot = open; window.spinSlot = spin; window.confirmStarter = confirmStarter2;
    try { openSlot = open; spinSlot = spin; confirmStarter = confirmStarter2; } catch (e) { }
    try { pullFree = open; const b = $('pullFree'); if (b) b.onclick = open; } catch (e) { }
    build();
    /* 入門船員：說明改短，確認鈕固定在視窗底部 */
    if (typeof openStarter === 'function') {
      const _os = openStarter;
      const os2 = function () { const r = _os.apply(this, arguments); const q = $('quotaNote'); if (q) q.innerHTML = '魯夫、索隆、香吉士三人都會加入並上陣。先選一位擔任<b>先鋒</b>（第一個出場，戰鬥中可以換人）。選好後還能免費抽一位 <b>SR 船員</b>！'; $('charModal').classList.add('nb-starter'); return r; };
      window.openStarter = os2; try { openStarter = os2; } catch (e) { }
      new MutationObserver(() => { const m = $('charModal'); if (!m.classList.contains('show') && m.classList.contains('nb-starter')) m.classList.remove('nb-starter'); }).observe($('charModal'), { attributes: true, attributeFilter: ['class'] });
    }
  });
})();
