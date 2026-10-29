// D1 仓储：users / user_data / notices / default_data / default_data_history
import type { Env, UserRow } from './core';
import { CARD_FIELDS, CARD_FIELD_LIST } from '../../shared/cardFields';

export const getUserByUsername = (env: Env, username: string) =>
  env.DB.prepare('select * from users where username = ?')
    .bind(username)
    .first<UserRow>();

export const getUserById = (env: Env, id: string) =>
  env.DB.prepare('select * from users where id = ?').bind(id).first<UserRow>();

export const getUserByShare = (env: Env, path: string) =>
  env.DB.prepare('select * from users where share_id = ? or username = ? limit 1')
    .bind(path, path)
    .first<UserRow>();

export const insertUser = (env: Env, u: Omit<UserRow, 'created_at'>) =>
  env.DB.prepare(
    `insert into users (id, username, password, nickname, phone, avatar, sex, birthday, user_type, status, share_id, share_enabled)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      u.id, u.username, u.password, u.nickname, u.phone, u.avatar,
      u.sex, u.birthday, u.user_type, u.status, u.share_id, u.share_enabled
    )
    .run();

export const updatePassword = (env: Env, id: string, password: string) =>
  env.DB.prepare('update users set password = ? where id = ?').bind(password, id).run();

export const updateProfile = (
  env: Env,
  id: string,
  p: { username?: string; nickname?: string; sex?: number; phone?: string; birthday?: string | null }
) =>
  env.DB.prepare(
    `update users set
       username = coalesce(?, username),
       nickname = coalesce(?, nickname),
       sex = coalesce(?, sex),
       phone = coalesce(?, phone),
       birthday = coalesce(?, birthday)
     where id = ?`
  )
    .bind(p.username ?? null, p.nickname ?? null, p.sex ?? null, p.phone ?? null, p.birthday ?? null, id)
    .run();

export const setUserType = (env: Env, id: string, type: number) =>
  env.DB.prepare('update users set user_type = ? where id = ?').bind(type, id).run();

export const setUserStatus = (env: Env, id: string, status: number) =>
  env.DB.prepare('update users set status = ? where id = ?').bind(status, id).run();

export const deleteUserCascade = (env: Env, id: string) =>
  env.DB.batch([
    env.DB.prepare('delete from user_data where user_id = ?').bind(id),
    env.DB.prepare('delete from cards where user_id = ?').bind(id),
    env.DB.prepare('delete from users where id = ?').bind(id),
  ]);

export interface UserDataRow {
  user_id: string;
  data: string;
  timestamp: number;
}

export const getUserData = (env: Env, userId: string) =>
  env.DB.prepare('select * from user_data where user_id = ?').bind(userId).first<UserDataRow>();

export const upsertUserData = (env: Env, userId: string, data: string, timestamp: number) =>
  env.DB.prepare(
    `insert into user_data (user_id, data, timestamp) values (?, ?, ?)
     on conflict(user_id) do update set data = excluded.data, timestamp = excluded.timestamp`
  )
    .bind(userId, data, timestamp)
    .run();

// —— 公告 ——
export const insertNotice = (env: Env, id: string, title: string, content: string, createdBy: string) =>
  env.DB.prepare(
    'insert into notices (id, title, content, status, time_code, created_by) values (?, ?, ?, 0, ?, ?)'
  )
    .bind(id, title, content, String(Date.now()), createdBy)
    .run();

export const updateNotice = (env: Env, id: string, title: string, content: string, resetStatus = false) =>
  env.DB.prepare(`update notices set title = ?, content = ?${resetStatus ? ', status = 0' : ''} where id = ?`)
    .bind(title, content, id)
    .run();

export const deleteNotice = (env: Env, id: string) =>
  env.DB.prepare('delete from notices where id = ?').bind(id).run();

export const getNoticeById = (env: Env, id: string) =>
  env.DB.prepare('select id, status from notices where id = ?').bind(id).first<{ id: string; status: number }>();

// 二次确认发布：仅保留最新一条启用
export const publishNotice = (env: Env, id: string) =>
  env.DB.batch([
    env.DB.prepare('update notices set status = 0'),
    env.DB.prepare('update notices set status = 1 where id = ?').bind(id),
  ]);

export const getPublishedNotice = (env: Env) =>
  env.DB.prepare(
    'select title, content, time_code from notices where status = 1 order by created_at desc, id desc limit 1'
  ).first<{ title: string; content: string; time_code: string }>();

// —— 默认主页 ——
export const upsertCurrentDefault = (env: Env, data: string, created_at: string) =>
  env.DB.prepare(
    `insert into default_data (id, data, created_at) values (1, ?, ?)
     on conflict(id) do update set data = excluded.data, created_at = excluded.created_at`
  )
    .bind(data, created_at)
    .run();

export const getCurrentDefault = (env: Env) =>
  env.DB.prepare('select data, created_at from default_data where id = 1').first<{ data: string; created_at: string }>();

export const insertHistory = (env: Env, id: string, data: string, createdBy: string, createdAt: string) =>
  env.DB.prepare(
    'insert into default_data_history (id, data, enabled, created_by, created_at) values (?, ?, 1, ?, ?)'
  )
    .bind(id, data, createdBy, createdAt)
    .run();

export const clearHistoryEnabled = (env: Env) => env.DB.prepare('update default_data_history set enabled = 0').run();

export const setHistoryEnabled = (env: Env, id: string, enabled: number) =>
  env.DB.prepare('update default_data_history set enabled = ? where id = ?').bind(enabled, id).run();

export const getHistoryById = (env: Env, id: string) =>
  env.DB.prepare('select * from default_data_history where id = ?').bind(id).first<{
    id: string; data: string; enabled: number; created_by: string; created_at: string;
  }>();

export const getEnabledHistory = (env: Env) =>
  env.DB.prepare(
    'select data, created_at from default_data_history where enabled = 1 order by created_at desc, id desc limit 1'
  ).first<{ data: string; created_at: string }>();

export const deleteHistory = (env: Env, id: string) =>
  env.DB.prepare('delete from default_data_history where id = ?').bind(id).run();

// 保留最近 N 条历史，其余删除
// （历史实现方向相反：按 desc 取 limit keep+1 后删除，删的是最新而非最旧，已修正）
export const pruneHistory = async (env: Env, keep: number) => {
  await env.DB.prepare(
    `delete from default_data_history where id not in (
       select id from default_data_history order by created_at desc, id desc limit ?
     )`
  )
    .bind(Math.max(0, keep))
    .run();
};

// —— 书签行存储（cards 表）：push 时整表重建拆行写入，pull 时按 ord 排序拼回原始数组 ——
// 列名与驼峰名的对应关系由 shared/cardFields.ts 字段表给出，本文件只做行/值转换
type ColumnValue<R> = R extends { kind: 'number' } ? number | null : string;
type CardRow = {
  [F in (typeof CARD_FIELDS)[number] as F['column']]: ColumnValue<F['rule']>;
} & { ord: number };

const cardColumns = CARD_FIELD_LIST.map((f) => f.column);
// ord 紧跟 card_id（与 schema 列序一致），其余列按字段表顺序
const INSERT_COLUMNS = ['user_id', cardColumns[0], 'ord', ...cardColumns.slice(1)];
const INSERT_SQL = `insert into cards (${INSERT_COLUMNS.join(', ')})
  values (${INSERT_COLUMNS.map(() => '?').join(', ')})
  on conflict(user_id, card_id) do update set
    ${['ord = excluded.ord', ...CARD_FIELD_LIST.slice(1).map((f) => `${f.column} = excluded.${f.column}`)].join(', ')}`;

const toCard = (r: CardRow): Record<string, unknown> => {
  const row = r as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of CARD_FIELD_LIST) {
    const v = row[f.column];
    if (f.db === 'always') out[f.key] = v || f.dbFallback || '';
    else if (v !== '' && v != null) out[f.key] = v;
  }
  return out;
};

export const getUserCards = async (env: Env, userId: string): Promise<Record<string, unknown>[]> => {
  const { results } = await env.DB.prepare('select * from cards where user_id = ? order by ord').bind(userId).all<CardRow>();
  return (results || []).map(toCard);
};

// 整表重建：先删旧行再按数组次序写入（ord = 数组下标），保证 pull 拼回次序一致
export const replaceUserCards = (env: Env, userId: string, cards: unknown[]) => {
  const s = (v: unknown) => (v === undefined || v === null ? '' : String(v));
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const del = env.DB.prepare('delete from cards where user_id = ?').bind(userId);
  const ins = cards.map((raw, i) => {
    const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const values: unknown[] = [userId, s(c.id) || `c${i}`, i];
    for (const f of CARD_FIELD_LIST.slice(1)) {
      values.push(f.rule.kind === 'number' ? n(c[f.key]) : s(c[f.key]) || f.dbFallback || '');
    }
    return env.DB.prepare(INSERT_SQL).bind(...values);
  });
  return env.DB.batch([del, ...ins]);
};
