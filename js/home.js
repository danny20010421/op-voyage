/* 首頁：導覽列、公告時鐘、遊戲特色、角色介紹、社區、客服中心、設定、船長頭像 */
(function () {
  const pad = n => String(n).padStart(2, '0');
  function tick() { const el = $('newsClock'); if (!el) return; const d = new Date(); el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; el.dateTime = d.toISOString(); }
  function homePanel(title, html, after) { $('homeTitle').textContent = title; $('homeBody').innerHTML = html; openModal('homeModal'); if (after) after($('homeBody')); }

  /* v156：遊戲特色依目前內容重寫；數字（角色、篇章、歌曲、保底、皮膚）打開時才從遊戲資料計算，不寫死 */
  function featList() {
    const nCh = CHAPTERS.length, nChar = Object.values(CHARACTERS).filter(c => !c.npcOnly).length;
    const nRar = typeof RAR_ORDER !== 'undefined' ? RAR_ORDER.length : 10, rar0 = typeof RAR_ORDER !== 'undefined' ? RAR_ORDER[0] : 'C', rar1 = typeof RAR_ORDER !== 'undefined' ? RAR_ORDER[RAR_ORDER.length - 1] : 'UR++';
    const nSkin = typeof SKINS !== 'undefined' ? Object.keys(SKINS).length : 0, pity = (typeof GAME_SETTINGS !== 'undefined' && GAME_SETTINGS.gachaPity) || 150;
    const nType = new Set(Object.values(CHARACTERS).flatMap(c => c.types || [])).size || 12;
    const songs = typeof RHYTHM_SONGS !== 'undefined' ? Object.values(RHYTHM_SONGS).map(x => `〈${x.title || x.name}〉`).join('') : '';
    return [
      ['🏝️', `${nCh} 座 3D 島嶼自由探索`, `從東海的風車村一路航行到巨人之國艾爾巴夫。每座島都是一張大地圖：奔跑、跳躍、走上石階與空中步道，跟著「自動前往」找到任務目標，沿途還有寶箱、支線與小 BOSS。`],
      ['📜', `${nCh} 章原作劇情`, '依原作時間線重寫每一章：潛入、護送、限時逃脫、奪鑰、推理找內奸，再到 BOSS 決戰。說話的角色會以立繪登場，每章都有序章與尾聲。'],
      ['⚔️', '回合制屬性對戰', `${nType} 種屬性互相克制（克制 ×${(typeof GAME_SETTINGS !== 'undefined' && GAME_SETTINGS.typeUp) || 1.25}），搭配麻痺、中毒、冰凍等異常狀態、能力升降、羈絆技能與華麗奧義。三人陣容輪番上陣，倒下就換人接力；伊姆、洛基、凱多等角色還會在戰鬥中變身。`],
      ['⚓', `${nChar} 位船員收藏培養`, `稀有度從 ${rar0} 到 ${rar1} 共 ${nRar} 階。升級、覺醒、技能升級、航海寶物與角色試煉，一步步把喜歡的船員養到最強${nSkin ? `；還有 ${nSkin} 款皮膚立繪可以收藏` : ''}。`],
      ['🎰', '懸賞召喚與限定召喚', `一般召喚 ${pity} 抽保底，限定召喚依檔期輪替、可以集碎片換角色；每日懸賞、高級懸賞與道具商店，讓你天天都有新收穫。`],
      ['🎉', '限時祭典與每日秘境', '大廳右側的活動關卡：節慶限定的祭典關卡（萬聖夜、巨人戰士祭、聖誕晚宴、新春祭、魯夫生日祭）掉落祭典徽章，可換限定角色碎片與 SSR 航海寶物；每日秘境天天開放，通關後一鍵掃蕩，貝里、經驗書、覺醒結晶、航海寶物一次拿。'],
      ['👑', '皇帝領海', '連戰四皇的幹部、擊破分身，最後挑戰四皇真身，勝利後四皇就會加入你的船隊。集齊六位皇帝，還能挑戰傳說中的「洛克斯」。'],
      ['🎤', '歌姬挑戰', `跟著 Ado ${songs || '的歌'} 的節奏點擊、長按、滑動四條音軌，擊敗歌姬美音；每首歌拿到 S 評分就能獲得美音碎片。`],
      ['🏆', '海賊天梯', '每月一季的玩家對戰：挑戰其他船長的防守陣容，一路爬上「海賊王」段位，賽季結束領取排名獎勵。'],
      ['🤝', '船團與好友', '登入帳號就能雲端存檔、加好友、送禮、留言與即時對戰，和船團夥伴每週一起挑戰船團 BOSS。'],
      ['🎁', '每日冒險', '七日登入、每日活躍、每月一季的航海通行證（30 級，滿級送限定皮膚選擇券）與掛機寶藏；懸賞任務與成就一鍵領取。還有奪寶大冒險、勇者之塔 250 層、懸賞金交易所與登上虛空王座等玩法。']
    ];
  }
  function features() { homePanel('遊戲特色', `<div class="feat-grid">${featList().map(f => `<article class="feat"><i aria-hidden="true">${f[0]}</i><h3>${f[1]}</h3><p>${f[2]}</p></article>`).join('')}</div><div class="home-cta"><button class="btn-primary big" data-go="start">揚帆出航</button></div>`, b => { b.querySelector('[data-go=start]').onclick = () => { closeModal('homeModal'); $('startBtn').click(); }; }); }
  /* v156：登入頁介紹文字裡的數字也從資料計算 */
  function introNums() { const set = (k, v) => document.querySelectorAll(`[data-intro=${k}]`).forEach(e => { e.textContent = v; }); try { set('ch', CHAPTERS.length); set('char', Object.values(CHARACTERS).filter(c => !c.npcOnly).length); } catch (e) { } }
  function community() {
    const url = location.href.split('#')[0], text = '一起來玩《海賊新時代》！', enc = encodeURIComponent;
    homePanel('社區', `<p class="home-lead">邀請朋友一起出航，分享你的陣容與冒險。</p><div class="share-grid">
      <button class="share" data-share="copy"><i>🔗</i><b>複製遊戲連結</b><small>貼到任何地方分享</small></button>
      <a class="share line" href="https://social-plugins.line.me/lineit/share?url=${enc(url)}" target="_blank" rel="noopener"><i>💬</i><b>分享到 LINE</b><small>傳給好友或群組</small></a>
      <a class="share fb" href="https://www.facebook.com/sharer/sharer.php?u=${enc(url)}" target="_blank" rel="noopener"><i>📘</i><b>分享到 Facebook</b><small>發佈到動態</small></a>
      <a class="share x" href="https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}" target="_blank" rel="noopener"><i>✖️</i><b>分享到 X</b><small>發一則推文</small></a></div>`,
      b => { b.querySelector('[data-share=copy]').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('已複製遊戲連結', 'gold')).catch(() => prompt('複製這個連結：', url)); }; });
  }
  const FAQ = [
    ['我的進度存在哪裡？', '進度會自動存在這台裝置的瀏覽器裡。到「設定 → 雲端存檔」登入帳號後，也會同步到雲端。清除瀏覽器資料會讓本機進度消失，記得先同步，或用下方的「匯出存檔」備份。'],
    ['換手機或電腦，要怎麼延續進度？', '最簡單的方法：兩台裝置登入同一個帳號，打開「設定 → 雲端存檔」按「立即同步」。不想登入的話，在舊裝置按「匯出存檔」下載檔案，傳到新裝置後按「匯入存檔」。'],
    ['在 LINE、Facebook 裡無法用 Google 登入？', 'App 內建的瀏覽器不允許 Google 登入。請點右上角選單選「用瀏覽器開啟」（Chrome 或 Safari）再登入，或直接改用「信箱登入」。'],
    ['找不到任務目標怎麼辦？', '按任務欄的「➤ 自動前往」，角色會自己走過去；目標不在畫面內時，畫面邊緣會有方向箭頭。也可以按電話蟲（電腦按 H 鍵）詢問下一步。'],
    ['畫面卡頓或手機發燙？', '到「設定」把畫質切換成「省電」、技能特效切成「低」，重新進入島嶼後就會變順。'],
    ['BOSS 太強打不過？', '換上克制 BOSS 屬性的船員最有效。也可以幫船員升級、覺醒、升級技能、裝上航海寶物，或到懸賞處商店買回復道具再挑戰。'],
    ['更新後畫面怪怪的？', '按下方的「重新整理並更新」，會重新下載最新版本的遊戲檔案，存檔不受影響。']
  ];
  function support() {
    homePanel('客服中心', `<div class="faq">${FAQ.map((f, i) => `<details ${i === 0 ? 'open' : ''}><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join('')}</div>
      <div class="sup-actions"><button class="btn-gold" data-s="export">匯出存檔</button><label class="btn-ghost file-btn">匯入存檔<input type="file" accept="application/json" data-s="import" hidden></label><button class="btn-ghost" data-s="reload">重新整理並更新</button></div>`,
      b => {
        b.querySelector('[data-s=export]').onclick = () => { const blob = new Blob([JSON.stringify({ game: 'op_voyage', v: DATA_VERSION, at: new Date().toISOString(), save: SAVE.data })], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `海賊新時代存檔_${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('已下載存檔檔案', 'gold'); };
        b.querySelector('[data-s=import]').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { const d = JSON.parse(t); if (!d || d.game !== 'op_voyage' || !d.save) throw 0; confirmBox('匯入存檔？', '目前這台裝置上的進度會被取代，無法復原。', '匯入', () => { localStorage.setItem(SAVE.key, JSON.stringify(d.save)); SAVE.load(); toast('存檔已匯入', 'gold'); closeModal('homeModal'); if (typeof loginInfo === 'function') loginInfo(); refreshAvatar(); }); }).catch(() => toast('這不是有效的存檔檔案', 'warn')); };
        b.querySelector('[data-s=reload]').onclick = () => { location.href = location.pathname + '?r=' + Date.now(); };
      });
  }
  function settings() {
    if (typeof openSettings === 'function') return openSettings();
    const P = AUDIO.pref, low = localStorage.getItem('op_gfx') === 'low';
    homePanel('設定', `<div class="set-list">
      <label class="set-row"><span><b>音樂與音效</b><small>關閉後完全靜音</small></span><input type="checkbox" class="sw" data-k="on" ${P.muted ? '' : 'checked'}></label>
      <label class="set-row"><span><b>音樂音量</b></span><input type="range" min="0" max="1" step="0.05" value="${P.music}" data-k="music"></label>
      <label class="set-row"><span><b>音效音量</b></span><input type="range" min="0" max="1" step="0.05" value="${P.sfx}" data-k="sfx"></label>
      <div class="set-row"><span><b>畫質</b><small>省電模式會降低 3D 解析度，手機發燙時使用（重新進入島嶼後生效）</small></span><div class="seg" role="radiogroup"><button data-g="ultra" class="${localStorage.getItem('op_gfx') === 'ultra' ? 'on' : ''}">極致</button><button data-g="high" class="${low || localStorage.getItem('op_gfx') === 'ultra' ? '' : 'on'}">高畫質</button><button data-g="low" class="${low ? 'on' : ''}">省電</button></div></div>
      <div class="set-row"><span><b>雲端存檔</b><small>用 Google 帳號在不同裝置之間接續進度</small></span><button class="btn-gold sm" onclick="openCloud()">開啟</button></div>
      <label class="set-row"><span><b>首頁公告預設展開</b></span><input type="checkbox" class="sw" data-k="news" ${localStorage.getItem('op_news_open') !== '0' ? 'checked' : ''}></label>
    </div>`, b => {
      b.querySelector('[data-k=on]').onchange = e => { AUDIO.setPref({ muted: !e.target.checked }); if (typeof syncSound === 'function') syncSound(); };
      b.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => AUDIO.setPref({ [r.dataset.k]: +r.value }));
      b.querySelectorAll('[data-g]').forEach(x => x.onclick = () => { localStorage.setItem('op_gfx', x.dataset.g); window.E3_ULTRA = x.dataset.g === 'ultra'; b.querySelectorAll('[data-g]').forEach(y => y.classList.toggle('on', y === x)); if (window.WORLD && WORLD.r) { WORLD.r.maxDpr = x.dataset.g === 'low' ? .75 : Math.min(devicePixelRatio || 1, 1.6); WORLD.r.dpr = Math.min(WORLD.r.dpr, WORLD.r.maxDpr); } toast(x.dataset.g === 'low' ? '已切換為省電畫質' : x.dataset.g === 'ultra' ? '已切換為極致畫質（重新進入島嶼後生效）' : '已切換為高畫質'); });
      b.querySelector('[data-k=news]').onchange = e => { if (typeof setNewsOpen === 'function') setNewsOpen(e.target.checked); };
    });
  }
  function chars() { if (typeof openCrew === 'function') openCrew('codex', { reveal: true }); }
  function refreshAvatar() {
    const img = $('homeAvatarImg'); if (!img) return; const id = SAVE.data && SAVE.data.player && SAVE.data.roster && SAVE.data.roster[SAVE.data.player] ? SAVE.data.player : null;
    img.src = id ? CHARACTERS[id].avatar : 'assets/ui/denden.webp'; if ($('homeAvatar')) $('homeAvatar').title = id ? `船長：${CHARACTERS[id].name}` : '尚未出航';
  }
  window.refreshAvatar = refreshAvatar;
  const ACT = { home: () => { }, features, chars, community, support };
  function go(k) { document.querySelectorAll('#homeNav [data-home]').forEach(b => b.classList.toggle('on', b.dataset.home === k)); (ACT[k] || ACT.home)(); if (k !== 'home') setTimeout(() => document.querySelectorAll('#homeNav [data-home]').forEach(b => b.classList.toggle('on', b.dataset.home === 'home')), 400); }
  window.addEventListener('DOMContentLoaded', () => {
    tick(); setInterval(tick, 1000); refreshAvatar(); introNums();
    document.querySelectorAll('#homeNav [data-home]').forEach(b => b.onclick = () => go(b.dataset.home));
    $('homeSettings').onclick = settings;
    if ($('homeAvatar')) $('homeAvatar').onclick = () => { if (Object.keys(SAVE.data.roster || {}).length) openCrew(); else toast('先按「揚帆出航」選擇你的船員吧！'); };
    $('homeMenuBtn').onclick = () => {
      const items = [['home', '首頁'], ['features', '遊戲特色'], ['chars', '角色介紹'], ['community', '社區'], ['support', '客服中心'], ['settings', '設定']];
      $('menuGrid').innerHTML = items.map(([k, l]) => `<button class="btn-ghost" data-k="${k}">${l}</button>`).join('');
      $('menuGrid').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { closeSheet(); b.dataset.k === 'settings' ? settings() : go(b.dataset.k); });
      $('menuSheet').classList.add('show');
    };
  });
})();
