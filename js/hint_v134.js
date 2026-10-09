/* v134 優化：培養提示（紅點）、航海寶物的一鍵裝備與批次分解、戰鬥結算顯示掉落的寶物。
   紅點規則（growHints）：覺醒材料足夠、可以挑戰試煉（★4 未通過）、有技能可以升級、寶物欄位空著且背包有同類寶物。
   顯示位置：大廳「船員」按鈕（只看出戰陣容）、船員列表的角色卡、「培養」按鈕、培養視窗的分頁。 */
(function () {
  const inv = () => SAVE.data.inventory || {};
  const R = id => (SAVE.data.roster || {})[id];
  function growHints(id) {
    const h = { star: false, trial: false, sk: false, gear: false }, r = R(id), P = window.PROG; if (!r || !P) return h;
    const st = P.starOf(id);
    if (st === 4 && window.TRIAL && !TRIAL.done(id)) h.trial = true;
    else if (st < 5) { const c = P.starCost(id, st + 1); h.star = r.lv >= c.lv && (inv().awaken_gem || 0) >= c.gem && (SAVE.data.berry || 0) >= c.berry; }
    const mx = P.skMax(id), c = CHARACTERS[id];
    h.sk = !!c && c.skills.some((s, i) => { const u = (typeof SKILL_UNLOCK !== 'undefined' && SKILL_UNLOCK[i]) || 1; if (r.lv < u || (c.skinSkills && c.skinSkills.includes(i))) return false; const lv = P.skLv(id, i); if (lv >= 5 || lv >= mx) return false; const k = P.skCost(lv + 1); return (inv().skill_book || 0) >= k.book && (SAVE.data.berry || 0) >= k.berry; });
    const G = window.GEAR; if (G) { const eq = G.equipped(id).map(g => g.slot); h.gear = Object.keys(G.cfg.slots).some(k => !eq.includes(k) && G.gear().items.some(g => g.slot === k && !g.eq)); }
    return h;
  }
  const any = h => h.star || h.trial || h.sk || h.gear;
  function paint() { try {
    const own = Object.keys(SAVE.data.roster || {}).filter(id => CHARACTERS[id]);
    const memo = {}; const hint = id => memo[id] || (memo[id] = growHints(id));
    document.querySelectorAll('#charModal .char[data-id], #charModal .sb-tile[data-id]').forEach(b => { const id = b.dataset.id; b.classList.toggle('gh-dot', own.includes(id) && any(hint(id))); });
    const sel = document.querySelector('#charModal .char.on[data-id], #charModal .sb-tile.on[data-id]'), go = document.querySelector('.gw-open');
    if (go && sel) go.classList.toggle('gh-dot', any(hint(sel.dataset.id)));
    const team = (SAVE.data.lineup || []).filter(id => own.includes(id)), nav = document.querySelector('.l2-tab[data-lb="crew"]');
    if (nav) nav.classList.toggle('has-dot', team.some(id => any(hint(id))));
    const m = document.getElementById('growModal'); if (m && m.classList.contains('show')) { const id = m.dataset.id; if (id) { const h = hint(id); [['star', h.star || h.trial], ['sk', h.sk], ['gear', h.gear]].forEach(([k, on]) => { const t = m.querySelector(`.gw-tabs [data-tab="${k}"]`); if (t) t.classList.toggle('gh-dot', !!on); }); } }
  } catch (e) { } }
  let qd = 0; const queue = () => { if (qd) return; qd = requestAnimationFrame(() => { qd = 0; paint(); }); };

  /* ---------- 航海寶物：一鍵裝備最佳、批次分解、結算顯示掉落 ---------- */
  const W = { dmg: 1, hp: 1, spd: 1.2, def: .8, ult: .7 }; /* 評分：各詞條百分比加權（速度略高、防禦與奧義傷害略低） */
  function score(g) { const G = window.GEAR, m = G.cfg.slots[g.slot].main; return G.mainVal(g) * (W[m] || 1) + g.subs.reduce((a, [k, v]) => a + v * (W[k] || 1), 0); }
  function bestEquip(id) { const G = window.GEAR; if (!G) return 0; let n = 0;
    Object.keys(G.cfg.slots).forEach(k => { const cur = G.equipped(id).find(g => g.slot === k); const pool = G.gear().items.filter(g => g.slot === k && (!g.eq || g.eq === id));
      const best = pool.sort((a, b) => score(b) - score(a))[0]; if (best && best !== cur) { G.equip(best.id, id); n++; } });
    return n; }
  function salvageRar(rar) { const G = window.GEAR; const ids = G.gear().items.filter(g => g.rar === rar && !g.eq).map(g => g.id); return ids.length ? G.salvage(ids) : { n: 0, berry: 0, gem: 0 }; }
  function toolbar(id) { const G = window.GEAR; if (!G) return ''; const items = G.gear().items, cnt = r => items.filter(g => g.rar === r && !g.eq).length;
    return `<div class="gr-tools"><span class="gr-bag">寶物 <b>${items.length}</b>/${G.cfg.cap}</span><button class="btn-gold sm" data-gbest>一鍵裝備最佳</button><button class="btn-ghost sm" data-gsal="R" ${cnt('R') ? '' : 'disabled'}>分解 R（${cnt('R')}）</button><button class="btn-ghost sm" data-gsal="SR" ${cnt('SR') ? '' : 'disabled'}>分解 SR（${cnt('SR')}）</button></div>`; }
  function decorateGear(m) { const id = m.dataset.id, slots = m.querySelector('.gr-slots'); if (!id || !slots || m.querySelector('.gr-tools')) return;
    slots.insertAdjacentHTML('beforebegin', toolbar(id));
    const b = m.querySelector('[data-gbest]'); if (b) b.onclick = e => { e.stopPropagation(); const n = bestEquip(id); toast(n ? `已換上評分最高的寶物（${n} 件）` : '目前已經是最佳裝備', n ? 'gold' : ''); if (n && typeof SFX !== 'undefined') SFX.play('buff'); rerender(id); };
    /* 批次分解：按第一次變成「再按一次確認」，3 秒內再按才分解（不用瀏覽器的確認視窗，App 內建瀏覽器也能用） */
    m.querySelectorAll('[data-gsal]').forEach(x => x.onclick = e => { e.stopPropagation(); const rar = x.dataset.gsal;
      if (!x.classList.contains('arm')) { x.classList.add('arm'); x.dataset.t = x.textContent; x.textContent = '再按一次確認'; clearTimeout(x.__t); x.__t = setTimeout(() => { x.classList.remove('arm'); x.textContent = x.dataset.t; }, 3000); return; }
      clearTimeout(x.__t); const r = salvageRar(rar); toast(`分解 ${r.n} 件：貝里 +${r.berry.toLocaleString()}${r.gem ? `、覺醒結晶 +${r.gem}` : ''}`, 'gold'); rerender(id); }); }
  function rerender(id) { if (window.openGrow) openGrow(id, 'gear'); }
  /* 戰鬥中掉落的寶物：結算畫面多一行 */
  let pend = [];
  function flush(tries) { const d = document.getElementById('bResDesc'), res = document.getElementById('bResult'); if (!pend.length) return;
    if (d && res && res.classList.contains('show') && d.innerHTML) { d.insertAdjacentHTML('beforeend', `<p class="gr-drop"><small>獲得航海寶物</small>${pend.map(g => `<span>${window.GEAR.gearIcon(g, 24)}<em class="rar c-rar r-${g.rar}">${g.rar}</em>${g.name}</span>`).join('')}</p>`); pend = []; return; }
    if (tries < 20) setTimeout(() => flush(tries + 1), 250); else pend = []; }

  window.addEventListener('DOMContentLoaded', () => {
    const G = window.GEAR;
    if (G && G.addGear) { const ag = G.addGear; G.addGear = function (g, quiet) { const r = ag.apply(this, arguments); if (r && typeof currentScreen !== 'undefined' && currentScreen === 'battleScreen' && typeof battle !== 'undefined' && battle && battle.gameOver) { pend.push(r); setTimeout(() => flush(0), 300); } queue(); return r; }; }
    if (window.openGrow) { const og = window.openGrow; window.openGrow = function (id, t) { const r = og.apply(this, arguments); const m = document.getElementById('growModal'); if (m) decorateGear(m); queue(); return r; }; }
    /* 培養視窗每次重畫（升級、換分頁）都會改寫內容：補上工具列與紅點 */
    const hook = () => { const m = document.getElementById('growModal'); if (!m || m.__gh) return; m.__gh = true; new MutationObserver(() => { decorateGear(m); queue(); }).observe(m, { childList: true, subtree: false }); };
    hook(); setTimeout(hook, 1500);
    const cm = document.getElementById('charModal'); if (cm) new MutationObserver(queue).observe(cm, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    if (typeof openModes === 'function') { const om = window.openModes; window.openModes = function () { const r = om.apply(this, arguments); setTimeout(paint, 300); return r; }; }
    if (typeof SAVE !== 'undefined' && SAVE.save) { const sv = SAVE.save; SAVE.save = function () { const r = sv.apply(this, arguments); queue(); return r; }; }
    setTimeout(paint, 2000);
  });
  window.GROWHINT = { hints: growHints, paint, bestEquip, score };
})();
