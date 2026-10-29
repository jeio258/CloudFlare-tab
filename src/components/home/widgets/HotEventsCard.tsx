import { useFetch } from '../../../lib/hooks';

// 紧凑前 3 条
export function HotEventsCard() {
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
