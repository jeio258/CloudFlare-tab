import { useEffect, useState } from 'react';
import type { CompProps } from './types';

export function CountdownAggCard({ config }: CompProps) {
  const [now, setNow] = useState(() => Date.now());
  // 每 60s 重算：否则 now 为挂载时的惰性值，跨天后天数不更新
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
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
