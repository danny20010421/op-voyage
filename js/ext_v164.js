/* v164 戰鬥擴充：巴托洛米奧第 5 招「屏障·絕對防禦」與皮膚能力加成。
   效果欄位（skill.effect）：
   bartoBarrier { turns, regen:[a,b], regenTurns }：張開絕對防禦屏障 turns 回合（與 invulnTurns 一起用，攻擊由 invuln 擋下）。
     屏障期間：對手的技能效果（異常狀態、能力下降、持續傷害、印記、扣技能次數、驅散、比例傷害等）對自己全部無效；
     任何來源的傷害（反彈、召喚獸、持續傷害、熔岩、靈魂壓制的吸取……）都不會扣體力。
     另外解除對手留在自己身上的印記（靈魂壓制這類「無法解除」的設計不解除，但屏障期間不會被吸體力）。
     regenTurns 回合內，每回合結束回復最大體力 a～b。
   皮膚加成 SKINS[k].bonus { def }：裝備該皮膚出戰時防禦力 ×(1＋def)（buildFighter 帶 skin 參數時套用）。
   載入順序：所有 ext_*.js、balance_*.js 之後（index.html 在 balance_v161.js 後面）；tests/*-sim.js 會用到 applySkillEffects／applyDamage／endTurnStatus。 */
(function () {
  if (typeof applySkillEffects !== 'function') return;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const sideOf = f => { const b = B(); return b && (f === b.player || (b.team && b.team.includes(f))) ? 'L' : 'R'; };
  const on = f => !!(f && f.status && f.status.__barrier > 0);
  const R = (a, b) => a + Math.random() * (b - a);
  const clone = o => { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return null; } };

  /* ---------- 技能效果：施放屏障；屏障中的一方不受對手效果影響 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    const guard = on(target) && actor !== target && !(skill && skill.__voidFx);
    const snap = guard ? { st: clone(target.status), b: Object.assign({}, target.buffs), hp: target.hp, mx: target.maxHp, pp: (target.skills || []).map(s => s.pp) } : null;
    /* 屏障中：先把這次的戰鬥紀錄暫存起來，擋下的效果（提到被保護的人）不寫進紀錄，只留一行「屏障擋下了」 */
    let buf = null, _log = null;
    if (snap && snap.st && typeof log === 'function') { buf = []; _log = log; try { log = function (m) { buf.push([this, arguments]); }; } catch (e) { buf = null; } }
    let r; try { r = _ase.apply(this, arguments); } finally { if (buf) { try { log = _log; } catch (e) { } } }
    if (buf) buf.forEach(([t, a]) => { if (!String(a[0] || '').includes(target.name)) _log.apply(t, a); });
    if (snap && snap.st) {
      let blocked = false;
      if (target.hp < snap.hp || target.maxHp !== snap.mx) { target.hp = Math.max(target.hp, snap.hp); target.maxHp = snap.mx; blocked = true; }
      ['atk', 'def', 'spd'].forEach(k => { if (target.buffs[k] < snap.b[k]) { target.buffs[k] = snap.b[k]; blocked = true; } });
      if (JSON.stringify(target.status) !== JSON.stringify(snap.st)) { target.status = snap.st; blocked = true; }
      (target.skills || []).forEach((s, i) => { if (s.pp < snap.pp[i]) { s.pp = snap.pp[i]; blocked = true; } });
      if (blocked) L(`🛡️ 絕對防禦！${target.name} 的屏障擋下了 ${actor.name} 的所有效果！`);
    }
    const ef = (skill && skill.effect) || {};
    if (ef.bartoBarrier && actor && actor.hp > 0 && !skill.__voidFx) {
      const BB = ef.bartoBarrier, st = actor.status;
      st.__barrier = Math.max(st.__barrier || 0, BB.turns || 2);
      if (BB.regenTurns) st.__bRegen = { turns: BB.regenTurns, range: BB.regen || [.05, .1] };
      if (st.__marks) Object.keys(st.__marks).forEach(k => { if (k !== 'soul') st.__marks[k] = 0; });
      st.__reflectDebuff = st.__reflectDebuff || 0;
      L(`🛡️ ${actor.name} 張開「絕對防禦」屏障！接下來 ${st.__barrier} 回合，所有攻擊、負面狀態與負面能力都無效。`);
      if (st.__bRegen) L(`💚 之後 ${st.__bRegen.turns} 回合，${actor.name} 每回合回復 ${Math.round(st.__bRegen.range[0] * 100)}～${Math.round(st.__bRegen.range[1] * 100)}% 體力。`);
    }
    return r;
  };

  /* ---------- 傷害：屏障中不受任何傷害 ---------- */
  const _ad = applyDamage;
  applyDamage = function (target, amount, side, opts) {
    if (on(target) && amount > 0) { L(`🛡️ 屏障擋下了攻擊！${target.name} 沒有受到傷害。`); try { if (typeof floatText === 'function') floatText(side || sideOf(target), '無效', 'miss'); } catch (e) { } return; }
    return _ad.apply(this, arguments);
  };

  /* ---------- 回合結束：屏障擋下持續傷害、每回合回復、倒數 ---------- */
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    const b = B(), all = b ? [b.player, b.enemy, ...(b.team || [])].filter((f, i, a) => f && a.indexOf(f) === i) : [c];
    const held = all.filter(on).map(f => [f, f.hp]);
    const r = _ets.apply(this, arguments);
    held.forEach(([f, hp]) => { if (f.hp < hp) { f.hp = hp; if (f === c) L(`🛡️ 屏障擋下了持續傷害，${f.name} 沒有損失體力。`); } });
    if (c && c.status) {
      const st = c.status, G = st.__bRegen;
      if (G && G.turns > 0 && c.hp > 0) {
        const h = Math.max(1, Math.floor(c.maxHp * R(G.range[0], G.range[1])));
        if (typeof healOk !== 'function' || healOk(c)) { const add = Math.min(c.maxHp - c.hp, h); if (add > 0) { c.hp += add; try { showHeal(sideOf(c), add); } catch (e) { } L(`💚 屏障裡的 ${c.name} 回復了 ${add} 體力（剩 ${G.turns - 1} 回合）`); } }
        G.turns--; if (G.turns <= 0) st.__bRegen = null;
      }
      if (st.__barrier > 0) { st.__barrier--; if (st.__barrier <= 0) L(`${c.name} 的絕對防禦屏障消失了。`); }
    }
    return r;
  };

  /* ---------- 狀態標籤 ---------- */
  if (typeof statusChips === 'function') {
    const _sc = statusChips;
    statusChips = function (c) {
      let h = _sc.apply(this, arguments); const st = c && c.status; if (!st) return h;
      if (st.__barrier > 0) h += `<span class="chip good" title="所有攻擊、負面狀態與負面能力都無效">絕對防禦 ${st.__barrier}</span>`;
      if (st.__bRegen && st.__bRegen.turns > 0) h += `<span class="chip good" title="每回合回復 ${Math.round(st.__bRegen.range[0] * 100)}～${Math.round(st.__bRegen.range[1] * 100)}% 體力">屏障回復 ${st.__bRegen.turns}</span>`;
      return h;
    };
  }

  /* ---------- 皮膚加成：防禦力 ---------- */
  if (typeof buildFighter === 'function') {
    const _bf = buildFighter;
    buildFighter = function (id, lv, skin) {
      const f = _bf.apply(this, arguments), SK = skin && typeof SKINS !== 'undefined' ? SKINS[skin] : null;
      if (f && SK && SK.char === id && SK.bonus) { if (SK.bonus.def && f.def) f.def = Math.round(f.def * (1 + SK.bonus.def)); f.__skinBonus = SK.bonus; }
      return f;
    };
  }

  /* ---------- AI 權重（敵方 AI 與模擬共用 window.__aiW160） ---------- */
  const _w = window.__aiW160;
  window.__aiW160 = function (actor, target, s) {
    let w = _w ? _w.apply(this, arguments) : 1; const e = (s && s.effect) || {}; if (!actor || !target) return w;
    if (e.bartoBarrier) w *= on(actor) ? .1 : (actor.hp / actor.maxHp < .55 ? 3 : 1);
    if (e.reflectTurns && !(actor.status.reflect > 0)) w *= 1.3;
    return w;
  };
})();
