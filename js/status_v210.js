/* v210（使用者 11/14 01:35）：負面狀態重新定義。
   冰凍＝無法行動＋速度 -50%（不再扣血）；燒傷每回合 5%、一律 2 回合；虛弱＝傷害 -15%、受傷 ×1.0～1.5；破防＝受傷 +5～10%；
   麻痺／恐懼／疲憊／固化／暈眩／臣服／魅惑＝無法行動（臣服另外解除所有強化，魅惑另外受傷 +15～30%）；
   封鎖＝無法行動，並消耗 1 次技能次數；熔岩灼燒每回合 6～12%。核心數值在 battle_core.js（ABN、CC_KEYS、applyDamage、endTurnStatus）。 */
function sealPP(c) { /* 封鎖：隨機扣掉 1 個還有次數的技能（不含第五技能奧義） */
  try { const pool = (c.skills || []).filter(s => !s.ultimate && s.pp > 0); if (!pool.length) return; const s = pool[Math.floor(Math.random() * pool.length)]; s.pp--;
    if (typeof log === 'function') log(`🚫 ${c.name} 的「${s.name}」被封鎖消耗 1 次`); } catch (e) { }
}
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  Object.values(CHARACTERS).forEach(c => (c.skills || []).forEach(s => { const e = s.effect; if (!e) return;
    if (e.burnTurns) e.burnTurns = 2;
    if ((e.weakChance || e.weakTurns) && s.desc) s.desc = s.desc.replace(/(虛弱[^。]*?)(\d(?:\.\d)?)\s*～\s*(\d(?:\.\d)?)(\s*倍)/g, '$11.0～1.5$4');
    if (e.freezeTurns) e.freezeTurns = 1; if (e.freezeForce) e.freezeForce = 1; /* 冰凍改成無法行動，一律 1 回合 */
    if (e.burnChance || e.burnChanceRange || e.perHitBurn) { if (s.desc) s.desc = s.desc.replace(/燒傷\s*(\d)\s*回合/g, '燒傷 2 回合').replace(/(\d)\s*回合(內)?的?燒傷/g, '2 回合燒傷'); }
  }));
  /* 技能說明同步新的狀態定義 */
  const D = (id, n, a, b) => { const c = CHARACTERS[id], k = c && c.skills.find(x => x.name === n); if (k && k.desc) k.desc = k.desc.split(a).join(b); };
  D('sanji', '惡魔風腳 畫龍點睛', '每回合扣 4% 體力', '每回合扣 5% 體力');
  D('aokiji', '冰凍時刻', '對手冰凍 2 回合', '對手冰凍 1 回合（無法行動）');
  D('aokiji', '兩棘矛', '冰凍 2 回合', '冰凍 1 回合');
  D('aokiji', '暴雉嘴', '冰凍 2 回合', '冰凍 1 回合');
  D('aokiji', '冰河時期', '每回合損失 6% 體力並被冰凍', '每回合損失 6% 體力，35% 機率被冰凍');
  D('mihawk_w', '洞察弱點', '受到 1.2～1.6 倍傷害', '受到 1.0～1.5 倍傷害');
  D('bigmom', '普羅米修斯', '燒傷對手 3 回合', '燒傷對手 2 回合');
  ['雪之羽', '白色世界', '雪女・暴風雪'].forEach(n => D('monet', n, '冰凍 2 回合', '冰凍 1 回合'));
  D('yamato', '雷鳴八卦', '受到 1.2～1.5 倍傷害', '受到 1.0～1.5 倍傷害');
  D('yamato', '大口真神形態', '冰凍 2 回合（每回合扣 2%、速度下降）', '冰凍 1 回合（無法行動、速度 -50%）');
  D('viona', '垂憐', '「魅惑」2 回合：攻擊 -1、速度 -1', '「魅惑」1 回合：無法行動，受到的傷害 +15～30%');
  D('mihawk', '洞察弱點', '1.1～1.5 倍', '1.0～1.5 倍');
  D('viona', '神妃', '；對「魅惑」中的對手傷害再 +40%', '');
})();
