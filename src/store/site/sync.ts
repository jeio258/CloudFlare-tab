// 云同步编排：快照落地、推送基准时间戳、autoSync 防抖与防循环
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HomeCard } from '../../api/types';
import { normalizeCards, normalizeMemos } from '../../lib/normalize';
import type { SiteSettings } from '../settings';
import { pullSnapshot, pushSnapshot, type Snapshot } from '../sync';
import { collectMemos, restoreMemos } from './memo';
import { sanitizeSettings } from './settings';

export type SyncState = 'idle' | 'syncing' | 'pulled' | 'pushed';

interface SiteSyncOptions {
  token: string;
  isLogin: boolean;
  settings: SiteSettings;
  cards: HomeCard[];
  updateSettings: (patch: Partial<SiteSettings>) => void;
  setCards: (cards: HomeCard[]) => void;
}

export interface SiteSync {
  syncState: SyncState;
  syncMsg: string;
  pull: () => Promise<void>;
  push: () => Promise<void>;
  cloudTime: number;
}

export function useSiteSync({
  token,
  isLogin,
  settings,
  cards,
  updateSettings,
  setCards,
}: SiteSyncOptions): SiteSync {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMsg, setSyncMsg] = useState('');
  const [cloudTime, setCloudTime] = useState(0);

  const autoTimer = useRef<number | null>(null);
  const skipAuto = useRef(false);
  // syncState 经 ref 读取：若纳入 effect deps，会在每次同步状态变化时重排推送而自激
  const syncStateRef = useRef(syncState);
  syncStateRef.current = syncState;

  // 云快照落地（pull 两处共用）：markSkip 时抑制随后的 autoSync 推送（防拉取触发推送循环）
  // skipAuto 仅在「本次确实改动 settings/cards（也即会触发推送 effect）」时置位；
  // 勿对 memos 置位 skipAuto：memos 不改变 effect deps，标记会残留并误吞下一次用户改动的推送
  const applyPull = useCallback(
    (snapshot: Snapshot, timestamp: number, markSkip: boolean) => {
      const nextSettings = snapshot.settings ? sanitizeSettings(snapshot.settings) : undefined;
      const nextCards = snapshot.cards ? normalizeCards(snapshot.cards) : undefined;
      const replaceCards = !!(nextCards && nextCards.length);
      if (markSkip && (nextSettings || replaceCards)) skipAuto.current = true;
      if (nextSettings) updateSettings(nextSettings);
      if (replaceCards) setCards(nextCards!);
      if (snapshot.memos) restoreMemos(normalizeMemos(snapshot.memos));
      setCloudTime(timestamp);
      setSyncMsg('已拉取云端数据');
      setSyncState('pulled');
    },
    [updateSettings, setCards]
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

  const pull = useCallback(async () => {
    if (!token) return;
    setSyncState('syncing');
    const { snapshot, timestamp } = await pullSnapshot(token);
    if (snapshot) applyPull(snapshot, timestamp, true);
    else {
      setSyncMsg('云端暂无数据');
      setSyncState('idle');
    }
  }, [token, applyPull]);

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
    if (syncStateRef.current === 'syncing') return;
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    autoTimer.current = window.setTimeout(() => {
      push();
    }, 2000);
    return () => {
      if (autoTimer.current) window.clearTimeout(autoTimer.current);
    };
    // settings 已含 autoSync；syncState 经 ref 读取，不纳入 deps（避免同步状态变化自激重排）
  }, [settings, cards, isLogin, token]);

  return { syncState, syncMsg, pull, push, cloudTime };
}
