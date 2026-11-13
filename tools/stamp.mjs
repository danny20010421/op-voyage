#!/usr/bin/env node
/* v214：發布前依檔案內容自動產生版本號（?v=內容雜湊前 8 碼）。
   1. js／css 裡寫死的素材網址：assets/…/檔名.副檔名?v=xxx → 該素材檔的雜湊
   2. index.html 的 <script src="js/…?v=xxx"> 與 <link href="css/…?v=xxx"> → 該檔（改完素材網址後）的雜湊
   用法：node tools/stamp.mjs        改寫並列出改了哪些
        node tools/stamp.mjs --check 只檢查，有過期的版本號就回傳錯誤碼 1（tests 會跑）
   動態組出來的網址（例如 `assets/fx/v196/${k}.webp?v=${V}`）不在處理範圍，仍由該檔自己的 V 控制。 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const hash = p => createHash('sha1').update(readFileSync(join(ROOT, p))).digest('hex').slice(0, 8);
const memo = new Map(); const H = p => { if (!memo.has(p)) memo.set(p, existsSync(join(ROOT, p)) ? hash(p) : null); return memo.get(p); };
const stale = [];

const ASSET = /(assets\/[A-Za-z0-9_\/.\-]+\.(?:webp|png|jpe?g|gif|svg|mp3|m4a|ogg|wav|mp4|webm|json|glb|gltf|woff2?))\?v=([A-Za-z0-9._-]+)/g;
for (const dir of ['js', 'css']) {
  for (const f of readdirSync(join(ROOT, dir)).filter(n => /\.(js|css)$/.test(n))) {
    const p = `${dir}/${f}`, src = readFileSync(join(ROOT, p), 'utf8');
    const out = src.replace(ASSET, (m, a, v) => { const h = H(a); if (!h || h === v) return m; stale.push(`${p}: ${a} ${v} → ${h}`); return `${a}?v=${h}`; });
    if (out !== src && !CHECK) { writeFileSync(join(ROOT, p), out); memo.delete(p); }
  }
}
const IDX = 'index.html', html = readFileSync(join(ROOT, IDX), 'utf8');
const outHtml = html.replace(/((?:src|href)=")((?:js|css)\/[A-Za-z0-9_.\-\/]+\.(?:js|css))\?v=([A-Za-z0-9._-]+)"/g, (m, pre, p, v) => {
  memo.delete(p); const h = H(p); if (!h || h === v) return m; stale.push(`${IDX}: ${p} ${v} → ${h}`); return `${pre}${p}?v=${h}"`; });
if (outHtml !== html && !CHECK) writeFileSync(join(ROOT, IDX), outHtml);

if (CHECK) { if (stale.length) { console.log(`版本號過期 ${stale.length} 處，請先執行 node tools/stamp.mjs：\n` + stale.slice(0, 20).join('\n')); process.exit(1); } console.log('版本號檢查通過'); }
else console.log(stale.length ? `已更新 ${stale.length} 處版本號` : '版本號都是最新的');
