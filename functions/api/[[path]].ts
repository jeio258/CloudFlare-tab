// 单入口声明式路由：/api/* 全部在此分发（区别于参考的逐文件路由，契约不变）
// 分发核心在 lib/dispatch.ts（Pages 与 Workers 两种部署共用）
import { dispatch } from '../lib/dispatch';
import type { Env } from '../lib/core';

export const onRequest = (context: { request: Request; env: Env }) => dispatch(context.request, context.env);
