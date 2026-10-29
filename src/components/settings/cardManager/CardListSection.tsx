// 列表分区：顶部统计/操作栏 + 按分组分区的卡片列表
import { Button, Checkbox } from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined, CheckOutlined,
} from '@ant-design/icons';
import { iconSrc } from '../../../lib/iconSrc';
import type { HomeCard } from '../../../api/types';
import type { CardManagerApi } from './useCardManager';

export function CardListHeader({ m }: { m: CardManagerApi }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">共 {m.cards.length} 张卡片</span>
      <div className="flex gap-2">
        <Button size="small" icon={<CheckOutlined />} type={m.batch ? 'primary' : 'default'} onClick={m.toggleBatch}>
          {m.batch ? '完成' : '批量管理'}
        </Button>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => m.setEditTarget('new')}>
          添加卡片
        </Button>
      </div>
    </div>
  );
}

export function CardListSection({ m }: { m: CardManagerApi }) {
  const { cards, groups, batch, selected } = m;

  // 分组分区渲染：未分组 + 各分组
  const renderRow = (c: HomeCard, globalIdx: number) => (
    <div key={c.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
      {batch && <Checkbox checked={selected.has(c.id)} onChange={() => m.toggleSelect(c.id)} />}
      <img src={iconSrc(c.icon) || '/icons/website.svg'} alt="" className="h-8 w-8 rounded object-contain" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{c.title}</div>
        <div className="truncate text-xs text-gray-400">{c.url}</div>
      </div>
      {!batch && (
        <>
          <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={globalIdx === 0} onClick={() => m.move(globalIdx, -1)} />
          <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={globalIdx === cards.length - 1} onClick={() => m.move(globalIdx, 1)} />
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => m.setEditTarget(c.id)} />
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => m.remove(c.id)} />
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      {cards.filter((c) => !c.group || !groups.includes(c.group)).map((c) => renderRow(c, cards.indexOf(c)))}
      {groups.map((g) => {
        const list = cards.filter((c) => c.group === g);
        if (list.length === 0) return null;
        return (
          <div key={g} className="space-y-2">
            <div className="text-xs font-semibold text-gray-500">
              {g}（{list.length}）
            </div>
            {list.map((c) => renderRow(c, cards.indexOf(c)))}
          </div>
        );
      })}
      {cards.length === 0 && <div className="py-4 text-center text-xs text-gray-400">暂无卡片，点击「添加卡片」或导入书签</div>}
    </div>
  );
}
