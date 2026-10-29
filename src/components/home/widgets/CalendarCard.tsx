import type { CompProps } from './types';

export function CalendarCard({ compact }: CompProps) {
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
