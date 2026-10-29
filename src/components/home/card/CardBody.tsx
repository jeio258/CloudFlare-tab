// 卡片内容渲染：展示样式三种内容体（默认/纯图/纯文本）与挂件卡分派
// 展示样式对齐参考 addorEditCardForm；主图标 55px/水印 40px 对齐 tab.kfkf.asia 实测
import { renderWidget, type WidgetType } from '../WidgetCards';
import type { HomeCard } from '../../../api/types';
import type { SiteSettings } from '../../../store/settings';
import { useSite } from '../../../store/site';
import { iconSrc } from '../../../lib/iconSrc';

export const isWidget = (c: HomeCard) => !!c.type && c.type !== 'link';

function widgetBody(c: HomeCard) {
  let config: Record<string, unknown> = {};
  try {
    config = c.config ? (JSON.parse(c.config) as Record<string, unknown>) : {};
  } catch {
    /* 忽略非法配置 */
  }
  return renderWidget(c.type as WidgetType, c.id, config, false);
}

// 宽格横版内容
function cardInner(c: HomeCard, settings: SiteSettings) {
  if (c.displayStyle === 'image') {
    return (
      <>
        <img src={iconSrc(c.icon)} alt="" aria-hidden className="pointer-events-none absolute left-4 top-1/2 max-h-10 max-w-10 -translate-y-1/2 object-contain opacity-10" />
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <img src={iconSrc(c.icon)} alt={c.title} className="max-h-[55px] max-w-[55px] object-contain" />
        </div>
      </>
    );
  }
  if (c.displayStyle === 'text') {
    return (
      <>
        <img src={iconSrc(c.icon)} alt="" aria-hidden className="pointer-events-none absolute left-4 top-1/2 max-h-10 max-w-10 -translate-y-1/2 object-contain opacity-10" />
        <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden">
          <span
            className="line-clamp-2 px-2 text-center text-sm font-semibold text-ink"
            style={{ color: (settings.simpleMode && settings.simpleFont) || c.fontColor || undefined, fontSize: c.fontSize ? `${c.fontSize}px` : undefined }}
          >
            {c.title}
          </span>
        </div>
      </>
    );
  }
  return (
    <>
      <img
        src={iconSrc(c.icon)}
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 max-h-10 max-w-10 -translate-y-1/2 object-contain opacity-10"
      />
      <div className="relative z-10 flex items-center gap-3 px-4">
        <div className="flex-center h-[55px] w-[55px] shrink-0">
          <img src={iconSrc(c.icon)} alt="" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <span
            className="line-clamp-1 text-sm font-semibold text-ink"
            style={{ color: (settings.simpleMode && settings.simpleFont) || c.fontColor || undefined, fontSize: c.fontSize ? `${c.fontSize}px` : undefined }}
          >
            {c.title}
          </span>
        </div>
      </div>
    </>
  );
}

// 窄卡体（竖版/纯图/纯文本：64×64 图标或文字居中，名称走 underName/流内）
function narrowInner(c: HomeCard, settings: SiteSettings) {
  return c.displayStyle === 'text' ? (
    <span
      className="line-clamp-2 px-1.5 text-center text-sm font-semibold text-ink"
      style={{ color: (settings.simpleMode && settings.simpleFont) || c.fontColor || undefined, fontSize: c.fontSize ? `${c.fontSize}px` : undefined }}
    >
      {c.title}
    </span>
  ) : (
    <img src={iconSrc(c.icon)} alt={c.title} className="max-h-12 max-w-12 object-contain" />
  );
}

export default function CardBody({ card, wide }: { card: HomeCard; wide: boolean }) {
  const { settings } = useSite();
  if (isWidget(card)) return <>{widgetBody(card)}</>;
  return <>{wide ? cardInner(card, settings) : narrowInner(card, settings)}</>;
}
