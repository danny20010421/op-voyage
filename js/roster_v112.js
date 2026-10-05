/* v112：洛基第一招改版（削弱）、紅髮小幅削弱、大和新皮膚「和服歌妓」（寶藏幣 1500）。roster_v110 之後載入。 */
(function () {
  const L = CHARACTERS.loki; if (L && L.skills[0]) Object.assign(L.skills[0], { pp: 10, maxPP: 10, power: 70,
    desc: '噴出雷電攻擊 5～10 次，並追加這次總傷害 5～10% 的額外傷害。', tags: [['連擊', 'red'], ['追加傷害', 'gold']],
    effect: { multiHitNormal: [5, 10], perHitPower: 70, bonusTotalPct: [.05, .1] } });
  /* 紅髮：小幅削弱（體質略降；神避秒殺率 60%→40%、倍率上限 50→40；強者波動最多 50→40 段） */
  const S = CHARACTERS.shanks; if (S) { S.statScale = .9; const k = S.skills;
    if (k[0]) { k[0].effect = Object.assign({}, k[0].effect, { multiHitNormal: [1, 40] }); k[0].desc = k[0].desc.replace(/1～50|1-50|50 次|50次/g, m => m.replace('50', '40')); }
    if (k[4]) { k[4].effect = Object.assign({}, k[4].effect, { executeChance: .4, randomMultiplierRange: [5, 40] }); k[4].desc = k[4].desc.replace(/60%/g, '40%').replace(/5～50|5-50/g, '5～40'); } }
  if (typeof SKINS !== 'undefined') {
    delete SKINS.yamato_s2;
    SKINS.yamato_geisha = { char: 'yamato', name: '和服歌妓', image: 'assets/chars/yamato_skin2.webp?v=112', avatar: 'assets/chars/yamato_skin2_face.webp?v=112', battleScale: .6, price: { tokens: 1500 }, how: '寶藏幣 1500 購買（皮膚圖鑑）' };
    ['yamato_s3', 'yamato_s4'].forEach(k => { if (SKINS[k]) { const v = SKINS[k]; delete SKINS[k]; SKINS[k] = v; } }); /* 未推出的「？？？」排在新皮膚後面 */
  }
})();
