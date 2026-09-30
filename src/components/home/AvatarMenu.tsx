// 用户入口：点头像直接滑出设置抽屉（自绘头像，P1-3：首屏不引入 antd）
import { useAuth } from '../../store/auth';
import type { SettingsTab } from '../settings/SettingsDrawer';

interface Props {
  onOpenTab: (tab: SettingsTab) => void;
}

export default function AvatarMenu({ onOpenTab }: Props) {
  const { isLogin, userInfo } = useAuth();
  return (
    <button
      type="button"
      aria-label="用户入口"
      onClick={() => onOpenTab(isLogin ? 'home' : 'profile')}
      className="-m-2 inline-block cursor-pointer rounded-full p-2"
    >
      {userInfo?.avatar ? (
        <img
          src={userInfo.avatar}
          alt=""
          className="h-8 w-8 rounded-full border-2 border-black/35 object-cover transition-all hover:border-white/50"
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black/35 bg-white/35 text-white transition-all hover:border-white/50">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12zm0 2c-4 0-8 2-8 6v1.5h16V20c0-4-4-6-8-6z" />
          </svg>
        </span>
      )}
    </button>
  );
}
