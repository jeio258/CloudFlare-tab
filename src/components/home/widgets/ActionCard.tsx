import { getWidgetCtx } from './ctx';

// 动作卡：图标 + 文案，整块可点
export function ActionCard({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-full w-full flex-col items-center justify-center gap-0.5">
      <img src={icon} alt="" className="h-6 w-6 object-contain" />
      <span className="text-[10px] font-medium text-ink">{label}</span>
    </button>
  );
}

export function BookmarksCard() {
  return <ActionCard icon="/favicon.ico" label="书签管理" onClick={() => getWidgetCtx().openCards()} />;
}

export function SettingsCard() {
  return <ActionCard icon="/favicon.ico" label="设置中心" onClick={() => getWidgetCtx().openSettings()} />;
}

export function DisguiseCard() {
  return <ActionCard icon="/favicon.ico" label="伪装助手" onClick={() => window.dispatchEvent(new CustomEvent('cftab:disguise-toggle'))} />;
}
