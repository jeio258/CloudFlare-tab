// 站点层持久化门面：设置读写沿用 store/settings 的遗留归一化，卡片与快照净化收敛在此
import type { HomeCard } from '../../api/types';
import { normalizeCards, normalizeSettings } from '../../lib/normalize';
import { readJSON, STORAGE_KEYS, writeJSON } from '../../lib/storage';
import { DEFAULT_SETTINGS } from '../settings';
import type { SiteSettings } from '../settings';

export { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../settings';

// 内置默认卡片：对齐参考默认主页（同文案；链接/图标本地化）；首页末位另渲染「添加卡片」方块
export const DEFAULT_CARDS: HomeCard[] = [
  { id: 'welcome', title: '欢迎使用', subTitle: '官方网站', url: 'https://github.com/jeio258/CloudFlare-tab', icon: '/icons/ref-welcome.svg' },
  { id: 'changelog', title: '版本日志', subTitle: '功能迭代记录', url: 'https://github.com/jeio258/CloudFlare-tab/blob/master/README.md', icon: '/icons/ref-changelog.svg' },
  { id: 'cloud', title: '云服务器', subTitle: '稳定、高性价比', url: 'https://pages.cloudflare.com', icon: '/icons/ref-cloud.svg' },
  { id: 'qq', title: '用户交流群', subTitle: '加入QQ群', url: 'https://github.com/jeio258/CloudFlare-tab', icon: '/icons/ref-qq.svg' },
];

// 读取过信任边界：本地遗留/被污染数据同样收敛，防畸形值致渲染崩溃
export function loadCards(): HomeCard[] | null {
  const raw = readJSON<unknown>(STORAGE_KEYS.cards, null);
  if (raw == null) return null;
  const list = normalizeCards(raw);
  return list.length > 0 ? list : null;
}

export function saveCards(cards: HomeCard[]) {
  writeJSON(STORAGE_KEYS.cards, cards);
}

// 快照/导入共用的唯一净化点：白名单字段由 normalizeSettings 兜底，其余字段按默认值形态逐键校验后放行。
// 不再「先原始合并、再以净化结果覆盖」，调用方只需把返回值与当前 state 合并一次。
export function sanitizeSettings(raw: unknown): Partial<SiteSettings> {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) {
    const v = r[key];
    if (v === undefined) continue;
    const d = DEFAULT_SETTINGS[key];
    if (Array.isArray(d) ? Array.isArray(v) : typeof v === typeof d) out[key] = v;
  }
  return { ...(out as unknown as Partial<SiteSettings>), ...normalizeSettings(raw) };
}
