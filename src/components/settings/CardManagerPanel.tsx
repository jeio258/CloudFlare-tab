// 卡片管理面板入口：只做分区组装（状态与操作见 ./cardManager/useCardManager）
import CardEditModal from './CardEditModal';
import { useCardManager } from './cardManager/useCardManager';
import { BatchToolbar } from './cardManager/BatchToolbar';
import { BookmarkImport } from './cardManager/BookmarkImport';
import { GroupManager } from './cardManager/GroupManager';
import { CardListHeader, CardListSection } from './cardManager/CardListSection';

export function CardManagerPanel({ initialBatch = false, initialSelect }: { initialBatch?: boolean; initialSelect?: string } = {}) {
  const m = useCardManager(initialBatch, initialSelect);
  return (
    <div className="space-y-4">
      <CardListHeader m={m} />
      {m.batch && <BatchToolbar m={m} />}
      <BookmarkImport m={m} />
      <GroupManager m={m} />
      <CardListSection m={m} />
      <CardEditModal open={m.editTarget !== null} cardId={m.editTarget} onClose={() => m.setEditTarget(null)} />
    </div>
  );
}
