/* v159 使用者 11/04 20:32：「女帝第五技能幫我加強傷害，另外洛克斯五個技能效果的傷害與秒殺效果也再加強」。
   漢庫克 大芳香腳：3～12 倍 → 5～16 倍、威力 100 → 120。
   洛克斯：蝕 威力 150 → 210、新增 12% 秒殺（BOSS 依既有規則改為 3 倍傷害）；瞬 下回合秒殺 5～25% → 15～40%、回復 20% → 30%；
   殺 SSR 以上秒殺 50% → 70%、沒秒殺時扣當下體力 50% → 60%；蓄 奉還 ×1.5；戴維的秘密 瀕死後下一擊 5～10 倍 → 8～15 倍、瀕死回復 20% → 30%。
   效果實作在 js/ext_v129.js（rocksKill 物件 {p,cut}、rocksStoreMult）。必須在 roster_v129、balance_v158 之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const H = CHARACTERS.hancock, K = CHARACTERS.rocks, sk = (c, n) => c && c.skills.find(s => s.name === n);
  const ult = sk(H, '大芳香腳'); if (ult) { ult.power = 120; ult.effect.randomMultiplierRange = [5, 16]; ult.desc = ult.desc.replace('3～12 倍', '5～16 倍'); }
  const e = sk(K, '蝕'); if (e) { e.power = 210; e.effect.executeChance = .12; if (!/秒殺/.test(e.desc)) e.desc += '12% 機率直接秒殺（BOSS 改為受到 3 倍傷害）。'; if (e.tags && !e.tags.some(t => t[0] === '秒殺')) e.tags.push(['秒殺', 'red']); }
  const sh = sk(K, '瞬'); if (sh) { sh.effect.rocksShun = [.15, .4]; sh.effect.healRatio = .3; sh.desc = sh.desc.replace('回復 20% 體力', '回復 30% 體力').replace('5～25%', '15～40%'); }
  const kl = sk(K, '殺'); if (kl) { kl.effect.rocksKill = { p: .7, cut: .6 }; kl.desc = kl.desc.replace('有 50% 直接秒殺，另外 50% 扣除對手當下體力的一半', '有 70% 直接秒殺，另外 30% 扣除對手當下體力的 60%'); }
  const st = sk(K, '蓄'); if (st) { st.effect.rocksStoreMult = 1.5; st.desc = st.desc.replace('把記錄到的傷害全部無視護盾奉還給對手', '把記錄到的傷害 1.5 倍、無視護盾奉還給對手'); }
  const ds = sk(K, '戴維的秘密'); if (ds && ds.effect.rocksSecret) { ds.effect.rocksSecret.mult = [8, 15]; ds.effect.rocksSecret.guard = [.1, .3]; ds.desc = ds.desc.replace('5～10 倍', '8～15 倍').replace('自動回復 20% 體力', '自動回復 30% 體力'); }
})();
