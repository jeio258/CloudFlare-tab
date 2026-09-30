// 重置回退：分类重置（设置 / 卡片 / 全部）
import { useState } from 'react';
import { Button, Divider, message } from 'antd';
import { useSite, DEFAULT_CARDS } from '../../../store/site';
import { DEFAULT_SETTINGS } from '../../../store/settings';

export function ResetPanel() {
  const { updateSettings, cards, setCards, resetSettings } = useSite();
  const [all, setAll] = useState(false);

  const resetSettingsOnly = () => {
    if (!confirm('重置全部设置为默认值？（卡片保留）')) return;
    updateSettings({ ...DEFAULT_SETTINGS });
    message.success('设置已重置');
  };
  const resetCards = () => {
    if (!confirm('恢复默认卡片？（当前自定义卡片将被清除）')) return;
    setCards(DEFAULT_CARDS);
    setAll(false);
    message.success('卡片已重置');
  };
  const resetAllFn = () => {
    if (!confirm('重置全部设置与卡片？此操作不可恢复，确认继续？')) return;
    resetSettings();
    setAll(true);
    message.success('已全部重置');
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400">重置仅影响本设备数据；云端数据不受影响，可在「数据同步」面板拉取恢复。</div>
      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
        <div>
          <div className="text-sm font-medium">重置设置</div>
          <div className="text-xs text-gray-400">全部设置恢复默认，卡片保留</div>
        </div>
        <Button size="small" onClick={resetSettingsOnly}>
          重置
        </Button>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
        <div>
          <div className="text-sm font-medium">重置卡片</div>
          <div className="text-xs text-gray-400">恢复默认 {DEFAULT_CARDS.length} 张卡片（当前 {cards.length} 张）</div>
        </div>
        <Button size="small" onClick={resetCards}>
          重置
        </Button>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
        <div>
          <div className="text-sm font-medium text-red-600">全部重置</div>
          <div className="text-xs text-red-400">设置与卡片全部恢复默认，不可恢复</div>
        </div>
        <Button size="small" danger onClick={resetAllFn}>
          重置
        </Button>
      </div>
      {all && <div className="text-xs text-green-600">已全部重置完成。</div>}
      <Divider />
      {/* 数据清理（对齐参考「找回数据/数据丢失/清理」族，本地子集） */}
      <div className="text-sm font-semibold">数据清理</div>
      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
        <div>
          <div className="text-sm font-medium">清除搜索历史</div>
          <div className="text-xs text-gray-400">删除本设备记录的搜索历史</div>
        </div>
        <Button
          size="small"
          onClick={() => {
            localStorage.removeItem('persist:searchHistory');
            message.success('搜索历史已清除');
          }}
        >
          清除
        </Button>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
        <div>
          <div className="text-sm font-medium text-red-600">清除全部本地数据</div>
          <div className="text-xs text-red-400">删除本设备全部 localStorage（设置/卡片/缓存），不可恢复</div>
        </div>
        <Button
          size="small"
          danger
          onClick={() => {
            if (!confirm('将清除本设备全部本地数据并刷新页面，确认继续？')) return;
            localStorage.clear();
            location.reload();
          }}
        >
          清除
        </Button>
      </div>
    </div>
  );
}
