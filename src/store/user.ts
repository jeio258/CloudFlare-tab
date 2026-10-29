// 认证状态：STORAGE_KEYS.user 存 {token, userInfo}；token 为单层字符串
import type { UserInfo } from '../api/types';
import { STORAGE_KEYS, readJSON, writeJSON, removeKey } from '../lib/storage';

export interface PersistUser {
  token?: string;
  userInfo?: UserInfo;
}

export function readPersist(): PersistUser {
  return readJSON<PersistUser>(STORAGE_KEYS.user, {});
}

export function writePersist(p: PersistUser) {
  const out: PersistUser = {};
  if (p.token) out.token = p.token;
  if (p.userInfo) out.userInfo = p.userInfo;
  writeJSON(STORAGE_KEYS.user, out);
}

export function clearPersist() {
  removeKey(STORAGE_KEYS.user);
}

// 旧数据 token 为双层 JSON 编码（外层对象 + 内层字符串）；只解一层，解出字符串才采用，
// 否则按单层原样返回，避免已迁移用户与新写入被再次解码。
export function getToken(): string {
  const t = readPersist().token;
  if (!t) return '';
  try {
    const decoded: unknown = JSON.parse(t);
    return typeof decoded === 'string' ? decoded : t;
  } catch {
    return t;
  }
}
