// 用户信息映射：字段按前端读取口径
import type { UserRow } from './core';

export function toUserInfo(u: UserRow) {
  return {
    userId: u.id,
    username: u.username,
    nickname: u.nickname || '',
    sex: Number(u.sex) || 0,
    phone: u.phone || '',
    birthday: u.birthday || '',
    avatar: u.avatar || '',
    userType: Number(u.user_type) || 0,
    shareEnabled: Number(u.share_enabled) || 0,
    shareId: u.share_id || '',
    appellation: '',
    appellationStatus: 0,
    registerTime: u.created_at || '',
  };
}
