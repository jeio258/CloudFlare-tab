// 网站信息+图标抓取：标题/描述取 getWebsiteInfo；图标统一存为本站同源代理地址
import { post } from '../api/client';

export interface SiteInfo {
  title: string;
  icon: string;
  description: string;
}

// 图标统一走同源代理 /api/icon?host=<站点域名>：由边缘去第三方取图并长缓存，
// 客户端不再直连境外第三方域（避免不可达/慢/第三方 Cookie，且尺寸可控不放大）
function iconProxyUrl(url: string): string {
  try {
    return `/api/icon?host=${encodeURIComponent(new URL(url).hostname)}`;
  } catch {
    return '';
  }
}

// 抓取网站信息：标题/描述取上游；icon 统一存为同源代理地址
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
