// 设置抽屉（唯一导航入口）：左侧菜单列 + 右侧面板；点头像直接滑出
import { lazy, Suspense } from 'react';
import { Drawer, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined, HomeOutlined, ClockCircleOutlined, SearchOutlined,
  AppstoreOutlined, CloudSyncOutlined, InfoCircleOutlined, ShareAltOutlined,
  DashboardOutlined, LayoutOutlined, EyeInvisibleOutlined,
  DatabaseOutlined, RollbackOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../store/auth';
import { ProfilePanel, HomePanel, ClockPanel, SearchPanel, AboutPanel, SyncPanel, SharePanel, LayoutPanel, SimpleModePanel, BackupPanel, ResetPanel } from './panels';
import { CardManagerPanel } from './CardManagerPanel';
import { LoginPanel } from './LoginPanel';

// 管理后台仅管理员使用，路由级分割（含 Table/Tabs 等重组件）
const AdminPanel = lazy(() => import('../admin/AdminPanel').then((m) => ({ default: m.AdminPanel })));

export type SettingsTab =
  | 'profile' | 'home' | 'layout' | 'simple' | 'clock' | 'search'
  | 'cards' | 'sync' | 'share' | 'backup' | 'reset' | 'admin' | 'about';

interface Props {
  open: boolean;
  onClose: () => void;
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

export function SettingsDrawer({ open, onClose, active, onChange }: Props) {
  const { isLogin, isAdmin } = useAuth();

  const items: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'home', icon: <HomeOutlined />, label: '主界面' },
    { key: 'layout', icon: <LayoutOutlined />, label: '排版布局' },
    { key: 'simple', icon: <EyeInvisibleOutlined />, label: '简约模式' },
    { key: 'clock', icon: <ClockCircleOutlined />, label: '时间日期' },
    { key: 'search', icon: <SearchOutlined />, label: '搜索栏' },
    { key: 'cards', icon: <AppstoreOutlined />, label: '卡片管理' },
    ...(isLogin ? [{ key: 'sync', icon: <CloudSyncOutlined />, label: '数据同步' }] : []),
    ...(isLogin ? [{ key: 'share', icon: <ShareAltOutlined />, label: '个性分享' }] : []),
    { key: 'backup', icon: <DatabaseOutlined />, label: '迁移备份' },
    { key: 'reset', icon: <RollbackOutlined />, label: '重置回退' },
    ...(isAdmin ? [{ key: 'admin', icon: <DashboardOutlined />, label: '管理后台' }] : []),
    { key: 'about', icon: <InfoCircleOutlined />, label: '关于我们' },
  ];

  return (
    <Drawer title="设置" placement="right" width="min(420px, 100vw)" open={open} onClose={onClose}>
      <div className="flex h-full w-full">
        <div className="w-32 shrink-0 border-r border-gray-200">
          <Menu
            mode="inline"
            selectedKeys={[active]}
            items={items}
            onClick={({ key }) => onChange(key as SettingsTab)}
            style={{ border: 'none', height: '100%' }}
          />
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto p-4">
          {active === 'profile' && (isLogin ? <ProfilePanel /> : <LoginPanel />)}
          {active === 'home' && <HomePanel />}
          {active === 'layout' && <LayoutPanel />}
          {active === 'simple' && <SimpleModePanel />}
          {active === 'clock' && <ClockPanel />}
          {active === 'search' && <SearchPanel />}
          {active === 'cards' && <CardManagerPanel />}
          {active === 'sync' && <SyncPanel />}
          {active === 'share' && <SharePanel />}
          {active === 'backup' && <BackupPanel />}
          {active === 'reset' && <ResetPanel />}
          {active === 'admin' && isAdmin && (
            <Suspense fallback={null}>
              <AdminPanel />
            </Suspense>
          )}
          {active === 'about' && <AboutPanel />}
        </div>
      </div>
    </Drawer>
  );
}
