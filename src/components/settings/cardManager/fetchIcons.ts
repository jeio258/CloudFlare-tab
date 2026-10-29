// 卡片管理共用：favicon 批量抓取（并发 2，失败静默保持默认图标）
import { fetchSiteInfoWithFavicon } from '../../../lib/siteInfo';

export async function fetchIconsBatch(targets: { id: string; url: string }[], apply: (id: string, icon: string) => void) {
  const queue = [...targets];
  const worker = async () => {
    while (queue.length) {
      const c = queue.shift()!;
      try {
        const info = await fetchSiteInfoWithFavicon(c.url);
        if (info?.icon) apply(c.id, info.icon);
      } catch {
        /* 单个失败保持默认图标 */
      }
    }
  };
  await Promise.all([worker(), worker()]);
}
