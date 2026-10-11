// 挂件数据：天气 / 热榜 / 汇率 / 一言 / 城市表（服务端代理 + 缓存 + 静态兜底）
import { cachedJson, fetchJson } from './upstream';
import { ICON_BY_CODE, HOT_TYPES, FX_CODES, FX_FALLBACK, SAY_FALLBACK, CITIES } from './widgetsData';

// ===== 天气 =====

// 天气文本 -> 图标 id（逐时/预报上游返回文字）
function iconByText(text: string): string {
  const t = String(text || '');
  if (/雷阵雨|雷电|雷/.test(t)) return '4';
  if (/冻雨/.test(t)) return '19';
  if (/雨夹雪/.test(t)) return '6';
  if (/阵雪/.test(t)) return '13';
  if (/暴雪/.test(t)) return '16';
  if (/大雪/.test(t)) return '16';
  if (/中雪/.test(t)) return '15';
  if (/小雪/.test(t)) return '14';
  if (/雪/.test(t)) return '14';
  if (/暴雨/.test(t)) return '10';
  if (/大雨/.test(t)) return '9';
  if (/中雨/.test(t)) return '8';
  if (/阵雨/.test(t)) return '3';
  if (/雨/.test(t)) return '7';
  if (/雾/.test(t)) return '18';
  if (/霾/.test(t)) return '29';
  if (/阴/.test(t)) return '2';
  if (/多云/.test(t)) return '1';
  if (/晴/.test(t)) return '0';
  return '1';
}

const fmtTemp = (v: unknown): string => {
  const n = Number(v);
  return Number.isFinite(n) ? `${Math.round(n)}°` : '';
};

interface UWeather {
  city?: string;
  weather?: string;
  weather_icon?: string;
  temperature?: string | number;
  wind_direction?: string;
  wind_power?: string;
  report_time?: string;
  temp_max?: string | number;
  temp_min?: string | number;
  forecast?: Array<{ date?: string; temp_max?: string | number; temp_min?: string | number; weather_day?: string; weather_night?: string }>;
  hourly_forecast?: Array<{ time?: string; temperature?: string | number; weather?: string }>;
}

export async function weatherOf(city: string) {
  const url = `https://uapis.cn/api/v1/misc/weather?city=${encodeURIComponent(city)}&forecast=true&hourly=true`;
  const w = await cachedJson<UWeather>(`weather:${city}`, 10 * 60_000, () => fetchJson(url) as Promise<UWeather>);
  return build(w, city);
}

function build(w: UWeather, city: string) {
  const name = w.city || city;
  const curIcon = ICON_BY_CODE[String(w.weather_icon || '')] || iconByText(w.weather || '');

  const forecast_list = (w.forecast || []).slice(0, 7).map((d) => ({
    date: d.date || '',
    high_temperature: fmtTemp(d.temp_max),
    low_temperature: fmtTemp(d.temp_min),
    weather_icon_id: iconByText(d.weather_day || ''),
    condition: d.weather_day || d.weather_night || '',
  }));
  const hourly_forecast = (w.hourly_forecast || []).slice(0, 24).map((h) => ({
    hour: Number(String(h.time || '').slice(11, 13) || 0),
    temperature: fmtTemp(h.temperature),
    weather_icon_id: iconByText(h.weather || ''),
  }));

  const today = forecast_list[0];
  const tomorrow = forecast_list[1];
  const todayDay = w.forecast?.[0]?.weather_day || '';
  const todayNight = w.forecast?.[0]?.weather_night || '';

  return {
    city: name,
    weather: {
      city: name,
      current_temperature: fmtTemp(w.temperature),
      current_condition: w.weather || '',
      weather_icon_id: curIcon,
      aqi: '',
      quality_level: '',
      wind_direction: w.wind_direction || '',
      wind_level: w.wind_power || '',
      update_time: w.report_time || '',
      tips: '',
      tomorrow_condition: tomorrow ? tomorrow.condition : '',
      tomorrow_high_temperature: tomorrow ? tomorrow.high_temperature : '',
      tomorrow_low_temperature: tomorrow ? tomorrow.low_temperature : '',
      high_temperature: today ? today.high_temperature : fmtTemp(w.temp_max),
      low_temperature: today ? today.low_temperature : fmtTemp(w.temp_min),
      day_condition: todayDay || w.weather || '',
      night_condition: todayNight || w.weather || '',
      // 契约：字段名沿用前端读取口径（day→dat 为历史拼写，勿改）
      dat_high_temperature: today ? today.high_temperature : '',
      dat_low_temperature: today ? today.low_temperature : '',
      forecast_list,
      hourly_forecast,
    },
  };
}

// ===== 热榜 =====
interface HotItem {
  title: string;
  url: string;
  hot?: string;
}
interface UHotItem {
  index?: number;
  title?: string;
  url?: string;
  hot_value?: string | number;
  extra?: unknown;
}

async function fetchBoard(type: string): Promise<HotItem[]> {
  const j = (await fetchJson(`https://uapis.cn/api/v1/misc/hotboard?type=${type}`)) as { list?: UHotItem[] };
  const list = j?.list;
  if (!Array.isArray(list)) return [];
  return list
    .map((it) => ({
      title: String(it.title || ''),
      url: String(it.url || ''),
      hot: it.hot_value != null ? String(it.hot_value) : '',
    }))
    .filter((x) => x.title && x.url);
}

export async function hotEvents(type: string): Promise<HotItem[]> {
  if (!HOT_TYPES.has(type)) return [];
  try {
    return await cachedJson(`hot:${type}`, 5 * 60_000, () => fetchBoard(type));
  } catch {
    return [];
  }
}

// ===== 汇率 =====
export async function exchangeRates() {
  return cachedJson<Record<string, number>>('fx', 10 * 60_000, async () => {
    try {
      const j = (await fetchJson(`https://api.frankfurter.app/latest?from=CNY&to=${FX_CODES.join(',')}`)) as {
        rates?: Record<string, number>;
      };
      const out: Record<string, number> = { CNY: 1 };
      for (const code of FX_CODES) {
        const v = j?.rates?.[code];
        out[code] = v && v > 0 ? Math.round((1 / v) * 1e6) / 1e6 : FX_FALLBACK[code];
      }
      return out;
    } catch {
      return { ...FX_FALLBACK };
    }
  });
}

// ===== 一言 =====
const pick = () => SAY_FALLBACK[Math.floor(Math.random() * SAY_FALLBACK.length)];

export async function yiyan(): Promise<string> {
  try {
    const j = (await fetchJson('https://uapis.cn/api/v1/saying/random')) as {
      content?: string;
      item?: { content?: string };
    };
    return j?.content || j?.item?.content || pick();
  } catch {
    return pick();
  }
}

// ===== 城市表 =====
export const cityOptions = CITIES.map(({ label, value }) => ({ label, value }));

// 城市名归一化：cf.city 为英文（如 "New York"），转小写去空格后匹配城市表 value
export function normalizeCityInput(raw: string): string {
  const v = raw.trim().toLowerCase().replace(/\s+/g, '');
  return CITIES.find((c) => c.value === v)?.value || raw;
}
