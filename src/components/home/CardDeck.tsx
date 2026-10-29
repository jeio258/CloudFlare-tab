// 卡片区：统一方格网格布局（融合原 standard/squares 两形态，默认方格模式）
// 64px 格 + 列 gap 32/行 gap 40（对齐参考站实测）；size 六选项 → 网格占格；拖拽换位/hover 编辑删除/右键/分组 tabs 全保留
import { cloneElement, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactElement } from 'react';
import { setWidgetCtx } from './WidgetCards';
import type { HomeCard } from '../../api/types';
import { useSite } from '../../store/site';
import { openUrl } from './SearchBar';
import CardBody, { isWidget } from './card/CardBody';
import HoverActions from './card/HoverActions';
import { useCardDrag } from './card/drag';
import { pushVisit } from './card/history';

interface Props {
  cards: HomeCard[];
  groups?: string[];
  onAddCard?: () => void;      // 网格「+」→ 直接弹出添加卡片弹窗（一步直达）
  onOpenCards?: (selectId?: string) => void; // 批量编辑（带卡片id直达批量模式）/书签挂件 → 卡片管理抽屉
  onEditCard?: (id: string) => void;
  onOpenSettings?: () => void;
}

const AddIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

// 移动端长按 500ms 触发 contextmenu（触屏无右键，长按唤出卡片菜单）
// 定时器登记表置于模块级：若放在组件体内，每次渲染都会重建 WeakMap，
// 长按途中一旦发生重渲染，抬手时的 clear 将在新表里找不到句柄而漏清 → 误弹菜单
const lpTimers = new WeakMap<HTMLElement, number>();

function withLongPress(node: ReactElement): ReactElement {
  const clear = (el: EventTarget | null) => {
    if (!(el instanceof HTMLElement)) return;
    const h = lpTimers.get(el);
    if (h) {
      window.clearTimeout(h);
      lpTimers.delete(el);
    }
  };
  return cloneElement(node, {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      const el = e.currentTarget as HTMLElement;
      clear(el);
      lpTimers.set(
        el,
        window.setTimeout(() => {
          lpTimers.delete(el);
          el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: t.clientX, clientY: t.clientY }));
        }, 500)
      );
    },
    onTouchEnd: (e: React.TouchEvent) => clear(e.currentTarget),
    onTouchMove: (e: React.TouchEvent) => clear(e.currentTarget),
  });
}

export default function CardDeck({ cards, groups = [], onAddCard, onOpenCards, onEditCard, onOpenSettings }: Props) {
  // 动作卡上下文（书签管理/设置中心）
  useEffect(() => {
    setWidgetCtx({ openCards: () => onOpenCards?.(), openSettings: () => onOpenSettings?.() });
  }, [onOpenCards, onOpenSettings]);
  const { settings, setCards } = useSite();
  const [tab, setTab] = useState('默认');
  const tabList = ['默认', ...groups];
  const cur = tabList.includes(tab) ? tab : '默认';
  const shown =
    cur === '默认'
      ? cards.filter((c) => !c.group || !groups.includes(c.group))
      : cards.filter((c) => c.group === cur);
  const open = (url: string, title = '') => (e: { preventDefault: () => void }) => {
    e.preventDefault();
    pushVisit(url, title);
    openUrl(url, settings.openType);
  };

  const { rootRef, onDropOn } = useCardDrag(cards, setCards);

  const cardShell = 'card-hover-hitbox card-motion relative flex overflow-hidden border-0 bg-white shadow-card transition-transform duration-300 hover:-translate-y-0.5';

  // 统一方格网格布局（融合 standard/squares；64px 格，列 gap 32/行 gap 40 → 对齐参考站实测 160/168）
  // 卡片大小 → 网格占格（列,行）；size 显式按六选项，缺省默认一行一列（1×1）
  const gridSpan = (c: HomeCard): [number, number] => {
    if (c.size) {
      const m = c.size.match(/^(\d)x(\d)$/);
      if (m) return [Number(m[1]), Number(m[2])];
    }
    return [1, 1];
  };

  // 右键/长按菜单（批量编辑/编辑/复制链接/换位/删除）：自绘菜单（不用 antd Dropdown），固定定位+视口内钳位
  interface CtxMenuState { x: number; y: number; card: HomeCard; idxShown: number }
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ctxMenu) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setCtxMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCtxMenu(null);
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [ctxMenu]);

  const onCtxAction = (state: CtxMenuState, key: string) => {
    const { card, idxShown } = state;
    if (key === 'batch' && onOpenCards) onOpenCards(card.id);
    else if (key === 'edit' && onEditCard) onEditCard(card.id);
    else if (key === 'copy') navigator.clipboard?.writeText(card.url).catch(() => {});
    else if (key === 'swapPrev' || key === 'swapNext') {
      const j = key === 'swapPrev' ? idxShown - 1 : idxShown + 1;
      if (idxShown < 0 || j < 0 || j >= shown.length) return;
      const from = cards.findIndex((x) => x.id === card.id);
      const to = cards.findIndex((x) => x.id === shown[j].id);
      if (from < 0 || to < 0 || from === to) return;
      const next = [...cards];
      [next[from], next[to]] = [next[to], next[from]];
      setCards(next);
    } else if (key === 'delete' && confirm(`删除卡片「${card.title}」？`)) setCards(cards.filter((x) => x.id !== card.id));
    setCtxMenu(null);
  };

  const ctxWrap = (c: HomeCard, node: ReactElement) => {
    const idxShown = shown.findIndex((x) => x.id === c.id);
    return cloneElement(withLongPress(node), {
      onContextMenu: (e: ReactMouseEvent) => {
        e.preventDefault();
        // 视口内钳位：菜单约 176×232，右/下溢出时回推
        setCtxMenu({
          x: Math.min(e.clientX, window.innerWidth - 188),
          y: Math.min(e.clientY, window.innerHeight - 244),
          card: c,
          idxShown,
        });
      },
    });
  };

  // 单网格卡渲染：移动 4 列（一行四个，窄格纯图标）/ 桌面 64px auto-fill（窄格纯图标、宽格横版）
  // 同一 DOM 单实例（挂件只挂载一次、fetch 只发一次）
  // size 跨格全端生效（SPAN_CLASS 静态映射，供 Tailwind JIT 扫描）：移动 4 列下 span4=整行、span2=半行，与桌面同构
  const SPAN_CLASS: Record<string, string> = {
    '2x1': '[grid-column:span_2]',
    '4x1': '[grid-column:span_4]',
    '1x2': '[grid-row:span_2]',
    '2x2': '[grid-column:span_2] [grid-row:span_2]',
    '4x2': '[grid-column:span_4] [grid-row:span_2]',
  };

  const gridCard = (c: HomeCard) => {
    const [colSpan] = gridSpan(c);
    const wide = colSpan >= 2;
    const title = `${c.title}${c.subTitle ? ' · ' + c.subTitle : ''}`;
    return ctxWrap(c, (
      <div
        key={c.id}
        data-card-id={c.id}
        className={`group relative ${SPAN_CLASS[c.size ?? '1x1'] ?? ''}`}
        draggable
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropOn(c.id)}
      >
        {isWidget(c) ? (
          <div className={`${cardShell} h-full w-full rounded-[18px]`} style={{ backgroundColor: c.bgColor || undefined }}>
            <CardBody card={c} wide={wide} />
          </div>
        ) : (
          <a
            href={c.url}
            target="_blank"
            rel="noreferrer"
            title={title}
            onClick={open(c.url, c.title)}
            className={`${cardShell} h-full w-full rounded-[18px] cursor-grab ${wide ? 'items-center' : 'items-center justify-center'} active:cursor-grabbing`}
            style={{ backgroundColor: c.bgColor || undefined }}
          >
            <CardBody card={c} wide={wide} />
          </a>
        )}
        <HoverActions card={c} onEditCard={onEditCard} onDelete={(id) => setCards(cards.filter((x) => x.id !== id))} />
        {c.displayStyle !== 'image' && (
          <>
            {/* 卡下名称：流内，溢出至行间隙显示 */}
            <span
              className="mt-1 block w-full truncate text-center text-[14px] font-medium leading-[21px] text-white"
              style={{ fontFamily: 'Roboto, arial, sans-serif', color: (settings.simpleMode && settings.simpleFont) || c.fontColor || undefined, fontSize: c.fontSize ? `${c.fontSize}px` : undefined }}
            >
              {c.title}
            </span>
          </>
        )}
      </div>
    ));
  };

  return (
    <div ref={rootRef} className="w-full">
      {groups.length > 0 && (
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {tabList.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                t === cur ? 'bg-white/85 font-semibold text-ink shadow' : 'bg-white/25 text-white/85 hover:bg-white/40'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {/* 统一方格网格（全端一致）：64px auto-fill，列 gap 32/行 gap 40；justify-center 使末行前空隙均分两侧（修复窄屏偏左） */}
      <div
        className="mx-auto grid max-w-[1248px] justify-center [grid-auto-rows:64px] [grid-template-columns:repeat(auto-fill,64px)] gap-x-8 gap-y-10"
      >
        {shown.map((c) => gridCard(c))}
        {onAddCard && (
          <button
            type="button"
            onClick={onAddCard}
            aria-label="添加卡片"
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card transition-transform duration-300 hover:-translate-y-0.5"
          >
            <AddIcon />
          </button>
        )}
      </div>
      {ctxMenu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`卡片菜单：${ctxMenu.card.title}`}
          className="fixed z-[1000] min-w-44 overflow-hidden rounded-lg bg-white py-1 shadow-glass"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {([
            { key: 'batch', label: '批量编辑', disabled: !onOpenCards },
            { key: 'edit', label: '编辑此卡片', disabled: !onEditCard },
            { key: 'copy', label: '复制链接', disabled: false },
            { key: 'sep1' },
            { key: 'swapPrev', label: '与上一张交换', disabled: ctxMenu.idxShown <= 0 },
            { key: 'swapNext', label: '与下一张交换', disabled: ctxMenu.idxShown < 0 || ctxMenu.idxShown >= shown.length - 1 },
            { key: 'sep2' },
            { key: 'delete', label: '删除此卡片', danger: true },
          ] as { key: string; label?: string; disabled?: boolean; danger?: boolean }[]).map((it) =>
            it.key.startsWith('sep') ? (
              <div key={it.key} className="my-1 h-px bg-black/10" />
            ) : (
              <button
                key={it.key}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                onClick={() => onCtxAction(ctxMenu, it.key)}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 ${it.danger ? 'text-red-500' : 'text-ink'}`}
              >
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
