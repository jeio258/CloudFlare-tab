// 数据同步（独立面板，smoke 依赖「上传到云端」按钮与「已同步到云端」文案）
import { Button, Divider, Space, Switch } from 'antd';
import { CloudDownloadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { useSite } from '../../../store/site';

export function SyncPanel() {
  const { syncState, syncMsg, pull, push, cloudTime, settings, updateSettings } = useSite();
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        {syncMsg || '登录后自动拉取云端；修改数据后手动上传。'}
        {cloudTime > 0 && ` 上次云端时间 ${new Date(cloudTime).toLocaleString()}`}
        <span className="ml-1">
          {syncState === 'syncing' && '同步中…'}
          {syncState === 'pushed' && '✓'}
          {syncState === 'pulled' && '⬇'}
        </span>
      </div>
      <Space>
        <Button icon={<CloudDownloadOutlined />} onClick={pull} loading={syncState === 'syncing'}>
          拉取云端
        </Button>
        <Button type="primary" icon={<CloudUploadOutlined />} onClick={push} loading={syncState === 'syncing'}>
          上传到云端
        </Button>
      </Space>
      <Divider />
      <div className="flex items-center justify-between">
        <span className="text-sm">变更自动推送云端</span>
        <Switch checked={settings.autoSync} onChange={(v) => updateSettings({ autoSync: v })} />
      </div>
      <div className="text-xs text-gray-400">开启后，登录状态下设置与卡片的每次修改将自动上传保存到云端（约 2 秒延迟防抖）。</div>
    </div>
  );
}
