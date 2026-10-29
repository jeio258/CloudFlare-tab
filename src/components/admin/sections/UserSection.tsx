// 用户管理分区
import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Select, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../../../store/auth';
import { get, post } from '../../../api/client';
import type { ApiResp } from '../../../api/client';
import { authHdr } from './shared';
import type { ApiList } from './shared';

interface UserRow {
  id: string;
  username: string;
  nickname: string;
  sex: number;
  phone: string;
  userType: number;
  status: number;
  registerTime: string;
}

export function UserSection() {
  const { token } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [kw, setKw] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const resp = await get<ApiList<UserRow>>(
      `/api/console/getAwaitingApprovalUserAppellationList?page=1&pageSize=100&username=${encodeURIComponent(kw)}`,
      authHdr(token)
    );
    setLoading(false);
    if (resp.code === 200 && resp.data) setRows(resp.data.list);
  }, [kw, token]);

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

  const addUser = async () => {
    const v = await form.validateFields();
    const resp = await post<ApiResp<unknown>>(
      '/api/console/addUser',
      { username: v.username, password: v.password, nickname: v.nickname, userType: v.userType ?? 0 },
      token
    );
    if (resp.code === 200) {
      message.success('用户已创建');
      setAddOpen(false);
      form.resetFields();
      load();
    } else message.error(resp.msg || '创建失败');
  };

  const columns: ColumnsType<UserRow> = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
    {
      title: '类型',
      dataIndex: 'userType',
      key: 'userType',
      width: 90,
      render: (v: number) => (v === 1 ? <Tag color="gold">管理员</Tag> : <Tag>用户</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: number) => (v === 1 ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag>),
    },
    {
      title: '操作',
      key: 'op',
      width: 220,
      render: (_, r) => (
        <span className="space-x-1">
          <Button size="small" type="link" onClick={() => act('/api/console/setUserType', { userId: r.id, type: r.userType === 1 ? 0 : 1 }, r.userType === 1 ? '已撤销管理员' : '已设为管理员')}>
            {r.userType === 1 ? '撤管理' : '设管理'}
          </Button>
          <Button size="small" type="link" onClick={() => act(r.status === 1 ? '/api/console/disableUser' : '/api/console/enableUser', { userId: r.id }, r.status === 1 ? '已禁用' : '已启用')}>
            {r.status === 1 ? '禁用' : '启用'}
          </Button>
          <Button size="small" type="link" danger onClick={() => { if (confirm('确认删除该用户？将级联删除其云数据')) act('/api/console/deleteUser', { userId: r.id }, '已删除'); }}>
            删除
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Input.Search placeholder="搜索用户名/昵称" allowClear onSearch={setKw} style={{ maxWidth: 220 }} />
        <Button type="primary" onClick={() => setAddOpen(true)}>
          新建用户
        </Button>
      </div>
      <Table<UserRow> rowKey="id" size="small" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 10 }} scroll={{ x: true }} />
      <Modal open={addOpen} title="新建用户" onCancel={() => setAddOpen(false)} onOk={addUser} width={400} zIndex={1100} okText="保存">
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input placeholder="字母开头，3-20 位" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input />
          </Form.Item>
          <Form.Item name="userType" label="类型" initialValue={0}>
            <Select options={[{ value: 0, label: '普通用户' }, { value: 1, label: '管理员' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
