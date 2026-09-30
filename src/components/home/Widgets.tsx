// 挂件三件套：实时热榜 / 实时汇率 / 一言（玻璃卡风格对齐 WeatherChip，默认关）
import { useFetch } from '../../lib/hooks';

const CARD = 'w-[300px] rounded-xl bg-white/60 p-3 text-ink shadow-glass backdrop-blur-md';
const TITLE = 'mb-2 flex items-center gap-1.5 text-sm font-semibold';

// ===== 实时热榜 =====
interface HotItem {
  title: string;
  url: string;
  hot?: string;
}

export function HotEventsCard() {
  const { data, err } = useFetch<HotItem[]>('/api/getHotEvents?type=weibo');
  const list = (data || []).slice(0, 10);
  return (
    <div className={CARD}>
      <div className={TITLE}>
        <img src="/icons/hotEvents.svg" alt="" className="h-4 w-4" />
        实时热榜
      </div>
      {list.length > 0 ? (
        <ol className="max-h-64 space-y-1 overflow-y-auto text-xs">
          {list.map((it, i) => (
            <li key={it.title}>
              <a href={it.url} target="_blank" rel="noreferrer" className="flex gap-1.5 rounded px-1 py-0.5 hover:bg-black/5">
                <span className={`w-4 shrink-0 text-center font-semibold ${i < 3 ? 'text-red-500' : 'text-gray-400'}`}>{i + 1}</span>
                <span className="truncate">{it.title}</span>
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <div className="py-4 text-center text-xs text-gray-400">{err ? '热榜加载失败' : '加载中…'}</div>
      )}
    </div>
  );
}

// ===== 实时汇率（1 外币 = rate CNY）=====
const FX = ['USD', 'EUR', 'GBP', 'JPY', 'HKD', 'AUD', 'CAD', 'CHF', 'NZD'];

export function ExchangeRateCard() {
  const { data, err } = useFetch<{ rates: Record<string, number> }>('/api/exchange-rate');
  const rates = data?.rates || {};
  return (
    <div className={CARD}>
      <div className={TITLE}>
        <img src="/icons/exchangeRate.svg" alt="" className="h-4 w-4" />
        实时汇率
      </div>
      {Object.keys(rates).length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {FX.filter((c) => rates[c] > 0).map((c) => (
            <div key={c} className="flex items-center gap-1 rounded bg-white/70 px-1.5 py-1">
              <img src={`/images/${c}.png`} alt="" className="h-4 w-4 rounded-full" />
              <div className="leading-tight">
                <div className="text-[10px] text-gray-500">{c}</div>
                <div className="text-xs font-semibold">{rates[c]}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-gray-400">{err ? '汇率加载失败' : '加载中…'}</div>
      )}
    </div>
  );
}

// ===== 一言（文案对齐参考：一言加载中… / 一言加载失败）=====
export function YiyanCard() {
  const { data, err } = useFetch<{ content: string }>('/api/yiyan');
  const text = data?.content?.trim();
  return (
    <div className={`${CARD} w-[300px]`}>
      <p className="min-h-10 text-sm leading-6">{text || (err ? '一言加载失败' : '一言加载中…')}</p>
      {text && <div className="mt-1 text-right text-xs text-gray-400">—— 一言</div>}
    </div>
  );
}
