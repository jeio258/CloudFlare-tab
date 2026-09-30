// 认证辅助：从请求取当前用户 / 管理员
import type { Env, UserRow } from './core';
import { verifyToken } from './auth';
import { getUserById } from './db';

// 从 Authorization 头取 token，返回当前用户
export async function authUser(env: Env, request: Request): Promise<UserRow | null> {
  const header = request.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const uid = await verifyToken(env, token);
  if (!uid) return null;
  return getUserById(env, uid);
}

export const requireAdmin = async (env: Env, request: Request): Promise<UserRow | null> => {
  const user = await authUser(env, request);
  return user && Number(user.user_type) === 1 ? user : null;
};
