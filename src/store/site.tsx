// 站点全局 store：组装设置/卡片持久化、记事本与云同步（所有 UI 数据源）
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { get } from '../api/request';
import type { DefaultData, HomeCard } from '../api/types';
import { normalizeCards } from '../lib/normalize';
import { useAuth } from './auth';
import { DEFAULT_CARDS, DEFAULT_SETTINGS, loadCards, loadSettings, saveCards, saveSettings } from './site/settings';
import { useSiteSync } from './site/sync';
import type { SiteSettings } from './settings';

export { DEFAULT_CARDS } from './site/settings';

interface SiteStore {
  settings: SiteSettings;
  updateSettings: (patch: Partial<SiteSettings>) => void;
  resetSettings: () => void;
  cards: HomeCard[];
  setCards: (cards: HomeCard[]) => void;
  syncState: 'idle' | 'syncing' | 'pulled' | 'pushed';
  syncMsg: string;
  pull: () => Promise<void>;
  push: () => Promise<void>;
  cloudTime: number;
}

const Ctx = createContext<SiteStore | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const { token, isLogin } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>(loadSettings);
  const [cards, setCards] = useState<HomeCard[]>(() => loadCards() ?? DEFAULT_CARDS);

  // 本地设置变化即持久化
  const updateSettings = useCallback((patch: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // 卡片写路径统一入口：内存 + 本地持久化
  const persistSetCards = useCallback((next: HomeCard[]) => {
    saveCards(next);
    setCards(next);
  }, []);

  const resetSettings = useCallback(() => {
    saveSettings({ ...DEFAULT_SETTINGS });
    setSettings({ ...DEFAULT_SETTINGS });
    saveCards(DEFAULT_CARDS);
    setCards(DEFAULT_CARDS);
  }, []);

  const { syncState, syncMsg, pull, push, cloudTime } = useSiteSync({
    token,
    isLogin,
    settings,
    cards,
    updateSettings,
    setCards: persistSetCards,
  });

  // 浏览器标签页标题/图标即时同步（用户自定义，空值回落默认）
  useEffect(() => {
    document.title = settings.tabTitle || 'CloudFlare-tab';
    const DEFAULT_ICON = '/favicon.ico';
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const href = settings.tabIcon || DEFAULT_ICON;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (link.href !== new URL(href, location.origin).href) link.href = href;
  }, [settings.tabTitle, settings.tabIcon]);

  // 公开默认主页（游客可见）：取云端默认卡片
  useEffect(() => {
    let alive = true;
    (async () => {
      const resp = await get<DefaultData>('/api/getDefaultData');
      if (!alive) return;
      // 用户已有本地卡片（导入/编辑过）时不覆盖
      if (resp.code === 200 && resp.data?.data && !loadCards()) {
        const d = resp.data.data as { home?: { cards?: HomeCard[] } };
        if (Array.isArray(d?.home?.cards) && d.home.cards.length) persistSetCards(normalizeCards(d.home.cards));
      }
    })();
    return () => {
      alive = false;
    };
  }, [persistSetCards]);

  const value = useMemo<SiteStore>(
    () => ({ settings, updateSettings, resetSettings, cards, setCards: persistSetCards, syncState, syncMsg, pull, push, cloudTime }),
    [settings, updateSettings, resetSettings, cards, syncState, syncMsg, pull, push, cloudTime]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSite must be used within SiteProvider');
  return v;
}
