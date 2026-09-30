// 排版布局：已融合为统一方格网格（默认模式），不再区分标准/方块
export function LayoutPanel() {
  return (
    <div className="space-y-4">
      <div className="text-sm">卡片布局已统一为方格模式：支持卡片大小调整（编辑弹窗）与行/列内拖拽换位。</div>
      <div className="text-xs text-gray-500">拖到同行或同列的另一张卡片上即可交换位置。</div>
    </div>
  );
}
