// 管理后台路由：用户管理 / 公告管理 / 默认主页管理（全部 admin 鉴权）
import { ApiError } from '../core';
import type { RouteContext } from '../core';
import { USERNAME_RE, validPassword, hashPassword, newId } from '../auth';
import {
  getUserByUsername, insertUser, setUserType as dbSetUserType, setUserStatus, deleteUserCascade,
  insertNotice, updateNotice, deleteNotice as dbDeleteNotice, getNoticeById, publishNotice,
  upsertCurrentDefault, insertHistory, clearHistoryEnabled, setHistoryEnabled,
  getHistoryById, getEnabledHistory, deleteHistory, pruneHistory,
} from '../db';
import { readPaging } from '../paging';

// —— 仪表盘（A12：总用户/今日新增/分享开启数）——
export const dashboard = async ({ env }: RouteContext) => {
  const users = await env.DB.prepare('select count(*) as c from users').first<{ c: number }>();
  const today = await env.DB.prepare("select count(*) as c from users where created_at >= date('now','start of day')").first<{ c: number }>().catch(() => ({ c: 0 }));
  const shares = await env.DB.prepare('select count(*) as c from users where share_enabled = 1').first<{ c: number }>();
  return { totalUsers: users?.c ?? 0, todayUsers: (today as { c: number } | null)?.c ?? 0, shareUsers: shares?.c ?? 0 };
};

// —— 用户管理 ——
export const addUser = async ({ env, body }: RouteContext) => {
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const nickname = String(body.nickname || '').trim() || username;
  const phone = String(body.phone || '').trim();
  const sex = Number(body.sex ?? 0);
  const userType = Number(body.userType ?? body.user_type ?? 0) === 1 ? 1 : 0;

  if (!USERNAME_RE.test(username)) throw new ApiError(400, '用户名需字母开头、3-20 位字母数字_-');
  if (!validPassword(password)) throw new ApiError(400, '密码长度需在 6-32 位之间');
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) throw new ApiError(400, '手机号格式不正确');
  if (await getUserByUsername(env, username)) throw new ApiError(400, '用户名已存在');

  await insertUser(env, {
    id: newId(), username, password: await hashPassword(password), nickname,
    phone, avatar: '', sex, birthday: '', user_type: userType, status: 1,
    share_id: newId(), share_enabled: 0,
  });
  return null;
};

export const setUserType = async ({ env, admin, body }: RouteContext) => {
  const userId = String(body.userId || '');
  const type = Number(body.type ?? -1);
  if (!userId || (type !== 0 && type !== 1)) throw new ApiError(400, '参数错误');
  if (userId === admin!.id) throw new ApiError(400, '不能修改自己的管理员身份');
  await dbSetUserType(env, userId, type);
  return null;
};

export const enableUser = async ({ env, admin, body }: RouteContext) => {
  const userId = String(body.userId || '');
  if (!userId) throw new ApiError(400, '参数错误');
  if (userId === admin!.id) throw new ApiError(400, '不能操作自己的账号');
  await setUserStatus(env, userId, 1);
  return null;
};

export const disableUser = async ({ env, admin, body }: RouteContext) => {
  const userId = String(body.userId || '');
  if (!userId) throw new ApiError(400, '参数错误');
  if (userId === admin!.id) throw new ApiError(400, '不能操作自己的账号');
  await setUserStatus(env, userId, 0);
  return null;
};

export const deleteUser = async ({ env, admin, body }: RouteContext) => {
  const userId = String(body.userId || body.id || '');
  if (!userId) throw new ApiError(400, '参数错误');
  if (userId === admin!.id) throw new ApiError(400, '不能删除自己的账号');
  await deleteUserCascade(env, userId);
  return null;
};

// 用户列表（端点沿用官方命名，返回全部用户；支持 GET/POST 分页）
export const listUsers = async (ctx: RouteContext) => {
  const { page, pageSize, keyword } = await readPaging(ctx.request);
  const db = ctx.env.DB;
  const where = keyword ? 'where username like ? or nickname like ?' : '';
  const args = keyword ? [`%${keyword}%`, `%${keyword}%`] : [];
  const totalRow = await db.prepare(`select count(*) as n from users ${where}`).bind(...args).first<{ n: number }>();
  const total = Number(totalRow?.n || 0);
  const rows = await db
    .prepare(
      `select id, username, user_type as userType, status, nickname, sex, phone, avatar, birthday,
              '' as appellation, 0 as appellationStatus,
              created_at as registerTime, created_at as updatedAt
       from users ${where} order by created_at desc limit ? offset ?`
    )
    .bind(...args, pageSize, (page - 1) * pageSize)
    .all<Record<string, unknown>>();
  return { list: rows.results || [], total };
};

// —— 公告管理 ——
export const addNotice = async ({ env, admin, body }: RouteContext) => {
  const title = String(body.title || '').trim();
  const content = String(body.content || '');
  if (!title) throw new ApiError(400, '标题不能为空');
  await insertNotice(env, newId(), title, content, admin!.username);
  return null;
};

export const editNotice = async ({ env, body }: RouteContext) => {
  const id = String(body.id || '');
  const title = String(body.title || '').trim();
  const content = String(body.content || '');
  if (!id || !title) throw new ApiError(400, '参数错误');
  const row = await getNoticeById(env, id);
  if (!row) throw new ApiError(400, '公告不存在');
  // 编辑已发布公告重置为待确认，复用 confirmNotice 二次确认流程
  await updateNotice(env, id, title, content, Number(row.status) === 1);
  return null;
};

export const deleteNotice = async ({ env, body }: RouteContext) => {
  const id = String(body.id || '');
  if (!id) throw new ApiError(400, '参数错误');
  await dbDeleteNotice(env, id);
  return null;
};

export const confirmNotice = async ({ env, body }: RouteContext) => {
  const id = String(body.id || '');
  if (!id) throw new ApiError(400, '参数错误');
  if (!(await getNoticeById(env, id))) throw new ApiError(400, '公告不存在');
  await publishNotice(env, id);
  return null;
};

export const rejectNotice = async ({ env, body }: RouteContext) => {
  const id = String(body.id || '');
  if (!id) throw new ApiError(400, '参数错误');
  await dbDeleteNotice(env, id);
  return null;
};

export const listNotices = async (ctx: RouteContext) => {
  const { page, pageSize } = await readPaging(ctx.request);
  const db = ctx.env.DB;
  const totalRow = await db.prepare('select count(*) as n from notices').first<{ n: number }>();
  const total = Number(totalRow?.n || 0);
  const rows = await db
    .prepare(
      'select id, title, content, status, time_code as timeCode, created_by as username, created_at from notices order by created_at desc, id desc limit ? offset ?'
    )
    .bind(pageSize, (page - 1) * pageSize)
    .all<Record<string, unknown>>();
  return { list: rows.results || [], total };
};

// —— 默认主页管理 ——
export const setDefaultData = async ({ env, admin, body }: RouteContext) => {
  const data = body.data;
  if (data === undefined || data === null) throw new ApiError(400, '参数错误');
  const now = new Date().toISOString();
  const dataJson = JSON.stringify(data);
  if (dataJson.length > 262144) throw new ApiError(400, '数据过大，无法保存');
  const db = env.DB;
  await db.batch([
    db
      .prepare(
        `insert into default_data (id, data, created_at) values (1, ?, ?)
         on conflict(id) do update set data = excluded.data, created_at = excluded.created_at`
      )
      .bind(dataJson, now),
    db.prepare('update default_data_history set enabled = 0'),
    db
      .prepare('insert into default_data_history (id, data, enabled, created_by, created_at) values (?, ?, 1, ?, ?)')
      .bind(newId(), dataJson, admin!.username, now),
  ]);
  return null;
};

export const listDefaultData = async (ctx: RouteContext) => {
  const { page, pageSize } = await readPaging(ctx.request);
  const db = ctx.env.DB;
  const totalRow = await db.prepare('select count(*) as n from default_data_history').first<{ n: number }>();
  const total = Number(totalRow?.n || 0);
  const rows = await db
    .prepare(
      'select id, data, enabled, created_by as username, created_at from default_data_history order by created_at desc, id desc limit ? offset ?'
    )
    .bind(pageSize, (page - 1) * pageSize)
    .all<Record<string, unknown>>();
  return { list: rows.results || [], total };
};

export const enableDefaultData = async ({ env, body }: RouteContext) => {
  const id = String(body.id || '');
  if (!id) throw new ApiError(400, '参数错误');
  const row = await getHistoryById(env, id);
  if (!row) throw new ApiError(400, '记录不存在');
  await clearHistoryEnabled(env);
  await setHistoryEnabled(env, id, 1);
  await upsertCurrentDefault(env, row.data, row.created_at);
  return null;
};

export const disableDefaultData = async ({ env, body }: RouteContext) => {
  const id = String(body.id || '');
  if (!id) throw new ApiError(400, '参数错误');
  await setHistoryEnabled(env, id, 0);
  // 重新依据剩余启用项同步当前默认主页；无则清除
  const enabled = await getEnabledHistory(env);
  if (enabled) await upsertCurrentDefault(env, enabled.data, enabled.created_at);
  else await env.DB.prepare('delete from default_data where id = 1').run();
  return null;
};

export const deleteDefaultData = async ({ env, body }: RouteContext) => {
  const id = String(body.id || '');
  if (!id) throw new ApiError(400, '参数错误');
  await deleteHistory(env, id);
  const enabled = await getEnabledHistory(env);
  if (enabled) await upsertCurrentDefault(env, enabled.data, enabled.created_at);
  else await env.DB.prepare('delete from default_data where id = 1').run();
  return null;
};

export const clearDefaultData = async ({ env }: RouteContext) => {
  // 清理历史，保留最近 10 条；当前默认主页不动
  await pruneHistory(env, 10);
  return null;
};
