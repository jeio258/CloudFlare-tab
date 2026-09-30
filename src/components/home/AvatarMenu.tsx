// 用户入口：点头像直接滑出设置抽屉（下拉菜单弹窗已删除，导航统一在抽屉内）
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
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
      className="-m-2 inline-block cursor-pointer p-2"
    >
      <Avatar
        size={32}
        icon={<UserOutlined />}
        src={userInfo?.avatar || undefined}
        className="bg-white/35 border-2 border-black/35 transition-all hover:border-white/50"
      />
    </button>
  );
}
