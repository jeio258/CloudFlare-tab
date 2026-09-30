// 认证状态：localStorage 'persist:user' 存 {token}，对齐参考前端存储口径
import { post, get } from '../api/client';
import type { LoginData, UserInfo } from '../api/types';

const KEY = 'persist:user';

export interface PersistUser {
  token?: string;
  userInfo?: UserInfo;
}

export function readPersist(): PersistUser {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PersistUser) : {};
  } catch {
    return {};
  }
}

export function writePersist(p: PersistUser) {
  // 对齐参考存储口径：token 字段为 JSON 编码的字符串（redux-persist 风格）
  const out: PersistUser = {};
  if (p.token) out.token = JSON.stringify(p.token);
  if (p.userInfo) out.userInfo = p.userInfo;
  localStorage.setItem(KEY, JSON.stringify(out));
}

export function clearPersist() {
  localStorage.removeItem(KEY);
}

export function getToken(): string {
  const t = readPersist().token;
  if (!t) return '';
  try {
    return JSON.parse(t) as string;
  } catch {
    return t;
  }
}

export async function login(username: string, password: string) {
  const resp = await post<LoginData>('/api/login', { username, password });
  if (resp.code === 200 && resp.data) {
    writePersist({ token: resp.data.token, userInfo: resp.data.userInfo });
  }
  return resp;
}

export async function logout() {
  await get('/api/user/logout');
  clearPersist();
}
