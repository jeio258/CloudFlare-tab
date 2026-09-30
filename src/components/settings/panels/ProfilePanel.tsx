// 个人中心：资料编辑 + 改密码
import { useEffect, useState } from 'react';
import { Button, Form, Input, Select, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../../../store/auth';
import { post } from '../../../api/client';
import type { ApiResp } from '../../../api/client';
import type { UserInfo } from '../../../api/types';

export function ProfilePanel() {
  const { token, userInfo, setUserInfo, logout } = useAuth();
  const [infoForm] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userInfo) infoForm.setFieldsValue(userInfo);
  }, [userInfo, infoForm]);

  const saveInfo = async () => {
    const v = await infoForm.validateFields();
    setLoading(true);
    const resp = await post<UserInfo>('/api/user/editUserInfo', v, token);
    setLoading(false);
    if (resp.code === 200 && resp.data) {
      setUserInfo(resp.data);
      message.success('资料已保存');
    } else {
      message.error(resp.msg || '保存失败');
    }
  };

  const changePwd = async () => {
    const v = await pwdForm.validateFields();
    setLoading(true);
    const resp = await post<ApiResp<unknown>>(
      '/api/user/changePassword',
      { oldPassword: v.oldPassword, newPassword: v.newPassword, confirmPassword: v.confirmPassword },
      token
    );
    setLoading(false);
    if (resp.code === 200) {
      message.success('密码已修改');
      pwdForm.resetFields();
    } else {
      message.error(resp.msg || '修改失败');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 text-sm font-semibold">基础资料</div>
        <Form form={infoForm} layout="vertical" requiredMark={false}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input />
          </Form.Item>
          <Form.Item name="sex" label="性别">
            <Select
              options={[
                { value: 0, label: '保密' },
                { value: 1, label: '男' },
                { value: 2, label: '女' },
              ]}
            />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={saveInfo}>
            保存资料
          </Button>
        </Form>
      </div>

      <Divider />

      <div>
        <div className="mb-2 text-sm font-semibold">修改密码</div>
        <Form form={pwdForm} layout="vertical" requiredMark={false}>
          <Form.Item name="oldPassword" label="原密码" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认新密码" dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return !value || getFieldValue('newPassword') === value
                    ? Promise.resolve()
                    : Promise.reject(new Error('两次密码不一致'));
                },
              }),
            ]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Button loading={loading} onClick={changePwd}>
            修改密码
          </Button>
        </Form>
      </div>

      <Divider />
      <Button danger block onClick={logout}>
        退出登录
      </Button>
    </div>
  );
}
