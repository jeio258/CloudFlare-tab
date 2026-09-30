// 公开内容路由：公告 / 默认主页 / 分享页 / 站点配置
import type { RouteContext } from '../core';
import type { Env } from '../core';
import { getUserByShare, getUserData, getPublishedNotice, getCurrentDefault } from '../db';
import SITE_CONFIG from '../siteConfig.json';

export const getSiteConfig = async () => ({ siteConfig: SITE_CONFIG });

export const getNotice = async ({ env }: RouteContext) => {
  const row = await getPublishedNotice(env);
  if (!row) return null;
  return { title: row.title, content: row.content, timeCode: row.time_code };
};

export const getDefaultData = async ({ env }: RouteContext) => {
  const row = await getCurrentDefault(env);
  if (!row) return { data: null, created_at: '' };
  try {
    return { data: JSON.parse(row.data), created_at: row.created_at };
  } catch {
    return { data: null, created_at: row.created_at };
  }
};

export const getDefaultDataTime = async ({ env }: RouteContext) => {
  const row = await getCurrentDefault(env);
  return row ? row.created_at : '';
};

// 分享页契约：data=对象{shareData} 正常；2=已停止分享；3=无权限；null=无效
async function resolveShare(env: Env, path: string) {
  if (!path) return null;
  const user = await getUserByShare(env, path);
  if (!user) return null;
  if (Number(user.status) === 0) return 3;
  if (Number(user.share_enabled) !== 1) return 2;
  const row = await getUserData(env, user.id);
  if (!row) return null;
  try {
    return { shareData: JSON.parse(row.data) };
  } catch {
    return null;
  }
}

export const getShareData = async ({ env, request, body }: RouteContext) => {
  if (request.method === 'POST') return resolveShare(env, String(body?.path || '').trim());
  const url = new URL(request.url);
  return resolveShare(env, (url.searchParams.get('path') || '').trim());
};
