// 站点全局 store：设置 + 卡片 + 云同步（所有 UI 数据源）
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './settings';
import type { SiteSettings } from './settings';
import type { HomeCard } from '../api/types';
import { get } from '../api/client';
import type { DefaultData } from '../api/types';
import { pullSnapshot, pushSnapshot, type Snapshot } from './sync';
import { useAuth } from './auth';
import { normalizeCards, normalizeMemos, normalizeSettings } from '../lib/normalize';

// 记事本内容随快照云同步（P2-6）：push 收集、pull 还原；旧快照无 memos 字段时本地不动（向后兼容）
const MEMO_PREFIX = 'persist:memo:';
function collectMemos(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(MEMO_PREFIX)) out[k.slice(MEMO_PREFIX.length)] = localStorage.getItem(k) || '';
    }
  } catch {
    /* 忽略 */
  }
  return out;
}
function restoreMemos(memos: Record<string, string>) {
  try {
    for (const [id, text] of Object.entries(memos)) localStorage.setItem(MEMO_PREFIX + id, text);
  } catch {
    /* 忽略 */
  }
  window.dispatchEvent(new CustomEvent('cftab:memos-restored'));
}

// 快照落地统一过信任边界：settings 先原始合并、再以净化结果覆盖安全相关字段
function applySnapshotClean(snapshot: Snapshot): { settings?: Partial<SiteSettings>; cards?: HomeCard[] } {
  return {
    settings: snapshot.settings
      ? { ...(snapshot.settings as Partial<SiteSettings>), ...normalizeSettings(snapshot.settings) }
      : undefined,
    cards: snapshot.cards ? normalizeCards(snapshot.cards) : undefined,
  };
}

// 内置默认卡片：对齐参考默认主页（同文案；链接/图标本地化）；首页末位另渲染「添加卡片」方块
export const DEFAULT_CARDS: HomeCard[] = [
  { id: 'welcome', title: '欢迎使用', subTitle: '官方网站', url: 'https://github.com/jeio258/CloudFlare-tab', icon: '/icons/ref-welcome.svg' },
  { id: 'changelog', title: '版本日志', subTitle: '功能迭代记录', url: 'https://github.com/jeio258/CloudFlare-tab/blob/master/README.md', icon: '/icons/ref-changelog.svg' },
  { id: 'cloud', title: '云服务器', subTitle: '稳定、高性价比', url: 'https://pages.cloudflare.com', icon: '/icons/ref-cloud.svg' },
  { id: 'qq', title: '用户交流群', subTitle: '加入QQ群', url: 'https://github.com/jeio258/CloudFlare-tab', icon: '/icons/ref-qq.svg' },
];

// 卡片本地持久化（对齐 settings：导入/编辑/拖拽即写 localStorage，刷新不丢）
// 读取过信任边界：本地遗留/被污染数据同样收敛，防畸形值致渲染崩溃
const CARDS_KEY = 'persist:cards';
function loadCards(): HomeCard[] | null {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (!raw) return null;
    const list = normalizeCards(JSON.parse(raw));
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}
function saveCards(cards: HomeCard[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

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
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'pulled' | 'pushed'>('idle');
  const [syncMsg, setSyncMsg] = useState('');
  const [cloudTime, setCloudTime] = useState(0);

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

  // 浏览器标签页标题/图标即时同步（用户自定义，空值回落默认）
  useEffect(() => {
    document.title = settings.tabTitle || 'CloudFlare-tab';
    const DEFAULT_ICON = '/icons/logo.png';
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
  }, []);

  // 登录后变更自动推送云端（autoSync 开关）：设置/卡片变更后 debounce 2s；拉取/同步中跳过防循环
  const autoTimer = useRef<number | null>(null);
  const skipAuto = useRef(false);

  // 云快照落地（pull 两处共用）：markSkip=true 时抑制随后的 autoSync 推送（防拉取触发推送循环）
  const applyPull = useCallback(
    (snapshot: Snapshot, timestamp: number, markSkip: boolean) => {
      const clean = applySnapshotClean(snapshot);
      if (clean.settings) {
        if (markSkip) skipAuto.current = true;
        setSettings((p) => {
          const next = { ...p, ...clean.settings };
          saveSettings(next);
          return next;
        });
      }
      if (clean.cards && clean.cards.length) {
        if (markSkip) skipAuto.current = true;
        persistSetCards(clean.cards);
      }
      if (snapshot.memos) {
        if (markSkip) skipAuto.current = true;
        restoreMemos(normalizeMemos(snapshot.memos));
      }
      setCloudTime(timestamp);
      setSyncMsg('已拉取云端数据');
      setSyncState('pulled');
    },
    [persistSetCards]
  );

  // 登录后自动拉取云快照
  useEffect(() => {
    if (!isLogin || !token) return;
    let alive = true;
    (async () => {
      setSyncState('syncing');
      const { snapshot, timestamp } = await pullSnapshot(token);
      if (!alive) return;
      if (snapshot) applyPull(snapshot, timestamp, false);
      else setSyncState('idle');
    })();
    return () => {
      alive = false;
    };
  }, [isLogin, token, applyPull]);

  const pull = useCallback(
    async () => {
      if (!token) return;
      setSyncState('syncing');
      const { snapshot, timestamp } = await pullSnapshot(token);
      if (snapshot) applyPull(snapshot, timestamp, true);
      else {
        setSyncMsg('云端暂无数据');
        setSyncState('idle');
      }
    },
    [token, applyPull]
  );

  const push = useCallback(async () => {
    if (!token) return;
    setSyncState('syncing');
    // baseTimestamp 用本地记录的云端权威时间戳（pull/push 后均更新），避免每次 push 前全量 pullWT；
    // 无本地基准（cloudTime=0，如换设备首推）时才走一次慢路径获取
    let base = cloudTime;
    if (!base) base = (await pullSnapshot(token)).timestamp;
    const data: Snapshot = { settings, cards, memos: normalizeMemos(collectMemos()) };
    const r = await pushSnapshot(token, data, base);
    if (r.ok) {
      setCloudTime(r.timestamp || Date.now());
      setSyncMsg('已同步到云端');
      setSyncState('pushed');
    } else {
      setSyncMsg(r.msg);
      setSyncState('idle');
    }
  }, [token, settings, cards, cloudTime]);

  // 登录后变更自动推送云端（autoSync 开关）：设置/卡片变更后 debounce 2s；拉取/同步中跳过防循环
  useEffect(() => {
    if (!isLogin || !token || !settings.autoSync) return;
    if (skipAuto.current) {
      skipAuto.current = false;
      return;
    }
    if (syncState === 'syncing') return;
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    autoTimer.current = window.setTimeout(() => {
      push();
    }, 2000);
    return () => {
      if (autoTimer.current) window.clearTimeout(autoTimer.current);
    };
  }, [settings, cards, isLogin, token, settings.autoSync]);

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
