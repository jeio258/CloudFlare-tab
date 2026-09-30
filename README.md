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

### 前置（两种方式通用）

1. 创建 D1 数据库：`npx wrangler d1 create cloudflare-tab-db`
2. 将返回的 `database_id` 填入 `wrangler.toml`（Pages）与 `wrangler.workers.toml`（Workers）
3. 部署后设置 Secret：`JWT_SECRET`（登录令牌签名密钥，≥32 字节）

### 方式一：CLI 手动部署

```bash
# Pages（原方式，不含迁移）
npm run deploy

# Pages / Workers（均自动执行 D1 迁移）
npm run deploy:pages
npm run deploy:workers
```

### 方式二：绑定 GitHub 仓库自动部署（推荐生产）

绑定后每次 `git push` 自动触发 Cloudflare 拉取代码 → 构建 → 迁移 → 部署。

**绑定流程（Cloudflare 控制台）：**

1. **授权 GitHub**：Dashboard → Workers & Pages → Create → 连接 GitHub，安装 Cloudflare GitHub App 并授权 `jeio258/CloudFlare-tab` 仓库（鉴权方式：GitHub App OAuth，只读代码 + 回写 commit status，不动仓库内容）
2. **创建项目（二选一）**：
   - Pages：Create application → Pages → Connect to Git → 选仓库 → 分支 `master`
   - Workers：Create application → Workers → Connect to Git → 选仓库 → 分支 `master`（Workers Builds）
3. **构建设置**：
   - Build command：`npm ci && npm run build:cloud`（构建 + 自动执行 D1 远端迁移）
   - Pages 输出目录：`dist`；Workers：Deploy command 填 `npx wrangler deploy -c wrangler.workers.toml`
   - Root directory：留空（仓库根即项目根）
4. **环境变量/绑定**：D1 绑定 `DB`（database_id 需已回填对应 wrangler 配置）、Secret `JWT_SECRET`
5. Save and Deploy → 首次部署完成

**自动触发机制：**

| 事件 | 行为 |
|---|---|
| push 到生产分支（master） | 自动构建 + 部署到生产环境 |
| push 到其他分支 / 新开 PR | 自动构建 + 部署到预览环境（独立 `*.{project}.pages.dev` 地址，不影响生产） |
| 构建失败 | 保留上一次成功部署，不中断线上服务 |

**约束条件：**

- **GitHub App 授权必须在控制台完成**，无法仅凭 API Token 建立仓库绑定；绑定后可通过 API 查询/调整项目配置
- **D1 迁移依赖幂等**：`schema.sql` 全部 `CREATE TABLE IF NOT EXISTS` / 幂等写入，重复执行安全；迁移随构建执行（`build:cloud`），迁移失败即构建失败并阻断本次部署（线上仍是上一版本）
- **远端 D1 需预先创建**并回填 `database_id`（Pages 与 Workers 配置各一份），否则构建期 `db:migrate` 失败
- **同一 Cloudflare 项目只能选一种运行时**：Pages（`wrangler.toml`）或 Workers（`wrangler.workers.toml`）；切换需重建项目
- **构建额度**：免费版 Pages 每月 500 次构建、单次构建 20 分钟上限
- **Node 版本**：构建环境 ≥18（`.nvmrc` 固定 22）

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
