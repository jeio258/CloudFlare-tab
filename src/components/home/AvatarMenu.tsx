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
        <img
          src="/favicon.ico"
          alt="默认头像"
          className="h-8 w-8 rounded-full border-2 border-black/35 bg-white/60 object-cover transition-all hover:border-white/50"
        />
      )}
    </button>
  );
}
