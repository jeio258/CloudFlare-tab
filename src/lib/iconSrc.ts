// 图标统一到指定图标源 faviconsnap（严格对齐参考项目口径：
// https://faviconsnap.com/api/favicon?url=<域名>，url 用「域名」而非 origin）。
// 规则：任何 http(s) 图标一律按其域名转成 faviconsnap 地址（含历史遗留的
// /api/icon?host=、icon.horse、google s2、duckduckgo、faviconsnap 的 origin 形式、
// 以及直连站点 favicon / 自定义图片 URL）；本站路径 / data: / blob: 原样返回。
const FAVICONSNAP = 'https://faviconsnap.com/api/favicon?url=';

export function iconSrc(icon?: string): string {
  const raw = (icon || '').trim();
  if (!raw) return '/favicon.ico';
  // 本站旧代理值：/api/icon?host=<域名>
  if (raw.startsWith('/api/icon')) {
    const h = new URLSearchParams(raw.split('?')[1] || '').get('host') || '';
    return h ? FAVICONSNAP + encodeURIComponent(h) : '/favicon.ico';
  }
  if (!/^https?:\/\//i.test(raw)) return raw; // 本站路径 / data: / blob:
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }
  const self = (globalThis as { location?: { hostname?: string } }).location?.hostname;
  if (self && u.hostname === self) return raw; // 本站绝对地址，不转

  let host = '';
  if (u.hostname === 'faviconsnap.com') {
    // 统一为「域名」形式（origin 形式对部分站点返回 HTML，会破图）
    const q = u.searchParams.get('url') || '';
    try {
      host = new URL(q).hostname;
    } catch {
      host = q.replace(/^https?:\/\//i, '').split('/')[0];
    }
  } else if (u.hostname === 'icon.horse') {
    host = u.pathname.replace(/^\/icon\//, '');
  } else if (u.hostname === 'www.google.com' && u.pathname.startsWith('/s2/favicons')) {
    host = u.searchParams.get('domain') || '';
  } else if (u.hostname === 'icons.duckduckgo.com') {
    host = u.pathname.replace(/^\/ip3\//, '').replace(/\.ico$/, '');
  } else {
    host = u.hostname; // 直连站点 favicon / 自定义图片：一律按域名走 faviconsnap
  }
  return host && /^[a-z0-9.-]+$/i.test(host) ? FAVICONSNAP + encodeURIComponent(host) : raw;
}
