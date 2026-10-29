// 挂件对宿主（卡片管理抽屉 / 设置抽屉）的调用入口，由 CardDeck 侧注入
export interface WidgetCtx {
  openCards: () => void;   // 书签管理 → 卡片管理抽屉
  openSettings: () => void; // 设置中心 → 抽屉主界面
}
let widgetCtx: WidgetCtx = { openCards: () => undefined, openSettings: () => undefined };
export function setWidgetCtx(ctx: WidgetCtx) {
  widgetCtx = ctx;
}
// 点击时取最新注入值，不能在渲染期缓存引用
export function getWidgetCtx(): WidgetCtx {
  return widgetCtx;
}
