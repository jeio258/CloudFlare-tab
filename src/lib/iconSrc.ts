// 图标源：faviconsnap（严格对齐参考项目口径 https://faviconsnap.com/api/favicon?url=<域名>）。
// 规则（唯一）：任何 http(s) 图标都按其「域名」转成 faviconsnap；已是 faviconsnap 或
// 本站绝对地址则原样；本站路径 / data: / blob: 原样。
// （历史遗留值已在 D1 一次性迁移为 faviconsnap 域名形式，故此处不再保留旧格式兼容分支。）
const FAVICONSNAP = 'https://faviconsnap.com/api/favicon?url=';

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
  if (u.hostname === 'faviconsnap.com') return raw; // 已是目标源
  const self = (globalThis as { location?: { hostname?: string } }).location?.hostname;
  if (self && u.hostname === self) return raw; // 本站绝对地址，不转
  return FAVICONSNAP + encodeURIComponent(u.hostname);
}
