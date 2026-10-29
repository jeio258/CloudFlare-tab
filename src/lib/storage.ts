// 统一持久化原语：集中键名与编解码，业务代码不得再直接访问 localStorage。
export const STORAGE_KEYS = {
  settings: 'persist:settings',
  cards: 'persist:cards',
  user: 'persist:user',
  visitHistory: 'persist:visitHistory',
  searchHistory: 'persist:searchHistory',
  memoPrefix: 'persist:memo:',
} as const;

export const memoKey = (cardId: string) => STORAGE_KEYS.memoPrefix + cardId;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 配额满 / 隐私模式：写入失败不阻断业务 */
  }
}

export function readText(key: string, fallback = ''): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeText(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 同上 */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* 同上 */
  }
}

export function keysWithPrefix(prefix: string): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) out.push(k);
    }
  } catch {
    /* 同上 */
  }
  return out;
}
