/* 遊戲管理後台：不用改程式碼即可調整數值、BOSS、劇情與扭蛋 */
const ADMIN_KEY = 'op_voyage_admin_v2';
/* v165：不再在 admin.js 載入當下拍「預設值快照」——admin.js 比 roster／balance／story 等檔案早載入，
   舊做法按「儲存並套用」時會把 50 位角色、13 章劇情還原成很舊的版本（例如凱多舊立繪、東海篇少一個任務）。
   現在改成「就地覆寫並記住原值」：套用前先把上一次後台改過的欄位還原，再寫入新的設定；沒改過的欄位完全不碰。
   套用時機：DOMContentLoaded（所有資料檔都載入後、遊戲開機前）。DATA_VERSION 不同的舊設定照舊備份後停用。 */
let ADMIN_TOUCH = [];
function admSet(o, k, val) { if (!o) return; ADMIN_TOUCH.push({ o, k, had: Object.prototype.hasOwnProperty.call(o, k), v: o[k] }); o[k] = val; }
function admRevert() { for (let i = ADMIN_TOUCH.length - 1; i >= 0; i--) { const t = ADMIN_TOUCH[i]; if (t.had) t.o[t.k] = t.v; else delete t.o[t.k]; } ADMIN_TOUCH = []; }
const admClone = x => x == null ? x : JSON.parse(JSON.stringify(x));
function adminLoad() {
  let c; try { c = JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}') || {}; } catch (e) { c = {}; }
  // 舊版本的後台設定會把新劇情、新技能蓋回去：備份後停用
  if (Object.keys(c).length && c.dataVersion !== DATA_VERSION) {
    try { localStorage.setItem(ADMIN_KEY + '_backup_v' + (c.dataVersion || 'old'), JSON.stringify(c)); } catch (e) { }
    localStorage.removeItem(ADMIN_KEY); window.__adminReset = true; return {};
  }
  return c;
}
const ADM_CHAR_F = ['name', 'title', 'maxHp', 'baseSpeed', 'scale', 'desc'], ADM_SKILL_F = ['name', 'maxPP', 'power', 'accuracy', 'desc', 'effect'], ADM_CH_F = ['name', 'subtitle', 'boss', 'bossTitle', 'blurb', 'npcs'];
function adminApply(cfg) {
  cfg = cfg || {}; admRevert();
  Object.entries(cfg.settings || {}).forEach(([k, v]) => admSet(GAME_SETTINGS, k, v));
  Object.entries(cfg.characters || {}).forEach(([id, o]) => { const c = CHARACTERS[id]; if (!c || !o) return;
    ADM_CHAR_F.forEach(k => { if (o[k] !== undefined && o[k] !== '' && o[k] !== null) admSet(c, k, o[k]); });
    (o.skills || []).forEach((s, i) => { const t = c.skills && c.skills[i]; if (!t || !s) return; ADM_SKILL_F.forEach(k => { if (s[k] !== undefined && s[k] !== null) admSet(t, k, admClone(s[k])); }); if (s.maxPP !== undefined && s.maxPP !== null) admSet(t, 'pp', s.maxPP); }); });
  Object.entries(cfg.difficulty || {}).forEach(([id, d]) => { const D = CHAPTER_DIFFICULTY[id]; if (!D || !d) return; Object.entries(d).forEach(([k, v]) => { if (v !== undefined && v !== null) admSet(D, k, admClone(v)); }); });
  Object.entries(cfg.chapters || {}).forEach(([id, o]) => { const ch = CHAPTERS.find(c => c.id === id); if (!ch || !o) return;
    ADM_CH_F.forEach(k => { if (o[k] !== undefined) admSet(ch, k, admClone(o[k])); });
    /* 任務步驟：數量必須和目前一樣（存檔用步驟序號記進度），不同就不套用 */
    if (Array.isArray(o.steps) && o.steps.length === ch.steps.length) admSet(ch, 'steps', admClone(o.steps));
    if (Array.isArray(o.rewards)) o.rewards.forEach((r, i) => { if (ch.steps[i] && r !== null && r !== undefined) admSet(ch.steps[i], 'reward', r); }); });
  Object.entries(cfg.rarity || {}).forEach(([k, r]) => { if (RARITY[k] && r && r.rate !== undefined) admSet(RARITY[k], 'rate', r.rate); });
  Object.entries(cfg.cost || {}).forEach(([k, v]) => admSet(GACHA_COST, k, v));
}
let ADMIN_READY = false;
function adminInit() { if (ADMIN_READY) return; ADMIN_READY = true; try { adminApply(adminLoad()); } catch (e) { console.error(e); } }
document.addEventListener('DOMContentLoaded', adminInit);

/* ---------- 介面 ---------- */
let ADM = null, admChar = 'luffy', admChapter = 'east';
function openAdmin() { adminInit(); ADM = adminLoad(); renderAdmin(); openModal('adminModal'); }
const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
function field(label, name, value, type, extra) {
  return `<label class="af"><span>${label}</span><input name="${name}" type="${type || 'number'}" value="${esc(value)}" ${extra || ''}></label>`;
}
function renderAdmin(tab) {
  tab = tab || document.querySelector('#adminNav .on')?.dataset.tab || 'general';
  document.querySelectorAll('#adminNav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const P = $('adminPane'); const S = GAME_SETTINGS;
  if (tab === 'visual') { renderVisualAdmin(P); $('adminStatus').textContent = ''; return; }
  if (tab === 'general') {
    P.innerHTML = `<h3>基本規則</h3><p class="an">存檔後立即套用到下一場戰鬥與下一次登島。</p><div class="agrid">
      ${field('每回合選技秒數', 'turnSeconds', S.turnSeconds, 'number', 'min="5" max="120"')}
      ${field('BOSS 復活次數', 'bossRevives', S.bossRevives, 'number', 'min="0" max="5"')}
      ${field('每場可用道具次數', 'itemsPerBattle', S.itemsPerBattle, 'number', 'min="0" max="20"')}
      ${field('新玩家初始寶藏幣', 'startTokens', S.startTokens, 'number', 'min="0"')}
      ${field('首次通關獎勵寶藏幣', 'clearBonus', S.clearBonus, 'number', 'min="0"')}
      ${field('替補船員分享經驗比例', 'shareExp', S.shareExp, 'number', 'step="0.05" min="0" max="1"')}
      ${field('攻擊每階增減（0.10 = 10%）', 'atkStep', S.atkStep, 'number', 'step="0.01" min="0" max="0.5"')}
      ${field('防禦每階增減', 'defStep', S.defStep, 'number', 'step="0.01" min="0" max="0.5"')}
      ${field('速度每階增減', 'spdStep', S.spdStep, 'number', 'step="0.01" min="0" max="0.5"')}
      ${field('冰凍每回合扣血', 'freezeDot', S.freezeDot, 'number', 'step="0.01" min="0" max="0.5"')}
      ${field('冰凍速度下降', 'freezeSlow', S.freezeSlow, 'number', 'step="0.05" min="0" max="0.9"')}
      ${field('燒傷每回合扣血', 'burnDot', S.burnDot, 'number', 'step="0.01" min="0" max="0.5"')}
      ${field('虛弱時傷害下降', 'weakDealt', S.weakDealt, 'number', 'step="0.05" min="0" max="0.9"')}
      ${field('破防時受傷增加', 'armorBreak', S.armorBreak, 'number', 'step="0.01" min="0" max="1"')}
      ${field('首殺 BOSS 加入機率', 'bossJoinFirst', S.bossJoinFirst, 'number', 'step="0.05" min="0" max="1"')}
      ${field('重複擊敗 BOSS 加入機率', 'bossJoinRepeat', S.bossJoinRepeat, 'number', 'step="0.05" min="0" max="1"')}
      ${field('BOSS 加入時的等級', 'bossJoinLv', S.bossJoinLv, 'number', 'min="1" max="100"')}
      ${field('屬性克制倍率（1 = 關閉）', 'typeUp', S.typeUp, 'number', 'step="0.05" min="1" max="3"')}
      ${field('屬性微弱倍率（1 = 關閉）', 'typeDown', S.typeDown, 'number', 'step="0.05" min="0.1" max="1"')}
      ${field('等級同步：敵人比陣容最高等級低幾級', 'syncGap', S.syncGap || 6, 'number', 'min="0" max="50"')}
      <label class="af check"><input name="levelSync" type="checkbox" ${S.levelSync ? 'checked' : ''}><span>等級同步（陣容太強時，篇章敵人跟著變強；航路畫面顯示的等級會一起變）</span></label>
      <label class="af check"><input name="unlockAll" type="checkbox" ${S.unlockAll ? 'checked' : ''}><span>全部篇章直接開放（不需依序解鎖）</span></label>
    </div>`;
  } else if (tab === 'chars') {
    const c = CHARACTERS[admChar];
    const R = typeof CHAR_RARITY !== 'undefined' ? CHAR_RARITY : {}, ids = [...CHARACTER_ORDER, ...Object.keys(CHARACTERS).filter(id => !CHARACTER_ORDER.includes(id))];
    P.innerHTML = `<h3>角色與技能</h3><p class="an">共 ${ids.length} 位角色。立繪大小與面向請到「立繪測試」調整；這裡改的是數值與技能，存檔後下一場戰鬥生效。</p>
      <div class="adm-pick"><input type="search" id="admCharQ" placeholder="搜尋名字" aria-label="搜尋角色"><select id="admCharSel" aria-label="選擇角色">${ids.map(id => `<option value="${id}" ${id === admChar ? 'selected' : ''}>${esc(CHARACTERS[id].name)}${R[id] ? `（${R[id]}）` : ''}${(ADM.characters || {})[id] ? '・已修改' : ''}</option>`).join('')}</select></div>
      <div class="adm-who"><img src="${c.avatar}" alt=""><div><b>${esc(c.name)}</b><small><span class="adm-tag">${R[admChar] || '—'}</span>${esc((c.types || []).join('・'))}・No.${String(c.no || 0).padStart(3, '0')}・代號 ${admChar}</small></div></div>
      <div class="agrid">${field('名稱', 'name', c.name, 'text')}${field('稱號', 'title', c.title, 'text')}${field('最大體力', 'maxHp', c.maxHp)}${field('速度', 'baseSpeed', c.baseSpeed)}${field('基礎縮放（scale）', 'scale', c.scale, 'number', 'step="0.01"')}</div>
      <label class="af wide"><span>角色介紹</span><input name="desc" type="text" value="${esc(c.desc)}"></label>
      <div class="askills">${c.skills.map((s, i) => `<fieldset data-skill="${i}"><legend>技能 ${i + 1}${s.ultimate ? '・奧義' : ''}</legend>
        <div class="agrid four">${field('名稱', 'sname', s.name, 'text')}${field('使用次數', 'maxPP', s.maxPP)}${field('威力', 'power', s.power)}${field('命中率', 'accuracy', s.accuracy)}</div>
        <label class="af wide"><span>說明</span><input name="sdesc" type="text" value="${esc(s.desc)}"></label>
        <label class="af wide"><span>效果（JSON，進階）</span><textarea name="effect" rows="2" spellcheck="false">${esc(JSON.stringify(s.effect || {}))}</textarea></label>
      </fieldset>`).join('')}</div>`;
    const sel = $('admCharSel'); sel.onchange = () => { if (collectAdmin()) { admChar = sel.value; renderAdmin('chars'); } else sel.value = admChar; };
    $('admCharQ').oninput = ev => { const q = ev.target.value.trim(); [...sel.options].forEach(o => { o.hidden = !!q && !o.textContent.includes(q) && !o.value.includes(q); }); const f = [...sel.options].find(o => !o.hidden); if (q && f && f.value !== admChar) { sel.value = f.value; sel.onchange(); setTimeout(() => { const i = $('admCharQ'); if (i) { i.value = q; i.focus(); i.dispatchEvent(new Event('input')); } }, 0); } };
  } else if (tab === 'chapters') {
    P.innerHTML = `<h3>篇章、BOSS 與難度</h3><p class="an">一般敵人套用體力倍率與能力階；BOSS 另外套用 BOSS 欄位（v156 起有 BOSS 傷害倍率、奧義次數上限與單一 BOSS 微調）。敵人實際等級＝篇章基本等級＋BOSS 加成，開啟等級同步時會依陣容提高。</p>` + CHAPTERS.map((ch, ci) => { const d = CHAPTER_DIFFICULTY[ch.id] || {}, st = (d.bossStages || 0) + (d.bossStageAdj || 0), lvN = typeof chapterEnemyLv === 'function' ? chapterEnemyLv(ch.id, false) : ENEMY_LEVEL[ch.id], lvB = typeof chapterEnemyLv === 'function' ? chapterEnemyLv(ch.id, true) : ENEMY_LEVEL[ch.id] + BOSS_LEVEL_BONUS;
      return `<details class="ach" data-chapter="${ch.id}" ${ci === 0 ? 'open' : ''}><summary>${esc(ch.name)}<small>敵人 LV ${lvN}・BOSS LV ${lvB}・${d.label || ''}</small></summary><div>
      <div class="agrid four">${field('篇章名稱', 'cname', ch.name, 'text')}${field('副標題', 'subtitle', ch.subtitle, 'text')}
      <label class="af"><span>篇章 BOSS</span><select name="boss"><option value="" ${!ch.boss ? 'selected' : ''}>（暫無 BOSS）</option>${CHARACTER_ORDER.map(id => `<option value="${id}" ${id === ch.boss ? 'selected' : ''}>${esc(CHARACTERS[id].name)}</option>`).join('')}</select></label>
      ${field('BOSS 稱號', 'bossTitle', ch.bossTitle, 'text')}</div>
      <div class="agrid four">${field('一般敵人體力倍率', 'hp', d.hp, 'number', 'step="0.01"')}${field('攻擊階', 'atk', d.atk)}${field('防禦階', 'def', d.def)}${field('速度階', 'spd', d.spd)}</div>
      <div class="agrid four">${field('BOSS 體力倍率', 'bossHp', d.bossHp, 'number', 'step="0.01"')}${field('BOSS 能力階（可為負）', 'bossStagesAll', st)}${field('BOSS 傷害倍率', 'bossDmg', d.bossDmg == null ? 1 : d.bossDmg, 'number', 'step="0.01" min="0"')}${field('BOSS 等級加成', 'bossLvUp', d.bossLvUp || 0)}
      ${field('BOSS 復活次數', 'revives', d.revives || 0, 'number', 'min="0" max="5"')}${field('BOSS 奧義次數上限（0＝不限）', 'bossUltCap', d.bossUltCap || 0, 'number', 'min="0"')}${field('AI 積極度', 'ai', d.ai, 'number', 'step="0.01"')}</div>
      <label class="af wide"><span>單一 BOSS 微調（JSON，進階；例：{"loki":{"hp":0.42,"dmg":0.42}}，空白＝沒有）</span><textarea name="bossFix" rows="2" spellcheck="false">${d.bossFix ? esc(JSON.stringify(d.bossFix)) : ''}</textarea></label>
      <div class="agrid five">${ch.steps.map((s, i) => field(`任務 ${i + 1} 獎勵`, 'rew' + i, s.reward)).join('')}</div></div></details>`; }).join('');
  } else if (tab === 'story') {
    const ch = CHAPTERS.find(c => c.id === admChapter);
    P.innerHTML = `<h3>劇情與對話</h3><p class="an">可以修改篇章介紹、NPC 名字與閒聊、每一步任務的說明與對白。對白格式為 ["NPC 代號","內容"]。</p>
      <div class="arow">${CHAPTERS.map(c => `<button class="chipbtn ${c.id === admChapter ? 'on' : ''}" data-ch="${c.id}">${c.name}</button>`).join('')}</div>
      <label class="af wide"><span>篇章介紹</span><textarea name="blurb" rows="2">${esc(ch.blurb)}</textarea></label>
      <label class="af wide"><span>NPC（JSON）</span><textarea name="npcs" rows="8" spellcheck="false">${esc(JSON.stringify(ch.npcs, null, 1))}</textarea></label>
      <label class="af wide"><span>任務步驟（JSON）</span><textarea name="steps" rows="14" spellcheck="false">${esc(JSON.stringify(ch.steps, null, 1))}</textarea></label>`;
    P.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => { if (collectAdmin()) { admChapter = b.dataset.ch; renderAdmin('story'); } });
  } else if (tab === 'gacha') {
    P.innerHTML = `<h3>懸賞召喚（一般召喚）</h3><p class="an">道具各稀有度的出現機率；儲存時會依比例換算，總和維持 ${(Object.values(RARITY).reduce((x, r) => x + r.rate, 0) * 100).toFixed(1)}%（其餘是抽到角色的機率）。</p><div class="agrid four">${Object.keys(RARITY).map(k => field(`${k} 道具機率（%）`, 'rate_' + k, Math.round(RARITY[k].rate * 1000) / 10, 'number', 'step="0.1" min="0"')).join('')}</div>
      <div class="agrid">${field('單抽花費', 'single', GACHA_COST.single)}${field('十連花費', 'ten', GACHA_COST.ten)}${field('每抽出現角色機率（%）', 'charRate', Math.round(GAME_SETTINGS.charRate * 1000) / 10, 'number', 'step="0.1" min="0" max="100"')}${field('抽到角色的等級', 'charLv', GAME_SETTINGS.charLv, 'number', 'min="1" max="100"')}</div>`;
  } else if (tab === 'news') {
    P.innerHTML = `<h3>公告</h3><p class="an">公告編輯器會另外開啟。</p><button class="btn-primary" id="admNews">開啟公告編輯器</button>`;
    $('admNews').onclick = () => { closeModal('adminModal'); openNewsEditor(); };
  } else if (tab === 'tools') {
    P.innerHTML = `<h3>備份與測試工具</h3><div class="atools">
      <button class="btn-ghost" data-t="export">匯出後台設定</button>
      <label class="btn-ghost filebtn">匯入後台設定<input type="file" accept="application/json" id="admImport"></label>
      <button class="btn-ghost" data-t="tokens">給自己 10 枚寶藏幣</button>
      <button class="btn-ghost" data-t="tokens1000">獲得 1000 枚寶藏幣</button>
      <button class="btn-ghost" data-t="paytest">切換儲值付款測試模式</button>
      <button class="btn-ghost" data-t="vip1000">模擬儲值 1000（測試 VIP）</button>
      <button class="btn-ghost" data-t="vipreset">清除儲值紀錄（VIP0）</button>
      <span class="adm-get"><select id="admGetChar">${CHARACTER_ORDER.map(id => `<option value="${id}">${CHARACTERS[id].name}${owned(id) ? '（已擁有）' : ''}</option>`).join('')}</select><button class="btn-ghost" data-t="getChar">馬上獲得此角色</button></span>
      <span class="adm-get"><select id="admGetSkin">${Object.entries(SKINS).filter(([k, s]) => !s.soon).map(([k, s]) => `<option value="${k}">${CHARACTERS[s.char].name}・${s.name}</option>`).join('')}</select><button class="btn-ghost" data-t="getSkin">馬上獲得此皮膚</button></span>
      <button class="btn-ghost" data-t="unlock">標記全部篇章已通關</button>
      <button class="btn-ghost" data-t="lvup">目前船長 +10 級</button>
      <button class="btn-ghost" data-t="allchars">獲得全部角色（LV 50）</button>
      <button class="btn-ghost" data-t="freedraw">重置新手免費召喚</button>
      <button class="btn-ghost danger" data-t="resetSave">清除遊戲進度</button>
      <button class="btn-ghost danger" data-t="resetAdmin">後台設定恢復預設</button></div>`;
    P.querySelectorAll('[data-t]').forEach(b => b.onclick = () => adminTool(b.dataset.t));
    $('admImport').onchange = (e) => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { const c = JSON.parse(t); c.dataVersion = DATA_VERSION; localStorage.setItem(ADMIN_KEY, JSON.stringify(c)); adminApply(c); ADM = c; renderAdmin('tools'); toast('後台設定已匯入'); } catch (err) { toast('檔案格式不正確，請選擇匯出的 JSON 檔', 'warn'); } }); };
  }
  $('adminStatus').textContent = '';
}
function collectAdmin() {
  const P = $('adminPane'), tab = document.querySelector('#adminNav .on').dataset.tab, v = (n, root) => (root || P).querySelector(`[name="${n}"]`);
  try {
    if (tab === 'general') {
      ADM.settings = Object.assign(ADM.settings || {}, {}); ['turnSeconds', 'bossRevives', 'itemsPerBattle', 'startTokens', 'clearBonus', 'shareExp', 'atkStep', 'defStep', 'spdStep', 'freezeDot', 'freezeSlow', 'burnDot', 'weakDealt', 'armorBreak', 'bossJoinFirst', 'bossJoinRepeat', 'bossJoinLv', 'typeUp', 'typeDown', 'syncGap'].forEach(k => ADM.settings[k] = num(v(k).value, GAME_SETTINGS[k]));
      ADM.settings.unlockAll = v('unlockAll').checked; ADM.settings.levelSync = v('levelSync').checked;
    } else if (tab === 'chars') {
      ADM.characters = ADM.characters || {}; const o = { name: v('name').value.trim(), title: v('title').value.trim(), maxHp: num(v('maxHp').value), baseSpeed: num(v('baseSpeed').value), scale: num(v('scale').value), desc: v('desc').value, skills: [] };
      P.querySelectorAll('[data-skill]').forEach(fs => { const i = +fs.dataset.skill; let ef; try { ef = JSON.parse(v('effect', fs).value || '{}'); } catch (e) { throw new Error(`技能 ${i + 1} 的效果 JSON 格式錯誤`); } o.skills[i] = { name: v('sname', fs).value, maxPP: num(v('maxPP', fs).value), power: num(v('power', fs).value), accuracy: num(v('accuracy', fs).value), desc: v('sdesc', fs).value, effect: ef }; });
      /* 只存和目前不同的欄位（沒改的不要凍結，之後改版的平衡調整才會生效） */
      const C = CHARACTERS[admChar], prev = ADM.characters[admChar] || {}, out = {};
      ADM_CHAR_F.forEach(k => { if (o[k] !== undefined && o[k] !== '' && JSON.stringify(o[k]) !== JSON.stringify(C[k])) out[k] = o[k]; else if (prev[k] !== undefined && JSON.stringify(o[k]) === JSON.stringify(C[k])) out[k] = prev[k]; });
      const sk = o.skills.map((x, i) => { const T = C.skills[i] || {}, P2 = (prev.skills || [])[i] || {}, r = {}; ADM_SKILL_F.forEach(k => { if (JSON.stringify(x[k]) !== JSON.stringify(T[k]) || P2[k] !== undefined) r[k] = x[k]; }); return Object.keys(r).length ? r : null; });
      if (sk.some(Boolean)) out.skills = sk;
      if (Object.keys(out).length) ADM.characters[admChar] = out; else delete ADM.characters[admChar];
    } else if (tab === 'chapters') {
      ADM.chapters = ADM.chapters || {}; ADM.difficulty = ADM.difficulty || {};
      P.querySelectorAll('[data-chapter]').forEach(fs => { const id = fs.dataset.chapter, ch = CHAPTERS.find(c => c.id === id), D = CHAPTER_DIFFICULTY[id] || {};
        const rewards = ch.steps.map((s, i) => num(v('rew' + i, fs).value, s.reward)), o = ADM.chapters[id] = Object.assign(ADM.chapters[id] || {}, { name: v('cname', fs).value, subtitle: v('subtitle', fs).value, boss: v('boss', fs).value || null, bossTitle: v('bossTitle', fs).value, rewards });
        delete o.steps; /* v165：篇章分頁只改獎勵，不再整份存任務步驟 */
        const d = {}; ['hp', 'atk', 'def', 'spd', 'bossHp', 'bossDmg', 'bossLvUp', 'revives', 'ai'].forEach(k => d[k] = num(v(k, fs).value, D[k]));
        const stg = num(v('bossStagesAll', fs).value, (D.bossStages || 0) + (D.bossStageAdj || 0)); d.bossStages = Math.max(0, stg); d.bossStageAdj = Math.min(0, stg);
        const cap = num(v('bossUltCap', fs).value, 0); d.bossUltCap = cap > 0 ? cap : 0;
        const fx = v('bossFix', fs).value.trim(); if (fx) { try { d.bossFix = JSON.parse(fx); } catch (e) { throw new Error(`${ch.name} 的單一 BOSS 微調 JSON 格式錯誤`); } } else if (D.bossFix) d.bossFix = null;
        Object.keys(d).forEach(k => { if (JSON.stringify(d[k]) === JSON.stringify(D[k]) || (d[k] === 0 && D[k] == null) || (k === 'bossDmg' && d[k] === 1 && D[k] == null)) delete d[k]; });
        if (Object.keys(d).length) ADM.difficulty[id] = Object.assign(ADM.difficulty[id] || {}, d); });
    } else if (tab === 'story') {
      let npcs, steps; try { npcs = JSON.parse(v('npcs').value); steps = JSON.parse(v('steps').value); } catch (e) { throw new Error('劇情 JSON 格式錯誤，請檢查括號與引號'); }
      if (!Array.isArray(npcs) || !Array.isArray(steps) || !steps.length) throw new Error('NPC 與任務步驟都必須是清單');
      const chN = CHAPTERS.find(c => c.id === admChapter); if (steps.length !== chN.steps.length) throw new Error(`任務步驟數量不能改（目前 ${chN.steps.length} 個，存檔用步驟序號記錄進度）`);
      ADM.chapters = ADM.chapters || {}; ADM.chapters[admChapter] = Object.assign(ADM.chapters[admChapter] || {}, { blurb: v('blurb').value, npcs, steps });
    } else if (tab === 'gacha') {
      const rates = {}; let tot = 0; Object.keys(RARITY).forEach(k => { rates[k] = Math.max(0, num(v('rate_' + k).value, 0)); tot += rates[k]; });
      if (tot <= 0) throw new Error('機率總和必須大於 0');
      const keep = Object.values(RARITY).reduce((x, r) => x + r.rate, 0) || 1; /* 道具機率總和維持原本的比例（剩下的是角色機率），不要硬湊成 100% */
      ADM.rarity = {}; Object.keys(rates).forEach(k => ADM.rarity[k] = { rate: rates[k] / tot * keep }); ADM.cost = { single: Math.max(0, num(v('single').value, 1)), ten: Math.max(0, num(v('ten').value, 9)) }; ADM.settings = Object.assign(ADM.settings || {}, { charRate: Math.min(1, Math.max(0, num(v('charRate').value, 3) / 100)), charLv: Math.min(100, Math.max(1, num(v('charLv').value, 20))) });
    }
    return true;
  } catch (e) { $('adminStatus').textContent = e.message; $('adminStatus').className = 'astatus err'; return false; }
}
const admEq = (a, b) => (typeof a === 'number' && typeof b === 'number') ? Math.abs(a - b) < 1e-3 : JSON.stringify(a) === JSON.stringify(b);
/* 在「已還原成遊戲預設」的狀態下呼叫：把和預設相同的欄位刪掉 */
function admPrune(c) {
  const drop = (o, base, keys) => { (keys || Object.keys(o)).forEach(k => { if (o[k] !== undefined && admEq(o[k], base[k])) delete o[k]; }); };
  if (c.settings) { drop(c.settings, GAME_SETTINGS); if (!Object.keys(c.settings).length) delete c.settings; }
  Object.entries(c.characters || {}).forEach(([id, o]) => { const C = CHARACTERS[id]; if (!C) { delete c.characters[id]; return; } drop(o, C, ADM_CHAR_F);
    if (o.skills) { o.skills = o.skills.map((x, i) => { if (!x) return null; drop(x, (C.skills || [])[i] || {}, ADM_SKILL_F); return Object.keys(x).length ? x : null; }); if (!o.skills.some(Boolean)) delete o.skills; }
    if (!Object.keys(o).length) delete c.characters[id]; });
  Object.entries(c.chapters || {}).forEach(([id, o]) => { const ch = CHAPTERS.find(x => x.id === id); if (!ch) { delete c.chapters[id]; return; } drop(o, ch, ADM_CH_F);
    if (o.rewards && o.rewards.every((r, i) => !ch.steps[i] || admEq(r, ch.steps[i].reward))) delete o.rewards;
    if (o.steps && admEq(o.steps, ch.steps)) delete o.steps; if (!Object.keys(o).length) delete c.chapters[id]; });
  Object.entries(c.difficulty || {}).forEach(([id, d]) => { const D = CHAPTER_DIFFICULTY[id] || {}; Object.keys(d).forEach(k => { if (admEq(d[k], D[k]) || (d[k] == null && D[k] == null)) delete d[k]; }); if (!Object.keys(d).length) delete c.difficulty[id]; });
  Object.entries(c.rarity || {}).forEach(([k, r]) => { if (!RARITY[k] || admEq(r.rate, RARITY[k].rate)) delete c.rarity[k]; });
  if (c.cost) drop(c.cost, GACHA_COST);
  ['characters', 'chapters', 'difficulty', 'rarity', 'cost'].forEach(k => { if (c[k] && !Object.keys(c[k]).length) delete c[k]; });
  return c;
}
function saveAdmin() {
  if (!collectAdmin()) return;
  admRevert(); admPrune(ADM); /* 只留下和遊戲預設不同的值，沒改的不要凍結 */
  ADM.dataVersion = DATA_VERSION; localStorage.setItem(ADMIN_KEY, JSON.stringify(ADM)); adminApply(ADM);
  $('adminStatus').textContent = '已儲存並套用'; $('adminStatus').className = 'astatus ok'; SFX.play('coin');
  if (currentScreen === 'chapterScreen') openChart(selChapter);
  const t = document.querySelector('#adminNav .on').dataset.tab; renderAdmin(t); $('adminStatus').textContent = '已儲存並套用'; $('adminStatus').className = 'astatus ok';
}
function adminTool(t) {
  if (t === 'vip1000') { if (window.VIP) VIP.recharge(1000, '後台測試'); return; }
  if (t === 'vipreset') { SAVE.data.vip = { paid: 0, once: [], day: '' }; SAVE.save(); if (window.vipRefreshLobby) vipRefreshLobby(); toast('已清除儲值紀錄'); return; }
  if (t === 'paytest') { let on = false; try { on = localStorage.getItem('op_pay_test') === '1'; localStorage.setItem('op_pay_test', on ? '0' : '1'); } catch (e) { } toast(on ? '已關閉儲值付款測試模式' : '已開啟儲值付款測試模式：儲值會模擬付款成功並入帳', 'gold'); return; }
  if (t === 'tokens1000') { SAVE.data.tokens += 1000; SAVE.save(); coins(); toast('獲得 1000 枚寶藏幣', 'gold'); return; }
  if (t === 'getChar') { const id = $('admGetChar').value; if (owned(id)) { toast(`${CHARACTERS[id].name} 已經在船上了`); return; } addCrew(id, 50); toast(`${CHARACTERS[id].name} 加入了船隊（LV 50）`, 'gold'); renderAdmin('tools'); return; }
  if (t === 'getSkin') { const k = $('admGetSkin').value, S = SAVE.data.skins = SAVE.data.skins || { owned: [], equip: {} }; S.owned = S.owned || []; if (S.owned.includes(k)) { toast('已經擁有這款皮膚'); return; } S.owned.push(k); SAVE.save(); toast(`獲得皮膚「${SKINS[k].name}」`, 'gold'); return; }
  if (t === 'export') { const blob = new Blob([JSON.stringify(adminLoad(), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'op_admin_config.json'; a.click(); }
  if (t === 'tokens') { addTokens(10, '後台發放'); }
  if (t === 'unlock') { CHAPTERS.forEach(c => SAVE.data.chapters[c.id].cleared = true); SAVE.save(); toast('全部篇章已標記通關'); }
  if (t === 'lvup') { const r = SAVE.data.roster[SAVE.data.player]; if (r) { r.lv = Math.min(MAX_LV, r.lv + 10); r.exp = 0; SAVE.save(); toast(`${CHARACTERS[SAVE.data.player].name} 升到 LV ${r.lv}`); } }
  if (t === 'allchars') { CHARACTER_ORDER.forEach(id => addCrew(id, 50)); toast('已獲得全部角色'); }
  if (t === 'freedraw') { SAVE.data.freeDraw = false; SAVE.save(); toast('新手免費召喚已重置'); }
  if (t === 'resetSave') confirmBox('清除遊戲進度？', '寶藏幣、背包與篇章進度都會歸零，無法復原。', '清除', () => { localStorage.removeItem(SAVE.key); SAVE.load(); coins(); loginInfo(); toast('遊戲進度已清除'); });
  if (t === 'resetAdmin') confirmBox('恢復預設設定？', '所有後台修改（數值、BOSS、劇情、扭蛋）都會還原。', '恢復', () => { localStorage.removeItem(ADMIN_KEY); ADM = {}; adminApply({}); renderAdmin('tools'); toast('後台設定已恢復預設'); });
}
function bindAdmin() {
  $('adminNav').querySelectorAll('button').forEach(b => b.onclick = () => { if (collectAdmin()) renderAdmin(b.dataset.tab); });
  $('adminSave').onclick = saveAdmin;
  $('adminCancel').onclick = () => { ADM = adminLoad(); renderAdmin(); $('adminStatus').textContent = '已放棄未儲存的修改'; $('adminStatus').className = 'astatus'; };
}
