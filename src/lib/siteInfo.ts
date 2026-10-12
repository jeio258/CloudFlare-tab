// 网站信息+图标抓取：标题/描述取 getWebsiteInfo；图标一律用 faviconsnap（参考项目口径）
import { post } from '../api/client';

export interface SiteInfo {
  title: string;
  icon: string;
  description: string;
}

// 图标一律默认 faviconsnap：https://faviconsnap.com/api/favicon?url=<域名>
// （用「域名」而非 origin：origin 形式对部分站点返回 HTML，会破图）
function faviconSnapUrl(url: string): string {
  try {
    return `https://faviconsnap.com/api/favicon?url=${encodeURIComponent(new URL(url).hostname)}`;
  } catch {
    return '';
  }
}

// 抓取网站信息：标题/描述取上游；icon 一律用 faviconsnap
export async function fetchSiteInfoWithFavicon(url: string): Promise<SiteInfo | null> {
  let info: SiteInfo | null = null;
  try {
    const resp = await post<SiteInfo>('/api/tools/getWebsiteInfo', { url });
    if (resp.code === 200 && resp.data) info = resp.data;
  } catch {
    /* 上游失败走兜底 */
  }
  if (!info) info = { title: '', icon: '', description: '' };
  info.icon = faviconSnapUrl(url) || info.icon;
  return info;
}
