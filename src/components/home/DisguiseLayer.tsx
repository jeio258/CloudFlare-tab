// 伪装助手（A9）：触发键切换全屏伪装页（静态搜索页样式），纯前端本地行为
import { useEffect, useState } from 'react';
import { useSite } from '../../store/site';

export default function DisguiseLayer() {
  const { settings } = useSite();
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!settings.disguiseEnabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setOn((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settings.disguiseEnabled]);

  // 伪装助手卡片触发（A8 动作卡）
  useEffect(() => {
    const onEvt = () => setOn((v) => !v);
    window.addEventListener('cftab:disguise-toggle', onEvt);
    return () => window.removeEventListener('cftab:disguise-toggle', onEvt);
  }, []);

  // 伪装页显示条件：卡片触发或 F2（开关仅控制 F2 快捷键）
  if (!on) return null;
  return (
    <div className="fixed inset-0 z-[999] bg-white">
      <div className="mx-auto mt-[18vh] w-[560px] max-w-[90vw] text-center">
        <div className="mb-6 text-4xl font-bold tracking-wide text-[#4e6ef2]">Bai du<span className="text-[#de0f17]">一</span>下</div>
        <div className="flex overflow-hidden rounded-md border-2 border-[#4e6ef2]">
          <input className="h-10 flex-1 px-3 text-sm outline-none" placeholder="搜一搜" readOnly />
          <button type="button" className="h-10 bg-[#4e6ef2] px-6 text-sm text-white">百度一下</button>
        </div>
        <div className="mt-3 text-xs text-gray-400">按 F2 返回</div>
      </div>
    </div>
  );
}
