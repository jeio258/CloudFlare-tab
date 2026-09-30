// A7 卡片组件族 + A8 挂件卡片化：通过 HomeCard.type + config(JSON) 挂载为可添加卡片
// A8 挂件卡（对齐参考 addComponent 清单）：天气/热点榜单/实时汇率/一言/历史记录/书签管理/设置中心/伪装助手
import { useEffect, useRef, useState } from 'react';
import { useFetch, useLocalStoragePoll } from '../../lib/hooks';
import { useSite } from '../../store/site';
import { openUrl } from './SearchBar';

type CompProps = { id: string; config: Record<string, unknown>; compact: boolean };
interface WidgetCtx {
  openCards: () => void;   // 书签管理 → 卡片管理抽屉
  openSettings: () => void; // 设置中心 → 抽屉主界面
}
let widgetCtx: WidgetCtx = { openCards: () => undefined, openSettings: () => undefined };
export function setWidgetCtx(ctx: WidgetCtx) {
  widgetCtx = ctx;
}

// —— A8：天气（紧凑） ——
function WeatherMini() {
  const { settings } = useSite();
  const { data, err } = useFetch<{ data: { weather: { city: string; current_temperature: string; current_condition: string; weather_icon_id: string } } }>(
    `/api/getWeather?city=${encodeURIComponent(settings.weatherCity || 'beijing')}`
  );
  const w = data?.data?.weather;
  if (err) return <div className="text-center text-[10px] text-gray-400">天气失败</div>;
  if (!w) return <div className="text-center text-[10px] text-gray-400">加载中…</div>;
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 px-2">
      <img src={`/images/w${w.weather_icon_id}.png`} alt="" className="h-8 w-8 object-contain" />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[10px] text-gray-500">{w.city}</div>
        <div className="text-xs font-semibold text-ink">
          {w.current_temperature} {w.current_condition}
        </div>
      </div>
    </div>
  );
}

// —— A8：热点榜单（紧凑前 3 条） ——
function HotMini() {
  const { data, err } = useFetch<{ hot: { title: string; url: string }[] } | { title: string; url: string }[]>('/api/getHotEvents?type=weibo');
  const list = (Array.isArray(data) ? data : data?.hot || []).slice(0, 3) as { title: string; url: string }[];
  if (err) return <div className="text-center text-[10px] text-gray-400">热榜失败</div>;
  if (list.length === 0) return <div className="text-center text-[10px] text-gray-400">加载中…</div>;
  return (
    <div className="h-full w-full overflow-hidden px-1.5 py-0.5 text-[9px] leading-[1.5]">
      {list.map((it, i) => (
        <a key={i} href={it.url} target="_blank" rel="noreferrer" className="flex gap-1 truncate hover:underline">
          <span className={`shrink-0 font-semibold ${i === 0 ? 'text-red-500' : 'text-gray-400'}`}>{i + 1}</span>
          <span className="truncate">{it.title}</span>
        </a>
      ))}
    </div>
  );
}

// —— A8：实时汇率（紧凑前 3 币种） ——
function FxMini() {
  const { data, err } = useFetch<{ rates: Record<string, number> }>('/api/exchange-rate');
  const rates = data?.rates || {};
  const top = ['USD', 'EUR', 'JPY'].filter((c) => rates[c] > 0);
  if (err) return <div className="text-center text-[10px] text-gray-400">汇率失败</div>;
  if (top.length === 0) return <div className="text-center text-[10px] text-gray-400">加载中…</div>;
  return (
    <div className="flex h-full w-full items-center justify-around px-1">
      {top.map((c) => (
        <div key={c} className="flex items-center gap-1">
          <img src={`/images/${c}.png`} alt="" className="h-4 w-4 rounded-full" />
          <div className="leading-tight">
            <div className="text-[8px] text-gray-500">{c}</div>
            <div className="text-[10px] font-semibold text-ink">{rates[c]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// —— A8：历史记录（紧凑前 3 条） ——
function HistoryMini() {
  const list = useLocalStoragePoll<{ url: string; title: string }>('persist:visitHistory', 3000).slice(0, 3);
  if (list.length === 0) return <div className="text-center text-[10px] text-gray-400">暂无历史</div>;
  return (
    <div className="h-full w-full overflow-hidden px-1.5 py-0.5 text-[9px] leading-[1.5]">
      {list.map((v, i) => (
        <button key={i} type="button" onClick={() => openUrl(v.url, 'newtab')} className="block w-full truncate text-left hover:underline">
          {v.title || v.url}
        </button>
      ))}
    </div>
  );
}

// —— A8：动作卡（书签管理/设置中心/伪装助手） ——
function ActionMini({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-full w-full flex-col items-center justify-center gap-0.5">
      <img src={icon} alt="" className="h-6 w-6 object-contain" />
      <span className="text-[10px] font-medium text-ink">{label}</span>
    </button>
  );
}

// —— 倒数日 ——
function CountdownCard({ config }: CompProps) {
  const target = String(config.date || '');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const d = new Date(target);
  if (!target || isNaN(d.getTime())) return <div className="text-center text-[10px] text-gray-400">未设置日期</div>;
  const diff = Math.max(0, d.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center leading-tight">
      <div className="max-w-full truncate px-1 text-[10px] text-gray-500">{String(config.title || target)}</div>
      <div className="font-bold text-ink">
        {days > 0 ? `${days} 天` : `${hours}:${pad(mins)}:${pad(secs)}`}
      </div>
      {days > 0 && <div className="text-[10px] text-gray-400">{`${hours}:${pad(mins)}:${pad(secs)}`}</div>}
    </div>
  );
}

// —— 聚合倒数日 ——
function CountdownAggCard({ config }: CompProps) {
  const [now] = useState(() => Date.now());
  const items = Array.isArray(config.items) ? (config.items as { title?: string; date?: string }[]) : [];
  if (items.length === 0) return <div className="text-center text-[10px] text-gray-400">未配置</div>;
  return (
    <div className="h-full w-full overflow-hidden px-1 py-0.5 text-[9px] leading-[1.4]">
      {items.slice(0, 4).map((it, i) => {
        const d = new Date(String(it.date || ''));
        const days = isNaN(d.getTime()) ? '-' : Math.ceil((d.getTime() - now) / 86400000);
        return (
          <div key={i} className="flex justify-between gap-1">
            <span className="truncate">{it.title || it.date}</span>
            <span className="shrink-0 font-semibold text-ink">{days}天</span>
          </div>
        );
      })}
    </div>
  );
}

// —— 记事本 ——
function MemoCard({ id, compact }: CompProps) {
  const key = `persist:memo:${id}`;
  const [text, setText] = useState(() => localStorage.getItem(key) || '');
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(key, text), 400);
    return () => clearTimeout(t);
  }, [text, key]);
  // 云同步拉取覆盖本地后刷新显示
  useEffect(() => {
    const refresh = () => setText(localStorage.getItem(key) || '');
    window.addEventListener('cftab:memos-restored', refresh);
    return () => window.removeEventListener('cftab:memos-restored', refresh);
  }, [key]);
  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="记一笔…"
      className="h-full w-full resize-none bg-transparent px-1 text-[10px] leading-tight text-ink outline-none placeholder:text-gray-300"
      rows={compact ? 2 : 3}
    />
  );
}

// —— 表盘时钟 ——
function AnalogClockCard() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => {
      const cv = ref.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const s = cv.width;
      const c = s / 2;
      ctx.clearRect(0, 0, s, s);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c, c, c - 2, 0, Math.PI * 2);
      ctx.stroke();
      const now = new Date();
      const hand = (angle: number, len: number, width: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.lineTo(c + len * Math.sin(angle), c - len * Math.cos(angle));
        ctx.stroke();
      };
      const h = ((now.getHours() % 12) + now.getMinutes() / 60) * ((Math.PI * 2) / 12);
      const m = (now.getMinutes() + now.getSeconds() / 60) * ((Math.PI * 2) / 60);
      const sec = now.getSeconds() * ((Math.PI * 2) / 60);
      hand(h, c * 0.45, 2, '#333');
      hand(m, c * 0.65, 1.5, '#666');
      hand(sec, c * 0.75, 0.8, '#de0f17');
    };
    draw();
    const t = setInterval(draw, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex h-full w-full items-center justify-center">
      <canvas ref={ref} width={56} height={56} />
    </div>
  );
}

// —— 数字时钟 ——
function DigitalClockCard() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex h-full w-full items-center justify-center font-bold text-ink" style={{ fontFamily: 'Roboto, arial, sans-serif', fontSize: 15 }}>
      {`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`}
    </div>
  );
}

// —— 日历 ——
function CalendarCard({ compact }: CompProps) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  if (compact) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center leading-tight">
        <div className="text-[9px] text-gray-500">{m + 1}月</div>
        <div className="text-base font-bold text-ink">{now.getDate()}</div>
      </div>
    );
  }
  return (
    <div className="h-full w-full px-1 py-0.5 text-[8px] leading-[1.35]">
      <div className="text-center font-semibold text-ink">{y}/{m + 1}</div>
      <div className="grid grid-cols-7 text-center text-gray-400">
        {'日一二三四五六'.split('').map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className="grid grid-cols-7 text-center">
        {Array.from({ length: first + days }, (_, i) => {
          const d = i - first + 1;
          return <span key={i} className={d === now.getDate() ? 'font-bold text-[#4e6ef2]' : 'text-ink'}>{d > 0 ? d : ''}</span>;
        })}
      </div>
    </div>
  );
}

// —— 内嵌框架 ——
function IframeCard({ config, compact }: CompProps) {
  const src = String(config.src || '');
  if (!src) return <div className="text-center text-[10px] text-gray-400">未设置地址</div>;
  return (
    <iframe
      src={src}
      title="内嵌框架"
      className="h-full w-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      style={{ pointerEvents: compact ? 'none' : 'auto' }}
    />
  );
}

// —— 人民币大写转换 ——
const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const UNITS = ['', '拾', '佰', '仟'];
const BIGUNITS = ['', '万', '亿'];

function rmbUpper(num: number): string {
  if (!isFinite(num) || num < 0) return '';
  if (num === 0) return '零元整';
  let n = Math.floor(num * 100 + 0.5);
  const jiao = Math.floor(n / 10) % 10;
  const fen = n % 10;
  n = Math.floor(n / 100);
  let int = '';
  let sectionIdx = 0;
  if (n === 0) int = '';
  else {
    while (n > 0) {
      const section = n % 10000;
      if (section > 0) {
        let s = '';
        let z = section;
        let u = 0;
        let zero = false;
        while (z > 0) {
          const d = z % 10;
          if (d === 0) {
            zero = true;
          } else {
            if (zero) s = DIGITS[0] + s;
            zero = false;
            s = DIGITS[d] + UNITS[u] + s;
          }
          z = Math.floor(z / 10);
          u += 1;
        }
        int = s + BIGUNITS[sectionIdx] + (n % 10000 > 0 && section < 1000 ? DIGITS[0] : '') + int;
      } else if (int) {
        int = DIGITS[0] + int;
      }
      n = Math.floor(n / 10000);
      sectionIdx += 1;
    }
    int += '元';
  }
  const dec = jiao === 0 && fen === 0 ? '整' : `${jiao > 0 ? DIGITS[jiao] + '角' : int ? '零' : ''}${fen > 0 ? DIGITS[fen] + '分' : ''}`;
  return `${int}${dec}`;
}

function RmbCard({ config }: CompProps) {
  const initial = String(config.amount ?? '');
  const [val, setVal] = useState(initial);
  const num = Number(val);
  return (
    <div className="flex h-full w-full flex-col justify-center gap-0.5 px-1.5">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value.replace(/[^\d.]/g, ''))}
        placeholder="输入金额"
        className="h-5 w-full rounded border border-gray-200 px-1 text-[10px] outline-none"
      />
      <div className="truncate text-[10px] leading-tight text-ink" title={rmbUpper(num)}>
        {val && !isNaN(num) ? rmbUpper(num) : '人民币大写'}
      </div>
    </div>
  );
}

// WidgetType 引用 types.ts 单一来源（与 HomeCard.type 同源，缺 'link'）
export type WidgetType = import('../../api/types').WidgetCardType;

// 对齐参考 addComponent 组件清单（股市行情属 B 类砍，除外）
export const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: 'bookmarks', label: '书签管理' },
  { value: 'history', label: '历史记录' },
  { value: 'settings', label: '设置中心' },
  { value: 'hotEvents', label: '热点榜单' },
  { value: 'weather', label: '天气' },
  { value: 'memo', label: '记事本' },
  { value: 'analogClock', label: '表盘时钟' },
  { value: 'digitalClock', label: '数字时钟' },
  { value: 'calendar', label: '日历' },
  { value: 'countdown', label: '倒数日' },
  { value: 'countdownAgg', label: '聚合倒数日' },
  { value: 'rmbUpper', label: '人民币大写转换' },
  { value: 'exchangeRate', label: '实时汇率' },
  { value: 'disguise', label: '伪装助手' },
  { value: 'iframe', label: '内嵌框架' },
];

export function renderWidget(type: WidgetType, id: string, config: Record<string, unknown>, compact: boolean): React.ReactNode {
  const props = { id, config, compact };
  switch (type) {
    case 'countdown': return <CountdownCard {...props} />;
    case 'countdownAgg': return <CountdownAggCard {...props} />;
    case 'memo': return <MemoCard {...props} />;
    case 'analogClock': return <AnalogClockCard />;
    case 'digitalClock': return <DigitalClockCard />;
    case 'calendar': return <CalendarCard {...props} />;
    case 'iframe': return <IframeCard {...props} />;
    case 'rmbUpper': return <RmbCard {...props} />;
    case 'weather': return <WeatherMini />;
    case 'hotEvents': return <HotMini />;
    case 'exchangeRate': return <FxMini />;
    case 'history': return <HistoryMini />;
    case 'bookmarks': return <ActionMini icon="/icons/logo.svg" label="书签管理" onClick={() => widgetCtx.openCards()} />;
    case 'settings': return <ActionMini icon="/icons/logo.svg" label="设置中心" onClick={() => widgetCtx.openSettings()} />;
    case 'disguise': return <ActionMini icon="/icons/logo.svg" label="伪装助手" onClick={() => window.dispatchEvent(new CustomEvent('cftab:disguise-toggle'))} />;
    default: return null;
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}
