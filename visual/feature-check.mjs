// UI 功能验证：设置抽屉 / 卡片管理 / 云同步 / 管理后台 / 天气挂件
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:8799/';
const USER = 'test@gotab.local';
const PASS = 'test123456';
const failures = [];
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? '✓' : '✗'} ${name}: ${ok ? 'pass' : `got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
  if (!ok) failures.push(name);
};

const browser = await chromium.launch({ executablePath: '/home/lyxy/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// 1. 首页基础渲染
await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
eq('首页 title', await page.title(), 'Gotab');
eq('时钟渲染', (await page.locator('.text-[56px]').count()) >= 1, true);

// 2. 头像 → 设置抽屉
await page.locator('.ant-avatar').first().click();
await page.waitForTimeout(800);
await page.getByText('设置', { exact: true }).click();
await page.waitForTimeout(1000);
eq('设置抽屉打开', await page.locator('.ant-drawer-open').count(), 1);
eq('主界面面板', await page.locator('.ant-drawer').getByText('背景模式').count(), 1);

// 3. 卡片管理：添加一张
await page.locator('.ant-menu').getByText('卡片管理').click();
await page.waitForTimeout(600);
await page.getByText('添加卡片').click();
await page.waitForTimeout(400);
await page.locator('.ant-modal input').first().fill('TestCard');
const urlInput = page.locator('.ant-modal input[placeholder="https://"]');
await urlInput.fill('https://example.com');
await page.locator('.ant-modal').getByRole('button', { name: '保存' }).click();
await page.waitForTimeout(800);
const cardCount = await page.locator('.ant-drawer .ant-card, .ant-drawer div:has(> div > .h-8)') .count().catch(() => -1);
eq('卡片列表含 TestCard', await page.locator('.ant-drawer').getByText('TestCard').count(), 1);

// 4. 个人中心未登录 → 直接登录表单
await page.locator('.ant-menu').getByText('个人中心').click();
await page.waitForTimeout(600);
await page.locator('#login-form_username').fill(USER);
await page.locator('#login-form_password').fill(PASS);
await page.locator('.ant-drawer').getByRole('button', { name: /登 录/ }).click();
await page.waitForTimeout(1800);

// 5. 登录后个人中心显示资料表单
await page.locator('.ant-menu').getByText('个人中心').click();
await page.waitForTimeout(800);
eq('个人中心昵称输入', await page.locator('.ant-drawer form input').count() >= 4, true);

// 6. 数据同步：上传
await page.locator('.ant-menu').getByText('数据同步').click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /上传到云端/ }).click();
await page.waitForTimeout(1500);
eq('同步提示', (await page.locator('.ant-drawer').innerText()).includes('已同步到云端'), true);

// 7. 管理后台（test 是管理员）
await page.locator('.ant-menu').getByText('管理后台').click();
await page.waitForTimeout(800);
eq('用户管理 Tab', await page.locator('.ant-drawer').getByText('用户管理').count() >= 1, true);
// 等待表格加载
await page.waitForTimeout(1500);
eq('用户表格有数据', await page.locator('.ant-drawer .ant-table-tbody tr').count() >= 1, true);
// 公告管理
await page.locator('.ant-drawer').getByText('公告管理', { exact: true }).click();
await page.waitForTimeout(1000);
eq('公告 Tab 渲染', await page.locator('.ant-drawer .ant-tabs-tab-active').innerText(), '公告管理');
// 默认主页
await page.locator('.ant-drawer').getByText('默认主页', { exact: true }).click();
await page.waitForTimeout(1000);
eq('默认主页 Tab', await page.locator('.ant-drawer .ant-tabs-tab-active').innerText(), '默认主页');

// 8. 天气挂件：在主界面打开
await page.locator('.ant-menu').getByText('主界面').click();
await page.waitForTimeout(600);
await page.locator('.ant-drawer').getByText('天气挂件').click().catch(() => {});
await page.locator('.ant-drawer .ant-switch').last().click();
await page.waitForTimeout(800);
eq('天气挂件显示', await page.locator('img[src*="/images/w"]').count() >= 1, true);

// 9. 关闭抽屉
await page.locator('.ant-drawer-close').click().catch(() => page.keyboard.press('Escape'));
await page.waitForTimeout(500);

// 10. 截图留证
await page.screenshot({ path: '/home/lyxy/pi/gotab/visual/feature-check.png', fullPage: true });

await browser.close();
console.log(failures.length === 0 ? '\nALL FEATURES PASS' : `\nFAILURES: ${failures.length}`);
process.exit(failures.length === 0 ? 0 : 1);
