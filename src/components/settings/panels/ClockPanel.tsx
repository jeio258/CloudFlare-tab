// 时间日期（对齐参考 clockAndDate 注册表）
import { Input, InputNumber, Select, Switch, Divider } from 'antd';
import { useSite } from '../../../store/site';

export function ClockPanel() {
  const { settings, updateSettings } = useSite();
  const s = settings;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm">时钟开关</span>
        <Switch checked={s.showClock} onChange={(v) => updateSettings({ showClock: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">时间格式（24 小时制）</span>
        <Switch checked={s.clock24h} onChange={(v) => updateSettings({ clock24h: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">秒钟</span>
        <Switch checked={s.clockSeconds} onChange={(v) => updateSettings({ clockSeconds: v })} />
      </div>
      <div>
        <div className="mb-1 text-sm">时间高度（{s.clockHeight}px）</div>
        <InputNumber min={20} max={120} value={s.clockHeight} onChange={(v) => updateSettings({ clockHeight: Number(v ?? 56) })} className="w-full" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">日期开关</span>
        <Switch checked={s.showDate} onChange={(v) => updateSettings({ showDate: v })} />
      </div>
      {s.showDate && (
        <>
          <div className="text-xs text-gray-500">阳历</div>
          <div className="grid grid-cols-3 gap-2">
            {([['dateYear', '年'], ['dateMonth', '月'], ['dateDay', '日']] as const).map(([k, label]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-gray-200 px-2 py-1.5">
                <span className="text-sm">阳历{label}</span>
                <Switch size="small" checked={s[k]} onChange={(v) => updateSettings({ [k]: v })} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">星期/周</span>
            <Switch checked={s.showWeek} onChange={(v) => updateSettings({ showWeek: v })} />
          </div>
          <div className="text-xs text-gray-500">农历</div>
          <div className="grid grid-cols-3 gap-2">
            {([['lunarYear', '年'], ['lunarMonth', '月'], ['lunarDay', '日']] as const).map(([k, label]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-gray-200 px-2 py-1.5">
                <span className="text-sm">农历{label}</span>
                <Switch size="small" checked={s[k]} onChange={(v) => updateSettings({ [k]: v })} />
              </div>
            ))}
          </div>
        </>
      )}
      <Divider />
      <div className="flex items-center justify-between">
        <span className="text-sm">时间日期阴影</span>
        <Switch checked={s.clockShadow} onChange={(v) => updateSettings({ clockShadow: v })} />
      </div>
      <div>
        <div className="mb-1 text-sm">时间日期透明度（{s.clockOpacity}）</div>
        <InputNumber min={0.1} max={1} step={0.1} value={s.clockOpacity} onChange={(v) => updateSettings({ clockOpacity: Number(v ?? 1) })} className="w-full" />
      </div>
      <div>
        <div className="mb-1 text-sm">时间日期对齐方式</div>
        <Select
          value={s.clockAlign}
          onChange={(v) => updateSettings({ clockAlign: v })}
          options={[
            { value: 'left', label: '左对齐' },
            { value: 'center', label: '居中' },
            { value: 'right', label: '右对齐' },
          ]}
          className="w-full"
        />
      </div>
      <Divider />
      <div>
        <div className="mb-1 text-sm">时钟日期替换</div>
        <Select
          value={s.clockReplace}
          onChange={(v) => updateSettings({ clockReplace: v })}
          options={[
            { value: 'none', label: '不替换' },
            { value: 'text', label: '自定义文本' },
            { value: 'image', label: '图片 logo' },
            { value: 'html', label: '自定义 HTML' },
          ]}
          className="w-full"
        />
      </div>
      {s.clockReplace === 'text' && (
        <>
          <Input value={s.clockMainText} onChange={(e) => updateSettings({ clockMainText: e.target.value })} placeholder="主文本内容" />
          <div className="flex items-center justify-between">
            <span className="text-sm">主文本加粗</span>
            <Switch checked={s.clockMainBold} onChange={(v) => updateSettings({ clockMainBold: v })} />
          </div>
          <div>
            <div className="mb-1 text-sm">主文本高度（{s.clockMainHeight}px）</div>
            <InputNumber min={12} max={160} value={s.clockMainHeight} onChange={(v) => updateSettings({ clockMainHeight: Number(v ?? 56) })} className="w-full" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">副文本开关</span>
            <Switch checked={s.clockSubOn} onChange={(v) => updateSettings({ clockSubOn: v })} />
          </div>
          {s.clockSubOn && (
            <>
              <Input value={s.clockSubText} onChange={(e) => updateSettings({ clockSubText: e.target.value })} placeholder="副文本内容" />
              <div>
                <div className="mb-1 text-sm">副文本高度（{s.clockSubHeight}px）</div>
                <InputNumber min={10} max={80} value={s.clockSubHeight} onChange={(v) => updateSettings({ clockSubHeight: Number(v ?? 20) })} className="w-full" />
              </div>
            </>
          )}
        </>
      )}
      {s.clockReplace === 'image' && (
        <>
          <Input value={s.clockImage} onChange={(e) => updateSettings({ clockImage: e.target.value })} placeholder="图片地址" />
          <div>
            <div className="mb-1 text-sm">图片高度（{s.clockImageHeight}px）</div>
            <InputNumber min={20} max={300} value={s.clockImageHeight} onChange={(v) => updateSettings({ clockImageHeight: Number(v ?? 80) })} className="w-full" />
          </div>
        </>
      )}
      {s.clockReplace === 'html' && <Input.TextArea value={s.clockHtml} maxLength={2000} rows={4} onChange={(e) => updateSettings({ clockHtml: e.target.value })} placeholder="自定义 HTML 内容" />}
    </div>
  );
}
