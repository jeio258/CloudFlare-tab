// 公告管理分区
import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../../../store/auth';
import { get, post } from '../../../api/client';
import type { ApiResp } from '../../../api/client';
import { authHdr } from './shared';
import type { ApiList } from './shared';

interface NoticeRow {
  id: string;
  title: string;
  content: string;
  status: number;
  timeCode: string;
  username: string;
}

export function NoticeSection() {
  const { token } = useAuth();
  const [rows, setRows] = useState<NoticeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NoticeRow | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const resp = await get<ApiList<NoticeRow>>('/api/console/getNoticeList?page=1&pageSize=100', authHdr(token));
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

  const save = async () => {
    const v = await form.validateFields();
    const path = editing ? '/api/console/editNotice' : '/api/console/addNotice';
    const resp = await post<ApiResp<unknown>>(path, { ...(editing ? { id: editing.id } : {}), title: v.title, content: v.content }, token);
    if (resp.code === 200) {
      message.success(resp.msg);
      setOpen(false);
      setEditing(null);
      load();
    } else message.error(resp.msg || '保存失败');
  };

  const columns: ColumnsType<NoticeRow> = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: number) => (v === 1 ? <Tag color="green">已发布</Tag> : <Tag>待确认</Tag>),
    },
    {
      title: '操作',
      key: 'op',
      width: 260,
      render: (_, r) => (
        <span className="space-x-1">
          {r.status === 0 && (
            <Button size="small" type="link" onClick={() => act('/api/console/confirmNotice', { id: r.id }, '已发布')}>
              确认发布
            </Button>
          )}
          <Button size="small" type="link" onClick={() => { setEditing(r); setOpen(true); }}>
            编辑
          </Button>
          <Button size="small" type="link" danger onClick={() => { if (confirm('确认删除该公告？')) act('/api/console/deleteNotice', { id: r.id }, '已删除'); }}>
            删除
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button type="primary" onClick={() => { setEditing(null); setOpen(true); }}>
          新建公告
        </Button>
      </div>
      <Table<NoticeRow> rowKey="id" size="small" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 10 }} scroll={{ x: true }} />
      <Modal open={open} title={editing ? '编辑公告' : '新建公告'} onCancel={() => setOpen(false)} onOk={save} width={520} zIndex={1100} okText="保存">
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="内容">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
