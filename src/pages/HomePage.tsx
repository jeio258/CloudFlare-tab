// 首页：对齐参考的顶部锚定节奏（时钟 y62 / 搜索 y174 / 卡行 y262，gap 32·40）
// 沉浸状态（immersive）：隐藏卡片网格与挂件，仅保留时间/日期/搜索框与右上菜单按钮；四方块按钮或时间/日期点击切换
import { useState } from 'react';
import WallpaperLayer from '../components/home/WallpaperLayer';
import ClockAndDate from '../components/home/ClockAndDate';
import SearchBar from '../components/home/SearchBar';
import CardDeck from '../components/home/CardDeck';
import BottomLinks from '../components/home/BottomLinks';
import AvatarMenu from '../components/home/AvatarMenu';
import WeatherChip from '../components/home/WeatherChip';
import HistoryWidget from '../components/home/HistoryWidget';
import DisguiseLayer from '../components/home/DisguiseLayer';
import CardEditModal from '../components/settings/CardEditModal';
import { HotEventsCard, ExchangeRateCard } from '../components/home/Widgets';
import { SettingsDrawer } from '../components/settings/SettingsDrawer';
import type { SettingsTab } from '../components/settings/SettingsDrawer';
import { useSite } from '../store/site';

// 右上四方块菜单按钮（沉浸状态切换入口之一）
function GridToggleButton({ immersive, onToggle }: { immersive: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={immersive ? '退出沉浸状态' : '进入沉浸状态'}
      onClick={onToggle}
      className="fixed right-[76px] top-[16px] z-50 -m-3.5 p-3.5 text-white/95 transition-colors hover:text-white"
    >
      <svg viewBox="0 0 1024 1024" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
        <path d="M864 144H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm0 400H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zM464 144H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm0 400H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16z" />
      </svg>
    </button>
  );
}

export default function HomePage() {
  const { cards, settings, updateSettings } = useSite();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('home');
  const [editTarget, setEditTarget] = useState<string | 'new' | null>(null);

  const openTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setDrawerOpen(true);
  };

  const immersive = settings.immersive;
  const toggleImmersive = () => updateSettings({ immersive: !immersive });

  // 简约模式：移除顶部（时间搜索均禁用），显示自定义文本
  const simpleHideHeader = settings.simpleMode && settings.simpleRemoveHeader;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <WallpaperLayer />
      <div className="fixed inset-0 z-0 flex h-full w-full flex-col">
        {/* 顶部锚定内容列：时钟与搜索固定（不随滚动）；对齐与原滚动列一致（items-center 居中、pt-[62px] 顶距不变） */}
        {simpleHideHeader ? (
          settings.simpleText ? (
            <div
              onClick={() => settings.simpleExitByText && updateSettings({ simpleMode: false })}
              className={`flex flex-none items-center justify-center px-4 pt-[62px] text-center text-white ${settings.simpleExitByText ? 'cursor-pointer' : ''}`}
              style={{ minHeight: settings.simpleTextHeight, color: settings.simpleChangeColor ? settings.simpleTextColor : undefined }}
            >
              {settings.simpleText}
            </div>
          ) : (
            <div className="h-[62px] flex-none" />
          )
        ) : (
          <div className="flex w-full flex-none flex-col items-center px-4 pt-[62px]">
            {/* 时间/日期区域：点击切换沉浸状态 */}
            <div onClick={toggleImmersive} className="cursor-pointer">
              <ClockAndDate />
            </div>
            <div className="mt-8">
              <SearchBar />
            </div>
          </div>
        )}
        {/* 卡片+挂件区：唯一滚动容器（隐藏滚动条）；移动端固定显示 4 行（4×64 + 3×40），其余滚动查看 */}
        <div
          className={`scrollbar-none mx-auto flex w-full max-w-[1280px] min-h-0 flex-1 flex-col items-center overflow-y-auto max-md:h-[376px] max-md:flex-none ${immersive ? 'overflow-hidden' : ''}`}
        >
          {!immersive && (
            <>
              <div className="mt-10 w-full">
                <CardDeck
                  cards={cards}
                  groups={settings.cardGroups}
                  onAddCard={() => openTab('cards')}
                  onOpenSettings={() => openTab('home')}
                  onEditCard={(id) => setEditTarget(id)}
                />
              </div>
              {(settings.showHotEvents || settings.showExchangeRate || settings.showHistoryWidget) && (
                <div className="mb-16 mt-6 flex flex-wrap justify-center gap-4">
                  {settings.showHistoryWidget && <HistoryWidget />}
                  {settings.showHotEvents && <HotEventsCard />}
                  {settings.showExchangeRate && <ExchangeRateCard />}
                </div>
              )}
            </>
          )}
        </div>
        {settings.showBottomLinks && <BottomLinks onOpenSettings={() => openTab('home')} showYiyan={settings.showYiyan} />}
      </div>
      <div className="fixed right-[14px] top-[14px] z-50">
        <AvatarMenu onOpenTab={openTab} />
      </div>
      <GridToggleButton immersive={immersive} onToggle={toggleImmersive} />
      {settings.showWeather && !immersive ? <WeatherChip /> : null}
      <DisguiseLayer />
      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        active={activeTab}
        onChange={setActiveTab}
      />
      <CardEditModal open={editTarget !== null} cardId={editTarget} onClose={() => setEditTarget(null)} />
    </div>
  );
}
