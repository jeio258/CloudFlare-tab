// 网站信息+图标抓取：标题/描述取 getWebsiteInfo；图标一律走 /api/icon 自建代理
import { post } from '../api/request';

export interface SiteInfo {
  title: string;
  icon: string;
  description: string;
}

// 图标走自建代理 /api/icon?host=<域名>（host 由后端正则校验，前端不做编码）
function iconProxyUrl(url: string): string {
  try {
    return `/api/icon?host=${new URL(url).hostname}`;
  } catch {
    return '';
  }
}

// 抓取网站信息：标题/描述取上游；icon 一律用 /api/icon 代理
export async function fetchSiteInfoWithFavicon(url: string): Promise<SiteInfo | null> {
  let info: SiteInfo | null = null;
  try {
    const resp = await post<SiteInfo>('/api/tools/getWebsiteInfo', { url });
    if (resp.code === 200 && resp.data) info = resp.data;
  } catch {
    /* 上游失败走兜底 */
  }
  if (!info) info = { title: '', icon: '', description: '' };
  info.icon = iconProxyUrl(url) || info.icon;
  return info;
}
