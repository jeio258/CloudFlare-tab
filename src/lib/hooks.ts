// 共用数据 hooks：useFetch（API GET + 错误标记）/ useLocalStoragePoll（轮询读取本地键）
import { useEffect, useState } from 'react';
import { get } from '../api/client';

// GET 请求：code 200 且 data 非空 → data；否则 err=true（加载中 data=null）
export function useFetch<T>(url: string): { data: T | null; err: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await get<T>(url);
        if (!alive) return;
        if (resp.code === 200 && resp.data != null) setData(resp.data);
        else setErr(true);
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

// 周期读取 localStorage（JSON 数组；解析失败回落空数组），卸载清理
export function useLocalStoragePoll<T>(key: string, intervalMs: number): T[] {
  const [list, setList] = useState<T[]>([]);
  useEffect(() => {
    const load = () => {
      try {
        const raw = JSON.parse(localStorage.getItem(key) || '[]');
        setList(Array.isArray(raw) ? raw : []);
      } catch {
        setList([]);
      }
    };
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [key, intervalMs]);
  return list;
}
