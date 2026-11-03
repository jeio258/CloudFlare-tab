// 挂件路由：天气 / 热榜 / 汇率 / 一言 / 城市 / 搜索联想 / 网站信息
import { ApiError } from '../core';
import type { RouteContext } from '../core';
import { fetchJson, fetchWithTimeout, readBodyPrefix, UA, cachedJson } from '../upstream';
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

// 网站信息抓取：先走 uapis 元数据解析，失败/超时后 Worker 自抓 HTML 兜底；成功结果缓存 24h
const WEBINFO_TTL_MS = 24 * 60 * 60 * 1000;
const WEBINFO_HTML_MAX_BYTES = 200 * 1024;

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

// 规范化：补协议、仅允许 http(s)、去掉 hash，结果同时作为缓存 key
function normalizeTargetUrl(raw: string): string | null {
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

async function upstreamInfo(raw: string): Promise<{ title: string; icon: string; description: string }> {
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
}

async function selfFetchInfo(url: string): Promise<{ title: string; icon: string; description: string }> {
  const resp = await fetchWithTimeout(
    url,
    { headers: { accept: 'text/html,application/xhtml+xml,*/*' } },
    5000
  );
  if (!resp.ok) throw new Error(`http ${resp.status}`);
  const html = await readBodyPrefix(resp, WEBINFO_HTML_MAX_BYTES);
  const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  let description = '';
  const tags = html.match(/<meta\s[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!/(?:name|property)\s*=\s*["']description["']/i.test(tag)) continue;
    const m = /content\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    if (m) {
      description = decodeEntities((m[1] ?? m[2] ?? '').trim());
      break;
    }
  }
  return {
    title: t ? decodeEntities(t[1].replace(/\s+/g, ' ').trim()).slice(0, 300) : '',
    icon: '',
    description: description.slice(0, 500),
  };
}

// icon 不在此生成：前端 siteInfo.ts 一律用 faviconsnap 覆盖 icon 字段
export const getWebsiteInfo = async ({ body }: RouteContext) => {
  const empty = { title: '', icon: '', description: '' };
  const raw = String(body.url || '').trim();
  if (!raw) return empty;
  const target = normalizeTargetUrl(raw);
  if (!target) return empty;
  try {
    // fetcher 抛错时不写缓存，保证瞬时故障下一轮可重试
    return await cachedJson(`webinfo:${target}`, WEBINFO_TTL_MS, async () => {
      try {
        return await upstreamInfo(raw);
      } catch {
        return await selfFetchInfo(target);
      }
    });
  } catch {
    return empty;
  }
};
