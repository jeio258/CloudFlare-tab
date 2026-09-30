// 简约模式：极简视图（对齐参考 simpleMode 分组，砍无契约依赖的动画/独立壁纸项）
import { Input, InputNumber, Switch, Divider } from 'antd';
import { useSite } from '../../../store/site';

export function SimpleModePanel() {
  const { settings, updateSettings } = useSite();
  const s = settings;
  const rm = s.simpleRemoveHeader;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm">进入简约模式</span>
        <Switch checked={s.simpleMode} onChange={(v) => updateSettings({ simpleMode: v })} />
      </div>
      <Divider />
      <div className="text-sm font-semibold">布局更新</div>
      <div className="flex items-center justify-between">
        <span className="text-sm">移除顶部（时间搜索均禁用）</span>
        <Switch checked={rm} onChange={(v) => updateSettings({ simpleRemoveHeader: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">更新字体颜色</span>
        <span className="flex items-center gap-2">
          <input type="color" value={s.simpleFont || '#333333'} disabled={!s.simpleFont} onChange={(e) => updateSettings({ simpleFont: e.target.value })} className="h-7 w-10 cursor-pointer rounded border border-gray-300 disabled:opacity-40" />
          <Switch checked={!!s.simpleFont} onChange={(v) => updateSettings({ simpleFont: v ? '#333333' : '' })} />
        </span>
      </div>
      {rm && (
        <>
          <Divider />
          <div className="text-sm font-semibold">移除顶部后显示文本</div>
          <Input.TextArea
            value={s.simpleText}
            maxLength={50}
            placeholder="在此输入您想显示的文本"
            onChange={(e) => updateSettings({ simpleText: e.target.value })}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm">点击文本退出简约模式</span>
            <Switch checked={s.simpleExitByText} onChange={(v) => updateSettings({ simpleExitByText: v })} />
          </div>
          <div>
            <div className="mb-1 text-sm">文本高度（{s.simpleTextHeight}px）</div>
            <InputNumber min={36} max={144} value={s.simpleTextHeight} onChange={(v) => updateSettings({ simpleTextHeight: Number(v ?? 72) })} className="w-full" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">简约模式改变文字颜色</span>
            <Switch checked={s.simpleChangeColor} onChange={(v) => updateSettings({ simpleChangeColor: v })} />
          </div>
          {s.simpleChangeColor && (
            <div className="flex items-center gap-2">
              <input type="color" value={s.simpleTextColor} onChange={(e) => updateSettings({ simpleTextColor: e.target.value })} className="h-7 w-10 cursor-pointer rounded border border-gray-300" />
              <span className="text-xs text-gray-500">{s.simpleTextColor}</span>
            </div>
          )}
        </>
      )}
      <Divider />
      <div className="text-xs text-gray-400">简约模式壁纸与主壁纸共用，可在「主界面」面板配置。</div>
    </div>
  );
}
