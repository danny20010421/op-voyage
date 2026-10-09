// 角色試煉模擬（v133）：window.__TRIAL = { ids?: [...], n?: 60, star?: 4, sk?: 1, calibrate?: 0.6 }（calibrate：找出讓勝率接近該值的對手額外倍率 adj，填入 js/trial_v133.js 的 TRIAL_ADJ）；用試煉的真實設定（LV100、單人、對手體質換算＋BOSS 強化）建立雙方，AI 與 duel-sim.js 相同。回傳每位角色的勝率。
async () => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  startBattle({ team: [{ id: 'luffy', lv: 80 }], enemyId: 'crocodile', enemyLv: 80, chapterId: 'east', isBoss: false, revives: 0, onEnd: () => ({ message: '' }), onLeave: () => {} });
  await w(1200); battle.gameOver = true;
  const noop = () => {}; ['log','floatText','showDamage','showHeal','triggerImpact','renderHUD','shake','flashScreen'].forEach(k => { try { window[k] = noop; } catch (e) {} });
  try { log = noop; } catch (e) {} try { showDamage = noop; } catch (e) {} try { showHeal = noop; } catch (e) {} try { floatText = noop; } catch (e) {} try { renderHUD = noop; } catch (e) {} try { triggerImpact = noop; } catch (e) {}
  const ids = CHARACTER_ORDER.filter(id => !['marine', 'mayor', 'imu', 'morgans'].includes(id)); const RR = {}; const tw = {};
  const CC = ['skipAttack', 'freeze', 'paralyze', 'fear', 'petrify'];
  function act(A, B, side) { return act1(A, B, side); }
  function act1(A, B, side) {
    for (const k of CC) if (A.status[k] > 0 && k !== 'freeze') { A.status[k]--; return; }
    const av = A.skills.map((s, i) => [s, i]).filter(([s]) => s.pp > 0 && !s.locked);
    if (!av.length) return;
    /* 會挑時機的 AI：對手血量低於 60% 或自己低於 40% 時放奧義；自己血量低時優先回復；其他時候偏好威力高的攻擊 */
    const hpA = A.hp / A.maxHp, hpB = B.hp / B.maxHp, ult = av.find(([s]) => s.ultimate), heal = av.find(([s]) => s.type === 'support' && s.effect && (s.effect.healRatio || s.effect.fullHeal || s.effect.regenTurns));
    let pick = null;
    const POL = (window.__DUEL || {}).ultFirst; /* ultFirst：像玩家一樣奧義一能用就先放（'all' 雙方、'me' 只有受測角色） */
    const early = POL === 'all' || (POL === 'me' && A.id === (window.__DUEL || {}).id);
    if (ult && (early || hpB < .6 || hpA < .4)) pick = ult; else if (heal && hpA < .45 && Math.random() < .7) pick = heal;
    if (!pick) { const atk = av.filter(([s]) => !s.ultimate); const w = atk.map(([s]) => (s.type === 'attack' ? (s.power || 60) : 70) + 20); let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < atk.length; i++) { r -= w[i]; if (r < 0) { pick = atk[i]; break; } } pick = pick || av[0]; }
    const skill = pick[0]; skill.pp--;
    const sk = JSON.parse(JSON.stringify(skill)); const tok = window.rocksPre ? rocksPre(A, B, sk) : null; try { return act2(A, B, side, sk); } finally { if (tok) rocksPost(tok); }
  }
  function act2(A, B, side, sk) {
    if (A.status.attackFail > 0 && Math.random() < (A.status.attackFailChance || 0)) { A.status.attackFail--; return; } /* 與 battle.js 相同：攻擊失效 */
    if (sk.type === 'attack' && B.status.invuln > 0) return;
    if (sk.type === 'attack' && B.status.dodge > 0) { B.status.dodge--; return; }
    const r = computeSkillOutcome(A, B, sk, {});
    if (sk.type === 'attack' && B.status.reflect > 0) { const m = B.status.reflectMultiplier || 1; B.status.reflect = 0; B.status.reflectMultiplier = 1; applyDamage(A, Math.max(1, Math.round(r.damage * m)), side); return; } /* 與 battle.js 相同：反彈 */
    if (r.damage > 0) applyDamage(B, r.damage, side === 'L' ? 'R' : 'L', r.meta);
    applySkillEffects(A, B, sk, r);
    if (r.damage > 0 && sk.type === 'attack' && B.status.thornTurns > 0) applyDamage(A, Math.round(r.damage * (B.status.thornRatio || .5)), side);
  }
  const proto = {};
  function prep(id) { const T = window.__TRIAL || {}; const r = SAVE.data.roster[id] = SAVE.data.roster[id] || { lv: 100, exp: 0 }; r.lv = 100; r.star = T.star ?? 4; r.sk = [1, 2, 3, 4, 5].map(() => T.sk || 1); r.trial = false;
    const rv = TRIAL.rival(id); startBattle({ team: [{ id, lv: 100 }], enemyId: rv, enemyLv: 100, enemyMod: TRIAL.mod(id), chapterId: 'east', isBoss: true, revives: 0, trial: id, onEnd: () => ({ message: '' }), onLeave: () => {} });
    battle.gameOver = true; clearInterval(battle.timerHandle); proto[id] = [structuredClone(battle.player), structuredClone(battle.enemy)]; }
  function fight(a, m) {
    const A = structuredClone(proto[a][0]), B = structuredClone(proto[a][1]); if (m) { B.maxHp = Math.round(B.maxHp * m); B.hp = B.maxHp; B.dmgMul *= m; } battle.player = A; battle.enemy = B; battle.team = [A]; battle.isBoss = true; battle.eruption = null; battle.gameOver = true;
    for (let round = 0; round < 40; round++) {
      const first = (A.baseSpeed * (1 + A.buffs.spd * .05)) >= (B.baseSpeed * (1 + B.buffs.spd * .05)) ? [A, B] : [B, A];
      for (const f of first) { const o = f === A ? B : A; if (f.hp <= 0 || o.hp <= 0) continue; act(f, o, f === A ? 'L' : 'R');
        [A, B].forEach(x => { if (x.hp <= 0 && x.status.undyingTurns > 0) { x.status.undyingTurns = 0; x.hp = x.maxHp; } }); }
      if (A.hp <= 0 || B.hp <= 0) break;
      endTurnStatus(A); endTurnStatus(B);
      [A, B].forEach(x => { if (x.hp <= 0 && x.status.undyingTurns > 0) { x.status.undyingTurns = 0; x.hp = x.maxHp; } });
      if (A.hp <= 0 || B.hp <= 0) break;
    }
    if (A.hp <= 0 && B.hp > 0) return 0; if (B.hp <= 0 && A.hp > 0) return 1; return A.hp / A.maxHp > B.hp / B.maxHp ? 1 : 0;
  }
  const T = window.__TRIAL || {}, N = T.n || 60; window.__DUEL = { ultFirst: 'me' };
  const tids = T.ids || CHARACTER_ORDER.filter(id => !(CHAR_OBTAIN[id] || {}).npcOnly);
  const out = {}, errs = new Set(); let sw = 0;
  const rate = (id, m) => { let wv = 0; for (let k = 0; k < N; k++) { try { wv += fight(id, m); } catch (e) { errs.add(id + ':' + e.message); } } return wv / N; };
  const adj = {};
  for (const id of tids) { try { prep(id); window.__DUEL.id = id; } catch (e) { errs.add(id + ':prep:' + e.message); continue; }
    if (T.calibrate) { /* 找出讓勝率最接近 target 的額外倍率（對手體力、傷害同乘） */ let lo = .25, hi = 4; for (let it = 0; it < 9; it++) { const mid = Math.sqrt(lo * hi); if (rate(id, mid) > T.calibrate) lo = mid; else hi = mid; } adj[id] = +Math.sqrt(lo * hi).toFixed(2); out[id] = Math.round(rate(id, adj[id]) * 100); }
    else out[id] = Math.round(rate(id) * 100); sw += out[id]; }
  return { avg: Math.round(sw / tids.length), vs: out, adj, errs: [...errs].slice(0, 8) };
}
