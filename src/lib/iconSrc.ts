// 图标地址归一：把第三方图标服务的历史 URL 重写为本站同源代理 /api/icon?host=，
// 使首页图标请求全部走本站域名（避免境外第三方域不可达/慢、第三方 Cookie、加载失败报错）。
// 非第三方地址（本站路径 / data: / 用户自定义外链图片等）原样返回。
export function iconSrc(icon?: string): string {
  const raw = (icon || '').trim();
  if (!raw) return '/favicon.ico';
  if (!/^https?:\/\//i.test(raw)) return raw; // 本站路径 / data: / blob:
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }
  let host = '';
  if (u.hostname === 'icon.horse') {
    host = u.pathname.replace(/^\/icon\//, '');
  } else if (u.hostname === 'faviconsnap.com') {
    try {
      host = new URL(u.searchParams.get('url') || '').hostname;
    } catch {
      host = '';
    }
  } else if (u.hostname === 'www.google.com' && u.pathname.startsWith('/s2/favicons')) {
    host = u.searchParams.get('domain') || '';
  } else if (u.hostname === 'icons.duckduckgo.com') {
    host = u.pathname.replace(/^\/ip3\//, '').replace(/\.ico$/, '');
  }
  return host && /^[a-z0-9.-]+$/i.test(host) ? `/api/icon?host=${encodeURIComponent(host)}` : raw;
}
