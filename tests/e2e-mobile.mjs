// 移动视口 e2e（375×812）：移动端严格复用 PC 布局，唯一差异=卡片区固定 4 行、其余滚动
// 依赖：本地 wrangler pages dev 已起在 GOTAB_BASE_URL（默认 8799）；GOTAB_CHROMIUM 可指定浏览器路径
import { chromium } from 'playwright';

const base = process.env.GOTAB_BASE_URL || 'http://127.0.0.1:8799';
const EXE = process.env.GOTAB_CHROMIUM;
const failures = [];
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
  if (!ok) failures.push(name);
};

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

// 24 张卡（6 行，超出 4 行窗口 → 必然可滚动）
await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.setItem(
    'persist:cards',
    JSON.stringify(
      Array.from({ length: 24 }, (_, i) => ({ id: `mv${i + 1}`, title: `卡片${i + 1}`, subTitle: '', url: `https://e${i + 1}.example.com` }))
    )
  );
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-card-id="mv24"]', { timeout: 10000 });

// 1. 无未捕获异常
eq('无未捕获异常', pageErrors.length, 0);

// 2. PC 同构网格：64×64 卡
const cardBox = await page.locator('[data-card-id="mv1"] a').boundingBox();
eq('卡片 64px 宽（PC auto-fill）', Math.round(cardBox?.width || 0), 64);
eq('卡片 64px 高', Math.round(cardBox?.height || 0), 64);

// 3. 一行四个：mv1-mv4 同行、mv5 换行
const y1 = (await page.locator('[data-card-id="mv1"]').boundingBox())?.y;
const ys = [];
for (let i = 2; i <= 4; i++) ys.push((await page.locator(`[data-card-id="mv${i}"]`).boundingBox())?.y);
const y5 = (await page.locator('[data-card-id="mv5"]').boundingBox())?.y;
eq('一行四个（前四卡同行）', ys.every((y) => Math.abs((y || 0) - (y1 || 0)) < 2), true);
eq('第五卡换行', (y5 || 0) > (y1 || 0) + 32, true);

// 4. 卡片区滚动容器：移动端固定 4 行高（4×64+3×40=376）且可滚动
const scroller = page.locator('.scrollbar-none');
const scBox = await scroller.boundingBox();
eq('滚动容器固定 4 行高', Math.abs(Math.round(scBox?.height || 0) - 376) <= 2, true);
const scrollable = await scroller.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight }));
eq('卡区可滚动', scrollable.sh > scrollable.ch, true);

// 5. 时钟/搜索吸顶固定：卡区滚动后搜索框位置不变
const barY1 = (await page.locator('.backdrop-blur-\\[40px\\]').boundingBox())?.y;
await scroller.evaluate((el) => el.scrollTo(0, el.scrollHeight));
await page.waitForTimeout(300);
const barY2 = (await page.locator('.backdrop-blur-\\[40px\\]').boundingBox())?.y;
eq('搜索框吸顶固定', Math.abs((barY2 || 0) - (barY1 || 0)) < 2, true);
await scroller.evaluate((el) => el.scrollTo(0, 0));
await page.waitForTimeout(200);

// 6. 搜索栏 PC 同构：48px 高
const bar = await page.locator('.backdrop-blur-\\[40px\\]').boundingBox();
eq('搜索栏 48px 高（PC 同构）', Math.round(bar?.height || 0), 48);

// 7. 长按卡片弹操作菜单（触屏能力保留）
await page.locator('[data-card-id="mv3"]').evaluate((el) => {
  const t = new Touch({ identifier: 1, target: el, clientX: 60, clientY: 400 });
  el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [t] }));
});
const menuShown = await page.waitForSelector('text=批量编辑', { timeout: 3000 }).then(() => true).catch(() => false);
eq('长按弹出操作菜单', menuShown, true);
await page.keyboard.press('Escape');
await page.mouse.click(187, 790);

// 8. 图标按钮热区 ≥40
const tb = await page.locator('button[aria-label*="沉浸"]').boundingBox();
eq('四方块按钮热区≥40', Math.min(tb?.width || 0, tb?.height || 0) >= 40, true);
const gear = await page.locator('button[aria-label="设置"]').boundingBox();
eq('设置齿轮热区≥40', Math.min(gear?.width || 0, gear?.height || 0) >= 40, true);
const av = await page.locator('button[aria-label="用户入口"]').boundingBox();
eq('头像热区≥40', Math.min(av?.width || 0, av?.height || 0) >= 40, true);

// 9. 设置抽屉不超出视口
await page.locator('button[aria-label="用户入口"]').click();
await page.waitForSelector('.ant-drawer-content', { timeout: 3000 });
const drawerBox = await page.locator('.ant-drawer-content').boundingBox();
eq('抽屉宽度不超视口', Math.round(drawerBox?.width || 999) <= 375, true);
await page.locator('.ant-drawer-mask').click();
await page.waitForSelector('.ant-drawer-content', { state: 'detached', timeout: 3000 }).catch(() => {});

// 10. 桌面回归：滚动区恢复 flex-1（高度 > 4 行），网格一致
await page.setViewportSize({ width: 1280, height: 800 });
await page.waitForTimeout(400);
const scBox2 = await scroller.boundingBox();
eq('桌面滚动区 flex-1（>4行高）', (scBox2?.height || 0) > 376, true);
eq('桌面卡片可见', await page.locator('[data-card-id="mv1"]').isVisible(), true);

await browser.close();
console.log(failures.length ? `FAILED: ${failures.join('; ')}` : 'ALL PASSED');
process.exit(failures.length ? 1 : 0);
