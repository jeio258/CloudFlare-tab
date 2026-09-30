// 认证相关路由：登录 / 注册
import { ApiError } from '../core';
import type { RouteContext } from '../core';
import { toUserInfo } from '../contract';
import {
  USERNAME_RE, validPassword,
  createToken, verifyPassword, hashPassword, newId,
} from '../auth';
import { checkAuthRateLimit, recordAuthRateLimit } from '../ratelimit';
import { getUserByUsername, getUserById, insertUser, updatePassword, updateProfile, getUserData, upsertUserData, getUserCards, replaceUserCards } from '../db';

export const login = async ({ env, request, body }: RouteContext) => {
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!username || !password) throw new ApiError(400, '用户名和密码不能为空');
  await checkAuthRateLimit(env, request, 'login', username);
  const user = await getUserByUsername(env, username);
  if (!user || !(await verifyPassword(password, user.password))) {
    await recordAuthRateLimit(env, request, 'login', username);
    throw new ApiError(400, '用户名或密码错误');
  }
  if (Number(user.status) === 0) {
    await recordAuthRateLimit(env, request, 'login', username);
    throw new ApiError(403, '账号已被禁用');
  }
  const token = await createToken(env, user.id);
  return { token, userInfo: toUserInfo(user) };
};

export const register = async ({ env, request, body }: RouteContext) => {
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!USERNAME_RE.test(username)) throw new ApiError(400, '用户名需字母开头、3-20 位字母数字_-');
  if (!validPassword(password)) throw new ApiError(400, '密码长度需在 6-32 位之间');
  await checkAuthRateLimit(env, request, 'register', username);
  if (await getUserByUsername(env, username)) throw new ApiError(400, '用户名已存在');

  await insertUser(env, {
    id: newId(),
    username,
    password: await hashPassword(password),
    nickname: username,
    phone: '',
    avatar: '',
    sex: 0,
    birthday: '',
    user_type: 0,
    status: 1,
    share_id: newId(),
    share_enabled: 0,
  });
  await recordAuthRateLimit(env, request, 'register', username);
  return null;
};

// 找回密码：用户名 + 原密码 + 新密码（无邮箱/验证码）
export const findPassword = async ({ env, request, body }: RouteContext) => {
  const username = String(body.username || '').trim();
  const oldPassword = String(body.oldPassword || '');
  const newPassword = String(body.newPassword || '');
  const confirmPassword = String(body.confirmPassword || '');
  if (!username) throw new ApiError(400, '请输入用户名');
  if (!oldPassword) throw new ApiError(400, '请输入原密码');
  if (!validPassword(newPassword)) throw new ApiError(400, '新密码长度需在 6-32 位之间');
  if (newPassword !== confirmPassword) throw new ApiError(400, '两次输入的新密码不一致');
  await checkAuthRateLimit(env, request, 'findPassword', username);

  const user = await getUserByUsername(env, username);
  if (!user) throw new ApiError(400, '用户不存在');
  if (!(await verifyPassword(oldPassword, user.password))) {
    await recordAuthRateLimit(env, request, 'findPassword', username);
    throw new ApiError(400, '原密码错误');
  }
  await updatePassword(env, user.id, await hashPassword(newPassword));
  await recordAuthRateLimit(env, request, 'findPassword', username);
  return null;
};

// —— user 子路由 ——
export const getUserInfo = async ({ user }: RouteContext) => toUserInfo(user!);
export const logout = async () => null;

export const isAdmin = async ({ user }: RouteContext) => {
  if (Number(user!.user_type) === 1 && Number(user!.status) !== 0) return true;
  throw new ApiError(403, '无权限');
};

export const changePassword = async ({ env, user, body }: RouteContext) => {
  const oldPassword = String(body.oldPassword || '');
  const newPassword = String(body.newPassword || '');
  const confirmPassword = String(body.confirmPassword || '');
  if (!oldPassword || !newPassword) throw new ApiError(400, '密码不能为空');
  if (newPassword !== confirmPassword) throw new ApiError(400, '两次输入的新密码不一致');
  if (newPassword.length < 6 || newPassword.length > 32) throw new ApiError(400, '新密码长度需在 6-32 位之间');
  if (!(await verifyPassword(oldPassword, user!.password))) throw new ApiError(400, '原密码错误');
  await updatePassword(env, user!.id, await hashPassword(newPassword));
  return null;
};

export const editUserInfo = async ({ env, user, body }: RouteContext) => {
  const username = String(body.username ?? user!.username).trim();
  const nickname = String(body.nickname ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const sex = Number(body.sex ?? 0);
  const birthdayRaw = body.birthday;
  const birthday = birthdayRaw === undefined || birthdayRaw === null ? null : String(birthdayRaw);

  if (!USERNAME_RE.test(username)) throw new ApiError(400, '用户名需字母开头、3-20 位字母数字_-');
  if (nickname.length > 20) throw new ApiError(400, '昵称不能超过 20 个字符');
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) throw new ApiError(400, '手机号格式不正确');
  if (sex !== 0 && sex !== 1) throw new ApiError(400, '性别参数不正确');

  if (username !== user!.username) {
    const exists = await getUserByUsername(env, username);
    if (exists && exists.id !== user!.id) throw new ApiError(400, '用户名已存在');
  }
  await updateProfile(env, user!.id, { username, nickname, sex, phone, birthday });
  const fresh = await getUserById(env, user!.id);
  return toUserInfo(fresh || user!);
};

// —— 云同步 ——
const MAX_DATA_BYTES = 262144;

export const push = async ({ env, user, body }: RouteContext) => {
  const data = body.data;
  const timestamp = Number(body.timestamp);
  const baseTimestamp = typeof body.baseTimestamp === 'number' ? body.baseTimestamp : undefined;
  if (data === undefined || data === null || !Number.isFinite(timestamp)) {
    throw new ApiError(400, '参数错误');
  }
  const payload = JSON.stringify(data);
  if (payload.length > MAX_DATA_BYTES) throw new ApiError(400, '数据过大，无法保存');

  const row = await getUserData(env, user!.id);
  const stored = row ? Number(row.timestamp) : 0;
  if (row && typeof baseTimestamp === 'number' && baseTimestamp < stored) {
    throw new ApiError(409, '云端数据已更新', 409);
  }
  const newTs = Math.max(timestamp, stored + 1);
  // 书签行存储：快照中的 cards 数组拆行写入 cards 表（ord = 数组下标）；pull 按序拼回原始数组
  const cardsArr = data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).cards)
    ? ((data as Record<string, unknown>).cards as unknown[])
    : null;
  if (cardsArr) await replaceUserCards(env, user!.id, cardsArr);
  await upsertUserData(env, user!.id, payload, newTs);
  return { timestamp: newTs };
};

// 个性分享开关：share_enabled 0|1（新增端点，契约只加不减）；share_id 注册时已生成
export const setShare = async ({ env, user, body }: RouteContext) => {
  const enabled = Number(body.enabled);
  if (enabled !== 0 && enabled !== 1) throw new ApiError(400, '参数错误');
  await env.DB.prepare('update users set share_enabled = ? where id = ?').bind(enabled, user!.id).run();
  return { shareId: user!.share_id };
};

export const pullWT = async ({ env, user }: RouteContext) => {
  const row = await getUserData(env, user!.id);
  if (!row) return { timestamp: 0, data: null };
  try {
    const parsed = JSON.parse(row.data) as Record<string, unknown>;
    // 书签行存储：优先从 cards 表按 ord 拼回原始数组；行表为空但旧快照内嵌 cards 时惰性迁移
    const cards = await getUserCards(env, user!.id);
    if (!cards.length && Array.isArray(parsed.cards) && parsed.cards.length) {
      await replaceUserCards(env, user!.id, parsed.cards);
      parsed.cards = await getUserCards(env, user!.id);
    } else if (cards.length) {
      parsed.cards = cards;
    }
    return { timestamp: Number(row.timestamp), data: parsed };
  } catch {
    return { timestamp: Number(row.timestamp), data: null };
  }
};
