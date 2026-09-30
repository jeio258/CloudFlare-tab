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

export const getYiyan = async () => ({ content: await yiyan() });

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
