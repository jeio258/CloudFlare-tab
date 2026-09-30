// 站点设置（本地持久化，云同步时整体进快照）：布局/时钟/搜索引擎/壁纸/简约模式/卡片
// 自定义搜索引擎：template 用 %s 作查询占位符（OpenSearch 风格）
export interface CustomEngine {
  id: string;
  name: string;
  template: string;
  icon?: string; // 自定义引擎图标 URL（对齐参考 searchEngines）
}

export interface SiteSettings {
  // 主界面
  wallpaper: string;        // 壁纸 URL（'' = 默认）
  wallpaperDim: number;     // 亮度 0.6-1
  wallpaperBlur: number;    // 壁纸模糊度 0-20px（对齐参考「壁纸模糊度」）
  wallpaperSlideshow: boolean;      // 幻灯片轮播壁纸
  wallpaperUrls: string;    // 轮播壁纸地址（每行一个）
  wallpaperInterval: number; // 壁纸轮播间隔（秒）
  colorMode: 'wallpaper' | 'color' | 'gradient';
  gradientFrom: string;     // 双层渐变起始色
  gradientTo: string;       // 双层渐变结束色
  color: string;
  simpleMode: boolean;      // 简约模式
  immersive: boolean;       // 沉浸状态：隐藏卡片网格，仅保留时间/日期/搜索框与右上菜单按钮
  // 时间日期（对齐参考 clockAndDate 注册表）
  showClock: boolean;
  clock24h: boolean;
  clockSeconds: boolean;      // 秒钟
  clockHeight: number;        // 时间高度 px
  showDate: boolean;
  showLunar: boolean;         // 总开关（农历任一段显示即需 true）
  dateYear: boolean;          // 阳历年
  dateMonth: boolean;         // 阳历月
  dateDay: boolean;           // 阳历日
  showWeek: boolean;          // 星期/周
  lunarYear: boolean;         // 农历年
  lunarMonth: boolean;        // 农历月
  lunarDay: boolean;          // 农历日
  clockShadow: boolean;       // 时间日期阴影
  clockOpacity: number;       // 时间日期透明度 0-1
  clockAlign: 'left' | 'center' | 'right'; // 对齐方式
  clockReplace: 'none' | 'text' | 'image' | 'html'; // 替换模式
  clockMainText: string;      // 替换主文本内容
  clockMainBold: boolean;     // 主文本加粗
  clockMainHeight: number;    // 主文本高度
  clockSubOn: boolean;        // 副文本开关
  clockSubText: string;       // 副文本内容
  clockSubHeight: number;     // 副文本高度
  clockImage: string;         // 替换图片地址
  clockImageHeight: number;   // 替换图片高度
  clockHtml: string;          // 自定义 HTML 内容
  // 打开方式
  openType: 'newtab' | 'new' | 'self'; // 新标签页/新窗口/当前页
  // 搜索栏（对齐参考 searchBar 注册表）
  engine: string;           // 引擎 value
  showSuggest: boolean;
  searchHistory: boolean;     // 本地搜索历史记录
  clearSearchAfter: boolean;  // 搜索后清除输入框内容
  searchRadius: number;       // 搜索栏圆角 px
  searchHeight: number;       // 搜索栏高度 px
  searchMaxWidth: number;     // 搜索栏最大宽度 px
  searchOpacity: number;      // 搜索栏初始透明度（白底 alpha）
  searchFocusOpacity: number; // 选中时透明度
  searchAutoFocus: boolean;   // 自动聚焦
  searchBtnStyle: 'icon' | 'text'; // 搜索按钮样式
  searchBtnText: string;      // 搜索按钮文字/文案
  searchPlaceholder: string;  // 提示词文案
  customEngines: CustomEngine[];
  // 排版布局：standard 卡行（1:1 基线）/ squares 64 方块；位置调整 = 行/列内换位
  cardLayout: 'standard' | 'squares';
  // 分组管理：卡片分组名列表（卡片归属见 HomeCard.group）
  cardGroups: string[];
  // 底部链接
  showBottomLinks: boolean;
  bottomLinks: import('../api/types').BottomLink[]; // 对齐参考 bottomLinks 管理
  autoSync: boolean;        // 登录后变更自动推送云端
  // 挂件
  showWeather: boolean;
  weatherCity: string;      // 天气城市（getCityList value）
  showHistoryWidget: boolean; // 历史记录挂件（A10）
  disguiseEnabled: boolean;   // 伪装助手（A9，F2 切换）
  showHotEvents: boolean;
  showExchangeRate: boolean;
  showYiyan: boolean;
  // 简约模式：移除顶部显示自定义文本；边框/字体色 ''=禁用
  simpleRemoveHeader: boolean;
  simpleText: string;
  simpleExitByText: boolean;
  simpleTextHeight: number;
  simpleChangeColor: boolean;
  simpleTextColor: string;
  simpleFont: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  wallpaper: '',
  wallpaperDim: 0.8,
  wallpaperBlur: 0,
  wallpaperSlideshow: false,
  wallpaperUrls: '',
  wallpaperInterval: 60,
  colorMode: 'wallpaper',
  gradientFrom: '#1e3c72',
  gradientTo: '#2a5298',
  color: '#12151a',
  simpleMode: false,
  immersive: false,
  showClock: true,
  clock24h: false,
  clockSeconds: true,
  clockHeight: 56,
  showDate: true,
  showLunar: false,
  dateYear: true,
  dateMonth: true,
  dateDay: true,
  showWeek: false,
  lunarYear: true,
  lunarMonth: true,
  lunarDay: true,
  clockShadow: false,
  clockOpacity: 1,
  clockAlign: 'center',
  clockReplace: 'none',
  clockMainText: '',
  clockMainBold: true,
  clockMainHeight: 56,
  clockSubOn: false,
  clockSubText: '',
  clockSubHeight: 20,
  clockImage: '',
  clockImageHeight: 80,
  clockHtml: '',
  openType: 'newtab',
  engine: 'baidu',
  showSuggest: true,
  searchHistory: false,
  clearSearchAfter: false,
  searchRadius: 12,
  searchHeight: 48,
  searchMaxWidth: 600,
  searchOpacity: 0.7,
  searchFocusOpacity: 0.7,
  searchAutoFocus: false,
  searchBtnStyle: 'icon',
  searchBtnText: '搜索',
  searchPlaceholder: '搜一搜，看一看',
  customEngines: [],
  cardLayout: 'standard',
  cardGroups: [],
  showBottomLinks: true,
  bottomLinks: [
    { name: '本网站由cloudflare提供计算服务', url: '' },
  ],
  autoSync: true,
  showWeather: false,
  weatherCity: 'beijing',
  showHistoryWidget: false,
  disguiseEnabled: false,
  showHotEvents: false,
  showExchangeRate: false,
  showYiyan: true,
  simpleRemoveHeader: false,
  simpleText: '',
  simpleExitByText: true,
  simpleTextHeight: 72,
  simpleChangeColor: false,
  simpleTextColor: '#ffffff',
  simpleFont: '',
};

const KEY = 'persist:settings';

export function loadSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const s = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<SiteSettings>) };
    // 旧值归一化：stack/grid/freeDrag 为历史形态，统一映射 standard
    if ((s.cardLayout as string) !== 'squares') s.cardLayout = 'standard';
    // 历史遗留键清理
    delete (s as Record<string, unknown>).freeDragStep;
    delete (s as Record<string, unknown>).freeDragPositions;
    delete (s as Record<string, unknown>).simpleShowFreeDragCards;
    delete (s as Record<string, unknown>).simpleBorder; // 零消费死设置，入库残留清理
    const clean = JSON.stringify(s);
    if (clean !== raw) saveSettings(s); // 清理结果回写，避免脏值滞留
    return s;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: SiteSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
