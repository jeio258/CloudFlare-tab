// 仪表盘分区（A12：总用户/今日新增/分享开启数）
import { useEffect, useState } from 'react';
import { useAuth } from '../../../store/auth';
import { get } from '../../../api/client';
import { authHdr } from './shared';

export function DashboardSection() {
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
