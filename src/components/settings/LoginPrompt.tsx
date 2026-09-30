// 未登录时的提示 + 唤起登录
import { Button, Empty } from 'antd';

interface Props {
  onLogin: () => void;
}

export function LoginPrompt({ onLogin }: Props) {
  return (
    <Empty description="登录后可同步数据、管理卡片">
      <Button type="primary" onClick={onLogin}>
        去登录
      </Button>
    </Empty>
  );
}
