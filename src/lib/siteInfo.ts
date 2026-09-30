// 网站信息+图标抓取：getWebsiteInfo 为主；icon 为空时前端 fallback 至 faviconsnap 直链
import { post } from '../api/client';

export interface SiteInfo {
  title: string;
  icon: string;
  description: string;
}

// 二次兜底：faviconsnap 服务直链（前端 img 直接引用）
function faviconSnapUrl(url: string): string {
  try {
    return `https://faviconsnap.com/api/favicon?url=${encodeURIComponent(new URL(url).origin)}`;
  } catch {
    return '';
  }
}

// 抓取网站信息：icon 取上游结果，为空时用 faviconsnap 直链兜底
export async function fetchSiteInfoWithFavicon(url: string): Promise<SiteInfo | null> {
  let info: SiteInfo | null = null;
  try {
    const resp = await post<SiteInfo>('/api/tools/getWebsiteInfo', { url });
    if (resp.code === 200 && resp.data) info = resp.data;
  } catch {
    /* 上游失败走兜底 */
  }
  if (!info) info = { title: '', icon: '', description: '' };
  if (!info.icon) {
    const fallback = faviconSnapUrl(url);
    if (fallback) info.icon = fallback;
  }
  return info;
}
