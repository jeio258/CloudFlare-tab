// 核心：统一响应契约（HTTP 200 + {code,msg,data}）+ 业务错误 + 处理器上下文
import { authUser, requireAdmin } from './guard';

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export interface UserRow {
  id: string;
  username: string;
  password: string;
  nickname: string;
  phone: string;
  avatar: string;
  sex: number;
  birthday: string;
  user_type: number;
  created_at: string;
  status: number;
  share_id: string | null;
  share_enabled: number;
}

export type JsonObject = Record<string, unknown>;

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json;charset=utf-8', 'cache-control': 'no-store' },
  });
}

export const ok = (data: unknown, msg = 'ok') => json(200, { code: 200, msg, data });
export const fail = (code: number, msg: string) => json(200, { code, msg, data: null });

// 业务错误：默认映射为 HTTP 200 + {code,msg}（前端契约）；httpStatus 显式指定时用真实状态码（如 409）
export class ApiError extends Error {
  constructor(
    readonly code: number,
    msg: string,
    readonly httpStatus?: number
  ) {
    super(msg);
    this.name = 'ApiError';
  }
}

export interface RouteContext {
  env: Env;
  request: Request;
  /** auth 校验通过后的当前用户 */
  user: UserRow | null;
  /** auth:'admin' 时的当前管理员 */
  admin: UserRow | null;
  /** body 解析后的请求体 */
  body: JsonObject;
}

export interface HandlerOptions {
  auth?: 'user' | 'admin';
  body?: true | 'optional';
  msg?: string;
  run: (ctx: RouteContext) => unknown;
}

// 统一入口：鉴权 → body 解析 → run → ok 包装；业务错误按契约映射
export function defineHandler(opts: HandlerOptions) {
  return async function handler(context: { request: Request; env: Env }): Promise<Response> {
    try {
      const { env, request } = context;
      let user: UserRow | null = null;
      if (opts.auth) {
        user = opts.auth === 'admin' ? await requireAdmin(env, request) : await authUser(env, request);
        if (!user) {
          return opts.auth === 'admin' ? fail(403, '无权限') : fail(401, '登录已失效');
        }
      }

      let body: JsonObject = {};
      if (opts.body) {
        try {
          const parsed: unknown = await request.json();
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('body 非对象');
          body = parsed as JsonObject;
        } catch {
          if (opts.body === true) return fail(400, '参数错误');
        }
      }

      const result = await opts.run({ env, request, user, admin: opts.auth === 'admin' ? user : null, body });
      if (result instanceof Response) return result;
      return ok(result, opts.msg ?? 'ok');
    } catch (e) {
      if (e instanceof ApiError) {
        return e.httpStatus && e.httpStatus !== 200
          ? json(e.httpStatus, { code: e.code, msg: e.message, data: null })
          : fail(e.code, e.message);
      }
      console.error('[handler] unhandled error:', e);
      return fail(500, '服务器内部错误');
    }
  };
}
