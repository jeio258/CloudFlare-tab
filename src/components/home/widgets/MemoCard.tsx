import { useEffect, useState } from 'react';
import type { CompProps } from './types';
import { memoKey, readText, writeText } from '../../../lib/storage';

export function MemoCard({ id, compact }: CompProps) {
  const key = memoKey(id);
  const [text, setText] = useState(() => readText(key));
  // 变更即落盘：备忘文本体量小，直接写；原 400ms 防抖会在组件卸载时 clearTimeout 而丢掉最后输入
  useEffect(() => {
    writeText(key, text);
  }, [text, key]);
  // 云同步拉取覆盖本地后刷新显示
  useEffect(() => {
    const refresh = () => setText(readText(key));
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
