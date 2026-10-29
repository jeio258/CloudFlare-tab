// 默认主页与历史快照分区
import { useCallback, useEffect, useState } from 'react';
import { Button, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../../../store/auth';
import { get, post } from '../../../api/client';
import type { ApiResp } from '../../../api/client';
import { authHdr } from './shared';
import type { ApiList } from './shared';

interface DefaultRow {
  id: string;
  data: string;
  enabled: number;
  username: string;
  created_at: string;
}

export function DefaultHomeSection() {
  const { token } = useAuth();
  const [rows, setRows] = useState<DefaultRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const resp = await get<ApiList<DefaultRow>>('/api/console/getDefaultDataList?page=1&pageSize=100', authHdr(token));
    setLoading(false);
    if (resp.code === 200 && resp.data) setRows(resp.data.list);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (path: string, data: unknown, msg: string) => {
    const resp = await post<ApiResp<unknown>>(path, data, token);
    if (resp.code === 200) {
      message.success(msg);
      load();
    } else message.error(resp.msg || '操作失败');
  };

  const columns: ColumnsType<DefaultRow> = [
    {
      title: '预览',
      dataIndex: 'data',
      key: 'data',
      render: (v: string) => {
        try {
          const d = JSON.parse(v) as { home?: { cards?: Array<{ title?: string }> } };
          const titles = (d.home?.cards || []).map((c) => c.title).join('、');
          return <span className="text-xs text-gray-500">{titles || '(空数据)'}</span>;
        } catch {
          return <span className="text-xs text-gray-400">(无法解析)</span>;
        }
      },
    },
    { title: '创建人', dataIndex: 'username', key: 'username', width: 120 },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 170 },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (v: number) => (v === 1 ? <Tag color="green">启用中</Tag> : <Tag>停用</Tag>),
    },
    {
      title: '操作',
      key: 'op',
      width: 180,
      render: (_, r) => (
        <span className="space-x-1">
          {r.enabled === 0 && (
            <Button size="small" type="link" onClick={() => act('/api/console/enableDefaultData', { id: r.id }, '已启用')}>
              启用
            </Button>
          )}
          {r.enabled === 1 && (
            <Button size="small" type="link" onClick={() => act('/api/console/disableDefaultData', { id: r.id }, '已停用')}>
              停用
            </Button>
          )}
          <Button size="small" type="link" danger onClick={() => { if (confirm('确认删除该历史快照？')) act('/api/console/deleteDefaultData', { id: r.id }, '已删除'); }}>
            删除
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button
          size="small"
          onClick={() => act('/api/console/clearDefaultData', {}, '已清理（保留最近 10 条）')}
        >
          清理历史
        </Button>
      </div>
      <Table<DefaultRow> rowKey="id" size="small" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 10 }} scroll={{ x: true }} />
      <p className="mt-2 text-xs text-gray-400">
        提示：当前首页点击「卡片管理」修改后，可在个人中心「数据同步」上传；再在下方启用对应历史快照作为公开默认主页。
      </p>
    </div>
  );
}
