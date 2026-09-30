// 搜索栏：默认引擎（内置+自定义）+ 联想 + 引擎管理
import { useState } from 'react';
import { Button, Input, InputNumber, Select, Switch, Divider, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useSite } from '../../../store/site';
import { allEngines } from '../../home/SearchBar';
import { newCardId } from '../../../lib/id';

export function SearchPanel() {
  const { settings, updateSettings } = useSite();
  const engines = allEngines(settings);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  const addEngine = () => {
    const n = name.trim();
    const t = template.trim();
    if (!n) return message.warning('请输入引擎名称');
    if (!t || !t.includes('%s')) return message.warning('URL 需包含 %s 占位符（如 https://x.com/search?q=%s）');
    if (engines.length >= 12) return message.warning('引擎数量已达上限');
    updateSettings({ customEngines: [...settings.customEngines, { id: newCardId(), name: n, template: t, icon: iconUrl.trim() || undefined }] });
    setName('');
    setTemplate('');
    setIconUrl('');
    message.success('引擎已添加');
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-sm font-semibold">默认搜索引擎</div>
        <Select
          value={engines.some((e) => e.value === settings.engine) ? settings.engine : engines[0].value}
          onChange={(v) => updateSettings({ engine: v })}
          options={engines.map((e) => ({ value: e.value, label: e.name }))}
          className="w-full"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">搜索联想词/建议</span>
        <Switch checked={settings.showSuggest} onChange={(v) => updateSettings({ showSuggest: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">本地搜索历史记录</span>
        <Switch checked={settings.searchHistory} onChange={(v) => updateSettings({ searchHistory: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">搜索后清除输入框内容</span>
        <Switch checked={settings.clearSearchAfter} onChange={(v) => updateSettings({ clearSearchAfter: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">搜索栏自动聚焦</span>
        <Switch checked={settings.searchAutoFocus} onChange={(v) => updateSettings({ searchAutoFocus: v })} />
      </div>
      <Divider />
      <div className="text-sm font-semibold">搜索栏外观</div>
      <div>
        <div className="mb-1 text-sm">搜索栏圆角（{settings.searchRadius}px）</div>
        <InputNumber min={0} max={24} value={settings.searchRadius} onChange={(v) => updateSettings({ searchRadius: Number(v ?? 12) })} className="w-full" />
      </div>
      <div>
        <div className="mb-1 text-sm">搜索栏高度（{settings.searchHeight}px）</div>
        <InputNumber min={36} max={72} value={settings.searchHeight} onChange={(v) => updateSettings({ searchHeight: Number(v ?? 48) })} className="w-full" />
      </div>
      <div>
        <div className="mb-1 text-sm">搜索栏最大宽度（{settings.searchMaxWidth}px）</div>
        <InputNumber min={320} max={1200} step={20} value={settings.searchMaxWidth} onChange={(v) => updateSettings({ searchMaxWidth: Number(v ?? 600) })} className="w-full" />
      </div>
      <div>
        <div className="mb-1 text-sm">搜索栏初始透明度（{settings.searchOpacity}）</div>
        <InputNumber min={0.1} max={1} step={0.05} value={settings.searchOpacity} onChange={(v) => updateSettings({ searchOpacity: Number(v ?? 0.7) })} className="w-full" />
      </div>
      <div>
        <div className="mb-1 text-sm">选中时透明度（{settings.searchFocusOpacity}）</div>
        <InputNumber min={0.1} max={1} step={0.05} value={settings.searchFocusOpacity} onChange={(v) => updateSettings({ searchFocusOpacity: Number(v ?? 0.7) })} className="w-full" />
      </div>
      <div>
        <div className="mb-1 text-sm">搜索按钮样式</div>
        <Select
          value={settings.searchBtnStyle}
          onChange={(v) => updateSettings({ searchBtnStyle: v })}
          options={[
            { value: 'icon', label: '图标' },
            { value: 'text', label: '文字' },
          ]}
          className="w-full"
        />
      </div>
      {settings.searchBtnStyle === 'text' && (
        <Input value={settings.searchBtnText} onChange={(e) => updateSettings({ searchBtnText: e.target.value })} placeholder="搜索按钮文字/文案" />
      )}
      <Input value={settings.searchPlaceholder} onChange={(e) => updateSettings({ searchPlaceholder: e.target.value })} placeholder="搜索栏提示词文案" />
      <Divider />
      <div>
        <div className="mb-2 text-sm font-semibold">自定义引擎</div>
        <div className="space-y-2">
          {settings.customEngines.length === 0 && <div className="text-xs text-gray-400">暂无自定义引擎</div>}
          {settings.customEngines.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <img src={c.icon || '/icons/search2.svg'} alt="" className="h-5 w-5 object-contain" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{c.name}</div>
                <div className="truncate text-xs text-gray-400">{c.template}</div>
              </div>
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => updateSettings({ customEngines: settings.customEngines.filter((x) => x.id !== c.id) })}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="引擎名称（如：DuckDuckGo）" />
          <Input value={template} onChange={(e) => setTemplate(e.target.value)} placeholder="URL（含 %s，如 https://x.com/search?q=%s）" />
          <Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="图标地址（可选，如 https://x.com/favicon.ico）" />
          <Button size="small" icon={<PlusOutlined />} onClick={addEngine}>
            添加引擎
          </Button>
        </div>
      </div>
    </div>
  );
}
