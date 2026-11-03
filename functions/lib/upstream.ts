// 上游代理基础设施：UA 注入 + 超时 + Cache API TTL 缓存
const enc = new TextEncoder();

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export async function fetchWithTimeout(url: string, init: RequestInit | undefined, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      headers: {
        'user-agent': UA,
        ...(init?.headers || {}),
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
  } catch (e) {
    console.error(`[widgets] fetch failed ${url}: ${(e as Error)?.message || String(e)}`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(url: string, init?: RequestInit, timeoutMs = 12000): Promise<unknown> {
  const resp = await fetchWithTimeout(url, init, timeoutMs);
  if (!resp.ok) throw new Error(`http ${resp.status}`);
  return await resp.json();
}

// 只读响应体前 maxBytes 字节后即取消流，避免大 HTML 整体下载
export async function readBodyPrefix(resp: Response, maxBytes: number): Promise<string> {
  const reader = resp.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.length;
    if (size >= maxBytes) {
      await reader.cancel().catch(() => {});
      break;
    }
  }
  const merged = new Uint8Array(size);
  let off = 0;
  for (const c of chunks) {
    merged.set(c, off);
    off += c.length;
  }
  return new TextDecoder('utf-8').decode(merged);
}

// Cache API + 应用层 TTL 的 JSON 缓存
export async function cachedJson<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const req = new Request(`https://cloudflare-tab-cache.local/${encodeURIComponent(key)}`);
  try {
    const hit = await caches.default.match(req);
    if (hit) {
      const j = (await hit.json()) as { t: number; data: T };
      if (Date.now() - j.t < ttlMs) return j.data;
    }
  } catch {
    /* 忽略缓存异常 */
  }
  const data = await fetcher();
  try {
    const body = enc.encode(JSON.stringify({ t: Date.now(), data }));
    await caches.default.put(req, new Response(body, { headers: { 'content-type': 'application/json' } }));
  } catch {
    /* 忽略缓存写入失败 */
  }
  return data;
}
