// 管理后台：用户管理 / 公告管理 / 默认主页管理（全部走 console/* API）
import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Table, Tabs, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../../store/auth';
import { get, post } from '../../api/client';
import type { ApiResp } from '../../api/client';

const authHdr = (token: string): RequestInit => ({ headers: { authorization: token } });

interface ApiList<T> {
  list: T[];
  total: number;
}

// ===== 用户管理 =====
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

function UserTab() {
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
          <Popconfirm title="确认删除该用户？将级联删除其云数据" onConfirm={() => act('/api/console/deleteUser', { userId: r.id }, '已删除')}>
            <Button size="small" type="link" danger>
              删除
            </Button>
          </Popconfirm>
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

// ===== 公告管理 =====
interface NoticeRow {
  id: string;
  title: string;
  content: string;
  status: number;
  timeCode: string;
  username: string;
}

function NoticeTab() {
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
          <Popconfirm title="确认删除该公告？" onConfirm={() => act('/api/console/deleteNotice', { id: r.id }, '已删除')}>
            <Button size="small" type="link" danger>
              删除
            </Button>
          </Popconfirm>
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

// ===== 默认主页管理 =====
interface DefaultRow {
  id: string;
  data: string;
  enabled: number;
  username: string;
  created_at: string;
}

function DefaultTab() {
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
          <Popconfirm title="确认删除该历史快照？" onConfirm={() => act('/api/console/deleteDefaultData', { id: r.id }, '已删除')}>
            <Button size="small" type="link" danger>
              删除
            </Button>
          </Popconfirm>
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

// ===== 仪表盘（A12：总用户/今日新增/分享开启数）=====
function DashboardTab() {
  const { token } = useAuth();
  const [d, setD] = useState<{ totalUsers: number; todayUsers: number; shareUsers: number } | null>(null);

  useEffect(() => {
    (async () => {
      const resp = await get<typeof d>('/api/console/dashboard', authHdr(token));
      if (resp.code === 200 && resp.data) setD(resp.data);
    })();
  }, [token]);

  const items = [
    { label: '总用户数', value: d?.totalUsers },
    { label: '今日新增', value: d?.todayUsers },
    { label: '分享开启', value: d?.shareUsers },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg border border-gray-200 px-4 py-3">
          <div className="text-xs text-gray-400">{it.label}</div>
          <div className="text-2xl font-semibold text-ink">{it.value ?? '-'}</div>
        </div>
      ))}
    </div>
  );
}

export function AdminPanel() {
  return (
    <Tabs
      items={[
        { key: 'dashboard', label: '仪表盘', children: <DashboardTab /> },
        { key: 'users', label: '用户管理', children: <UserTab /> },
        { key: 'notices', label: '公告管理', children: <NoticeTab /> },
        { key: 'default', label: '默认主页', children: <DefaultTab /> },
      ]}
    />
  );
}
