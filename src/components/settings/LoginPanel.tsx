// 登录面板：个人中心未登录时直接在此登录/注册（头像下拉弹窗也可登录，双入口）
import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../store/auth';
import { post } from '../../api/client';

export function LoginPanel() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const doLogin = async () => {
    const v = await form.validateFields();
    setLoading(true);
    const resp = await login(v.username, v.password);
    setLoading(false);
    if (resp.code === 200) {
      message.success('登录成功');
    } else {
      message.error(resp.msg || '登录失败');
    }
  };

  const doForgot = async () => {
    const v = await form.validateFields();
    setLoading(true);
    const resp = await post('/api/findPassword', { username: v.username, oldPassword: v.oldPassword, newPassword: v.newPassword, confirmPassword: v.confirmPassword });
    setLoading(false);
    if (resp.code === 200) {
      message.success('密码已重置，请登录');
      setMode('login');
      form.resetFields();
    } else {
      message.error(resp.msg || '重置失败');
    }
  };

  const doRegister = async () => {
    const v = await form.validateFields();
    setLoading(true);
    const resp = await post('/api/register', { username: v.username, password: v.password });
    setLoading(false);
    if (resp.code === 200) {
      message.success('注册成功，请登录');
      setMode('login');
      form.resetFields();
    } else {
      message.error(resp.msg || '注册失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">{mode === 'login' ? '登录以同步数据、管理卡片' : '注册新账号'}</div>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
          <Input id="login-form_username" prefix={<UserOutlined />} placeholder="用户名" size="large" />
        </Form.Item>
        {mode === 'login' ? (
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password id="login-form_password" prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
        ) : mode === 'forgot' ? (
          <>
            <Form.Item name="oldPassword" rules={[{ required: true, message: '请输入原密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="原密码" size="large" />
            </Form.Item>
            <Form.Item name="newPassword" rules={[{ required: true, min: 6, message: '至少 6 位' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="新密码" size="large" />
            </Form.Item>
            <Form.Item name="confirmPassword" rules={[{ required: true, message: '请确认新密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" size="large" />
            </Form.Item>
          </>
        ) : (
          <Form.Item name="password" rules={[{ required: true, min: 6, message: '至少 6 位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
        )}
        <Button
          type="primary"
          block
          size="large"
          loading={loading}
          onClick={mode === 'login' ? doLogin : mode === 'register' ? doRegister : doForgot}
        >
          {mode === 'login' ? '登 录' : mode === 'register' ? '注 册' : '重 置'}
        </Button>
      </Form>
      <div className="text-center text-sm">
        {mode === 'register' ? (
          <Button type="link" onClick={() => setMode('login')}>已有账号，去登录</Button>
        ) : mode === 'forgot' ? (
          <Button type="link" onClick={() => setMode('login')}>想起密码了，去登录</Button>
        ) : (
          <>
            <Button type="link" onClick={() => setMode('register')}>注册账号</Button>
            <Button type="link" onClick={() => setMode('forgot')}>忘记密码</Button>
          </>
        )}
      </div>
    </div>
  );
}
