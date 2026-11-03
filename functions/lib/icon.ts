// 图标代理：/api/icon?host=&sz= → Google S2 → DuckDuckGo → 内置默认 SVG 三级回退，Cache API 落地
import type { RouteContext } from './core';
import { corsHeaders } from './core';

// 与 upstream.ts 的 UA 同值；不 import 以免本文件与 upstream 形成交叉依赖
const UPSTREAM_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// 只放行常规域名：拒绝空值/IP（末段须为字母）、内网名、路径与非常规字符，防滥用出站
const HOST_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
const SZ_SET = new Set(['16', '32', '64', '128']);

// 默认图标：圆角灰底 + 线描地球（经线椭圆 + 两条纬线弦），无文字、视觉中性
const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#eef1f5"/>
<circle cx="32" cy="32" r="15" fill="none" stroke="#8b95a5" stroke-width="2.5"/>
<ellipse cx="32" cy="32" rx="6.5" ry="15" fill="none" stroke="#8b95a5" stroke-width="2.5"/>
<path d="M17.9 27h28.2M17.9 37h28.2" stroke="#8b95a5" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>`;

const DEFAULT_SVG_HEADERS = {
  'content-type': 'image/svg+xml',
  'cache-control': 'public, max-age=86400',
  ...corsHeaders,
};

// 5s 超时；仅接受 200，失败返回 null 由调用方走下一级回退
async function fetchIcon(url: string): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const resp = await fetch(url, {
      headers: { 'user-agent': UPSTREAM_UA },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    if (resp.status !== 200) return null;
    return resp;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function icon(ctx: RouteContext): Promise<Response> {
  const url = new URL(ctx.request.url);
  const host = (url.searchParams.get('host') || '').trim();
  const sz = url.searchParams.get('sz') || '64';
  // 参数非法同样回默认 SVG：该接口多作为 <img> src 使用，保持 200 避免前端破图
  if (!HOST_RE.test(host) || !SZ_SET.has(sz)) {
    return new Response(DEFAULT_SVG, { status: 200, headers: DEFAULT_SVG_HEADERS });
  }

  const cacheKey = new Request(ctx.request.url);
  try {
    const hit = await caches.default.match(cacheKey);
    if (hit) return hit;
  } catch {
    /* 缓存读失败按未命中处理 */
  }

  const candidates = [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${sz}`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
  ];
  for (const target of candidates) {
    const resp = await fetchIcon(target);
    if (!resp) continue;
    const headers = {
      'content-type': resp.headers.get('content-type') || 'image/x-icon',
      'cache-control': 'public, max-age=604800',
      ...corsHeaders,
    };
    const out = new Response(resp.body, { status: 200, headers });
    try {
      // body 只能读一次：先 clone 入缓存再返回原响应
      await caches.default.put(cacheKey, out.clone());
    } catch {
      /* 缓存写失败不影响返回 */
    }
    return out;
  }
  return new Response(DEFAULT_SVG, { status: 200, headers: DEFAULT_SVG_HEADERS });
}
