// 认证接口限流：D1 固定窗口计数（Pages 不支持 Workers ratelimit binding，D1 原子 upsert 保证本地/远端行为一致）
// 双维度 IP + 账号；仅失败/敏感操作计数，成功登录不计数，不破坏正常使用
import { ApiError } from './core';
import type { Env } from './core';

export type AuthScope = 'login' | 'register' | 'findPassword';

interface Rule {
  name: string;
  limit: number;
  period: number;
}

// 阈值理由：login:acct 10 次失败/5min 覆盖正常人输错+找回流程，同时把单账号在线爆破压到 ~2880 次/天；
// ip 维度 30 为 NAT 多用户留余量；register/findPassword 20-30 足以拦截批量注册与凭证枚举，且兼容 e2e 连续多轮重跑
const RULES: Record<AuthScope, Rule[]> = {
  login: [
    { name: 'login:ip', limit: 30, period: 300 },
    { name: 'login:acct', limit: 10, period: 300 },
  ],
  register: [
    { name: 'register:ip', limit: 30, period: 300 },
    { name: 'register:acct', limit: 20, period: 300 },
  ],
  findPassword: [
    { name: 'find:ip', limit: 30, period: 300 },
    { name: 'find:acct', limit: 20, period: 300 },
  ],
};

const clientIp = (request: Request): string => request.headers.get('cf-connecting-ip') || 'unknown';

// 累加计数并返回；窗口切换时从 1 重新开始
async function bump(env: Env, rule: Rule, value: string, nowSec: number): Promise<number> {
  const windowStart = Math.floor(nowSec / rule.period);
  const row = await env.DB.prepare(
    `insert into auth_rate (rule, window_start, count) values (?, ?, 1)
     on conflict(rule) do update set
       count = case when window_start = excluded.window_start then auth_rate.count + 1 else 1 end,
       window_start = excluded.window_start
     returning count`
  )
    .bind(`${rule.name}:${value}`, windowStart)
    .first<{ count: number }>();
  return Number(row?.count ?? 1);
}

async function readCount(env: Env, rule: Rule, value: string, nowSec: number): Promise<number> {
  const windowStart = Math.floor(nowSec / rule.period);
  const row = await env.DB.prepare('select count from auth_rate where rule = ? and window_start = ?')
    .bind(`${rule.name}:${value}`, windowStart)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

async function forEachRule(
  env: Env,
  request: Request,
  scope: AuthScope,
  account: string,
  fn: (rule: Rule, value: string) => Promise<void>
): Promise<void> {
  const ip = clientIp(request);
  const acct = account.trim() || '-';
  const nowSec = Math.floor(Date.now() / 1000);
  for (const rule of RULES[scope]) {
    await fn(rule, rule.name.endsWith(':ip') ? ip : acct);
  }
}

// 请求前检查（只读）：窗口内计数已达上限 → HTTP 429
export async function checkAuthRateLimit(
  env: Env,
  request: Request,
  scope: AuthScope,
  account: string
): Promise<void> {
  await forEachRule(env, request, scope, account, async (rule, value) => {
    const count = await readCount(env, rule, value, Math.floor(Date.now() / 1000));
    if (count >= rule.limit) throw new ApiError(429, '尝试过于频繁，请稍后再试', 429);
  });
}

// 失败/敏感操作完成后计数
export async function recordAuthRateLimit(
  env: Env,
  request: Request,
  scope: AuthScope,
  account: string
): Promise<void> {
  await forEachRule(env, request, scope, account, async (rule, value) => {
    await bump(env, rule, value, Math.floor(Date.now() / 1000));
  });
}
