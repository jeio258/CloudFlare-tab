// 网站信息+图标抓取：标题/描述取 getWebsiteInfo；图标统一用尺寸可控源（防小图被放大）
import { post } from '../api/client';

export interface SiteInfo {
  title: string;
  icon: string;
  description: string;
}

// 图标源一：icon.horse，稳定返回 ≥96px（避免显示 55px 时被放大触发 Lighthouse image-size-responsive）
function iconHorseUrl(url: string): string {
  try {
    return `https://icon.horse/icon/${new URL(url).hostname}`;
  } catch {
    return '';
  }
}

// 图标源二（兜底）：faviconsnap 直链
function faviconSnapUrl(url: string): string {
  try {
    return `https://faviconsnap.com/api/favicon?url=${encodeURIComponent(new URL(url).origin)}`;
  } catch {
    return '';
  }
}

// 抓取网站信息：标题/描述取上游；icon 统一改为尺寸可控源，保证卡片显示（≤55px）不被放大
export async function fetchSiteInfoWithFavicon(url: string): Promise<SiteInfo | null> {
  let info: SiteInfo | null = null;
  try {
    const resp = await post<SiteInfo>('/api/tools/getWebsiteInfo', { url });
    if (resp.code === 200 && resp.data) info = resp.data;
  } catch {
    /* 上游失败走兜底 */
  }
  if (!info) info = { title: '', icon: '', description: '' };
  info.icon = iconHorseUrl(url) || faviconSnapUrl(url) || info.icon;
  return info;
}
