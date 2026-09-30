// 数据类型：与参考后端契约一致
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

// 挂件卡片类型（单一来源：HomeCard.type 与 WidgetCards 的 WidgetType 均引用此处）
export type WidgetCardType =
  | 'countdown' | 'countdownAgg' | 'memo' | 'analogClock' | 'digitalClock' | 'calendar' | 'iframe' | 'rmbUpper'
  | 'weather' | 'hotEvents' | 'exchangeRate' | 'history' | 'bookmarks' | 'settings' | 'disguise';

// 首页卡片（云同步数据形状，对齐参考 user/push 的快照结构）
export interface HomeCard {
  id: string;
  title: string;
  subTitle: string;
  url: string;
  icon?: string;
  iconColor?: string;
  color?: string;
  group?: string; // 所属分组名（''/缺省 = 未分组）
  displayStyle?: 'default' | 'horizontal' | 'vertical' | 'image' | 'text'; // 展示样式（对齐参考：默认/横版/竖版/纯图/纯文本）
  type?: 'link' | WidgetCardType; // 卡片类型（A7 组件族 + A8 挂件卡）
  config?: string;     // 组件配置 JSON（如 {"date":"2026-12-31"}）
  size?: '1x1' | '2x1' | '4x1' | '1x2' | '2x2' | '4x2'; // 卡片大小（列x行，对齐参考编辑弹窗「卡片大小」六选项，缺省回落 displayStyle）
  fontSize?: number;   // 卡片名称字号覆盖（批量调整）
  fontColor?: string;  // 卡片文字颜色覆盖（批量调整）
  bgColor?: string;    // 卡片背景颜色覆盖（批量调整）
}

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
