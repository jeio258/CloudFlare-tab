// 挂件数据：天气 / 热榜 / 汇率 / 一言 / 城市表（服务端代理 + 缓存 + 静态兜底）
import { cachedJson, fetchJson } from './upstream';

// ===== 天气 =====
// 中国天气网 3 位图标码 -> 项目内置 /images/w{id}.png
const ICON_BY_CODE: Record<string, string> = {
  '100': '0', '101': '1', '102': '1', '103': '1', '104': '2',
  '300': '3', '301': '3', '302': '4', '303': '4', '304': '4',
  '305': '7', '306': '8', '307': '9', '308': '10', '309': '7', '310': '7', '311': '7', '312': '8', '313': '10', '399': '7',
  '400': '14', '401': '15', '402': '16', '403': '16', '404': '6', '405': '6', '406': '14', '407': '15', '408': '16',
  '409': '6', '410': '13', '411': '14', '412': '15', '413': '16', '499': '14',
  '500': '18', '501': '18', '502': '18', '503': '18', '504': '18', '505': '18', '506': '18', '518': '18',
  '507': '29', '508': '29', '509': '29', '510': '29', '511': '29', '512': '29', '513': '29', '514': '29', '515': '29',
  '200': '20', '201': '20', '202': '20', '203': '20', '204': '20', '205': '20', '206': '20',
  '900': '30', '901': '31',
};

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

const HOT_TYPES = new Set(['weibo', 'bilibili', 'baidu', 'douyin']);

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
const FX_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'HKD', 'AUD', 'CAD', 'CHF', 'NZD'];
const FX_FALLBACK: Record<string, number> = {
  CNY: 1, USD: 7.16, EUR: 7.85, GBP: 9.1, JPY: 0.0478, HKD: 0.916,
  AUD: 4.72, CAD: 5.24, CHF: 8.1, NZD: 4.32,
};

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
const SAY_FALLBACK = [
  '花有重开日，人无再少年。',
  '纸上得来终觉浅，绝知此事要躬行。',
  '长风破浪会有时，直挂云帆济沧海。',
  '念念不忘，必有回响。',
  '路虽远，行则将至；事虽难，做则必成。',
];
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
interface City {
  label: string;
  value: string;
  lat: number;
  lon: number;
}

const CITIES: City[] = [
  { label: '北京', value: 'beijing', lat: 39.9042, lon: 116.4074 },
  { label: '上海', value: 'shanghai', lat: 31.2304, lon: 121.4737 },
  { label: '广州', value: 'guangzhou', lat: 23.1291, lon: 113.2644 },
  { label: '深圳', value: 'shenzhen', lat: 22.5431, lon: 114.0579 },
  { label: '杭州', value: 'hangzhou', lat: 30.2741, lon: 120.1551 },
  { label: '成都', value: 'chengdu', lat: 30.5728, lon: 104.0668 },
  { label: '重庆', value: 'chongqing', lat: 29.563, lon: 106.5516 },
  { label: '武汉', value: 'wuhan', lat: 30.5928, lon: 114.3055 },
  { label: '西安', value: 'xian', lat: 34.3416, lon: 108.9398 },
  { label: '南京', value: 'nanjing', lat: 32.0603, lon: 118.7969 },
  { label: '天津', value: 'tianjin', lat: 39.3434, lon: 117.3616 },
  { label: '苏州', value: 'suzhou', lat: 31.2989, lon: 120.5853 },
  { label: '长沙', value: 'changsha', lat: 28.2282, lon: 112.9388 },
  { label: '郑州', value: 'zhengzhou', lat: 34.7466, lon: 113.6254 },
  { label: '青岛', value: 'qingdao', lat: 36.0671, lon: 120.3826 },
  { label: '大连', value: 'dalian', lat: 38.914, lon: 121.6147 },
  { label: '厦门', value: 'xiamen', lat: 24.4798, lon: 118.0894 },
  { label: '福州', value: 'fuzhou', lat: 26.0745, lon: 119.2965 },
  { label: '济南', value: 'jinan', lat: 36.6512, lon: 117.1201 },
  { label: '沈阳', value: 'shenyang', lat: 41.8057, lon: 123.4315 },
  { label: '哈尔滨', value: 'haerbin', lat: 45.8038, lon: 126.5349 },
  { label: '昆明', value: 'kunming', lat: 24.8801, lon: 102.8329 },
  { label: '贵阳', value: 'guiyang', lat: 26.647, lon: 106.6302 },
  { label: '南宁', value: 'nanning', lat: 22.817, lon: 108.3665 },
  { label: '海口', value: 'haikou', lat: 20.044, lon: 110.1999 },
  { label: '兰州', value: 'lanzhou', lat: 36.0611, lon: 103.8343 },
  { label: '乌鲁木齐', value: 'wulumuqi', lat: 43.8256, lon: 87.6168 },
  { label: '石家庄', value: 'shijiazhuang', lat: 38.0428, lon: 114.5149 },
  { label: '合肥', value: 'hefei', lat: 31.8206, lon: 117.2272 },
  { label: '南昌', value: 'nanchang', lat: 28.682, lon: 115.8579 },
  { label: '香港', value: 'hongkong', lat: 22.3193, lon: 114.1694 },
  { label: '澳门', value: 'macao', lat: 22.1987, lon: 113.5439 },
  { label: '台北', value: 'taibei', lat: 25.033, lon: 121.5654 },
  { label: '东京', value: 'tokyo', lat: 35.6762, lon: 139.6503 },
  { label: '首尔', value: 'seoul', lat: 37.5665, lon: 126.978 },
  { label: '新加坡', value: 'singapore', lat: 1.3521, lon: 103.8198 },
  { label: '纽约', value: 'newyork', lat: 40.7128, lon: -74.006 },
  { label: '洛杉矶', value: 'losangeles', lat: 34.0522, lon: -118.2437 },
  { label: '伦敦', value: 'london', lat: 51.5074, lon: -0.1278 },
  { label: '巴黎', value: 'paris', lat: 48.8566, lon: 2.3522 },
  { label: '悉尼', value: 'sydney', lat: -33.8688, lon: 151.2093 },
];

export const cityOptions = CITIES.map(({ label, value }) => ({ label, value }));
export const cityCoord = (value: string): City | undefined =>
  CITIES.find((c) => c.value === value) || CITIES.find((c) => c.label === value);

// 城市名归一化：cf.city 为英文（如 "New York"），转小写去空格后匹配城市表 value
export function normalizeCityInput(raw: string): string {
  const v = raw.trim().toLowerCase().replace(/\s+/g, '');
  return CITIES.find((c) => c.value === v)?.value || raw;
}
