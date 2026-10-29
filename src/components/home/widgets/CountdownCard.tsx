import { useEffect, useState } from 'react';
import type { CompProps } from './types';
import { pad } from './pad';

export function CountdownCard({ config }: CompProps) {
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
