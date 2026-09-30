// 迁移备份：整包导出/导入（与云快照同构 {settings, cards}）
import { Button, Divider, Upload, message } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useSite } from '../../../store/site';
import { DEFAULT_SETTINGS } from '../../../store/settings';
import { normalizeCards, normalizeSettings } from '../../../lib/normalize';

export function BackupPanel() {
  const { settings, updateSettings, cards, setCards } = useSite();

  const exportBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      cards,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cloudflare-tab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    message.success('备份已导出');
  };

  const importBackup = async (file: File) => {
    try {
      const obj = JSON.parse(await file.text()) as { settings?: Partial<typeof settings>; cards?: unknown };
      if (typeof obj !== 'object' || obj === null || (typeof obj.settings !== 'object' && !Array.isArray(obj.cards))) {
        throw new Error('shape');
      }
      if (!confirm('导入将覆盖当前设置与卡片，确认继续？')) return;
      if (obj.settings && typeof obj.settings === 'object') {
        // 备份文件属外部输入：先原始合并，再以净化结果覆盖安全相关字段
        updateSettings({ ...DEFAULT_SETTINGS, ...obj.settings, ...normalizeSettings(obj.settings) });
      }
      if (Array.isArray(obj.cards)) {
        setCards(normalizeCards(obj.cards));
      }
      message.success('备份已导入');
    } catch {
      message.error('文件解析失败，仅支持本应用导出的备份 JSON');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-sm font-semibold">导出备份</div>
        <div className="mb-2 text-xs text-gray-400">将当前设置与全部卡片导出为 JSON 文件（与云端快照同构）。</div>
        <Button icon={<DownloadOutlined />} onClick={exportBackup}>
          导出 JSON
        </Button>
      </div>
      <Divider />
      <div>
        <div className="mb-2 text-sm font-semibold">导入还原</div>
        <div className="mb-2 text-xs text-gray-400">选择此前导出的备份文件，导入前会确认覆盖。</div>
        <Upload
          accept=".json"
          maxCount={1}
          showUploadList={false}
          beforeUpload={(f) => {
            importBackup(f as File);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>选择备份文件</Button>
        </Upload>
      </div>
    </div>
  );
}
