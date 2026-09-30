// 书签导入解析：浏览器书签导出文件（Netscape HTML / Chrome·Firefox JSON / 通用 JSON 数组）→ 卡片
import { newCardId } from './id';

export interface ImportedCard {
  title: string;
  url: string;
  dup: boolean;
}

const isHttpUrl = (u: string) => /^https?:\/\//i.test(u);
const TITLE_MAX = 50; // 标题上限：面板导入说明已注明，超出自动截断
const cleanTitle = (t: string) => t.replace(/\s+/g, ' ').trim().slice(0, TITLE_MAX);

// Netscape bookmark file: <DT><a href="...">标题</a>（文件夹 <h3> 跳过）
function parseHtml(text: string): ImportedCard[] {
  const out: ImportedCard[] = [];
  const re = /<a[^>]+href\s*=\s*["']([^"'#]+)["'][^>]*>([^<]*)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const url = m[1].trim();
    const title = cleanTitle(m[2]) || new URL(url).hostname;
    if (isHttpUrl(url) && title) out.push({ title, url, dup: false });
  }
  return out;
}

interface BmNode {
  name?: string;
  url?: string;
  title?: string;
  href?: string;
  children?: BmNode[];
}

// JSON：Chrome/Firefox 导出（roots.children 树）或 [{title,url}] 扁平数组
function parseJson(text: string): ImportedCard[] {
  const j: unknown = JSON.parse(text);
  const out: ImportedCard[] = [];
  const walk = (n: BmNode | undefined) => {
    if (!n) return;
    if (n.url && isHttpUrl(n.url) && n.name) out.push({ title: cleanTitle(n.name) || new URL(n.url).hostname, url: n.url, dup: false });
    for (const c of n.children || []) walk(c);
  };
  // Chrome/Firefox 导出：roots 是对象（bookmark_bar/other/mobile 各含 children）
  const obj = j as { roots?: Record<string, { children?: BmNode[] }>; children?: BmNode[] };
  if (Array.isArray(j)) {
    for (const it of j as Array<Partial<ImportedCard> & BmNode>) {
      const url = String(it.url || it.href || '');
      const title = cleanTitle(String(it.title || it.name || ''));
      if (isHttpUrl(url) && title) out.push({ title, url, dup: false });
    }
  } else if (obj?.roots) {
    for (const group of Object.values(obj.roots)) for (const c of group?.children || []) walk(c);
  } else if (Array.isArray(obj?.children)) {
    for (const c of obj.children) walk(c);
  }
  return out;
}

/** 解析书签文件内容 → 卡片；existingUrls 用于去重标记 */
export function parseBookmarkFile(_name: string, text: string, existingUrls: Set<string>): ImportedCard[] {
  let list: ImportedCard[];
  const trimmed = text.trim();
  if (trimmed.startsWith('<') || /<DT>|<A\s/i.test(trimmed)) {
    list = parseHtml(trimmed);
  } else {
    list = parseJson(trimmed);
  }
  const seen = new Set(existingUrls);
  for (const c of list) {
    if (seen.has(c.url)) c.dup = true;
    else seen.add(c.url);
  }
  return list;
}

export const bookmarkToCard = (c: ImportedCard) => ({
  id: newCardId(),
  title: c.title,
  subTitle: '',
  url: c.url,
  icon: '',
});
