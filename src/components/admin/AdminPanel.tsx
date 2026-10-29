// 管理后台入口：只做 tabs 组装，分区见 ./sections（全部走 console/* API）
import { Tabs } from 'antd';
import { DashboardSection } from './sections/DashboardSection';
import { UserSection } from './sections/UserSection';
import { NoticeSection } from './sections/NoticeSection';
import { DefaultHomeSection } from './sections/DefaultHomeSection';

export function AdminPanel() {
  return (
    <Tabs
      items={[
        { key: 'dashboard', label: '仪表盘', children: <DashboardSection /> },
        { key: 'users', label: '用户管理', children: <UserSection /> },
        { key: 'notices', label: '公告管理', children: <NoticeSection /> },
        { key: 'default', label: '默认主页', children: <DefaultHomeSection /> },
      ]}
    />
  );
}
