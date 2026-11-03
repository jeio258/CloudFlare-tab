// 图标源：统一走后端代理 /api/icon?host=<域名>&sz=64（Worker 桥接 Google S2，永远 200）。
// 规则：本站路径 / data: / blob: 原样；faviconsnap 旧格式与任意 http(s) 图标按域名转代理；
// icon 为空时用 url 提取域名兜底，仍无则 /favicon.ico。
const PROXY = '/api/icon?host=';

function hostToProxy(host: string): string {
  return PROXY + encodeURIComponent(host);
}

export function iconSrc(icon?: string, url?: string): string {
  const raw = (icon || '').trim();
  if (!raw) {
    const u = (url || '').trim();
    if (u) {
      try {
        return hostToProxy(new URL(u).hostname);
      } catch {
        /* url 非法，回落 */
      }
    }
    return '/favicon.ico';
  }
  if (!/^https?:\/\//i.test(raw)) return raw; // 本站路径（含 /api/icon?...）/ data: / blob:
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }
  if (u.hostname === 'faviconsnap.com') {
    const target = u.searchParams.get('url'); // 旧格式：?url=<域名>，searchParams 自动解码
    if (target) return hostToProxy(target);
  }
  const self = (globalThis as { location?: { hostname?: string } }).location?.hostname;
  if (self && u.hostname === self) return raw; // 本站绝对地址，不转
  return hostToProxy(u.hostname);
}
