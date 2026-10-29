// admin 分区共用：console 请求头与列表响应形状
export const authHdr = (token: string): RequestInit => ({ headers: { authorization: token } });

export interface ApiList<T> {
  list: T[];
  total: number;
}
