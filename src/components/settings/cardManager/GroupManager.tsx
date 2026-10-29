// 分组管理分区：改名 / 删除 / 新增
import { Button, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import type { CardManagerApi } from './useCardManager';

export function GroupManager({ m }: { m: CardManagerApi }) {
  return (
    <div>
      <div className="mb-1 text-sm font-semibold">分组管理</div>
      <div className="space-y-2">
        {m.groups.length === 0 && <div className="text-xs text-gray-400">暂无分组，卡片默认未分组</div>}
        {m.groups.map((g) => (
          <div key={g} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Input
              size="small"
              value={m.renameMap[g] ?? g}
              onChange={(e) => m.setRenameMap((map) => ({ ...map, [g]: e.target.value }))}
              className="flex-1"
            />
            <Button size="small" type="text" icon={<CheckOutlined />} onClick={() => m.renameGroup(g)} />
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => m.deleteGroup(g)} />
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Input size="small" value={m.newGroup} onChange={(e) => m.setNewGroup(e.target.value)} placeholder="新分组名" />
          <Button size="small" icon={<PlusOutlined />} onClick={m.addGroup}>
            添加分组
          </Button>
        </div>
      </div>
    </div>
  );
}
