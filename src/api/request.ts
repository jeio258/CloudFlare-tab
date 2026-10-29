// 统一请求层：超时、错误规范化、契约解析。useFetch 与 sync 都基于此，禁止再裸 fetch。
export interface ApiResp<T> {
  code: number;
  msg: string;
  data: T | null;
}

const API_BASE = (globalThis as { __GOTAB_API_BASE__?: string }).__GOTAB_API_BASE__?.replace(/\/+$/, '') || '';
const DEFAULT_TIMEOUT_MS = 15_000;

export async function request<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ApiResp<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(API_BASE + path, {
      ...init,
      signal: controller.signal,
      headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    });
    const json = (await resp.json().catch(() => null)) as ApiResp<T> | null;
    return json ?? { code: 500, msg: `http ${resp.status}`, data: null };
  } catch {
    return { code: -1, msg: '网络异常', data: null };
  } finally {
    clearTimeout(timer);
  }
}

export const get = <T>(path: string, init?: RequestInit) => request<T>(path, init);

export const post = <T>(path: string, body: unknown, token?: string) =>
  request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: token ? { authorization: token } : undefined,
  });
