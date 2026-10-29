// 访问历史写入：本站内点击卡片/链接后追加一条，最多保留 20 条（A10 历史记录数据源）
import { STORAGE_KEYS, readJSON, writeJSON } from '../../../lib/storage';

const MAX_VISITS = 20;

interface VisitRecord {
  url: string;
  title: string;
  at: number;
}

export function pushVisit(url: string, title: string): void {
  const list = readJSON<VisitRecord[]>(STORAGE_KEYS.visitHistory, []);
  // readJSON 只保证可解析，不保证是数组：本地数据可被外部污染，非数组一律不写
  if (!Array.isArray(list)) return;
  list.unshift({ url, title, at: Date.now() });
  writeJSON(STORAGE_KEYS.visitHistory, list.slice(0, MAX_VISITS));
}
