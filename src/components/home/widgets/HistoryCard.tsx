import { useLocalStoragePoll } from '../../../lib/hooks';
import { openUrl } from '../SearchBar';

// 紧凑前 3 条
export function HistoryCard() {
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
