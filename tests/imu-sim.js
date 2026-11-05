// 伊姆三型態模擬（v165）：在遊戲頁面執行（page.evaluate），回傳勝率、平均回合、伊姆晉升到的型態與錯誤。
// window.__IMU = { cases: [{ name, team: ['loki',...], lv: 100, imuSide: 'E'|'P', foe: 'kaido', boss: true, revives: 2, chapter: 'giant', mod: { hp, dmg, atk, def }, skin }], n: 20, maxRounds: 80, log: false }
// imuSide 'E'：伊姆當敵人（BOSS 或一般），我方 team 依序上場；'P'：玩家使用伊姆（team 含 imu），對手 foe。
// 出招流程與 battle.js executeAction 相同（含 window.IMU165.preAct／postAct：震懾、封印、支配、命中、迴避）。
async () => {
  const CFG = window.__IMU || window.__ARG || {}, w = ms => new Promise(r => setTimeout(r, ms));
  startBattle({ team: [{ id: 'luffy', lv: 80 }], enemyId: 'crocodile', enemyLv: 80, chapterId: 'east', isBoss: false, revives: 0, onEnd: () => ({ message: '' }), onLeave: () => {} });
  await w(1200);
  const LOG = []; const noop = () => {};
  const q = CFG.log ? (t => { LOG.push(t); }) : noop;
  try { log = q; } catch (e) {} try { showDamage = noop; } catch (e) {} try { showHeal = noop; } catch (e) {} try { floatText = noop; } catch (e) {} try { renderHUD = noop; } catch (e) {} try { triggerImpact = noop; } catch (e) {} try { renderTeam = noop; } catch (e) {} try { renderSkills = noop; } catch (e) {} try { refreshFighterImage = noop; } catch (e) {}
  const I = window.IMU165, CC = [...CC_KEYS, 'skipAttack'];
  function pickNormal(A, B) {
    const av = A.skills.map((s, i) => [s, i]).filter(([s]) => s.pp > 0 && !s.locked); if (!av.length) return -1;
    const hpA = A.hp / A.maxHp, hpB = B.hp / B.maxHp, ult = av.find(([s]) => s.ultimate), heal = av.find(([s]) => s.type === 'support' && s.effect && (s.effect.healRatio || s.effect.fullHeal || s.effect.regenTurns));
    if (ult && (hpB < .6 || hpA < .4)) return ult[1]; if (heal && hpA < .45 && Math.random() < .7) return heal[1];
    const atk = av.filter(([s]) => !s.ultimate); if (!atk.length) return av[0][1];
    const wt = atk.map(([s]) => ((s.type === 'attack' ? (s.power || 60) : 70) + 20) * (window.__aiW160 ? window.__aiW160(A, B, s) : 1)); let r = Math.random() * wt.reduce((a, b) => a + b, 0);
    for (let i = 0; i < atk.length; i++) { r -= wt[i]; if (r < 0) return atk[i][1]; } return atk[0][1];
  }
  function act(A, B) {
    let idx = A.__imu ? I.ai(A, B) : pickNormal(A, B); if (idx === -2) return; if (idx < 0) idx = pickNormal(A, B); if (idx < 0) return;
    const pre = I.preAct(A, B, idx); if (pre.skip) return; idx = pre.idx; const skill = A.skills[idx]; if (!skill) return;
    try {
      for (const k of CC) if (A.status[k] > 0 && !(skill.effect && skill.effect.unstoppable)) { A.status[k]--; return; }
      if (A.status.attackFail > 0 && Math.random() < (A.status.attackFailChance || 0)) { A.status.attackFail--; return; } if (A.status.attackFail > 0) A.status.attackFail--;
      skill.pp--; const sk = skill;
      if (Math.random() * 100 > sk.accuracy) return;
      if (sk.type === 'attack' && B.status.invuln > 0) return;
      if (sk.type === 'attack' && B.status.dodge > 0 && !(sk.effect && sk.effect.sureHit)) { B.status.dodge--; return; }
      const blocked = A.status.skillNullify > 0;
      const r = computeSkillOutcome(A, B, sk, blocked);
      if (sk.type === 'attack' && B.status.reflect > 0) { const m = B.status.reflectMultiplier || 1; B.status.reflect = 0; B.status.reflectMultiplier = 1; applyDamage(A, Math.max(1, Math.round(r.damage * m)), 'L'); return; }
      if (r.damage > 0) applyDamage(B, r.damage, 'R', r.meta);
      if (!blocked) applySkillEffects(A, B, sk, r);
      else if (A.__imu && sk.effect && sk.effect.imuAscend) I.ascend(A, B, sk.effect.imuAscend);
      if (r.damage > 0 && sk.type === 'attack' && B.status.thornTurns > 0 && A.hp > 0) applyDamage(A, Math.round(r.damage * (B.status.thornRatio || .5)), 'L');
    } finally { I.postAct(A, B, skill, pre); if (A.__imu && A.__imu.pend != null) { const f = A.__imu.pend; A.__imu.pend = null; I.setForm(A, f); } }
  }
  function revive(f, isEnemy, st) {
    if (f.hp > 0) return true;
    if (window.IMU165) I.pactReward(f, true);
    if (f.status.__erase && f.status.__erase.t > 0) { f.status.undyingTurns = 0; f.status.lives = 0; f.status.revive = 0; }
    if (f.status.undyingTurns > 0) { f.status.undyingTurns = 0; f.hp = f.maxHp; return true; }
    if (f.status.lives > 0) { f.status.lives--; f.hp = f.maxHp; return true; }
    if (isEnemy && st.rev > 0) { st.rev--; f.hp = f.maxHp; const s = f.status; s.freeze = 0; s.petrify = 0; s.skipAttack = 0; s.attackFail = 0; s.dots = []; s.skillNullify = 0; return true; }
    return false;
  }
  function fight(C) {
    const lv = C.lv || 100, mk = (id, enemy) => { const f = buildFighter(id, lv, id === 'imu' ? (C.skin || null) : null); if (!enemy) applyRarityScale(f); return f; };
    const team = (C.team || []).map(id => mk(id, false)); const foeId = C.imuSide === 'P' ? C.foe : 'imu';
    let E = buildFighter(foeId, C.foeLv || lv, foeId === 'imu' ? (C.skin || null) : null);
    if (C.boss || C.chapter) E = applyChapterDifficulty(E, C.chapter || 'giant', !!C.boss); else if (C.pvp) applyRarityScale(E);
    if (C.mod) { const M = C.mod; if (M.hp) { E.maxHp = Math.round(E.maxHp * M.hp); E.hp = E.maxHp; } if (M.dmg) E.dmgMul *= M.dmg; ['atk', 'def'].forEach(k => { if (M[k]) E.buffs[k] = clamp(E.buffs[k] + M[k], -6, 6); }); }
    battle.team = team; battle.pi = 0; battle.player = team[0]; battle.enemy = E; battle.isBoss = !!C.boss; battle.__imuDom = null; battle.eruption = null; battle.iceAge = null; battle.round = 1; battle.opts = { revives: C.revives || 0 }; battle.difficulty = CHAPTER_DIFFICULTY[C.chapter || 'giant'];
    if (E.__imu && C.pace) { E.__imu.pace = C.pace; if (C.paceHp != null) E.__imu.paceHp = C.paceHp; }
    if (C.throne && E.__imu) { E.maxHp = E.hp = 99999999; E.voidImmune = true; E.skills.forEach(s => { s.pp = s.maxPP = 9999; s.locked = 0; }); I.throneInit(E); battle.voidDamage = 0; }
    const st = { rev: C.boss ? (C.revives || 0) : 0 }; let rounds = 0;
    for (rounds = 1; rounds <= (CFG.maxRounds || 80); rounds++) {
      battle.round = rounds; I.punishNow();
      const P = battle.player; const first = effectiveSpeed(P) >= effectiveSpeed(E) ? [P, E] : [E, P];
      for (const f of first) { const o = f === P ? E : P; if (f.hp <= 0 || o.hp <= 0) continue; act(f, o); if (!revive(E, true, st)) break; if (!revive(battle.player, false, st)) { const nx = team.findIndex(x => x.hp > 0); if (nx < 0) break; battle.pi = nx; battle.player = team[nx]; break; } }
      if (E.hp <= 0 || !team.some(x => x.hp > 0)) break;
      endTurnStatus(battle.player); endTurnStatus(E);
      if (!revive(E, true, st)) break;
      if (!revive(battle.player, false, st)) { const nx = team.findIndex(x => x.hp > 0); if (nx < 0) break; battle.pi = nx; battle.player = team[nx]; }
      if (!team.some(x => x.hp > 0)) break;
    }
    const imu = C.imuSide === 'P' ? team.find(x => x.id === 'imu') : E;
    const win = E.hp <= 0 && team.some(x => x.hp > 0);
    return { win, rounds: Math.min(rounds, CFG.maxRounds || 80), form: imu && imu.__imu ? imu.__imu.form : -1, timeout: rounds > (CFG.maxRounds || 80), dmg: C.throne ? battle.voidDamage || 0 : 0 };
  }
  const out = [], errs = new Set();
  for (const C of (CFG.cases || [])) {
    let wins = 0, rs = 0, to = 0, dm = 0; const forms = [0, 0, 0];
    for (let k = 0; k < (C.n || CFG.n || 20); k++) { try { const r = fight(C); if (r.win) wins++; rs += r.rounds; dm += r.dmg || 0; if (r.timeout) to++; if (r.form >= 0) forms[r.form]++; } catch (e) { errs.add(C.name + ':' + e.message + ' ' + (e.stack || '').split('\n')[1]); } }
    const n = C.n || CFG.n || 20; out.push({ name: C.name, win: Math.round(wins / n * 100), rounds: +(rs / n).toFixed(1), timeouts: to, forms, ...(C.throne ? { avgDmg: Math.round(dm / n) } : {}) });
  }
  return { out, errs: [...errs].slice(0, 8), log: LOG.slice(0, CFG.log || 0) };
}
