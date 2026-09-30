// 像素 diff 基准：线上站(tab.kfkf.asia) vs 本项目(8799)，同视口逐像素对比
import { chromium } from 'playwright';
const EXE = process.env.GOTAB_CHROMIUM || '/home/lyxy/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const W = 1280, H = 800;
const shot = async (url, waitMs) => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(waitMs);
  const buf = await p.screenshot({ type: 'png' });
  await b.close();
  return buf.toString('base64');
};
const refB64 = await shot('https://tab.kfkf.asia/', 7000);
const myB64 = await shot('http://127.0.0.1:8799/', 5000);
// 在单页 canvas 上解码两张图逐像素对比
const b = await chromium.launch({ executablePath: EXE });
const p = await b.newPage();
await p.setContent('<canvas id="c" width="1280" height="800"></canvas>', { waitUntil: 'load' });
const result = await p.evaluate(async ([a, b2]) => {
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const [ia, ib] = await Promise.all([load('data:image/png;base64,' + a), load('data:image/png;base64,' + b2)]);
  const cv = document.getElementById('c'); const ctx = cv.getContext('2d');
  ctx.drawImage(ia, 0, 0); const A = ctx.getImageData(0, 0, 1280, 800).data;
  ctx.drawImage(ib, 0, 0); const B = ctx.getImageData(0, 0, 1280, 800).data;
  const tol = 24; let diff = 0; const grid = Array.from({ length: 8 }, () => Array(10).fill(0));
  const gw = 128, gh = 100;
  for (let y = 0; y < 800; y += 2) for (let x = 0; x < 1280; x += 2) {
    const i = (y * 1280 + x) * 4;
    const d = Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2]);
    if (d > tol * 3) { diff++; grid[Math.min(7, Math.floor(y/gh))][Math.min(9, Math.floor(x/gw))]++; }
  }
  const total = (800/2) * (1280/2);
  return { diffPct: (100 * diff / total).toFixed(2), gridPct: grid.map(r => r.map(c => (100*c/ (gw/2*gh/2)).toFixed(1))) };
}, [refB64, myB64]);
await b.close();
console.log('整体像素差异: ' + result.diffPct + '%');
console.log('分块差异(行8×列10, 每块128×100):');
result.gridPct.forEach((row, i) => console.log('  ' + String(i).padStart(1) + ': ' + row.join(' ')));
