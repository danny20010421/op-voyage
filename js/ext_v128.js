/* v128 戰鬥擴充：凱多的龍人型態（效果 kaidoDragon { image, scale, label }）。載入順序：ext_v121.js 之後。
   - 只要第 5 招真的使用出去（扣了 PP，不論打中、落空或被閃避），凱多仍活著 → 化為龍人型態。
   - 不使用 formTurns：回合結束不會倒數恢復，紅髮的霸王色（revertForm）也不會解除；只有倒下（體力歸 0）才恢復原本立繪。
   - 戰鬥結束後角色會重新建立，自然回到原本立繪。
   kaidoDragonOn(f) / kaidoDragonOff(f)：只改角色狀態並更新立繪，battle.js（executeAction 包裝，見 fx_v128.js 的雷光演出）與 live.js 共用。 */
(function () {
  const vo = id => (typeof visualOverride === 'function' ? visualOverride('form:' + id) : null);
  const refresh = f => { if (typeof refreshFighterImage === 'function') refreshFighterImage(f); };
  window.kaidoDragonOn = function (f, silent) {
    const sk = f && f.skills && f.skills.find(s => s.effect && s.effect.kaidoDragon), D = sk && sk.effect.kaidoDragon;
    if (!D || f.hp <= 0 || f.status.kaidoDragon) return false;
    if (!f.baseImage) f.baseImage = f.image;
    f.image = D.image; const VO = vo(f.id); f.visMul = (VO && VO.battleScale) || D.scale || 1; f.mirror = VO && VO.faceLeft !== undefined ? VO.faceLeft : !!D.mirror;
    f.status.kaidoDragon = true;
    if (!silent) refresh(f);
    if (typeof log === 'function') log(`🐉 ${f.name} 化為${D.label || '龍人型態'}！`);
    return true;
  };
  window.kaidoDragonOff = function (f) {
    if (!f || !f.status || !f.status.kaidoDragon) return false;
    f.status.kaidoDragon = false;
    if (f.baseImage) f.image = f.baseImage; f.visMul = 1; f.mirror = false; refresh(f);
    return true;
  };
  /* 倒下就恢復原本立繪 */
  if (typeof applyDamage === 'function') {
    const _ad = applyDamage;
    applyDamage = function (target) { const r = _ad.apply(this, arguments); if (target && target.hp <= 0) kaidoDragonOff(target); return r; };
  }
  if (typeof checkBattleEnd === 'function') {
    const _cbe = checkBattleEnd;
    checkBattleEnd = function () { try { const b = typeof battle !== 'undefined' && battle; if (b) [b.player, b.enemy].concat(b.team || []).forEach(f => { if (f && f.hp <= 0) kaidoDragonOff(f); }); } catch (e) { } return _cbe.apply(this, arguments); };
  }
  /* 第 5 招使用後變身：包住 executeAction（battle.js），招式演出結束後才播雷光並換圖 */
  if (typeof executeAction === 'function') {
    const _ea = executeAction;
    executeAction = async function (side, idx) {
      const actor = typeof battle !== 'undefined' && battle ? (side === 'P' ? battle.player : battle.enemy) : null;
      const skill = actor && idx !== -1 ? actor.skills[idx] : null, D = skill && skill.effect && skill.effect.kaidoDragon;
      if (!D) return _ea.apply(this, arguments);
      const mark = {}, prev = actor.status.lastSkill; actor.status.lastSkill = mark;
      const r = await _ea.apply(this, arguments);
      const used = actor.status.lastSkill === skill.name;
      if (actor.status.lastSkill === mark) actor.status.lastSkill = prev;
      if (used && actor.hp > 0 && !actor.status.kaidoDragon && battle && (battle.player === actor || battle.enemy === actor)) {
        const S = battle.player === actor ? 'L' : 'R';
        if (typeof kaidoDragonFx === 'function') { try { await kaidoDragonFx(S, actor, () => kaidoDragonOn(actor)); } catch (e) { console.warn(e); kaidoDragonOn(actor); } }
        else kaidoDragonOn(actor);
        if (typeof renderHUD === 'function') renderHUD();
      }
      return r;
    };
  }
})();
