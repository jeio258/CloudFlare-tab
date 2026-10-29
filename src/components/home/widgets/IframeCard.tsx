import type { CompProps } from './types';

export function IframeCard({ config, compact }: CompProps) {
  const src = String(config.src || '');
  if (!src) return <div className="text-center text-[10px] text-gray-400">未设置地址</div>;
  // 加固：地址须为 http(s)，否则不渲染（阻断 javascript:/data: 等，配置可能来自云同步/导入）
  let ok = false;
  let sameOrigin = false;
  try {
    const u = new URL(src, window.location.href);
    ok = u.protocol === 'http:' || u.protocol === 'https:';
    sameOrigin = ok && u.origin === window.location.origin;
  } catch {
    ok = false;
  }
  if (!ok) return <div className="text-center text-[10px] text-gray-400">地址不受支持</div>;
  // 同源地址不得同时放宽 allow-scripts+allow-same-origin（组合可让内嵌页访问父页面）；外部站点保持放宽以兼容登录态
  const sandbox = sameOrigin ? 'allow-forms' : 'allow-scripts allow-same-origin allow-forms allow-popups';
  return (
    <iframe
      src={src}
      title="内嵌框架"
      className="h-full w-full border-0"
      sandbox={sandbox}
      style={{ pointerEvents: compact ? 'none' : 'auto' }}
    />
  );
}
