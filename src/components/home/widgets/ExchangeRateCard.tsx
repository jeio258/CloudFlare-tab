import { useFetch } from '../../../lib/hooks';

// 紧凑前 3 币种
export function ExchangeRateCard() {
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
