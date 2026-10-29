// Pages CLI 部署前置：wrangler pages deploy 只上传目录内容，Pages Functions 必须位于
// 该目录下的 functions/，故在 vite build 之后把它组装进 dist。Workers 路径不需要此步。
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const fns = join(root, 'functions');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('未找到 dist/index.html，请先 npm run build');
  process.exit(1);
}

if (!existsSync(fns)) {
  console.error('未找到仓库根 functions/，无法组装 Pages Functions');
  process.exit(1);
}

rmSync(join(dist, 'functions'), { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(fns, join(dist, 'functions'), { recursive: true });

console.log('dist/functions 已就绪：', join(dist, 'functions'));
