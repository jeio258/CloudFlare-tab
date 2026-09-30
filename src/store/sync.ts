// 云同步：整份快照 push/pull（对齐后端 409 冲突契约），数据 = {settings, cards}
// 关键：baseTimestamp 必须用后端权威 timestamp（pullWT 返回的 timestamp），而非 payload 内部时间戳
import { get, post } from '../api/client';
import type { SiteSettings } from './settings';
import type { HomeCard } from '../api/types';

export interface Snapshot {
  settings?: SiteSettings;
  cards?: HomeCard[];
  /** 记事本内容（cardId → 文本）；旧快照无此字段，保持本地不动（向后兼容） */
  memos?: Record<string, string>;
}

export interface PullResult {
  snapshot: Snapshot | null;
  /** 后端权威时间戳（作为下次 push 的 baseTimestamp） */
  timestamp: number;
}

export async function pullSnapshot(token: string): Promise<PullResult> {
  const resp = await get<{ timestamp: number; data: Snapshot | null }>(
    '/api/user/pullWT',
    { headers: { authorization: token } }
  );
  if (resp.code === 200 && resp.data) {
    return { snapshot: resp.data.data ?? null, timestamp: Number(resp.data.timestamp) || 0 };
  }
  return { snapshot: null, timestamp: 0 };
}

export async function pushSnapshot(
  token: string,
  data: Snapshot,
  baseTimestamp: number
): Promise<{ ok: boolean; msg: string; timestamp?: number }> {
  const resp = await post<{ timestamp: number }>(
    '/api/user/push',
    { data, timestamp: Date.now(), baseTimestamp },
    token
  );
  if (resp.code === 200) return { ok: true, msg: resp.msg, timestamp: resp.data?.timestamp };
  if (resp.code === 409) return { ok: false, msg: '云端数据已更新，请先拉取', timestamp: resp.data?.timestamp };
  return { ok: false, msg: resp.msg || '同步失败' };
}
