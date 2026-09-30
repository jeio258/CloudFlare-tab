// 主界面：壁纸 / 背景色 / 挂件
import { useEffect, useState } from 'react';
import { Button, Input, InputNumber, Select, Switch, Divider } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useSite } from '../../../store/site';
import { WALLPAPERS } from '../../home/wallpapers';
import { get } from '../../../api/client';

export function HomePanel() {
  const { settings, updateSettings } = useSite();
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-sm font-semibold">背景模式</div>
        <Select
          value={settings.colorMode}
          onChange={(v) => updateSettings({ colorMode: v })}
          options={[
            { value: 'wallpaper', label: '壁纸' },
            { value: 'color', label: '纯色' },
            { value: 'gradient', label: '渐变' },
          ]}
          className="w-full"
        />
      </div>
      {settings.colorMode === 'gradient' && (
        <div>
          <div className="mb-2 text-sm font-semibold">双层渐变</div>
          <div className="flex items-center gap-2">
            <input type="color" value={settings.gradientFrom} onChange={(e) => updateSettings({ gradientFrom: e.target.value })} className="h-10 w-14 cursor-pointer rounded border border-gray-300" />
            <span className="text-gray-400">→</span>
            <input type="color" value={settings.gradientTo} onChange={(e) => updateSettings({ gradientTo: e.target.value })} className="h-10 w-14 cursor-pointer rounded border border-gray-300" />
          </div>
        </div>
      )}
      {settings.colorMode === 'wallpaper' ? (
        <div>
          <div className="mb-2 text-sm font-semibold">壁纸</div>
          <div className="grid grid-cols-3 gap-2">
            {WALLPAPERS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => updateSettings({ wallpaper: w })}
                className={`relative h-16 overflow-hidden rounded-lg border-2 transition ${
                  settings.wallpaper === w ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <img src={w} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => updateSettings({ wallpaper: '' })}
              className={`flex h-16 items-center justify-center rounded-lg border-2 text-xs ${
                settings.wallpaper === '' ? 'border-blue-500 text-blue-500' : 'border-gray-300 text-gray-400'
              }`}
            >
              默认
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">壁纸地址（输入图片 URL 设置自定义壁纸）</div>
          <Input
            value={/^https?:\/\//.test(settings.wallpaper) ? settings.wallpaper : ''}
            placeholder="https://…/wallpaper.jpg"
            onChange={(e) => updateSettings({ wallpaper: e.target.value.trim() })}
          />
          <div className="mt-2 text-xs text-gray-500">壁纸亮度</div>
          <InputNumber
            min={0.5}
            max={1}
            step={0.05}
            value={settings.wallpaperDim}
            onChange={(v) => updateSettings({ wallpaperDim: Number(v ?? 0.8) })}
            className="w-full"
          />
          <div className="mt-2 text-xs text-gray-500">壁纸模糊度（{settings.wallpaperBlur}px）</div>
          <InputNumber
            min={0}
            max={20}
            value={settings.wallpaperBlur}
            onChange={(v) => updateSettings({ wallpaperBlur: Number(v ?? 0) })}
            className="w-full"
          />
          <Divider />
          <div className="flex items-center justify-between">
            <span className="text-sm">幻灯片轮播壁纸</span>
            <Switch checked={settings.wallpaperSlideshow} onChange={(v) => updateSettings({ wallpaperSlideshow: v })} />
          </div>
          {settings.wallpaperSlideshow && (
            <>
              <Input.TextArea
                rows={3}
                value={settings.wallpaperUrls}
                placeholder={'轮播壁纸地址，每行一个\nhttps://example.com/1.jpg\nhttps://example.com/2.jpg'}
                onChange={(e) => updateSettings({ wallpaperUrls: e.target.value })}
              />
              <div>
                <div className="mb-1 text-sm">轮播间隔（{settings.wallpaperInterval} 秒）</div>
                <InputNumber min={5} max={3600} value={settings.wallpaperInterval} onChange={(v) => updateSettings({ wallpaperInterval: Number(v ?? 60) })} className="w-full" />
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-2 text-sm font-semibold">背景色</div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.color}
              onChange={(e) => updateSettings({ color: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded border border-gray-300"
            />
            <Input value={settings.color} onChange={(e) => updateSettings({ color: e.target.value })} />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm">简约模式</span>
        <Switch checked={settings.simpleMode} onChange={(v) => updateSettings({ simpleMode: v })} />
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold">打开方式</div>
        <Select
          value={settings.openType}
          onChange={(v) => updateSettings({ openType: v })}
          options={[
            { value: 'newtab', label: '新标签页' },
            { value: 'new', label: '新窗口' },
            { value: 'self', label: '当前页' },
          ]}
          className="w-full"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">显示底部区域</span>
        <Switch checked={settings.showBottomLinks} onChange={(v) => updateSettings({ showBottomLinks: v })} />
      </div>
      {settings.showBottomLinks && (
        <>
          <div className="text-sm font-semibold">底部链接管理</div>
          <div className="space-y-2">
            {(settings.bottomLinks || []).map((l, i) => (
              <div key={i} className="space-y-1.5 rounded-lg border border-gray-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Input
                    size="small"
                    value={l.name}
                    placeholder="链接名称（例如：京ICP备12345678号）"
                    onChange={(e) => {
                      const next = [...settings.bottomLinks];
                      next[i] = { ...l, name: e.target.value };
                      updateSettings({ bottomLinks: next });
                    }}
                  />
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => updateSettings({ bottomLinks: settings.bottomLinks.filter((_, j) => j !== i) })}
                  />
                </div>
                <Input
                  size="small"
                  value={l.url}
                  placeholder="链接地址（例如：https://beian.miit.gov.cn）"
                  onChange={(e) => {
                    const next = [...settings.bottomLinks];
                    next[i] = { ...l, url: e.target.value };
                    updateSettings({ bottomLinks: next });
                  }}
                />
                <Input
                  size="small"
                  value={l.icon || ''}
                  placeholder="链接图标（例如：/images/beian.png，可选）"
                  onChange={(e) => {
                    const next = [...settings.bottomLinks];
                    next[i] = { ...l, icon: e.target.value };
                    updateSettings({ bottomLinks: next });
                  }}
                />
              </div>
            ))}
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => updateSettings({ bottomLinks: [...(settings.bottomLinks || []), { name: '', url: '' }] })}
            >
              添加链接
            </Button>
          </div>
        </>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm">天气挂件</span>
        <Switch checked={settings.showWeather} onChange={(v) => updateSettings({ showWeather: v })} />
      </div>
      {settings.showWeather && <WeatherCitySelect value={settings.weatherCity} onChange={(v) => updateSettings({ weatherCity: v })} />}
      <div className="flex items-center justify-between">
        <span className="text-sm">历史记录挂件</span>
        <Switch checked={settings.showHistoryWidget} onChange={(v) => updateSettings({ showHistoryWidget: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">伪装助手（F2 切换）</span>
        <Switch checked={settings.disguiseEnabled} onChange={(v) => updateSettings({ disguiseEnabled: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">实时热榜</span>
        <Switch checked={settings.showHotEvents} onChange={(v) => updateSettings({ showHotEvents: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">实时汇率</span>
        <Switch checked={settings.showExchangeRate} onChange={(v) => updateSettings({ showExchangeRate: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">每日一言（页脚）</span>
        <Switch checked={settings.showYiyan} onChange={(v) => updateSettings({ showYiyan: v })} />
      </div>
      <Divider />
      <div className="text-sm font-semibold">浏览器标签页</div>
      <div>
        <div className="mb-1 text-sm">标签页名称</div>
        <Input
          value={settings.tabTitle}
          maxLength={60}
          placeholder="默认 CloudFlare-tab"
          onChange={(e) => updateSettings({ tabTitle: e.target.value })}
        />
      </div>
      <div>
        <div className="mb-1 text-sm">标签页图标（URL）</div>
        <Input
          value={settings.tabIcon}
          placeholder="默认 /icons/logo.png"
          onChange={(e) => updateSettings({ tabIcon: e.target.value.trim() })}
        />
        <div className="mt-1 text-xs text-gray-400">支持 http(s) 或站内路径；留空恢复默认。修改后即时生效并持久保存。</div>
      </div>
    </div>
  );
}

// ===== 天气城市选择（A17：数据源 /api/getCityList）=====
function WeatherCitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  useEffect(() => {
    (async () => {
      const resp = await get<{ label: string; value: string }[]>('/api/getCityList');
      if (resp.code === 200 && Array.isArray(resp.data)) setCities(resp.data);
    })();
  }, []);
  return (
    <div>
      <div className="mb-1 text-sm">天气城市</div>
      <Select
        showSearch
        optionFilterProp="label"
        value={value}
        onChange={onChange}
        options={cities}
        className="w-full"
        placeholder="选择城市"
      />
    </div>
  );
}
