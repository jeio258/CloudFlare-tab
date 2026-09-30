// 本项目规格提取：截图 + 关键元素计算样式（1280×800）
import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/home/lyxy/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:8799/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
await page.screenshot({ path: '/home/lyxy/pi/gotab/visual/my-home-desktop.png', fullPage: true });
const out = await page.evaluate(() => {
  const pick = (sel, n = 0) => {
    const el = document.querySelectorAll(sel)[n];
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), font: `${cs.fontSize}/${cs.fontWeight}`, color: cs.color, bg: cs.backgroundColor, blur: cs.backdropFilter, radius: cs.borderRadius };
  };
  const clock = [...document.querySelectorAll('div')].find((e) => /^\d{2}:\d{2}:\d{2}/.test((e.textContent || '').trim()) && e.children.length === 0);
  const date = [...document.querySelectorAll('div')].find((e) => /^\d{4}年\d{1,2}月/.test((e.textContent || '').trim()) && e.children.length === 0);
  const ccs = clock ? getComputedStyle(clock) : null;
  const dcs = date ? getComputedStyle(date) : null;
  return {
    avatar: pick('.ant-avatar'),
    searchSurface: pick('.search-bar-surface, [class*="rounded-xl"][class*="bg-white/70"]'),
    searchInput: pick('input[type=search]'),
    clock: clock ? { text: clock.textContent.trim(), font: ccs.fontSize, w: ccs.fontWeight, color: ccs.color } : null,
    date: date ? { text: date.textContent.trim(), font: dcs.fontSize, color: dcs.color } : null,
    card: (() => { const a = document.querySelector('a[target="_blank"]'); if (!a) return null; const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { w: Math.round(r.width), h: Math.round(r.height), radius: cs.borderRadius, bg: cs.backgroundColor, shadow: cs.boxShadow.slice(0, 60) }; })(),
  };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
