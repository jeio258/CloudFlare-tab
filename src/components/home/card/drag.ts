// 行/列内拖拽换位：拖到同行或同列的另一张卡上交换位置，其余卡片不动
import { useEffect, useRef } from 'react';
import type { DragEvent as RDragEvent } from 'react';
import type { HomeCard } from '../../../api/types';

export function useCardDrag(cards: HomeCard[], setCards: (cards: HomeCard[]) => void) {
  const dragId = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // dragstart 用容器级原生监听（捕获阶段），React 合成 onDragStart 实测不触发
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onStart = (e: DragEvent) => {
      const card = (e.target as HTMLElement).closest?.('[data-card-id]');
      if (!card) return;
      const id = card.getAttribute('data-card-id');
      if (!id) return;
      dragId.current = id;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
      }
    };
    el.addEventListener('dragstart', onStart, true);
    return () => el.removeEventListener('dragstart', onStart, true);
  }, []);

  const onDropOn = (targetId: string) => (e: RDragEvent) => {
    e.preventDefault();
    const from = cards.findIndex((c) => c.id === dragId.current);
    const to = cards.findIndex((c) => c.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const a = document.querySelector(`[data-card-id="${CSS.escape(cards[from].id)}"]`);
    const b = document.querySelector(`[data-card-id="${CSS.escape(cards[to].id)}"]`);
    if (!a || !b) return;
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    const sameRow = Math.abs(ra.top - rb.top) < ra.height / 2;
    const sameCol = Math.abs(ra.left - rb.left) < ra.width / 2;
    if (!sameRow && !sameCol) return;
    const next = [...cards];
    [next[from], next[to]] = [next[to], next[from]];
    setCards(next);
  };

  return { rootRef, onDropOn };
}
