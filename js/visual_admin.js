/* 後台「立繪測試」（v165 重做）：
   - 可以選任何角色（含 NPC）、任何皮膚（含尚未上架）、任何型態（技能變身 formImage／phoenixForm／kaidoDragon，伊姆的 forms[1..3]）。
   - 即時調整：對戰大小 battleScale、鏡像 faceLeft、左右／上下位置（dx、dy，單位是立繪框的 %）。
     預覽和戰鬥用同一個算法（battle.js applyVisual）：--sc＝角色 scale × battleScale ×（型態倍率 visMul），
     --mx＝(faceLeft?-1:1)×(型態 mirror?-1:1)，敵方（右）再水平翻轉一次。
   - 預覽可以切換：放在我方（左）／敵方（右）／左右都放；手機直式或電腦橫式戰場；另一邊的對手可以自己選。
   - 「實際測試戰鬥」：用目前的數值直接開一場戰鬥（型態在開場直接套用），按「撤退」回到後台；沒按儲存的數值回來後會還原。
   設定存在 op_visual_v1：{ battleScale, faceLeft, dx, dy, img }，不會因為改版（DATA_VERSION）而失效；
   img 記錄當時的立繪檔名，立繪換新圖後會提醒「這筆調整是舊圖的」。戰鬥時由 visualOverride()（battle_core.js）讀取大小與鏡像；
   位置 dx／dy 由這裡包住 applyVisual，設定 .fighter 的 --vx／--vy，css/admin_v165.css 用 CSS translate 套用（不影響原本 transform 的動畫）。 */
(function () {
  const KEY = 'op_visual_v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const store = W => { try { localStorage.setItem(KEY, JSON.stringify(W)); } catch (e) { toast('瀏覽器不允許儲存設定', 'warn'); } };
  const bare = u => String(u || '').split('?')[0];
  const H = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rar = id => (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[id]) || '';
  const FORM_KEYS = { formImage: '變身', phoenixForm: '不死鳥型態', kaidoDragon: '龍人型態' };

  /* ---------- 所有可調整的立繪 ---------- */
  function entries() {
    const L = [], ids = [...CHARACTER_ORDER, ...Object.keys(CHARACTERS).filter(id => !CHARACTER_ORDER.includes(id))];
    ids.forEach(id => { const c = CHARACTERS[id]; if (!c || !c.image) return;
      L.push({ key: 'char:' + id, kind: 'char', id, label: c.name, sub: ['角色', rar(id), c.npcOnly ? 'NPC' : ''].filter(Boolean).join('・'), img: c.image, avatar: c.avatar, bs: c.battleScale || 1, face: !!c.faceLeft, mul: 1, mirror: false, skin: null }); });
    Object.entries(typeof SKINS !== 'undefined' ? SKINS : {}).forEach(([k, s]) => { const c = CHARACTERS[s.char]; if (!c || !s.image) return;
      L.push({ key: 'skin:' + k, kind: 'skin', id: s.char, label: `${c.name}「${s.name}」`, sub: s.soon ? '皮膚・尚未上架' : '皮膚', img: s.image, avatar: s.avatar || c.avatar, bs: s.battleScale || c.battleScale || 1, face: s.faceLeft !== undefined ? s.faceLeft : !!c.faceLeft, mul: 1, mirror: false, skin: k }); });
    ids.forEach(id => { const c = CHARACTERS[id]; if (!c) return;
      (c.skills || []).forEach(s => Object.entries((s && s.effect) || {}).forEach(([k, v]) => { if (!FORM_KEYS[k] || !v || !v.image) return;
        L.push({ key: 'form:' + id, kind: 'form', id, label: `${c.name}（${k === 'formImage' ? s.name : FORM_KEYS[k]}）`, sub: '型態', img: v.image, avatar: c.avatar, bs: c.battleScale || 1, face: !!c.faceLeft, mul: v.scale || 1, mirror: !!v.mirror, skin: null }); }));
      (c.forms || []).forEach((F, i) => { if (!i || !F || !F.image) return;
        L.push({ key: 'form:' + id + '_form' + i, kind: 'form', id, label: `${F.name || c.name}（${F.label || `第 ${i} 型態`}）`, sub: '型態', img: F.image, avatar: F.avatar || c.avatar, bs: c.battleScale || 1, face: !!c.faceLeft, mul: F.scale || 1, mirror: false, skin: null }); });
    });
    return L;
  }
  /* 戰鬥中的角色對應哪一筆設定（依目前顯示的圖片判斷：型態 → 皮膚 → 角色） */
  function keyFor(f) {
    if (!f) return null; const im = bare(f.image), E = entries();
    const hit = E.find(e => e.kind === 'form' && e.id === f.id && bare(e.img) === im) || E.find(e => e.kind === 'skin' && e.id === f.id && bare(e.img) === im);
    return hit ? hit.key : 'char:' + f.id;
  }
  window.visualKeyFor = keyFor;

  /* ---------- 戰鬥：套用位置（dx、dy） ---------- */
  if (typeof applyVisual === 'function') {
    const _av = applyVisual;
    applyVisual = function (f) {
      const r = _av.apply(this, arguments);
      try { if (battle && f) { const side = f === battle.player ? 'L' : f === battle.enemy ? 'R' : null, el = side && document.getElementById('bF' + side);
        if (el) { const o = load()[keyFor(f)] || {}; el.style.setProperty('--vx', (side === 'R' ? -1 : 1) * (+o.dx || 0) + '%'); el.style.setProperty('--vy', (+o.dy || 0) + '%'); } } } catch (e) { }
      return r;
    };
  }

  /* ---------- 介面 ---------- */
  const st = { cur: 'char:luffy', q: '', kind: 'all', side: 'L', opp: 'crocodile', ratio: innerWidth < 900 ? 'tall' : 'wide' };
  function withChar(e, V) { if (e.kind !== 'form') return e; const co = V['char:' + e.id]; if (!co) return e; return Object.assign({}, e, { bs: co.battleScale || e.bs, face: co.faceLeft !== undefined ? co.faceLeft : e.face }); }
  function vals(e, V) { const o = V[e.key] || {}; return { bs: o.battleScale || (e.kind === 'form' ? e.mul : e.bs), face: o.faceLeft !== undefined ? o.faceLeft : (e.kind === 'form' ? e.mirror : e.face), dx: +o.dx || 0, dy: +o.dy || 0, saved: !!V[e.key], stale: !!(V[e.key] && V[e.key].img && bare(V[e.key].img) !== bare(e.img)) }; }
  function look(e, v) { const scale = (CHARACTERS[e.id] || {}).scale || .9;
    if (e.kind === 'form') return { sc: scale * (e.bs || 1) * v.bs, mx: (e.face ? -1 : 1) * (v.face ? -1 : 1), parts: [['角色基礎', scale], ['對戰大小', e.bs || 1], ['型態倍率', v.bs]] };
    return { sc: scale * v.bs, mx: v.face ? -1 : 1, parts: [['角色基礎', scale], ['對戰大小', v.bs]] }; }
  const fig = (side, e, v, dim) => { const L = look(e, v); return `<div class="vz-f ${side}${dim ? ' dim' : ''}" style="--sc:${L.sc.toFixed(3)};--mx:${L.mx};--vx:${(side === 'R' ? -1 : 1) * v.dx}%;--vy:${v.dy}%"><i class="vz-shadow"></i><img src="${e.img}" alt=""></div>`; };

  window.renderVisualAdmin = function (P) {
    const E = entries(), V = load(); if (!E.find(x => x.key === st.cur)) st.cur = E[0].key;
    const e = withChar(E.find(x => x.key === st.cur), V), v = vals(e, V), q = st.q.trim().toLowerCase();
    const oe = withChar(E.find(x => x.key === 'char:' + st.opp) || E.find(x => x.key === 'char:crocodile') || E[0], V), ov = vals(oe, V);
    const list = E.filter(x => (st.kind === 'all' || x.kind === st.kind || (st.kind === 'saved' && V[x.key])) && (!q || (x.label + x.id + x.sub).toLowerCase().includes(q)));
    const kinds = [['all', '全部'], ['char', '角色'], ['skin', '皮膚'], ['form', '型態'], ['saved', '已調整']];
    P.innerHTML = `<div class="vz"><h3>立繪測試</h3><p class="an">選一個立繪，調整戰鬥中的大小、面向與位置。預覽和戰鬥用同一套算法，也可以按「實際測試戰鬥」直接開一場確認。儲存後下一場戰鬥就生效，改版也不會被重置。</p>
      <div class="vz-grid">
        <section class="vz-pick">
          <input class="vz-q" id="vzQ" type="search" placeholder="搜尋角色、皮膚或型態" value="${H(st.q)}" aria-label="搜尋立繪">
          <div class="vz-kinds">${kinds.map(([k, n]) => `<button class="${st.kind === k ? 'on' : ''}" data-kind="${k}">${n}${k === 'saved' ? ` ${Object.keys(V).length}` : ''}</button>`).join('')}</div>
          <div class="vz-list" id="vzList">${list.map(x => `<button class="vz-it ${x.key === st.cur ? 'on' : ''}" data-key="${x.key}"><img src="${x.avatar}" alt="" loading="lazy"><span><b>${H(x.label)}</b><small>${H(x.sub)}</small></span>${V[x.key] ? '<em>已調整</em>' : ''}</button>`).join('') || '<p class="an">找不到符合的立繪</p>'}</div>
        </section>
        <section class="vz-main">
          <div class="vz-bar"><div class="vz-seg" aria-label="預覽位置">${[['L', '我方（左）'], ['R', '敵方（右）'], ['both', '左右都放']].map(([k, n]) => `<button class="${st.side === k ? 'on' : ''}" data-side="${k}">${n}</button>`).join('')}</div>
            <div class="vz-seg" aria-label="戰場比例">${[['tall', '手機直式'], ['wide', '電腦橫式']].map(([k, n]) => `<button class="${st.ratio === k ? 'on' : ''}" data-ratio="${k}">${n}</button>`).join('')}</div></div>
          <div class="vz-stage ${st.ratio}" id="vzStage" style="background-image:linear-gradient(180deg,rgba(8,16,28,.1),rgba(8,16,28,.55)),url('${(CHAPTERS[0] || {}).art || ''}')">
            <div class="vz-layer" id="vzLayer">${st.side === 'R' ? fig('L', oe, ov, true) : fig('L', e, v)}${st.side === 'L' ? fig('R', oe, ov, true) : fig('R', e, v)}</div>
            <span class="vz-tag">${H(e.label)}${v.stale ? '　<b>立繪已換新圖，這筆調整是舊圖的</b>' : ''}</span></div>
          <div class="vz-ctl">
            <label class="vz-row"><span>對戰大小</span><input type="range" id="vzScale" min="0.2" max="3" step="0.01" value="${v.bs}"><input type="number" id="vzScaleN" min="0.2" max="3" step="0.01" value="${(+v.bs).toFixed(2)}" aria-label="對戰大小數值"></label>
            <label class="vz-row"><span>左右位置</span><input type="range" id="vzDx" min="-40" max="40" step="1" value="${v.dx}"><input type="number" id="vzDxN" min="-40" max="40" step="1" value="${v.dx}" aria-label="左右位置（%）"></label>
            <label class="vz-row"><span>上下位置</span><input type="range" id="vzDy" min="-40" max="40" step="1" value="${v.dy}"><input type="number" id="vzDyN" min="-40" max="40" step="1" value="${v.dy}" aria-label="上下位置（%）"></label>
            <label class="vz-chk"><input type="checkbox" id="vzFace" ${v.face ? 'checked' : ''}><span>鏡像：原圖的頭與眼神朝左時勾選，讓角色面向對手</span></label>
            <label class="vz-row vz-opp"><span>對手</span><select id="vzOpp">${E.filter(x => x.kind === 'char').map(x => `<option value="${x.id}" ${x.id === st.opp ? 'selected' : ''}>${H(x.label)}</option>`).join('')}</select></label>
            <p class="vz-calc" id="vzCalc"></p>
          </div>
          <div class="vz-btns"><button class="btn-ghost" id="vzReset" ${v.saved ? '' : 'disabled'}>恢復預設</button><button class="btn-ghost" id="vzTest">實際測試戰鬥</button><button class="btn-gold" id="vzSave">儲存此項</button></div>
        </section></div></div>`;

    const $v = id => P.querySelector('#' + id), stage = $v('vzStage');
    const cur = () => ({ bs: +$v('vzScale').value, face: $v('vzFace').checked, dx: +$v('vzDx').value, dy: +$v('vzDy').value });
    const apply = () => { const c = cur(), L = look(e, c);
      stage.querySelectorAll('.vz-f:not(.dim)').forEach(f => { f.style.setProperty('--sc', L.sc.toFixed(3)); f.style.setProperty('--mx', L.mx); f.style.setProperty('--vx', (f.classList.contains('R') ? -1 : 1) * c.dx + '%'); f.style.setProperty('--vy', c.dy + '%'); });
      /* 鏡頭：和 battle.js updateCamera 相同，雙方有人特別大時整個戰場拉遠 */
      const scs = [...stage.querySelectorAll('.vz-f')].map(f => +f.style.getPropertyValue('--sc') || .9), big = Math.max(...scs.map(x => x / .9)), cam = big <= 1.12 ? 1 : Math.max(.5, Math.min(1, 1.08 / Math.pow(big, .85)));
      $v('vzLayer').style.transform = cam < 1 ? `scale(${cam.toFixed(3)})` : '';
      $v('vzCalc').textContent = `實際大小：${L.parts.map(([n, x]) => `${n} ${(+x).toFixed(2)}`).join(' × ')} ＝ ${L.sc.toFixed(2)}　${L.mx < 0 ? '鏡像' : '原方向'}　位置 ${c.dx}%／${c.dy}%${cam < 1 ? `　戰場鏡頭拉遠 ×${cam.toFixed(2)}` : ''}`; };
    const pair = (r, n, f) => { $v(r).oninput = () => { $v(n).value = f($v(r).value); apply(); }; $v(n).onchange = () => { $v(r).value = $v(n).value; $v(n).value = f($v(r).value); apply(); }; };
    pair('vzScale', 'vzScaleN', x => (+x).toFixed(2)); pair('vzDx', 'vzDxN', x => +x); pair('vzDy', 'vzDyN', x => +x);
    $v('vzFace').onchange = apply; apply();
    $v('vzQ').oninput = ev => { st.q = ev.target.value; const pos = ev.target.selectionStart; renderVisualAdmin(P); const q2 = P.querySelector('#vzQ'); q2.focus(); try { q2.setSelectionRange(pos, pos); } catch (x) { } };
    P.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { st.kind = b.dataset.kind; renderVisualAdmin(P); });
    P.querySelectorAll('[data-key]').forEach(b => b.onclick = () => { st.cur = b.dataset.key; renderVisualAdmin(P); });
    P.querySelectorAll('[data-side]').forEach(b => b.onclick = () => { st.side = b.dataset.side; renderVisualAdmin(P); });
    P.querySelectorAll('[data-ratio]').forEach(b => b.onclick = () => { st.ratio = b.dataset.ratio; renderVisualAdmin(P); });
    $v('vzOpp').onchange = ev => { st.opp = ev.target.value; renderVisualAdmin(P); };
    const on = P.querySelector('.vz-it.on'); if (on) { const l = $v('vzList'); l.scrollTop = on.offsetTop - l.offsetTop - l.clientHeight / 2 + on.offsetHeight / 2; }
    $v('vzSave').onclick = () => { const c = cur(), W = load(); W[e.key] = { battleScale: +c.bs.toFixed(3), faceLeft: c.face, dx: c.dx, dy: c.dy, img: bare(e.img) }; store(W); toast(`已儲存：${e.label}`, 'gold'); renderVisualAdmin(P); };
    $v('vzReset').onclick = () => { const W = load(); delete W[e.key]; store(W); toast('已恢復預設'); renderVisualAdmin(P); };
    $v('vzTest').onclick = () => { const c = cur(), W = load(), was = W[e.key]; W[e.key] = { battleScale: c.bs, faceLeft: c.face, dx: c.dx, dy: c.dy, img: bare(e.img) }; store(W);
      testBattle(e, () => { const W2 = load(); if (was) W2[e.key] = was; else delete W2[e.key]; store(W2); }); };
  };

  /* ---------- 實際測試戰鬥 ---------- */
  function testBattle(e, restore) {
    if (typeof startBattle !== 'function') return;
    const back = typeof currentScreen !== 'undefined' && currentScreen !== 'battleScreen' ? currentScreen : 'loginScreen', asEnemy = st.side === 'R', opp = CHARACTERS[st.opp] ? st.opp : 'crocodile';
    let done = false; const leave = () => { if (done) return; done = true; restore(); showScreen(back); openModal('adminModal'); renderAdmin('visual'); };
    closeModal('adminModal');
    startBattle({ team: [{ id: asEnemy ? opp : e.id, lv: MAX_LV, skin: asEnemy ? null : e.skin }], enemyId: asEnemy ? e.id : opp, enemySkin: asEnemy ? e.skin : null, chapterId: CHAPTERS[0].id, isBoss: false, enemyLv: MAX_LV,
      onEnd: () => ({ message: '立繪測試結束，按「返回」回到後台。' }), onLeave: leave });
    if (e.kind === 'form') setTimeout(() => { try { const f = asEnemy ? battle.enemy : battle.player, o = load()[e.key] || {}; if (!f.baseImage) f.baseImage = f.image; f.image = e.img; f.visMul = o.battleScale || e.mul || 1; f.mirror = o.faceLeft !== undefined ? o.faceLeft : e.mirror; refreshFighterImage(f); } catch (x) { } }, 80);
    toast('立繪測試戰鬥：按「撤退」或打完後回到後台', 'gold');
  }
})();
