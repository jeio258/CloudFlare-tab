// 个性分享：开关 + 分享链接（初始状态取 userInfo，服务端为准）
import { useState } from 'react';
import { Button, Input, Switch, message } from 'antd';
import { useAuth } from '../../../store/auth';
import { post } from '../../../api/client';

export function SharePanel() {
  const { token, userInfo, setUserInfo } = useAuth();
  const [enabled, setEnabled] = useState(userInfo?.shareEnabled === 1);
  const [shareId, setShareId] = useState(userInfo?.shareId || '');
  const [loading, setLoading] = useState(false);

  const toggle = async (v: boolean) => {
    setLoading(true);
    const resp = await post<{ shareId: string | null }>('/api/user/setShare', { enabled: v ? 1 : 0 }, token);
    setLoading(false);
    if (resp.code === 200) {
      setEnabled(v);
      if (resp.data?.shareId) setShareId(resp.data.shareId);
      if (userInfo) setUserInfo({ ...userInfo, shareEnabled: v ? 1 : 0, shareId: resp.data?.shareId || userInfo.shareId });
      message.success(v ? '分享已开启' : '分享已关闭');
    } else {
      message.error(resp.msg || '操作失败');
    }
  };

  const shareUrl = shareId ? `${location.origin}/s/${shareId}` : '';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm">开启主页分享</span>
        <Switch checked={enabled} loading={loading} onChange={toggle} />
      </div>
      <div className="text-xs text-gray-500">开启后，他人可通过分享链接（/s/分享ID 或 /s/你的用户名）查看你的卡片主页（只读）。</div>
      {enabled && shareUrl && (
        <div className="flex items-center gap-2">
          <Input readOnly value={shareUrl} />
          <Button
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              message.success('链接已复制');
            }}
          >
            复制
          </Button>
        </div>
      )}
    </div>
  );
}
