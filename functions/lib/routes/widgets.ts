// 挂件路由：天气 / 热榜 / 汇率 / 一言 / 城市 / 搜索联想 / 网站信息
import { ApiError } from '../core';
import type { RouteContext } from '../core';
import { fetchJson, UA } from '../upstream';
import { weatherOf, hotEvents, exchangeRates, yiyan, cityOptions, normalizeCityInput } from '../widgets';

export const getCityList = async () => cityOptions;

export const getWeather = async ({ request }: RouteContext) => {
  const url = new URL(request.url);
  const city = (url.searchParams.get('city') || '').trim();
  let name = city ? normalizeCityInput(city) : '';
  if (!name) {
    const cf = (request as unknown as { cf?: { city?: string } }).cf;
    name = normalizeCityInput(String(cf?.city || '')) || 'beijing';
  }
  try {
    // 契约：前端按 data.data 读取天气对象（外层为统一响应包装，故此处再包一层）
    return { data: await weatherOf(name) };
  } catch {
    throw new ApiError(500, '天气服务暂不可用');
  }
};

export const getHotEvents = async ({ request }: RouteContext) => {
  const url = new URL(request.url);
  const type = (url.searchParams.get('type') || 'weibo').trim();
  return await hotEvents(type);
};

export const getExchangeRate = async () => ({ rates: await exchangeRates() });

export const getYiyan = async () => await yiyan();

// 搜索联想：百度 sugrec 的 JSONP 同源代理（免 CORS，cb 白名单过滤）
export const searchSuggest = async ({ request }: RouteContext) => {
  const url = new URL(request.url);
  const wd = (url.searchParams.get('wd') || '').trim();
  const cb = (url.searchParams.get('cb') || 'cb').replace(/[^A-Za-z0-9_$.]/g, '');
  let g: Array<{ q: string }> = [];
  if (wd) {
    try {
      const j = (await fetchJson(
        `https://www.baidu.com/sugrec?prod=pc&from=pc_web&wd=${encodeURIComponent(wd)}`,
        { headers: { 'user-agent': UA, referer: 'https://www.baidu.com/' } }
      )) as { g?: Array<{ q?: string }> };
      if (Array.isArray(j?.g)) {
        g = j.g.map((x) => ({ q: String(x?.q || '') })).filter((x) => x.q);
      }
    } catch {
      /* 联想失败返回空 */
    }
  }
  return new Response(`${cb}(${JSON.stringify({ g })})`, {
    headers: { 'content-type': 'application/javascript;charset=utf-8', 'cache-control': 'no-store' },
  });
};

// 网站信息抓取：uapis 元数据解析；icon 空时由前端 fallback 至 faviconsnap 直链
export const getWebsiteInfo = async ({ body }: RouteContext) => {
  const raw = String(body.url || '').trim();
  if (!raw) return { title: '', icon: '', description: '' };
  try {
    const j = (await fetchJson(`https://uapis.cn/api/v1/webparse/metadata?url=${encodeURIComponent(raw)}`)) as {
      title?: string;
      description?: string;
      favicon_url?: string;
    };
    return {
      title: String(j?.title || '').trim(),
      icon: String(j?.favicon_url || '').trim(),
      description: String(j?.description || '').trim(),
    };
  } catch {
    return { title: '', icon: '', description: '' };
  }
};

// 图标代理（同源）：客户端只连本站域名，由边缘去取图标，避免第三方域（国内常不可达/慢、
// 且第三方 Cookie/加载失败会拖累 Lighthouse 的 performance 与 best-practices）。
// 优先取 64px 小图（体积小、足够 55px 显示），失败退回大图源；长缓存 + 边缘缓存。
const HOST_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export const getIcon = async ({ request }: RouteContext): Promise<Response> => {
  const url = new URL(request.url);
  const host = (url.searchParams.get('host') || '').trim().toLowerCase();
  const fallback = new Response(null, {
    status: 302,
    headers: { location: '/favicon.ico', 'cache-control': 'public, max-age=3600' },
  });
  if (host.length > 253 || !HOST_RE.test(host)) return fallback;

  const cacheKey = new Request(`https://cloudflare-tab-cache.local/icon/${host}`);
  try {
    const hit = await caches.default.match(cacheKey);
    if (hit) return hit;
  } catch {
    /* 忽略缓存异常 */
  }

  const sources = [
    `https://www.google.com/s2/favicons?sz=64&domain=${host}`,
    `https://icon.horse/icon/${host}`,
  ];
  for (const src of sources) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const resp = await fetch(src, { headers: { 'user-agent': UA }, redirect: 'follow', signal: ctrl.signal });
      const ct = resp.headers.get('content-type') || '';
      const buf = resp.ok && ct.startsWith('image/') ? await resp.arrayBuffer() : null;
      if (!buf || !buf.byteLength) continue;
      const out = new Response(buf, {
        status: 200,
        headers: {
          'content-type': ct,
          'cache-control': 'public, max-age=2592000, immutable',
          'x-content-type-options': 'nosniff',
        },
      });
      try {
        await caches.default.put(cacheKey, out.clone());
      } catch {
        /* 忽略缓存写入失败 */
      }
      return out;
    } catch {
      /* 超时/不可达：尝试下一个源 */
    } finally {
      clearTimeout(timer);
    }
  }
  return fallback;
};
