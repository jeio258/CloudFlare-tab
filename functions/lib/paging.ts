// console 通用分页：GET query 或 POST JSON body 均可传参
export interface Paging {
  page: number;
  pageSize: number;
  keyword: string;
}

export const readPaging = async (req: Request): Promise<Paging> => {
  const url = new URL(req.url);
  const q = url.searchParams;
  let body: Record<string, unknown> = {};
  if (req.method === 'POST') {
    try {
      body = (await req.clone().json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }
  const pick = (...keys: string[]): unknown => {
    for (const k of keys) {
      const v = q.get(k) ?? body?.[k];
      if (v !== null && v !== undefined && v !== '') return v;
    }
    return undefined;
  };
  const page = Math.max(Number(pick('page', 'current') || 1) || 1, 1);
  // 上限 100：管理列表 UI 每页 ≤50，防止单请求全表拉取
  const pageSize = Math.min(Math.max(Number(pick('pageSize', 'size', 'page_size', 'limit') || 10) || 1, 1), 100);
  const keyword = String(pick('username', 'keyword', 'search') || '').trim();
  return { page, pageSize, keyword };
};
