// 打包浏览器扩展（离线壳，方案 B）：把前端 dist 打进扩展目录 extension-dist/，
// 新标签页直接加载本地打包的 index.html（瞬时打开、无跳转），接口经 apibase.js 指向线上域名。
//
// 产物：extension-dist/（未跟踪，加入 .gitignore）
//   manifest.json  ← extension/manifest.json
//   apibase.js     ← extension/apibase.js（改域名只改这里）
//   newtab.html    ← dist/index.html（注入 apibase.js；资源为绝对路径 /assets /fonts…，
//                     在 chrome-extension://<id>/ 根下解析即扩展根，故随包拷贝到根）
//   assets/ fonts/ images/ icons/ favicon.ico ← dist 静态资源
//
// 用法：npm run build:ext  （= npm run build && node scripts/build-extension.mjs）
// 安装：chrome://extensions → 开发者模式 → 加载已解压的扩展程序 → 选 extension-dist/
import { cpSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const src = join(root, 'extension');
const out = join(root, 'extension-dist');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('未找到 dist/index.html，请先 npm run build');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1) 拷贝 dist 静态资源（排除服务端专用内容与 index.html）
const EXCLUDE = new Set(['functions', '_headers', '_redirects', 'index.html']);
cpSync(dist, out, {
  recursive: true,
  filter: (s) => {
    const rel = relative(dist, s).split(/[\\/]/)[0];
    return !EXCLUDE.has(rel);
  },
});

// 2) newtab.html：以 dist/index.html 为模板，在 head 起首注入 apibase.js（外部脚本，MV3 禁内联）
let html = readFileSync(join(dist, 'index.html'), 'utf8');
html = html.replace('<head>', '<head>\n  <script src="./apibase.js"></script>');
writeFileSync(join(out, 'newtab.html'), html);

// 3) 拷贝扩展源文件
cpSync(join(src, 'manifest.json'), join(out, 'manifest.json'));
cpSync(join(src, 'apibase.js'), join(out, 'apibase.js'));

console.log('extension-dist 已生成：');
console.log('  加载路径：', out);
console.log('  接口基址：', readFileSync(join(out, 'apibase.js'), 'utf8').match(/=\s*'([^']+)'/)?.[1]);
