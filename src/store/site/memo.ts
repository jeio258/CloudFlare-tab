// 记事本内容随快照云同步：push 收集、pull 还原；快照无 memos 字段时本地不动（向后兼容）
import { keysWithPrefix, memoKey, readText, STORAGE_KEYS, writeText } from '../../lib/storage';

export function collectMemos(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keysWithPrefix(STORAGE_KEYS.memoPrefix)) {
    out[k.slice(STORAGE_KEYS.memoPrefix.length)] = readText(k);
  }
  return out;
}

export function restoreMemos(memos: Record<string, string>) {
  for (const [id, text] of Object.entries(memos)) writeText(memoKey(id), text);
  window.dispatchEvent(new CustomEvent('cftab:memos-restored'));
}
