// Workers 部署入口（wrangler.workers.toml main 指向本文件）：
// /api/* 复用与 Pages 相同的分发核心；其余请求走静态资产（dist）
import { dispatch } from './functions/lib/dispatch';
import type { Env } from './functions/lib/core';

// Workers 模式专属：静态资产绑定（wrangler.workers.toml [assets].binding）
type WorkerEnv = Env & { ASSETS: { fetch(request: Request): Promise<Response> } };

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return dispatch(request, env);
    return env.ASSETS.fetch(request);
  },
};
