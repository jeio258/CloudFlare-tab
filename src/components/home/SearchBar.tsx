// 搜索栏：设置驱动（默认引擎/联想开关），玻璃面 600×48 对齐参考
import { useEffect, useRef, useState } from 'react';
import { useSite } from '../../store/site';

interface Engine {
  value: string;
  name: string;
  icon: string;
  url: (q: string) => string;
}

export const ENGINES: Engine[] = [
  { value: 'baidu', name: '百度', icon: '/icons/baidu2.svg', url: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}` },
  { value: 'bing', name: '必应', icon: '/icons/bing2.svg', url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
  { value: 'google', name: 'Google', icon: '/icons/google2.svg', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
];

// 内置 + 自定义合并（自定义引擎 value=id，template 用 %s 占位；icon 可自定义）
export function allEngines(settings: { customEngines?: { id: string; name: string; template: string; icon?: string }[] }): Engine[] {
  const custom = (settings.customEngines || []).map((c) => ({
    value: c.id,
    name: c.name,
    icon: c.icon || '/icons/search2.svg',
    url: (q: string) => c.template.replace('%s', encodeURIComponent(q)),
  }));
  return [...ENGINES, ...custom];
}

// 本地搜索历史（对齐参考「本地搜索历史记录」）：最多 10 条，去重置顶
const HISTORY_KEY = 'persist:searchHistory';
function readHistory(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string').slice(0, 10) : [];
  } catch {
    return [];
  }
}
function pushHistory(kw: string) {
  const list = readHistory().filter((x) => x !== kw);
  list.unshift(kw);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 10)));
}

// JSONP 联想：同源代理 /api/search-suggest?wd=&cb=
function suggest(wd: string, timeoutMs = 4000): Promise<string[]> {
  return new Promise((resolve) => {
    const cb = `__cftab_sug_${Date.now()}`;
    const timer = setTimeout(() => {
      cleanup();
      resolve([]);
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(timer);
      try {
        delete (window as unknown as Record<string, unknown>)[cb];
      } catch {
        /* 忽略 */
      }
      document.getElementById(cb)?.remove();
    };
    (window as unknown as Record<string, unknown>)[cb] = (j: { g?: Array<{ q?: string }> }) => {
      cleanup();
      resolve(Array.isArray(j?.g) ? j.g.map((x) => String(x?.q || '')).filter(Boolean) : []);
    };
    const s = document.createElement('script');
    s.id = cb;
    s.src = `/api/search-suggest?wd=${encodeURIComponent(wd)}&cb=${cb}`;
    s.onerror = () => {
      cleanup();
      resolve([]);
    };
    document.head.appendChild(s);
  });
}

// 打开方式（卡片行共用）：newtab 新标签页 / new 新窗口 / self 当前页
// 最后防线：仅放行 http(s)，阻断同步/导入数据中的 javascript: 等 scheme
export function openUrl(url: string, mode: 'newtab' | 'new' | 'self') {
  if (!/^https?:\/\//i.test(url)) return;
  if (mode === 'self') window.location.href = url;
  else if (mode === 'new') window.open(url, '_blank', 'popup=yes,noopener');
  else window.open(url, '_blank', 'noopener');
}

export default function SearchBar() {
  const { settings, updateSettings } = useSite();
  const engine = allEngines(settings).find((e) => e.value === settings.engine) || ENGINES[0];
  const [q, setQ] = useState('');
  const [sugs, setSugs] = useState<string[]>([]);
  const [focus, setFocus] = useState(false);
  const [history, setHistory] = useState<string[]>(() => readHistory());
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);
  const seq = useRef(0);

  // 填入搜索框：插入联想词并保持输入焦点，不触发跳转
  const fillInput = (s: string) => {
    setQ(s);
    setSugs([]);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    const kw = q.trim();
    if (!kw || !focus || !settings.showSuggest) {
      setSugs([]);
      return;
    }
    timer.current = window.setTimeout(async () => {
      const my = ++seq.current;
      const list = await suggest(kw);
      if (my === seq.current) setSugs(list);
    }, 260);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q, focus, settings.showSuggest]);

  const go = (kw?: string) => {
    const target = (kw ?? q).trim();
    if (!target) return;
    if (settings.searchHistory) {
      pushHistory(target);
      setHistory(readHistory());
    }
    openUrl(engine.url(target), settings.openType);
    if (settings.clearSearchAfter) setQ('');
  };

  const h = settings.searchHeight;
  const alpha = focus ? settings.searchFocusOpacity : settings.searchOpacity;
  // 引擎下拉外点关闭
  const engRef = useRef<HTMLDivElement>(null);
  const [engOpen, setEngOpen] = useState(false);
  useEffect(() => {
    if (!engOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!engRef.current?.contains(e.target as Node)) setEngOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [engOpen]);
  return (
    <div className="pointer-events-none flex h-min items-center *:pointer-events-auto">
      <div
        className="relative z-30 flex w-[73vw] items-stretch overflow-visible shadow-glass backdrop-blur-[40px] backdrop-saturate-200"
        style={{ maxWidth: settings.searchMaxWidth, height: h, borderRadius: settings.searchRadius, backgroundColor: `rgba(255,255,255,${alpha})` }}
      >
        {/* 引擎选择（self-stretch 统一内外高度，移动端不再溢出裁切） */}
        <div ref={engRef} className="relative flex items-stretch">
          <button
            type="button"
            onClick={() => setEngOpen((o) => !o)}
            className="flex items-center gap-1.5 self-stretch pl-4 pr-2 text-sm text-ink transition-colors hover:bg-black/5"
          >
            <img src={engine.icon} alt={engine.name} className="h-6 w-6 object-contain" />
            <svg viewBox="0 0 1024 1024" className="h-3 w-3 opacity-30 transition-transform" fill="currentColor" aria-hidden>
              <path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z" />
            </svg>
          </button>
          {engOpen && (
            <div className="absolute left-0 top-full z-[60] mt-1 min-w-36 overflow-hidden rounded-lg bg-white py-1 shadow-glass">
              {allEngines(settings).map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => {
                    updateSettings({ engine: e.value });
                    setEngOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink transition-colors hover:bg-black/5"
                >
                  <img src={e.icon} alt="" className="h-5 w-5 object-contain" />
                  {e.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* 输入 + 联想/历史下拉 */}
        <div className="relative min-w-0 flex-1 self-stretch">
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => window.setTimeout(() => setFocus(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') go();
            }}
            autoFocus={settings.searchAutoFocus}
            placeholder={settings.searchPlaceholder}
            className="h-full w-full min-w-0 bg-transparent px-1 font-medium text-ink outline-none placeholder:text-ink/40"
          />
          {focus && q.trim() && sugs.length > 0 && (
            <div
              role="listbox"
              aria-label="搜索联想"
              className="absolute left-0 top-full z-[60] mt-1 w-full overflow-hidden rounded-lg bg-white py-1 shadow-glass"
            >
              {sugs.map((s, i) => (
                <div
                  key={`${s}-${i}`}
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => {
                    e.preventDefault(); // 防止 input 失焦
                  }}
                  onClick={() => fillInput(s)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm text-ink transition-colors hover:bg-black/5"
                >
                  <svg viewBox="0 0 1024 1024" className="h-3.5 w-3.5 shrink-0 opacity-40" fill="currentColor" aria-hidden>
                    <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.6 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.6 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z" />
                  </svg>
                  <span className="min-w-0 flex-1 truncate">{s}</span>
                  {/* 填入搜索框按钮：插入联想词并保持焦点，不触发跳转 */}
                  <span
                    role="button"
                    aria-label={`填入「${s}」`}
                    onClick={(e) => {
                      e.stopPropagation();
                      fillInput(s);
                    }}
                    className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-black/10 hover:text-ink"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </div>
              ))}
            </div>
          )}
          {focus && settings.searchHistory && !q.trim() && history.length > 0 && (
            <div className="absolute left-0 top-full z-[60] mt-1 w-full overflow-hidden rounded-lg bg-white py-1 shadow-glass">
              {history.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(s);
                  }}
                  className="flex w-full items-center gap-2 truncate px-3 py-1.5 text-left text-sm text-ink transition-colors hover:bg-black/5"
                >
                  <svg viewBox="0 0 1024 1024" className="h-3.5 w-3.5 shrink-0 opacity-40" fill="currentColor" aria-hidden>
                    <path d="M536.1 273H488c-1.8 0-3.3 1.4-3.4 3.2l-8.8 336.7c-.1 1.9 1.5 3.5 3.4 3.5h59.4c1.9 0 3.5-1.6 3.4-3.5l-8.8-336.7c-.1-1.8-1.6-3.2-3.4-3.2zM512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
                  </svg>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* 搜索按钮（图标/文字两种样式；高度断点统一 32/36，不再依赖设置值溢出容器） */}
        <div className="flex items-center self-stretch">
          <button
            type="button"
            aria-label="搜索"
            onClick={() => go()}
            className={`mx-2 my-1 flex items-center justify-center self-center rounded-full text-ink transition-colors hover:bg-black/10 active:scale-95 ${
              settings.searchBtnStyle === 'text'
                ? 'min-h-9 min-w-9 px-3'
                : 'h-9 w-9'
            }`}
          >
            {settings.searchBtnStyle === 'text' ? (
              <span className="whitespace-nowrap text-sm">{settings.searchBtnText || '搜索'}</span>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
