# CloudFlare-tab

基于 Cloudflare 全家桶构建的浏览器新标签页（起始页）：前端 React + Vite + TypeScript，后端 Cloudflare Pages Functions + D1（SQLite）。开箱即用，支持账号云同步、个性化导航卡片、实用挂件与后台管理。

## 功能特性

- **导航卡片**：添加/编辑/删除卡片，支持分组、批量调整、卡片大小（1x1 ~ 4x2）、展示样式（图标/纯图/纯文本）与拖拽换位；移动端长按唤出操作菜单
- **挂件**：天气（自动定位/城市选择）、实时热榜、实时汇率、记事本（云同步）、日历、倒数日、表盘/数字时钟、历史记录、书签管理、内嵌框架、伪装助手等
- **搜索聚合**：多引擎（内置 + 自定义 `%s` 模板）、搜索联想、本地搜索历史
- **云同步**：设置/卡片/记事本整包快照上传下载，baseTimestamp 增量冲突检测（409），变更自动推送（2s 防抖）
- **个性分享**：一键开启只读分享主页（`/s/分享ID` 或 `/s/用户名`）
- **账号体系**：注册/登录/找回密码，D1 固定窗口限流（IP + 账号双维度）
- **后台管理**：用户管理、公告发布（二次确认）、默认主页配置
- **数据迁移**：备份整包导出/导入（JSON，与云快照同构）、书签 HTML/JSON 导入
- **其他**：简约模式、沉浸模式、壁纸/幻灯片、底部自定义链接、每日本地缓存优化

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 · Vite · TypeScript · Tailwind CSS · Ant Design 5 |
| 后端 | Cloudflare Pages Functions · D1（SQLite） |
| 测试 | Playwright（API + 桌面/移动视口 e2e） |

## 快速开始

```bash
npm install
npm run dev            # 本地开发（wrangler pages dev，D1 本地模拟）
npm run build          # 产物构建至 dist/
npm run test           # API + 桌面 e2e（需本地服务已起）
npm run test:e2e       # 移动视口 e2e（375×812）
```

## 部署

1. 创建 D1 数据库：`npx wrangler d1 create cloudflare-tab-db`
2. 将返回的 `database_id` 填入 `wrangler.toml`（Pages）与 `wrangler.workers.toml`（Workers）
3. 执行迁移：`npm run db:migrate`
4. 两种部署方式二选一（均自动执行 D1 迁移）：

```bash
# 方式一：Cloudflare Pages（原方式）
npm run deploy:pages

# 方式二：Workers（静态资产 + Worker 统一入口）
npm run deploy:workers
```

Workers 模式说明：`/api/*` 由 Worker 分发核心处理（与 Pages 共用 `functions/lib/dispatch.ts`），其余请求由静态资产层响应（SPA 回退）。部署后需设置 Secret：`JWT_SECRET`。

## 目录结构

```
├── src/                 # 前端（页面/组件/store/api client）
├── functions/           # Pages Functions（lib/routes 分层，契约统一）
├── schema.sql           # D1 全量建表（幂等）
├── tests/e2e.mjs        # API + 桌面 e2e
├── tests/e2e-mobile.mjs # 移动视口 e2e
└── wrangler.toml        # Cloudflare 配置
```

## License

[MIT](./LICENSE)
