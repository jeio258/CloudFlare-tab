// 共用数据 hooks：useFetch（API GET + 错误标记 + 同 URL 去重）/ useLocalStoragePoll（轮询读取本地键）
import { useEffect, useState } from 'react';
import { get } from '../api/request';
import type { ApiResp } from '../api/request';
import { readJSON } from './storage';

// 同 URL 去重：短 TTL 内存缓存 + 并发请求共享同一 Promise
// （同页多个挂件常请求相同接口，如天气/热榜/汇率/一言）
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { t: number; data: unknown }>();
const inflight = new Map<string, Promise<ApiResp<unknown>>>();

function fetchShared(url: string): Promise<ApiResp<unknown>> {
  const p = inflight.get(url);
  if (p) return p;
  const next = get<unknown>(url).finally(() => inflight.delete(url));
  inflight.set(url, next);
  return next;
}

// GET 请求：code 200 且 data 非空 → data；否则 err=true（加载中 data=null）
export function useFetch<T>(url: string): { data: T | null; err: boolean } {
  const cached = cache.get(url);
  const [data, setData] = useState<T | null>(() => (cached ? (cached.data as T) : null));
  const [err, setErr] = useState(false);
  useEffect(() => {
    let alive = true;
    const hit = cache.get(url);
    if (hit && Date.now() - hit.t < CACHE_TTL_MS) {
      setData(hit.data as T);
      return () => {
        alive = false;
      };
    }
    (async () => {
      try {
        const resp = await fetchShared(url);
        if (!alive) return;
        if (resp.code === 200 && resp.data != null) {
          cache.set(url, { t: Date.now(), data: resp.data });
          setData(resp.data as T);
        } else setErr(true);
      } catch {
        if (alive) setErr(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [url]);
  return { data, err };
}

// 周期读取本地 JSON 数组（非数组/解析失败回落空数组），卸载清理
export function useLocalStoragePoll<T>(key: string, intervalMs: number): T[] {
  const [list, setList] = useState<T[]>([]);
  useEffect(() => {
    const load = () => {
      const raw = readJSON<unknown>(key, []);
      setList(Array.isArray(raw) ? (raw as T[]) : []);
    };
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [key, intervalMs]);
  return list;
}
