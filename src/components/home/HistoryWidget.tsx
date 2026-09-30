// 历史记录挂件（A10）：本站内点击过的卡片/搜索，纯本地 localStorage，最多展示 12 条
import { openUrl } from './SearchBar';
import { useSite } from '../../store/site';
import { useLocalStoragePoll } from '../../lib/hooks';

interface Visit {
  url: string;
  title: string;
  at: number;
}

export default function HistoryWidget() {
  const { settings } = useSite();
  const list = useLocalStoragePoll<Visit>('persist:visitHistory', 3000).slice(0, 12);

  if (list.length === 0) return null;
  return (
    <div className="w-72 rounded-xl bg-white/70 p-3 text-ink shadow-glass backdrop-blur-md">
      <div className="mb-1.5 text-xs font-semibold text-gray-500">历史记录</div>
      <div className="max-h-48 space-y-0.5 overflow-y-auto">
        {list.map((v, i) => (
          <button
            key={`${v.url}-${i}`}
            type="button"
            onClick={() => openUrl(v.url, settings.openType)}
            className="block w-full truncate rounded px-1.5 py-1 text-left text-xs transition-colors hover:bg-black/5"
            title={v.title ? `${v.title} · ${v.url}` : v.url}
          >
            {v.title ? `${v.title} · ` : ''}
            {v.url}
          </button>
        ))}
      </div>
    </div>
  );
}
