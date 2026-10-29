import { useState } from 'react';
import type { CompProps } from './types';
import { rmbUpper } from './rmbUpper';

export function RmbUpperCard({ config }: CompProps) {
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
