// API 客户端：契约对齐参考（HTTP 200 + {code,msg,data}；业务错误按 code 判断）
export interface ApiResp<T> {
  code: number;
  msg: string;
  data: T | null;
}

// 扩展离线壳：页面运行在 chrome-extension:// 下，相对路径 /api 会指向扩展自身，
// 由构建注入的 apibase.js 设置 __GOTAB_API_BASE__ 指向线上域名；网页端为空，行为不变。
const API_BASE = (globalThis as { __GOTAB_API_BASE__?: string }).__GOTAB_API_BASE__?.replace(/\/+$/, '') || '';

const read = async <T>(resp: Response): Promise<ApiResp<T>> => {
  const j = (await resp.json().catch(() => null)) as ApiResp<T> | null;
  if (!j) return { code: 500, msg: `http ${resp.status}`, data: null };
  return j;
};

export async function api<T>(path: string, init?: RequestInit): Promise<ApiResp<T>> {
  try {
    const resp = await fetch(API_BASE + path, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    });
    return await read<T>(resp);
  } catch {
    return { code: -1, msg: '网络异常', data: null };
  }
}

export const get = <T>(path: string, init?: RequestInit) => api<T>(path, init);
export const post = <T>(path: string, body: unknown, token?: string) =>
  api<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: token ? { authorization: token } : undefined,
  });
