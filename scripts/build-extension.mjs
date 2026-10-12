// 打包浏览器扩展（离线壳）：把 dist 打进 extension-dist/，新标签页直接加载本地 newtab.html。
// 资源用绝对路径（/assets /fonts…），在 chrome-extension://<id>/ 根下解析即扩展根，故静态资源拷到根。
// 构建/安装步骤见 README「浏览器扩展」。
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

// 3) 拷贝扩展源文件（清单、接口基址、图标）
cpSync(join(src, 'manifest.json'), join(out, 'manifest.json'));
cpSync(join(src, 'apibase.js'), join(out, 'apibase.js'));
if (existsSync(join(src, 'icons'))) cpSync(join(src, 'icons'), join(out, 'icons'), { recursive: true });

console.log('extension-dist 已生成：');
console.log('  加载路径：', out);
console.log('  接口基址：', readFileSync(join(out, 'apibase.js'), 'utf8').match(/=\s*'([^']+)'/)?.[1]);
