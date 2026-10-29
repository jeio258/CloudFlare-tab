// 批量操作分区：分组移动 / 删除 / 图标 / 字号与颜色
import { Button, Input, InputNumber, Select } from 'antd';
import type { CardManagerApi } from './useCardManager';

export function BatchToolbar({ m }: { m: CardManagerApi }) {
  return (
    <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-blue-600">已选 {m.selected.size} 张</span>
        <Button size="small" type="link" onClick={m.selectAllOrNone}>
          {m.selected.size === m.cards.length ? '全不选' : '全选'}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={m.batchGroup}
          onChange={m.setBatchGroup}
          placeholder="移动到分组"
          size="small"
          className="min-w-32 flex-1"
          allowClear
          options={m.groups.map((g) => ({ value: g, label: g }))}
        />
        <Button size="small" onClick={m.batchMoveGroup}>
          移动
        </Button>
        <Button size="small" danger onClick={m.batchDelete}>
          删除
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input size="small" value={m.batchIcon} onChange={(e) => m.setBatchIcon(e.target.value)} placeholder="批量设置图标 URL" />
        <Button size="small" onClick={m.batchSetIcon}>
          应用
        </Button>
        <Button size="small" onClick={m.batchFetchIcons}>
          获取图标
        </Button>
      </div>
      {/* 批量样式（对齐参考：批量调整字号/文字颜色/背景颜色） */}
      <div className="flex items-center gap-2">
        <InputNumber
          size="small"
          min={9}
          max={28}
          value={m.batchFontSize}
          placeholder="字号"
          onChange={(v: number | null) => m.setBatchFontSize(v ?? null)}
          className="w-20"
          addonAfter="px"
        />
        <Button size="small" disabled={m.batchFontSize === null} onClick={() => m.batchApplyStyle({ fontSize: m.batchFontSize ?? undefined })}>
          应用字号
        </Button>
        <input
          type="color"
          aria-label="批量文字颜色"
          value={m.batchFontColor}
          onChange={(e) => m.setBatchFontColor(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-gray-300"
        />
        <Button size="small" onClick={() => m.batchApplyStyle({ fontColor: m.batchFontColor })}>
          文字色
        </Button>
        <input
          type="color"
          aria-label="批量背景颜色"
          value={m.batchBgColor}
          onChange={(e) => m.setBatchBgColor(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-gray-300"
        />
        <Button size="small" onClick={() => m.batchApplyStyle({ bgColor: m.batchBgColor })}>
          背景色
        </Button>
        <Button size="small" onClick={() => m.batchApplyStyle({ fontSize: undefined, fontColor: undefined, bgColor: undefined })}>
          清除样式
        </Button>
      </div>
    </div>
  );
}
