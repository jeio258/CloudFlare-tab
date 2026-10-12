// API 分发核心（Pages 薄壳与 Workers 入口共用）：/api/* 路由表在此定义
// 规则：未匹配路径 → {code:404,msg:'接口不存在'}；业务错误 → HTTP 200 + code（409 等除外）
import { defineHandler, fail } from './core';
import type { Env } from './core';
import type { HandlerOptions } from './core';
import * as authRoutes from './routes/auth';
import * as consoleRoutes from './routes/console';
import * as contentRoutes from './routes/content';
import * as widgetRoutes from './routes/widgets';

type RouteDef = { path: string; methods: string[]; opts: HandlerOptions };

// 路由表：方法 + 路径 → 处理器选项（auth/body 由 defineHandler 统一处理）
const ROUTES: RouteDef[] = [
  // 认证与账号
  { path: '/api/login', methods: ['POST'], opts: { body: true, run: authRoutes.login } },
  { path: '/api/register', methods: ['POST'], opts: { body: true, msg: '注册成功，请登录', run: authRoutes.register } },
  { path: '/api/findPassword', methods: ['POST'], opts: { body: true, msg: '密码已重置，请登录', run: authRoutes.findPassword } },

  // user 子路由
  { path: '/api/user/getUserInfo', methods: ['GET'], opts: { auth: 'user', run: authRoutes.getUserInfo } },
  { path: '/api/user/logout', methods: ['GET'], opts: { run: authRoutes.logout } },
  { path: '/api/user/isAdmin', methods: ['GET'], opts: { auth: 'user', run: authRoutes.isAdmin } },
  { path: '/api/user/changePassword', methods: ['POST'], opts: { auth: 'user', body: true, run: authRoutes.changePassword } },
  { path: '/api/user/editUserInfo', methods: ['POST'], opts: { auth: 'user', body: true, run: authRoutes.editUserInfo } },
  { path: '/api/user/push', methods: ['POST'], opts: { auth: 'user', body: true, run: authRoutes.push } },
  { path: '/api/user/pullWT', methods: ['GET'], opts: { auth: 'user', run: authRoutes.pullWT } },
  { path: '/api/user/setShare', methods: ['POST'], opts: { auth: 'user', body: true, run: authRoutes.setShare } },

  // 公开内容
  { path: '/api/getSiteConfig', methods: ['GET'], opts: { run: contentRoutes.getSiteConfig } },
  { path: '/api/getNotice', methods: ['GET'], opts: { run: contentRoutes.getNotice } },
  { path: '/api/getDefaultData', methods: ['GET'], opts: { run: contentRoutes.getDefaultData } },
  { path: '/api/getDefaultDataTime', methods: ['GET'], opts: { run: contentRoutes.getDefaultDataTime } },
  { path: '/api/getShareData', methods: ['GET', 'POST'], opts: { body: 'optional', run: contentRoutes.getShareData } },

  // 挂件
  { path: '/api/getCityList', methods: ['GET'], opts: { run: widgetRoutes.getCityList } },
  { path: '/api/getWeather', methods: ['GET'], opts: { run: widgetRoutes.getWeather } },
  { path: '/api/getHotEvents', methods: ['GET'], opts: { run: widgetRoutes.getHotEvents } },
  { path: '/api/exchange-rate', methods: ['GET'], opts: { run: widgetRoutes.getExchangeRate } },
  { path: '/api/yiyan', methods: ['GET', 'POST'], opts: { run: widgetRoutes.getYiyan } },
  { path: '/api/search-suggest', methods: ['GET'], opts: { run: widgetRoutes.searchSuggest } },
  { path: '/api/tools/getWebsiteInfo', methods: ['POST'], opts: { body: 'optional', run: widgetRoutes.getWebsiteInfo } },

  // 管理后台
  { path: '/api/console/dashboard', methods: ['GET'], opts: { auth: 'admin', run: consoleRoutes.dashboard } },
  { path: '/api/console/addUser', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '用户已创建', run: consoleRoutes.addUser } },
  { path: '/api/console/setUserType', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '已更新', run: consoleRoutes.setUserType } },
  { path: '/api/console/enableUser', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '已启用', run: consoleRoutes.enableUser } },
  { path: '/api/console/disableUser', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '用户已禁用', run: consoleRoutes.disableUser } },
  { path: '/api/console/deleteUser', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '用户已删除', run: consoleRoutes.deleteUser } },
  { path: '/api/console/getAwaitingApprovalUserAppellationList', methods: ['GET', 'POST'], opts: { auth: 'admin', run: consoleRoutes.listUsers } },
  { path: '/api/console/addNotice', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '公告已创建，请确认发布', run: consoleRoutes.addNotice } },
  { path: '/api/console/editNotice', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '公告已更新', run: consoleRoutes.editNotice } },
  { path: '/api/console/deleteNotice', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '公告已删除', run: consoleRoutes.deleteNotice } },
  { path: '/api/console/confirmNotice', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '公告已发布', run: consoleRoutes.confirmNotice } },
  { path: '/api/console/rejectNotice', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '已驳回删除', run: consoleRoutes.rejectNotice } },
  { path: '/api/console/getNoticeList', methods: ['GET', 'POST'], opts: { auth: 'admin', run: consoleRoutes.listNotices } },
  { path: '/api/console/setDefaultData', methods: ['POST'], opts: { auth: 'admin', body: true, msg: '已保存为默认主页', run: consoleRoutes.setDefaultData } },
  { path: '/api/console/getDefaultDataList', methods: ['GET', 'POST'], opts: { auth: 'admin', run: consoleRoutes.listDefaultData } },
  { path: '/api/console/enableDefaultData', methods: ['POST'], opts: { auth: 'admin', body: true, run: consoleRoutes.enableDefaultData } },
  { path: '/api/console/disableDefaultData', methods: ['POST'], opts: { auth: 'admin', body: true, run: consoleRoutes.disableDefaultData } },
  { path: '/api/console/deleteDefaultData', methods: ['POST'], opts: { auth: 'admin', body: true, run: consoleRoutes.deleteDefaultData } },
  { path: '/api/console/clearDefaultData', methods: ['POST'], opts: { auth: 'admin', body: true, run: consoleRoutes.clearDefaultData } },
];

// 方法匹配：路由表方法为空即所有方法放行
export function dispatch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  for (const r of ROUTES) {
    if (r.path === url.pathname && (r.methods.length === 0 || r.methods.includes(method))) {
      return defineHandler(r.opts)({ request, env });
    }
  }
  // 未实现接口统一兜底：HTTP 200 + code 404，前端按业务错误静默降级
  return Promise.resolve(fail(404, '接口不存在'));
}
