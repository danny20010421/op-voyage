/* v220：道具改用使用者提供的去背插圖（assets/items/*.webp）。
   itemIcon 有 it.img 時直接用圖片，懸賞處 itemHtml 也改成優先用 it.img，所以背包、商店、獎勵彈窗、通行證、每日任務會一起換。 */
(function () {
  const IDS = ['potion_s', 'herb', 'potion_l', 'pp_s', 'haki', 'potion_m', 'guard_pot', 'pp_l', 'haki_l', 'shield',
    'exp_s', 'exp_m', 'skill_book', 'awaken_gem', 'sweep', 'exp_l', 'summon_ticket'];
  const URL = {
    potion_s: 'assets/items/potion_s.webp?v=731cad7a', herb: 'assets/items/herb.webp?v=eca93ed4', potion_l: 'assets/items/potion_l.webp?v=019ebd36', pp_s: 'assets/items/pp_s.webp?v=feb39cba', haki: 'assets/items/haki.webp?v=ede3f7d0',
    potion_m: 'assets/items/potion_m.webp?v=0e305fb5', guard_pot: 'assets/items/guard_pot.webp?v=4c3d2848', pp_l: 'assets/items/pp_l.webp?v=7e50c334', haki_l: 'assets/items/haki_l.webp?v=cce27034', shield: 'assets/items/shield.webp?v=b7e67639',
    exp_s: 'assets/items/exp_s.webp?v=8cac0c3a', exp_m: 'assets/items/exp_m.webp?v=d481cd2c', skill_book: 'assets/items/skill_book.webp?v=dd2ed8d2', awaken_gem: 'assets/items/awaken_gem.webp?v=64a6ed1f', sweep: 'assets/items/sweep.webp?v=aed77e58',
    exp_l: 'assets/items/exp_l.webp?v=0a0c1325', summon_ticket: 'assets/items/summon_ticket.webp?v=5109b7b0'
  };
  const apply = () => { if (typeof ITEMS === 'undefined') return; IDS.forEach(id => { if (ITEMS[id]) ITEMS[id].img = URL[id]; }); };
  apply(); window.ITEM_IMG = URL;
})();
