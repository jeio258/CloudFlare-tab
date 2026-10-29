// hover 编辑/删除（对齐截图：编辑左上/删除右上，36px 白底圆钮红色图标，骑跨卡顶）
import type { HomeCard } from '../../../api/types';

interface Props {
  card: HomeCard;
  onEditCard?: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function HoverActions({ card, onEditCard, onDelete }: Props) {
  return (
    <>
      {onEditCard && (
        <button
          type="button"
          aria-label={`编辑 ${card.title}`}
          onClick={() => onEditCard(card.id)}
          className="absolute -left-1.5 -top-4 z-20 hidden h-9 w-9 items-center justify-center rounded-full bg-white text-base text-red-500 shadow-lg group-hover:flex"
        >
          ✎
        </button>
      )}
      <button
        type="button"
        aria-label={`删除 ${card.title}`}
        onClick={() => {
          if (confirm(`删除卡片「${card.title}」？`)) onDelete(card.id);
        }}
        className="absolute -right-1.5 -top-4 z-20 hidden h-9 w-9 items-center justify-center rounded-full bg-white text-base text-red-500 shadow-lg group-hover:flex"
      >
        ×
      </button>
    </>
  );
}
