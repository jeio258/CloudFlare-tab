// 组件卡 + 挂件卡：通过 HomeCard.type + config(JSON) 挂载为可添加卡片
// 挂件实现见 ./widgets/（一文件一挂件），本文件只保留类型清单与注册表分派
import { WIDGET_RENDERERS } from './widgets/registry';
import type { CompProps } from './widgets/types';

export { setWidgetCtx } from './widgets/ctx';

// WidgetType 引用 types.ts 单一来源（与 HomeCard.type 同源，缺 'link'）
export type WidgetType = import('../../api/types').WidgetCardType;

// 对齐参考 addComponent 组件清单（股市行情属 B 类砍，除外）
export const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: 'bookmarks', label: '书签管理' },
  { value: 'history', label: '历史记录' },
  { value: 'settings', label: '设置中心' },
  { value: 'hotEvents', label: '热点榜单' },
  { value: 'weather', label: '天气' },
  { value: 'memo', label: '记事本' },
  { value: 'analogClock', label: '表盘时钟' },
  { value: 'digitalClock', label: '数字时钟' },
  { value: 'calendar', label: '日历' },
  { value: 'countdown', label: '倒数日' },
  { value: 'countdownAgg', label: '聚合倒数日' },
  { value: 'rmbUpper', label: '人民币大写转换' },
  { value: 'exchangeRate', label: '实时汇率' },
  { value: 'disguise', label: '伪装助手' },
  { value: 'iframe', label: '内嵌框架' },
];

export function renderWidget(type: WidgetType, id: string, config: Record<string, unknown>, compact: boolean): React.ReactNode {
  const props: CompProps = { id, config, compact };
  // 运行时可能收到非挂件类型（如 'link'），注册表外一律不渲染
  const Renderer = WIDGET_RENDERERS[type];
  return Renderer ? <Renderer {...props} /> : null;
}
