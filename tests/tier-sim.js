// v142 稀有度對戰矩陣模擬（平衡調整用）：window.__TIER = { ids, pairs?, n, scale, rs }；對戰規則與 AI 同 duel-sim.js（LV80、無寶物、雙方套用稀有度體質）。
async () => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  startBattle({ team: [{ id: 'luffy', lv: 80 }], enemyId: 'crocodile', enemyLv: 80, chapterId: 'east', isBoss: false, revives: 0, onEnd: () => ({ message: '' }), onLeave: () => {} });
  await w(1200);
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
  /* 與 live.js 的 rise 相同：美音魔王復活、不死鳥、額外生命 */
  function rise(f) { if (f.hp > 0) return; if (window.kaidoDragonOff) kaidoDragonOff(f); if (window.utaRise && utaRise(f)) return; if (f.status.undyingTurns > 0) { f.status.undyingTurns = 0; f.hp = f.maxHp; f.status.dots = []; return; } if (f.status.lives > 0) { f.status.lives--; f.hp = f.maxHp; f.status.dots = []; } }
  function fight(a, b) {
    const A = applyRarityScale(buildFighter(a, 80)), B = applyRarityScale(buildFighter(b, 80)); battle.player = A; battle.enemy = B; battle.team = [A]; battle.isBoss = false; battle.eruption = null;
    for (let round = 0; round < 40; round++) {
      const first = (A.baseSpeed * (1 + A.buffs.spd * .05)) >= (B.baseSpeed * (1 + B.buffs.spd * .05)) ? [A, B] : [B, A];
      for (const f of first) { const o = f === A ? B : A; if (f.hp <= 0 || o.hp <= 0) continue; act(f, o, f === A ? 'L' : 'R');
        [A, B].forEach(rise); }
      if (A.hp <= 0 || B.hp <= 0) break;
      endTurnStatus(A); endTurnStatus(B);
      [A, B].forEach(rise);
      if (A.hp <= 0 || B.hp <= 0) break;
    }
    if (A.hp <= 0 && B.hp > 0) return 0; if (B.hp <= 0 && A.hp > 0) return 1; return A.hp / A.maxHp > B.hp / B.maxHp ? 1 : 0;
  }
  /* v142 全稀有度對戰矩陣：window.__TIER = { ids:[...], n, scale:{id:statScale}, rs:{稀有度:倍率} } → { m:{a:{b:勝率}} } */
  const T = window.__TIER || {}; if (T.scale) Object.entries(T.scale).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  if (T.rs) Object.assign(GAME_SETTINGS.rarityScale, T.rs);
  const ids2 = T.ids, N2 = T.n || 60, m = {}, errs2 = new Set();
  const PAIRS = T.pairs || []; if (!T.pairs) for (let i = 0; i < ids2.length; i++) for (let j = i + 1; j < ids2.length; j++) PAIRS.push([ids2[i], ids2[j]]);
  for (const [a, b] of PAIRS) { let wv = 0;
    for (let k = 0; k < N2; k++) { try { wv += k % 2 ? fight(a, b) : 1 - fight(b, a); } catch (e) { errs2.add(a + '/' + b + ':' + e.message); } }
    (m[a] = m[a] || {})[b] = wv / N2; (m[b] = m[b] || {})[a] = 1 - wv / N2; }
  return { m, errs: [...errs2].slice(0, 8) };
}
