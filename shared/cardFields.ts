// 卡片字段唯一定义源：前端驼峰名 ↔ D1 列名 ↔ 类型与净化规则。
// src/api/types.ts（类型）、src/lib/normalize.ts（信任边界净化）、functions/lib/db.ts（行映射）均由此派生，
// 新增/改名卡片字段只改本文件。纯常量与纯函数，不得引入 React / Workers 运行时。

export const WIDGET_CARD_TYPES = [
  'countdown', 'countdownAgg', 'memo', 'analogClock', 'digitalClock', 'calendar', 'iframe', 'rmbUpper',
  'weather', 'hotEvents', 'exchangeRate', 'history', 'bookmarks', 'settings', 'disguise',
] as const;
export type WidgetCardType = (typeof WIDGET_CARD_TYPES)[number];

export const CARD_TYPES = ['link', ...WIDGET_CARD_TYPES] as const;
export const CARD_SIZES = ['1x1', '2x1', '4x1', '1x2', '2x2', '4x2'] as const;
export const CARD_DISPLAY_STYLES = ['default', 'horizontal', 'vertical', 'image', 'text'] as const;

export type CardRule =
  | { kind: 'text' }
  | { kind: 'url' } // 仅 http(s)，用于阻断 javascript: 等 scheme
  | { kind: 'color' } // #RGB ~ #RRGGBBAA
  | { kind: 'enum'; values: readonly string[] }
  | { kind: 'number'; min: number; max: number };

export interface CardFieldDef {
  /** 前端驼峰字段名（HomeCard 键） */
  key: string;
  /** D1 cards 表列名 */
  column: string;
  rule: CardRule;
  /** 净化失败或空值时的回落；缺省表示省略该键 */
  fallback?: string | (() => string);
  /** HomeCard 中是否必填 */
  required?: boolean;
  /** 读库时空值仍保留键；缺省为「非空才保留」 */
  db?: 'always';
  /** 读/写库时列值缺失的回落（如 type 列缺省为 link） */
  dbFallback?: string;
}

const newCardId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// 顺序即 D1 列序（card_id 必须在首位：replaceUserCards 在其后插入 ord），读回键序亦按此排列
export const CARD_FIELDS = [
  { key: 'id', column: 'card_id', rule: { kind: 'text' }, fallback: newCardId, required: true, db: 'always' },
  { key: 'title', column: 'title', rule: { kind: 'text' }, fallback: '', required: true, db: 'always' },
  { key: 'subTitle', column: 'sub_title', rule: { kind: 'text' }, fallback: '', required: true, db: 'always' },
  { key: 'url', column: 'url', rule: { kind: 'url' }, fallback: '', required: true, db: 'always' },
  { key: 'icon', column: 'icon', rule: { kind: 'text' }, fallback: '' },
  { key: 'iconColor', column: 'icon_color', rule: { kind: 'color' } },
  { key: 'color', column: 'color', rule: { kind: 'color' } },
  { key: 'group', column: 'group_name', rule: { kind: 'text' }, fallback: '' },
  { key: 'displayStyle', column: 'display_style', rule: { kind: 'enum', values: CARD_DISPLAY_STYLES }, fallback: 'default' },
  // 非法 type 会让 renderWidget 落空渲染成空白卡，故白名单外一律收敛为 'link'
  { key: 'type', column: 'type', rule: { kind: 'enum', values: CARD_TYPES }, fallback: 'link', db: 'always', dbFallback: 'link' },
  { key: 'config', column: 'config', rule: { kind: 'text' }, fallback: '' },
  { key: 'size', column: 'size', rule: { kind: 'enum', values: CARD_SIZES } },
  { key: 'fontSize', column: 'font_size', rule: { kind: 'number', min: 9, max: 32 } },
  { key: 'fontColor', column: 'font_color', rule: { kind: 'color' } },
  { key: 'bgColor', column: 'bg_color', rule: { kind: 'color' } },
] as const satisfies readonly CardFieldDef[];

// 运行时遍历入口：元组元素类型收窄后属性为可选，统一按 CardFieldDef 读取
export const CARD_FIELD_LIST: readonly CardFieldDef[] = CARD_FIELDS;

type FieldDef = (typeof CARD_FIELDS)[number];
export type CardFieldKey = FieldDef['key'];
export type CardColumn = FieldDef['column'];

type RuleValue<R> = R extends { kind: 'enum'; values: readonly (infer V)[] }
  ? V
  : R extends { kind: 'number' }
    ? number
    : string;

export type CardFieldValue<K extends CardFieldKey> = RuleValue<Extract<FieldDef, { key: K }>['rule']>;

type RequiredKey = Extract<FieldDef, { required: true }>['key'];
type OptionalKey = Exclude<CardFieldKey, RequiredKey>;

export type HomeCardFields = { [K in RequiredKey]: CardFieldValue<K> } & {
  [K in OptionalKey]?: CardFieldValue<K>;
};

const isHttp = (u: string) => /^https?:\/\//i.test(u);
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

const parseField = (rule: CardRule, raw: unknown): string | number | undefined => {
  switch (rule.kind) {
    case 'text':
      return typeof raw === 'string' ? raw : undefined;
    case 'url':
      return typeof raw === 'string' && isHttp(raw) ? raw : undefined;
    case 'color':
      return typeof raw === 'string' && COLOR_RE.test(raw) ? raw : undefined;
    case 'enum':
      return typeof raw === 'string' && rule.values.includes(raw) ? raw : undefined;
    case 'number':
      return typeof raw === 'number' && raw >= rule.min && raw <= rule.max ? raw : undefined;
  }
};

export function normalizeCardFields(raw: unknown): HomeCardFields {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const f of CARD_FIELD_LIST) {
    const v = parseField(f.rule, r[f.key]);
    const fb = typeof f.fallback === 'function' ? f.fallback() : f.fallback;
    // 无 fallback 的字段（size/fontSize/*Color）仍写入 undefined：保持键集恒定，与旧实现一致
    out[f.key] = v === undefined || v === '' ? fb : v;
  }
  return out as unknown as HomeCardFields;
}
