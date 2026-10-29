// 数据类型：与参考后端契约一致
import type { HomeCardFields } from '../../shared/cardFields';

export interface UserInfo {
  userId: string;
  username: string;
  nickname: string;
  sex: number;
  phone: string;
  birthday: string;
  avatar: string;
  userType: number;
  shareEnabled?: number;
  shareId?: string;
  appellation: string;
  appellationStatus: number;
  registerTime: string;
}

export interface LoginData {
  token: string;
  userInfo: UserInfo;
}

export interface NoticeData {
  title: string;
  content: string;
  timeCode: string;
}

export interface DefaultData {
  data: unknown;
  created_at: string;
}

// 挂件卡片类型：元组与 HomeCard 同在 shared/cardFields.ts，此处保留原导出路径供既有引用点使用
export { WIDGET_CARD_TYPES } from '../../shared/cardFields';
export type { WidgetCardType } from '../../shared/cardFields';

// 首页卡片（云同步数据形状，对齐参考 user/push 的快照结构）
// 字段与可选性由 shared/cardFields.ts 字段表派生，勿在此逐字段重写
export type HomeCard = HomeCardFields;

// 底部链接（对齐参考 bottomLinks：链接名称/地址/图标）
export interface BottomLink {
  name: string;
  url: string;
  icon?: string;
}

export interface HomeData {
  home: {
    cards: HomeCard[];
    showMode?: 'wallpaper' | 'color';
    color?: string;
  };
}
