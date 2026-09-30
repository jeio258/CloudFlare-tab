// 底栏：右下设置齿轮（打开设置抽屉）+ 中央链接列表 + 页脚一言（开关）；
// 取证说明：上游左下图标实为「支持作者/捐赠」弹窗（已裁决砍）故移除，右下齿轮=设置中心
import { useSite } from '../../store/site';
import { useFetch } from '../../lib/hooks';

interface Props {
  onOpenSettings?: () => void;
  showYiyan?: boolean;
}

export default function BottomLinks({ onOpenSettings, showYiyan }: Props) {
  const { settings } = useSite();
  const links = settings.bottomLinks || [];
  return (
    <div className="pointer-events-none fixed bottom-3 z-10 w-full">
      {/* 页脚一言（每日一言开关，置于页脚） */}
      {showYiyan && <YiyanFooter />}
      <div className="flex h-8 items-center">
        {/* 右下：设置入口图标（上游=设置中心） */}
        <button
          type="button"
          aria-label="设置"
          onClick={onOpenSettings}
          className="pointer-events-auto absolute bottom-[-8px] right-[18px] -m-3 p-3 text-white transition-opacity hover:opacity-70"
        >
          <svg viewBox="0 0 1024 1024" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M924.8 625.7l-65.5-56c3.1-19 4.9-40.6 4.9-63.4 0-22.8-1.8-44.5-5.3-64.1l65.5-56c10.1-8.6 13.8-24 8.6-35.7l-59.4-102.7c-5.2-9-16.5-14.2-27.7-10.7l-76.1 23.1C731 231.8 684.2 204.4 640 189.7L624.8 111c-1.9-11.6-12.3-20.3-24.2-20.3h-119c-11.9 0-22.3 8.7-24.2 20.3L441 189.7c-44.2 14.7-91 42.1-132.4 78.9l-76.1-23.1c-11.2-3.5-22.5 1.7-27.7 10.7l-59.4 102.7c-5.2 9-1.5 21.1 8.6 35.7l65.5 56c-3.5 19.6-5.3 41.3-5.3 64.1 0 22.8 1.8 44.5 4.9 63.4l-65.5 56c-10.1 8.6-13.8 24-8.6 35.7l59.4 102.7c5.2 9 16.5 14.2 27.7 10.7l76.1-23.1c41.4 36.8 88.2 64.2 132.4 78.9l15.2 78.7c1.9 11.6 12.3 20.3 24.2 20.3h119c11.9 0 22.3-8.7 24.2-20.3l15.2-78.7c44.2-14.7 91-42.1 132.4-78.9l76.1 23.1c11.2 3.5 22.5-1.7 27.7-10.7l59.4-102.7c5.2-9 1.5-21.1-8.6-35.7zM512 674.5c-89.5 0-162.3-72.8-162.3-162.3S422.5 349.9 512 349.9 674.3 422.7 674.3 512.2 601.5 674.5 512 674.5z" />
          </svg>
        </button>
        {/* 中央：链接列表（600 12px Roboto 纯白，项间 | 分隔） */}
        <div className="absolute inset-x-0 flex items-center justify-center gap-2 font-semibold text-white" style={{ fontFamily: 'Roboto, arial, sans-serif' }}>
          {links.map((l, i) => (
            <span key={`${l.name}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span className="pointer-events-none text-white/60">|</span>}
              {l.url ? (
                <a href={l.url} target="_blank" rel="noreferrer" className="pointer-events-auto flex items-center gap-1 transition-opacity hover:opacity-70">
                  {l.icon && <img src={l.icon} alt="" className="h-3.5 w-3.5 object-contain" />}
                  {l.name}
                </a>
              ) : (
                <span className="flex items-center gap-1">
                  {l.icon && <img src={l.icon} alt="" className="h-3.5 w-3.5 object-contain" />}
                  {l.name}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// 页脚一言（置于链接行上方，每日一言开关控制）
function YiyanFooter() {
  const { data, err } = useFetch<{ content: string }>('/api/yiyan');
  const text = err ? '' : (data?.content?.trim() || '');
  if (!text) return null;
  return (
    <div className="absolute inset-x-0 bottom-9 flex items-center justify-center text-xs text-white/85" style={{ fontFamily: 'Roboto, arial, sans-serif' }}>
      {text} —— 一言
    </div>
  );
}
