// UI 冒烟 v3：头像直开抽屉（下拉弹窗已删除）/ 抽屉菜单导航 / 卡片管理 / 登录 / 管理后台 / 云同步
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const EXE = process.env.GOTAB_CHROMIUM || '/home/lyxy/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const base = process.env.GOTAB_BASE_URL || 'http://127.0.0.1:8799';
const USER = process.env.GOTAB_USER || 'test@gotab.local';
const PASS = process.env.GOTAB_PASS || 'test123456';
const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
let pass = 0, fail = 0;
const P = (n, c, x = '') => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗'} ${n}${x ? ' ' + x : ''}`); };

await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
P('首页无 console 错误', errs.length === 0, errs.slice(0, 3).join(' | '));

// 1. 未登录：点头像 → 抽屉直接滑出（无下拉弹窗），内含完整菜单
await page.locator('.ant-avatar').first().click();
await page.waitForTimeout(600);
P('下拉弹窗已删除', (await page.locator('.ant-dropdown').count()) === 0);
P('抽屉直接滑出', (await page.locator('.ant-drawer-open').count()) === 1);
let menu = await page.locator('.ant-drawer .ant-menu-item').allTextContents();
P('抽屉菜单含个人中心/主界面/时间日期/搜索栏/卡片管理/关于', ['个人中心', '主界面', '时间日期', '搜索栏', '卡片管理', '关于我们'].every((t) => menu.some((m) => m.includes(t))), JSON.stringify(menu));
P('未登录默认落在登录面板', (await page.locator('#login-form_username').count()) === 1);

// 2. 菜单切到卡片管理，添加卡片（编辑表单为弹出式弹窗，对齐上游）
await page.locator('.ant-drawer .ant-menu-item', { hasText: '卡片管理' }).click();
await page.waitForTimeout(600);
await page.locator('.ant-drawer button', { hasText: '添加卡片' }).click();
await page.waitForTimeout(600);
const modal = page.locator('.ant-modal', { hasText: '添加卡片' });
await modal.locator('input[placeholder="如：GitHub"]').fill('测试卡');
await modal.locator('input[placeholder="https://"]').fill('https://example.com/x');
await modal.locator('button', { hasText: /保\s*存/ }).click({ timeout: 8000 });
await page.waitForTimeout(600);
P('新卡片出现在列表', await page.locator('text=测试卡').count() >= 1);

// 2b. 书签导入（HTML 导出文件 → 卡片，去重）
const bsFile = `<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p><DT><a href="https://vitejs.dev">Vite 官网</a></DT><DT><a href="https://react.dev">React</a></DT></DL>`;
writeFileSync('/tmp/gotab-bm.html', bsFile);
await page.locator('input[type=file]').setInputFiles('/tmp/gotab-bm.html');
await page.waitForTimeout(800);
P('书签导入成功（Vite 官网卡片出现）', await page.locator('text=Vite 官网').count() >= 1);

// 3. 菜单切主界面面板
await page.locator('.ant-drawer .ant-menu-item', { hasText: '主界面' }).click();
await page.waitForTimeout(500);
P('主界面面板渲染', await page.locator('.ant-drawer .ant-select').count() >= 1);

// 4. 菜单切个人中心登录（管理员）
await page.locator('.ant-drawer .ant-menu-item', { hasText: '个人中心' }).click();
await page.waitForTimeout(500);
await page.locator('#login-form_username').fill(USER);
await page.locator('#login-form_password').fill(PASS);
await page.locator('.ant-drawer button', { hasText: '登 录' }).click();
await page.waitForTimeout(1500);
P('登录成功（localStorage 有 token）', await page.evaluate(() => !!localStorage.getItem('persist:user')));

// 5. 登录后菜单：数据同步 + 管理后台
menu = await page.locator('.ant-drawer .ant-menu-item').allTextContents();
P('登录后菜单含数据同步/管理后台', menu.some((m) => m.includes('数据同步')) && menu.some((m) => m.includes('管理后台')), JSON.stringify(menu));
await page.locator('.ant-drawer .ant-menu-item', { hasText: '管理后台' }).click();
await page.waitForTimeout(1000);
const tabs = await page.locator('.ant-tabs-tab').allTextContents();
P('管理后台三面板渲染', tabs.length >= 3, JSON.stringify(tabs));
await page.waitForTimeout(800);
// 仪表盘为默认 Tab，切到用户管理后再断言表格
await page.locator('.ant-tabs-tab', { hasText: '用户管理' }).click();
await page.waitForTimeout(800);
P('用户列表含管理员', (await page.locator('.ant-table-row').count()) >= 1);
// 公告管理：新建一条
await page.locator('.ant-tabs-tab', { hasText: '公告管理' }).click();
await page.waitForTimeout(600);
await page.locator('button', { hasText: '新建公告' }).click();
await page.waitForTimeout(400);
await page.locator('.ant-modal', { hasText: '新建公告' }).locator('input').first().fill('冒烟公告');
await page.locator('.ant-modal', { hasText: '新建公告' }).locator('textarea').fill('冒烟内容');
await page.locator('.ant-modal', { hasText: '新建公告' }).locator('button', { hasText: /保\s*存/ }).click();
await page.waitForTimeout(800);
P('公告创建成功可见', await page.locator('text=冒烟公告').count() >= 1);

// 6. 数据同步面板：上传
await page.locator('.ant-drawer .ant-menu-item', { hasText: '数据同步' }).click();
await page.waitForTimeout(600);
await page.locator('button', { hasText: '上传到云端' }).click();
await page.waitForTimeout(1500);
P('云同步成功提示', await page.locator('text=已同步到云端').count() >= 1);

console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
console.log('console/page 错误:', errs.length ? errs.slice(0, 5).join(' | ') : '无');
await page.screenshot({ path: '/tmp/smoke-v2-admin.png', fullPage: false });
await browser.close();
process.exit(fail === 0 ? 0 : 1);
