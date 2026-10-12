// 扩展（离线壳，方案 B）真实加载验证：新标签页在 chrome-extension:// 下渲染、
// 接口经 apibase 指向线上域名、无 CSP/JS 报错。
// 依赖：先 npm run build:ext 生成 extension-dist/
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, rmSync, existsSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ext = join(root, 'extension-dist');
const EXE = process.env.GOTAB_CHROMIUM;
const API = (readFileSync(join(ext, 'apibase.js'), 'utf8').match(/=\s*'([^']+)'/) || [])[1];
const PROFILE = '/tmp/cftab-ext-profile';
if (!existsSync(join(ext, 'newtab.html'))) {
  console.error('未找到 extension-dist/newtab.html，请先 npm run build:ext');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 自包含：每次全新 profile（否则读到的 id 可能来自旧构建）
rmSync(PROFILE, { recursive: true, force: true });

const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  executablePath: EXE,
  args: [
    '--headless=new',
    '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    `--disable-extensions-except=${ext}`,
    `--load-extension=${ext}`,
  ],
});

// unpacked 扩展 id 由 Chrome 按路径生成并写入 profile，加载后轮询读取
const tryExtId = () => {
  const p = join(PROFILE, 'Default/Preferences');
  if (!existsSync(p)) return null;
  try {
    const s = (JSON.parse(readFileSync(p, 'utf8')).extensions || {}).settings || {};
    for (const [id, v] of Object.entries(s)) if (v.path === ext) return id;
  } catch { /* 写入中，重试 */ }
  return null;
};
let id = null;
for (let i = 0; i < 40 && !id; i++) { id = tryExtId(); if (!id) await sleep(500); }
if (!id) { console.log('FAIL 未读取到扩展 id'); await ctx.close(); process.exit(2); }

const page = await ctx.newPage();
const errs = [];
const apiReqs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('request', (r) => { if (r.url().includes('/api/')) apiReqs.push(r.url()); });

await page.goto(`chrome-extension://${id}/newtab.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(6000);

const info = await page.evaluate(() => {
  const el = document.getElementById('root');
  return {
    base: globalThis.__GOTAB_API_BASE__ || '(未设置)',
    rootLen: el ? el.innerHTML.length : -1,
    text: (document.body.innerText || '').slice(0, 60).replace(/\s+/g, ' '),
  };
});

// 扩展图标：manifest 声明了 icons，且各尺寸文件可访问（否则浏览器显示默认占位图标）
const iconCheck = await page.evaluate(async () => {
  const m = await (await fetch(chrome.runtime.getURL('manifest.json'))).json();
  const declared = Object.values(m.icons || {});
  const results = [];
  for (const p of declared) {
    const r = await fetch(chrome.runtime.getURL(p));
    results.push({ p, ok: r.ok, type: r.headers.get('content-type') || '' });
  }
  return { declared, results };
});

console.log('扩展 id:', id, '| apibase:', info.base);
console.log('root 渲染长度:', info.rootLen, '| 文本:', info.text);
console.log('JS 报错:', errs.length ? errs.slice(0, 5) : '无');
console.log('API 请求:', apiReqs.length, apiReqs[0] ? `例: ${apiReqs[0]}` : '');
console.log('扩展图标:', JSON.stringify(iconCheck));

const iconsOk = iconCheck.declared.length >= 4 && iconCheck.results.every((r) => r.ok && r.type.startsWith('image/'));
const ok = info.rootLen > 500 && errs.length === 0 && info.base === API
  && apiReqs.length > 0 && apiReqs.every((u) => u.startsWith(API + '/')) && iconsOk;
console.log(ok ? '✓ EXT PASS' : '✗ EXT FAIL');
await ctx.close();
process.exit(ok ? 0 : 1);
