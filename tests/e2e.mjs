// 端到端 API + UI 测试（headless）。需要本地 wrangler pages dev 已起在 baseUrl。
import { chromium, request as playwrightRequest } from 'playwright';

const base = process.env.GOTAB_BASE_URL || 'http://127.0.0.1:8799';
const USER = process.env.GOTAB_USER || 'e2etester';
const PASS = process.env.GOTAB_PASS || 'test123456';
// 无 1243 浏览器时可指定已装版本（如 GOTAB_CHROMIUM=…/chromium-1234/chrome-linux64/chrome）
const EXE = process.env.GOTAB_CHROMIUM;
const failures = [];
const skipped = [];
const skip = (name) => skipped.push(name);
const log = (...a) => console.log(...a);
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  log(`${ok ? '✓' : '✗'} ${name}: ${ok ? 'pass' : `got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
  if (!ok) failures.push(name);
};

const api = await playwrightRequest.newContext();
const okJson = async (resp) => ({ status: resp.status(), body: await resp.json().catch(() => null) });
const cleanupUsers = [];

// 1. 静态与兜底
{
  const r = await api.get(`${base}/`);
  const html = await r.text();
  eq('home <title>', html.match(/<title>([^<]*)<\/title>/)?.[1], 'CloudFlare-tab');
  eq('home http 200', r.status(), 200);
  const m = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (m) {
    const rr = await api.get(base + m[1]);
    eq('asset 200', rr.status(), 200);
  } else failures.push('asset ref not found');
  // D12：/fonts/* 应有长缓存（否则每次加载字体都回源）
  const rf = await api.get(`${base}/fonts/roboto.woff`);
  const fontCC = rf.headers()['cache-control'] || '';
  eq('fonts 长缓存 immutable(D12)', /max-age=31536000/.test(fontCC) && /immutable/.test(fontCC), true);
  // 图标：/favicon.ico 可访问，且页面 link 指向它
  const rfav = await api.get(`${base}/favicon.ico`);
  eq('favicon.ico 200', rfav.status(), 200);
  eq('favicon link 指向 /favicon.ico', /<link[^>]+rel="icon"[^>]+href="\/favicon\.ico"/.test(html), true);
  const r404 = await api.get(`${base}/api/does-not-exist`);
  const { status, body } = await okJson(r404);
  eq('catch-all 200', status, 200);
  eq('catch-all code 404', body?.code, 404);
}

// 2. 登录错误
{
  const r = await api.post(`${base}/api/login`, { data: { username: USER, password: 'wrong' } });
  const { body } = await okJson(r);
  eq('wrong pwd code', body?.code, 400);
}

// 2.5 注册/资料编辑
{
  const uname = `u${Date.now() % 1000000}`;
  cleanupUsers.push(uname);
  const r1 = await api.post(`${base}/api/register`, {
    data: { username: uname, password: 'pass123' },
  });
  const { body: b1 } = await okJson(r1);
  eq('register 成功', b1?.code, 200);
  // 重复用户名
  const r2 = await api.post(`${base}/api/register`, {
    data: { username: uname, password: 'pass123' },
  });
  const { body: b2 } = await okJson(r2);
  eq('register 重复用户名', b2?.code, 400);
  // 新用户登录(userType=0)
  const r3 = await api.post(`${base}/api/login`, { data: { username: uname, password: 'pass123' } });
  const { body: b3 } = await okJson(r3);
  eq('新用户登录 code', b3?.code, 200);
  eq('新用户 userType=0', b3?.data?.userInfo?.userType, 0);
  const ntoken = b3?.data?.token;
  // 资料编辑
  const r4 = await api.post(`${base}/api/user/editUserInfo`, {
    headers: { authorization: ntoken },
    data: { username: uname, nickname: '昵称', sex: 1, phone: '13800138000' },
  });
  const { body: b4 } = await okJson(r4);
  eq('editUserInfo code', b4?.code, 200);
  eq('editUserInfo nickname', b4?.data?.nickname, '昵称');
  eq('editUserInfo sex', b4?.data?.sex, 1);
  // C1：手机号校验（复用 PHONE_RE）——非法格式被拒
  const rBadPhone = await api.post(`${base}/api/user/editUserInfo`, {
    headers: { authorization: ntoken },
    data: { username: uname, phone: '123' },
  });
  eq('editUserInfo 非法手机号被拒', (await okJson(rBadPhone)).body?.code, 400);
  // 找回密码（无邮箱/验证码：用户名+原密码+新密码）
  const r5bad = await api.post(`${base}/api/findPassword`, {
    data: { username: uname, newPassword: 'newpass1', confirmPassword: 'newpass1' },
  });
  const { body: b5bad } = await okJson(r5bad);
  eq('findPassword 缺原密码被拒', b5bad?.code, 400);
  const r5 = await api.post(`${base}/api/findPassword`, {
    data: { username: uname, oldPassword: 'pass123', newPassword: 'newpass1', confirmPassword: 'newpass1' },
  });
  const { body: b5 } = await okJson(r5);
  eq('findPassword 重置成功', b5?.code, 200);
  const r7 = await api.post(`${base}/api/login`, { data: { username: uname, password: 'newpass1' } });
  const { body: b7 } = await okJson(r7);
  eq('重置后新密码可登录', b7?.code, 200);
}

// 3. 正确登录 + getUserInfo + 同步 round-trip（对 D1 残留状态鲁棒）
let token = '';
{
  // 主账号确保存在（新库/重复运行鲁棒：已存在时注册返回"用户名已存在"忽略）
  const r0 = await api.post(`${base}/api/register`, { data: { username: USER, password: PASS } });
  const b0 = await okJson(r0);
  if (b0.body?.code !== 200) log(`主账号预注册: ${b0.body?.msg || b0.status}（已存在则忽略）`);
  const r = await api.post(`${base}/api/login`, { data: { username: USER, password: PASS } });
  const { body } = await okJson(r);
  eq('login code', body?.code, 200);
  token = body?.data?.token;
  eq('login token', typeof token === 'string' && token.length > 20, true);
  eq('userInfo username', body?.data?.userInfo?.username, USER);
}
const authHdr = { authorization: token };
{
  const r1 = await api.get(`${base}/api/user/pullWT`, { headers: authHdr });
  const { body: b1 } = await okJson(r1);
  const baseTs = Number(b1?.data?.timestamp) || 0;
  const stored = b1?.data?.data || null;

  const ts1 = Math.max(Date.now(), baseTs + 1);
  // 含 cards:[] 以便每次运行清空 cards 行表，保证本用例可重复运行
  const data1 = { home: { a: 1 }, card: { items: [] }, cards: [] };
  const r2 = await api.post(`${base}/api/user/push`, {
    headers: authHdr,
    data: { data: data1, timestamp: ts1, baseTimestamp: baseTs },
  });
  const { body: b2 } = await okJson(r2);
  eq('push first ts >= ts1', typeof b2?.data?.timestamp === 'number' && b2.data.timestamp >= ts1, true);

  // 数据上限：超大快照被拒绝（P0-4）
  const rBig = await api.post(`${base}/api/user/push`, {
    headers: authHdr,
    data: { data: { blob: 'x'.repeat(300000) }, timestamp: ts1 + 5, baseTimestamp: 0 },
  });
  const { body: bBig } = await okJson(rBig);
  eq('push 超大数据被拒', bBig?.code, 400);

  // D7：体积按 UTF-8 字节计——100000 个中文≈300KB 字节（>256KB），但字符数仅约 10 万，不得绕过上限
  const rBigMb = await api.post(`${base}/api/user/push`, {
    headers: authHdr,
    data: { data: { blob: '中'.repeat(100000) }, timestamp: ts1 + 6, baseTimestamp: 0 },
  });
  const { body: bBigMb } = await okJson(rBigMb);
  eq('push 多字节超限被拒(按字节)', bBigMb?.code, 400);

  // 冲突：baseTimestamp 取一个肯定小于已存的数
  const r3 = await api.post(`${base}/api/user/push`, {
    headers: authHdr,
    data: { data: { ...data1, home: { a: 2 } }, timestamp: ts1 - 10, baseTimestamp: 1 },
  });
  eq('conflict http', r3.status(), 409);
  const b3 = await r3.json();
  eq('conflict code', b3?.code, 409);
  eq('conflict msg', b3?.msg, '云端数据已更新');

  const r4 = await api.get(`${base}/api/user/pullWT`, { headers: authHdr });
  const { body: b4 } = await okJson(r4);
  eq('pull data matches', b4?.data?.data, data1);
  eq('pull ts >= ts1', typeof b4?.data?.timestamp === 'number' && b4.data.timestamp >= ts1, true);

  // 仅打印残留信息便于排查
  if (stored) log(`(注：首次 pullWT 有残留数据 ${JSON.stringify(stored).slice(0, 80)})`);
}

// 3.5 个性分享：setShare + getShareData 联动（R6 新增端点）
{
  const bad = await api.post(`${base}/api/user/setShare`, { headers: authHdr, data: { enabled: 2 } });
  eq('setShare 非法参数被拒', (await bad.json())?.code, 400);

  const off = await api.post(`${base}/api/user/setShare`, { headers: authHdr, data: { enabled: 0 } });
  const bOff = await off.json();
  eq('setShare off code', bOff?.code, 200);
  const shareId = bOff?.data?.shareId;
  eq('setShare 返回 shareId', typeof shareId === 'string' && shareId.length > 10, true);

  const rStopped = await api.get(`${base}/api/getShareData?path=${shareId}`);
  eq('share off → data 2', (await rStopped.json())?.data, 2);

  // 分享最小投影（D2）：推一份含私有字段的快照，验证只回卡片+背景色，不泄露 memos/私有 settings
  const SECRET_SETTING = 'SHARE_SECRET_TITLE';
  const SECRET_MEMO = 'SHARE_SECRET_MEMO';
  const shareCards = [{ id: 'sh1', title: '分享卡', subTitle: '', url: 'https://share.example.com' }];
  const baseTs2 = Number((await okJson(await api.get(`${base}/api/user/pullWT`, { headers: authHdr })))?.body?.data?.timestamp) || 0;
  const pushShare = await api.post(`${base}/api/user/push`, {
    headers: authHdr,
    data: {
      data: { settings: { color: '#123456', tabTitle: SECRET_SETTING }, cards: shareCards, memos: { sh1: SECRET_MEMO } },
      timestamp: Date.now(),
      baseTimestamp: baseTs2,
    },
  });
  const pushShareBody = (await okJson(pushShare))?.body;
  eq('分享快照推送成功', pushShareBody?.code, 200);

  const on = await api.post(`${base}/api/user/setShare`, { headers: authHdr, data: { enabled: 1 } });
  eq('setShare on code', (await on.json())?.code, 200);

  const rOk = await api.get(`${base}/api/getShareData?path=${shareId}`);
  const sd = (await rOk.json())?.data?.shareData || {};
  eq('share 返回卡片投影', sd?.cards?.[0]?.id, 'sh1');
  eq('share 返回背景色', sd?.settings?.color, '#123456');
  eq('share 不泄露 memos', sd?.memos === undefined, true);
  eq('share 不泄露私有 settings', sd?.settings?.tabTitle === undefined, true);

  // 自清洁：cards:[] 整表重建清空 cards 表，保证本用例可重复运行（不影响后续断言）
  await api.post(`${base}/api/user/push`, {
    headers: authHdr,
    data: { data: { home: { a: 1 }, card: { items: [] }, cards: [] }, timestamp: Number(pushShareBody?.data?.timestamp) + 1, baseTimestamp: Number(pushShareBody?.data?.timestamp) || 0 },
  });

  const rInvalid = await api.get(`${base}/api/getShareData?path=no_such_user_xyz`);
  eq('share 无效路径 → null', (await rInvalid.json())?.data, null);

  // 还原关闭态：后续「未开启分享返回 2」断言依赖此前置
  await api.post(`${base}/api/user/setShare`, { headers: authHdr, data: { enabled: 0 } });
}

// 4. isAdmin（管理员放行）
{
  let r = await api.get(`${base}/api/user/isAdmin`, { headers: authHdr });
  let { body } = await okJson(r);
  if (body?.data !== true) {
    // 本地库自举：主账号提权为管理员（仅 --local；远端库的管理员由运维提权）
    try {
      const { execSync } = await import('node:child_process');
      const safeUser = USER.replace(/['"\\]/g, '');
      execSync(
        `npx wrangler d1 execute cloudflare-tab-db --local --command "update users set user_type = 1 where username = '${safeUser}'"`,
        { stdio: 'pipe', cwd: process.cwd() }
      );
      r = await api.get(`${base}/api/user/isAdmin`, { headers: authHdr });
      ({ body } = await okJson(r));
    } catch (e) {
      log(`admin 自举失败: ${String(e).slice(0, 80)}`);
    }
  }
  eq('isAdmin code', body?.code, 200);
  eq('isAdmin data', body?.data, true);
}

// 5. 改密码 round-trip
{
  const r1 = await api.post(`${base}/api/user/changePassword`, {
    headers: authHdr,
    data: { oldPassword: PASS, newPassword: 'tmp654321', confirmPassword: 'tmp654321' },
  });
  const { body: b1 } = await okJson(r1);
  eq('changePwd ok', b1?.code, 200);
  const r2 = await api.post(`${base}/api/login`, { data: { username: USER, password: 'tmp654321' } });
  const { body: b2 } = await okJson(r2);
  eq('login new pwd', b2?.code, 200);
  const token2 = b2?.data?.token;
  await api.post(`${base}/api/user/changePassword`, {
    headers: { authorization: token2 },
    data: { oldPassword: 'tmp654321', newPassword: PASS, confirmPassword: PASS },
  });
}

// 6. getWebsiteInfo（上游 uapis 预检：不可用时跳过断言并标注，避免验证链假红）
{
  const r = await api.post(`${base}/api/tools/getWebsiteInfo`, { data: { url: 'https://example.com' } });
  const { body } = await okJson(r);
  eq('getWebsiteInfo code', body?.code, 200);
  const upstreamOk = typeof body?.data?.title === 'string' && body.data.title.length > 0;
  if (!upstreamOk) {
    skip('getWebsiteInfo title/icon（uapis 上游不可用）');
  } else {
    eq('getWebsiteInfo title', body?.data?.title, 'Example Domain');
    eq('getWebsiteInfo icon 由 uapis 解析为字符串', typeof body?.data?.icon === 'string' && body.data.icon.length > 0, true);
  }
}

// 6.5 挂件接口（游客可调，公共数据）
{
  const r1 = await api.get(`${base}/api/getCityList`);
  const { body: b1 } = await okJson(r1);
  eq('cityList code', b1?.code, 200);
  const hasBeijing = Array.isArray(b1?.data) && b1.data.some((c) => c?.label === '北京' && c?.value === 'beijing');
  eq('cityList 含北京{label,value}', hasBeijing, true);

  const r2 = await api.get(`${base}/api/getWeather?city=beijing`);
  const { body: b2 } = await okJson(r2);
  const w = b2?.data?.data?.weather;
  const weatherOk = b2?.code === 200 && !!w;
  if (!weatherOk) {
    skip('weather 全组（外部天气源不可用）');
  } else {
    eq('weather 双层 data.data', b2?.code === 200 && !!w, true);
    eq('weather city', b2?.data?.data?.city, '北京');
    eq('weather temp 为字符串', typeof w?.current_temperature === 'string', true);
    eq('weather icon 为字符串(防0丢失)', typeof w?.weather_icon_id === 'string', true);
    eq('weather forecast>=1', Array.isArray(w?.forecast_list) && w.forecast_list.length >= 1, true);
    eq('weather hourly>=1', Array.isArray(w?.hourly_forecast) && w.hourly_forecast.length >= 1, true);
  }

  for (const type of ['weibo', 'douyin']) {
    const r = await api.get(`${base}/api/getHotEvents?type=${type}`);
    const { body } = await okJson(r);
    eq(`hot[${type}] code200+数组`, body?.code === 200 && Array.isArray(body?.data), true);
    if (Array.isArray(body?.data) && body.data.length) {
      const item = body.data[0];
      eq(`hot[${type}] 条目含 title/url`, typeof item?.title === 'string' && !!item?.url, true);
    } else log(`(注：hot[${type}] 为空，源可能不可达，容忍)`);
  }

  const r3 = await api.get(`${base}/api/yiyan?types=a,b`);
  const { body: b3 } = await okJson(r3);
  eq('yiyan code200', b3?.code, 200);
  eq('yiyan content 非空', typeof b3?.data?.content === 'string' && b3.data.content.length > 0, true);

  // 前端实际为 POST（body 带 types），需保证 POST 也 200（修复 404）
  const r3p = await api.post(`${base}/api/yiyan`, { data: { types: ['a', 'b'] } });
  const { body: b3p } = await okJson(r3p);
  eq('yiyan POST code200', b3p?.code, 200);
  eq('yiyan POST content 非空', typeof b3p?.data?.content === 'string' && b3p.data.content.length > 0, true);

  const r4 = await api.get(`${base}/api/exchange-rate`);
  const { body: b4 } = await okJson(r4);
  const rates = b4?.data?.rates || {};
  eq('fx CNY=1', rates.CNY, 1);
  const need = ['USD', 'EUR', 'GBP', 'JPY', 'HKD', 'AUD', 'CAD', 'CHF', 'NZD'];
  eq('fx 币种齐全', need.every((c) => typeof rates[c] === 'number' && rates[c] > 0), true);
}

// 7. UI 登录流程
{
  const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleErrs = [];
  page.on('pageerror', (e) => consoleErrs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });

  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // 图标默认头像：未登录时右上角头像应为 /favicon.ico
  eq('默认头像使用 /favicon.ico', await page.locator('button[aria-label="用户入口"] img[src="/favicon.ico"]').count(), 1);

  // D3：iconColor/color 不得在信任边界被净化丢弃（本地写路径往返）
  page.on('dialog', (d) => d.accept());
  await page.evaluate(() => {
    localStorage.setItem('persist:cards', JSON.stringify([
      { id: 'd3a', title: 'D3A', subTitle: '', url: 'https://d3a.example.com' },
      { id: 'd3b', title: 'D3B', subTitle: '', url: 'https://d3b.example.com', iconColor: '#ff0000', color: '#00ff00' },
    ]));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  // 右键删除 D3A（触发 setCards→saveCards 写路径），保留带字段的 D3B
  await page.locator('[data-card-id="d3a"]').click({ button: 'right' });
  await page.waitForTimeout(400);
  await page.locator('[role="menu"] [role="menuitem"]', { hasText: '删除此卡片' }).click();
  await page.waitForTimeout(600);
  const d3kept = await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem('persist:cards') || '[]');
    return list.find((c) => c.id === 'd3b') || null;
  });
  eq('D3 写路径保留 iconColor/color', !!d3kept && d3kept.iconColor === '#ff0000' && d3kept.color === '#00ff00', true);

  // D6：非法卡片 type 在信任边界收敛为 'link'，合法挂件类型保留（写路径往返）
  await page.evaluate(() => {
    localStorage.setItem('persist:cards', JSON.stringify([
      { id: 'd6a', title: 'D6A', subTitle: '', url: 'https://d6a.example.com', type: 'evilWidget' },
      { id: 'd6b', title: 'D6B', subTitle: '', url: 'https://d6b.example.com', type: 'calendar' },
      { id: 'd6c', title: 'D6C', subTitle: '', url: 'https://d6c.example.com' },
    ]));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  // 删除 D6C 触发出一次写路径，保留 D6A/D6B
  await page.locator('[data-card-id="d6c"]').click({ button: 'right' });
  await page.waitForTimeout(400);
  await page.locator('[role="menu"] [role="menuitem"]', { hasText: '删除此卡片' }).click();
  await page.waitForTimeout(600);
  const d6types = await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem('persist:cards') || '[]');
    return Object.fromEntries(list.map((c) => [c.id, c.type]));
  });
  eq('D6 非法 type 收敛为 link', d6types.d6a, 'link');
  eq('D6 合法挂件 type 保留', d6types.d6b, 'calendar');

  // D11：iframe src 加固（仅 http(s)；同源不放宽沙箱）+ 记事本即时落盘
  await page.evaluate(() => {
    localStorage.setItem('persist:cards', JSON.stringify([
      { id: 'd11bad', title: 'BAD', subTitle: '', url: '', type: 'iframe', config: JSON.stringify({ src: 'javascript:alert(1)' }) },
      { id: 'd11same', title: 'SAME', subTitle: '', url: '', type: 'iframe', config: JSON.stringify({ src: '/robots.txt' }) },
      { id: 'd11memo', title: 'Memo', subTitle: '', url: '', type: 'memo' },
    ]));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  eq('D11 iframe 非 http(s) 不渲染', await page.locator('[data-card-id="d11bad"] iframe').count(), 0);
  const sameSandbox = await page.locator('[data-card-id="d11same"] iframe').getAttribute('sandbox');
  eq('D11 同源 iframe 不放宽 allow-same-origin', (sameSandbox || '').includes('allow-same-origin'), false);
  await page.locator('[data-card-id="d11memo"] textarea').fill('即时落盘');
  await page.waitForTimeout(120);
  eq('D11 记事本即时落盘', await page.evaluate(() => localStorage.getItem('persist:memo:d11memo')), '即时落盘');

  // 关闭可能出现的公告通知弹层，避免遮挡头像
  const notifClose = page.locator('.ant-notification-notice-close, .ant-notification-close-icon').first();
  if (await notifClose.count()) {
    await notifClose.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }
  await page.locator('button[aria-label="用户入口"]').first().click();
  await page.waitForTimeout(1200);
  // 头像直接滑出抽屉（下拉弹窗已删），未登录默认落在个人中心登录面板
  await page.waitForTimeout(500);
  await page.locator('#login-form_username').fill(USER);
  await page.locator('#login-form_password').fill(PASS);
  const [loginResp] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/login') && r.request().method() === 'POST', { timeout: 10000 }),
    page.getByRole('button', { name: '登 录' }).click(),
  ]);
  eq('UI login http', loginResp.status(), 200);
  await page.waitForTimeout(1500);

  // D8：memos-only 拉取不得残留 skipAuto 而误吞后续用户改动的自动推送
  // 0) 等登录触发的自动推送（2s 防抖）落定，否则它会把本地 settings/cards 推上云，破坏后续前提
  await page.waitForTimeout(2600);
  // 1) 造一份「仅 memos + cards:[]」云快照（无 settings → 拉取不改动本地 settings/cards；cards:[] 清空行表）
  const d8base = Number((await okJson(await api.get(`${base}/api/user/pullWT`, { headers: { authorization: token } })))?.body?.data?.timestamp) || 0;
  const d8seed = await api.post(`${base}/api/user/push`, {
    headers: { authorization: token },
    data: { data: { memos: { d8: 'x' }, cards: [] }, timestamp: Date.now(), baseTimestamp: d8base },
  });
  eq('D8 造 memos 快照', (await okJson(d8seed))?.body?.code, 200);
  // 2) 抽屉内切「数据同步」→ 点击「拉取云端」（markSkip=true 的 pull 路径）
  await page.locator('.ant-drawer .ant-menu-item', { hasText: '数据同步' }).click();
  await page.waitForTimeout(500);
  await page.locator('.ant-drawer button', { hasText: '拉取云端' }).click();
  await page.waitForTimeout(1200);
  // 3) 切「主界面」切换开关（触发用户改动）→ 新实现应自动推送；旧实现因 skipAuto 残留被吞
  await page.locator('.ant-drawer .ant-menu-item', { hasText: '主界面' }).click();
  await page.waitForTimeout(400);
  const d8pushReq = page.waitForRequest((r) => r.url().endsWith('/api/user/push') && r.method() === 'POST', { timeout: 6000 });
  await page.locator('.ant-drawer .ant-switch').last().click();
  const d8pushed = await d8pushReq.then(() => true).catch(() => false);
  eq('D8 拉取后用户改动仍触发自动推送', d8pushed, true);

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('persist:user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  });
  const tok = JSON.parse(stored?.token || '""');
  eq('UI token persisted', typeof tok === 'string' && tok.length > 20, true);
  eq('UI no console errors', consoleErrs.length, 0);
  await page.screenshot({ path: '/tmp/gotab-after-login.png' });
  await browser.close();
}

// 7.5 公告与默认主页（token=admin）
{
  // 普通用户无权限
  const uname = `n${Date.now() % 1000000}`;
  cleanupUsers.push(uname);
  await api.post(`${base}/api/register`, {
    data: { username: uname, password: 'pass123' },
  });
  const lr = await api.post(`${base}/api/login`, { data: { username: uname, password: 'pass123' } });
  const lj = (await okJson(lr)).body;
  const rn = await api.post(`${base}/api/console/addNotice`, {
    headers: { authorization: lj?.data?.token },
    data: { title: 'x', content: 'y' },
  });
  eq('console 普通用户拒绝', (await okJson(rn)).body?.code, 403);
  const ia = await api.get(`${base}/api/user/isAdmin`, { headers: { authorization: lj?.data?.token } });
  eq('isAdmin 普通用户拒绝', (await okJson(ia)).body?.code, 403);

  // 发布公告（待确认）→ 确认 → 首页可见 → 编辑 → 删除
  const a1 = await api.post(`${base}/api/console/addNotice`, {
    headers: { authorization: token },
    data: { title: '公告标题', content: '公告内容' },
  });
  eq('addNotice code', (await okJson(a1)).body?.code, 200);
  const l1 = await api.get(`${base}/api/console/getNoticeList`, { headers: { authorization: token } });
  const l1b = (await okJson(l1)).body;
  const noticeId = l1b?.data?.list?.[0]?.id;
  eq('getNoticeList 有记录且带 id', typeof noticeId === 'string', true);
  const c1 = await api.post(`${base}/api/console/confirmNotice`, {
    headers: { authorization: token },
    data: { id: noticeId },
  });
  eq('confirmNotice code', (await okJson(c1)).body?.code, 200);
  const g1 = await api.get(`${base}/api/getNotice`);
  const g1b = (await okJson(g1)).body;
  eq('getNotice 返回最新公告', !!g1b?.data?.title && !!g1b?.data?.content, true);
  const e1 = await api.post(`${base}/api/console/editNotice`, {
    headers: { authorization: token },
    data: { id: noticeId, title: '公告标题2', content: '内容2' },
  });
  eq('editNotice code', (await okJson(e1)).body?.code, 200);
  const d1 = await api.post(`${base}/api/console/deleteNotice`, {
    headers: { authorization: token },
    data: { id: noticeId },
  });
  eq('deleteNotice code', (await okJson(d1)).body?.code, 200);

  // 默认主页
  const payload = { home: { showMode: 'wallpaper' }, card: { listData: [] } };
  const s1 = await api.post(`${base}/api/console/setDefaultData`, {
    headers: { authorization: token },
    data: { data: payload },
  });
  eq('setDefaultData code', (await okJson(s1)).body?.code, 200);
  const t1 = await api.get(`${base}/api/getDefaultDataTime`);
  const t1b = (await okJson(t1)).body;
  eq('getDefaultDataTime 非空 ISO', typeof t1b?.data === 'string' && t1b.data.length > 0, true);
  const gd = await api.get(`${base}/api/getDefaultData`);
  const gdb = (await okJson(gd)).body;
  eq('getDefaultData 回读一致', JSON.stringify(gdb?.data?.data), JSON.stringify(payload));
  eq('getDefaultData 含 created_at', typeof gdb?.data?.created_at === 'string', true);

  // 用户管理（列表/新增/删除）
  const ul = await api.get(`${base}/api/console/getAwaitingApprovalUserAppellationList`, {
    headers: { authorization: token },
  });
  const ulb = (await okJson(ul)).body;
  eq('用户列表非空且含字段', Array.isArray(ulb?.data?.list) && ulb.data.list.length >= 1 && typeof ulb.data.list[0]?.username === 'string', true);
  const cu = `cu${Date.now() % 1000000}`;
  const cu1 = await api.post(`${base}/api/console/addUser`, {
    headers: { authorization: token },
    data: { username: cu, password: 'pass123', nickname: '后台创建', sex: 0 },
  });
  eq('addUser code', (await okJson(cu1)).body?.code, 200);
  const cuList = await api.get(`${base}/api/console/getAwaitingApprovalUserAppellationList?username=${cu}`, {
    headers: { authorization: token },
  });
  const cuRow = (await okJson(cuList)).body?.data?.list?.[0];
  eq('addUser 列表可见', cuRow?.username === cu && cuRow?.userType === 0, true);
  const st = await api.post(`${base}/api/console/setUserType`, {
    headers: { authorization: token },
    data: { userId: cuRow?.id, type: 1 },
  });
  eq('setUserType 设管理员', (await okJson(st)).body?.code, 200);
  const du = await api.post(`${base}/api/console/deleteUser`, {
    headers: { authorization: token },
    data: { userId: cuRow?.id },
  });
  eq('deleteUser code', (await okJson(du)).body?.code, 200);
  // 默认主页历史列表
  const dhl = await api.get(`${base}/api/console/getDefaultDataList`, { headers: { authorization: token } });
  const dhlb = (await okJson(dhl)).body;
  eq('默认主页历史列表≥1', Array.isArray(dhlb?.data?.list) && dhlb.data.list.length >= 1, true);

  // D1：清理历史应「保留最新」，而非删除最新（旧实现方向相反）
  const tagOf = (r) => { try { return JSON.parse(r.data)?.home?.tag; } catch { return null; } };
  await api.post(`${base}/api/console/setDefaultData`, {
    headers: { authorization: token },
    data: { data: { home: { tag: 'KEEP-NEWEST', cards: [] } } },
  });
  const clr = await api.post(`${base}/api/console/clearDefaultData`, { headers: { authorization: token }, data: {} });
  eq('clearDefaultData code', (await okJson(clr)).body?.code, 200);
  const kept = await api.get(`${base}/api/console/getDefaultDataList?page=1&pageSize=100`, { headers: { authorization: token } });
  const keptTags = ((await okJson(kept)).body?.data?.list || []).map(tagOf);
  eq('清理历史保留最新快照', keptTags.includes('KEEP-NEWEST'), true);
  eq('清理历史后条数≤10', keptTags.length <= 10, true);
}

// 7.6 搜索联想(同源 JSONP)与只读分享页
{
  // API：搜索联想
  const sg = await api.get(`${base}/api/search-suggest?wd=react&cb=cb123`);
  const sgText = await sg.text();
  const sgOk = sg.status() === 200 && sgText.startsWith('cb123(') && sgText.includes('"q"');
  eq('search-suggest JSONP', sgOk, true);
  // 产物已同源化：主 bundle 内不再直连百度 sugrec（新版入口为 index-*.js，静态 import main-*.js）
  {
    const r = await api.get(`${base}/`);
    const html = await r.text();
    const m =
      html.match(/src="(\/assets\/main-[^"]+\.js)"/) ||
      html.match(/src="(\/assets\/index-[^"]+\.js)"/) ||
      html.match(/href="(\/assets\/main-[^"]+\.js)"/);
    if (!m) failures.push('entry asset not found');
    else {
      let entry = await (await api.get(base + m[1])).text();
      // 若入口是 index chunk，跟随其静态 import 找到 main chunk 再校验
      if (!entry.includes('/api/search-suggest?wd=')) {
        const im = entry.match(/main-[A-Za-z0-9._-]+\.js/);
        if (im) entry = await (await api.get(base + '/assets/' + im[0])).text();
      }
      eq('main 已改用 /api/search-suggest', entry.includes('/api/search-suggest?wd='), true);
      eq('main 不含百度直连', !entry.includes('baidu.com/sugrec'), true);
    }
  }
  // 分享页：getShareData(管理员 username 或 share_id) 返回其云数据
  const sh1 = await api.get(`${base}/api/getShareData?path=${encodeURIComponent(USER)}`);
  const sh1b = (await okJson(sh1)).body;
  eq('getShareData 未开启分享返回 2', sh1b?.data, 2);
  const sh2 = await api.get(`${base}/api/getShareData?path=ghost_not_exist`);
  const sh2b = (await okJson(sh2)).body;
  eq('getShareData 未知返回 null', sh2b?.data === null, true);
}

// 7.7 站点配置端点（后台功能开关页依赖，原缺失返回 404）
{
  const r = await api.get(`${base}/api/getSiteConfig`);
  const { status, body } = await okJson(r);
  eq('getSiteConfig http 200', status, 200);
  eq('getSiteConfig code', body?.code, 200);
  eq('getSiteConfig 含 siteConfig', !!body?.data?.siteConfig, true);
  eq('getSiteConfig uploadWallpaper=close', body?.data?.siteConfig?.uploadWallpaper, 'close');
  eq('getSiteConfig cardPush=close', body?.data?.siteConfig?.cardPush, 'close');
}

// 8. 清理测试注册的普通用户（管理员删除）
for (const uname of cleanupUsers) {
  try {
    const r = await api.get(`${base}/api/console/getAwaitingApprovalUserAppellationList?username=${uname}`, {
      headers: { authorization: token },
    });
    const row = (await okJson(r)).body?.data?.list?.[0];
    if (row?.id) {
      await api.post(`${base}/api/console/deleteUser`, {
        headers: { authorization: token },
        data: { userId: row.id },
      });
      log(`cleanup user ${uname}`);
    }
  } catch {
    /* 忽略清理失败 */
  }
}

await api.dispose();
if (skipped.length) console.log(`\nSKIPPED: ${skipped.length} ${skipped.join(', ')}`);
console.log(failures.length === 0 ? '\nALL PASSED' : `\nFAILURES: ${failures.length} ${failures.join(', ')}`);
process.exit(failures.length === 0 ? 0 : 1);
