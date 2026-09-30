// 分享页 /s/:shareId：getShareData 四态（null 无效 / 2 已停止 / 3 不可见 / shareData 渲染）
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { get } from '../api/client';
import { normalizeCards } from '../lib/normalize';
import type { HomeCard } from '../api/types';

type State =
  | { code: 'loading' }
  | { code: 'invalid' }
  | { code: 'stopped' }
  | { code: 'denied' }
  | { code: 'ok'; bg: string; cards: HomeCard[] };

const MSG: Record<'invalid' | 'stopped' | 'denied', string> = {
  invalid: '分享链接无效或暂无数据',
  stopped: '该用户已停止分享',
  denied: '主页暂不可见',
};

export default function SharePage() {
  const { shareId } = useParams();
  const [st, setSt] = useState<State>({ code: 'loading' });

  useEffect(() => {
    let alive = true;
    (async () => {
      const resp = await get<unknown>(`/api/getShareData?path=${encodeURIComponent(shareId || '')}`);
      if (!alive) return;
      if (resp.code !== 200) {
        setSt({ code: 'invalid' });
        return;
      }
      const d = resp.data as number | { shareData?: { settings?: { color?: string }; cards?: HomeCard[] } } | null;
      if (d === 2) setSt({ code: 'stopped' });
      else if (d === 3) setSt({ code: 'denied' });
      else if (d && typeof d === 'object' && 'shareData' in d && d.shareData) {
        const s = d.shareData as { settings?: { color?: string }; cards?: unknown };
        // 分享数据属外部输入：卡片过信任边界；背景色仅接受 hex，防 CSS 注入
        const bg = typeof s.settings?.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(s.settings.color) ? s.settings.color : '#12151a';
        setSt({
          code: 'ok',
          bg,
          cards: normalizeCards(s.cards),
        });
      } else setSt({ code: 'invalid' });
    })();
    return () => {
      alive = false;
    };
  }, [shareId]);

  if (st.code === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">加载中…</div>
    );
  }
  if (st.code !== 'ok') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper">
        <img src="/images/empty.svg" alt="" className="h-24 w-24 opacity-60" />
        <div className="text-muted">{MSG[st.code]}</div>
        <a href="/" className="text-sm text-blue-500 hover:underline">
          去逛逛 CloudFlare-tab
        </a>
      </div>
    );
  }
  return (
    <div className="min-h-screen" style={{ background: st.bg }}>
      <div className="flex min-h-screen flex-col items-center pt-24">
        {st.cards.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-8 px-6">
            {st.cards.map((c) => (
              <a
                key={c.id}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="relative flex h-16 w-40 items-center overflow-hidden rounded-[18px] bg-white shadow-card transition-transform duration-300 hover:-translate-y-0.5"
              >
                <img
                  src={c.icon || '/icons/logo.svg'}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 object-contain opacity-10"
                />
                <div className="relative z-10 flex items-center gap-2 px-4">
                  <img src={c.icon || '/icons/logo.svg'} alt="" className="h-10 w-10 shrink-0 object-contain" />
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-semibold text-ink">{c.title}</div>
                    <div className="line-clamp-1 text-sm font-medium text-muted">{c.subTitle}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-white/60">TA 还没有分享任何卡片</div>
        )}
        <div className="fixed bottom-3 text-xs text-white/50">来自 CloudFlare-tab 的分享主页</div>
      </div>
    </div>
  );
}
