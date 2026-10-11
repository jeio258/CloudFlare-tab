// 挂件静态数据表（与逻辑分离，便于维护）：
// 天气图标码映射 / 热榜类型白名单 / 汇率币种与兜底 / 一言兜底 / 城市表

// 中国天气网 3 位图标码 -> 项目内置 /images/w{id}.png
export const ICON_BY_CODE: Record<string, string> = {
  '100': '0', '101': '1', '102': '1', '103': '1', '104': '2',
  '300': '3', '301': '3', '302': '4', '303': '4', '304': '4',
  '305': '7', '306': '8', '307': '9', '308': '10', '309': '7', '310': '7', '311': '7', '312': '8', '313': '10', '399': '7',
  '400': '14', '401': '15', '402': '16', '403': '16', '404': '6', '405': '6', '406': '14', '407': '15', '408': '16',
  '409': '6', '410': '13', '411': '14', '412': '15', '413': '16', '499': '14',
  '500': '18', '501': '18', '502': '18', '503': '18', '504': '18', '505': '18', '506': '18', '518': '18',
  '507': '29', '508': '29', '509': '29', '510': '29', '511': '29', '512': '29', '513': '29', '514': '29', '515': '29',
  '200': '20', '201': '20', '202': '20', '203': '20', '204': '20', '205': '20', '206': '20',
  '900': '30', '901': '31',
};

export const HOT_TYPES = new Set(['weibo', 'bilibili', 'baidu', 'douyin']);

export const FX_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'HKD', 'AUD', 'CAD', 'CHF', 'NZD'];
export const FX_FALLBACK: Record<string, number> = {
  CNY: 1, USD: 7.16, EUR: 7.85, GBP: 9.1, JPY: 0.0478, HKD: 0.916,
  AUD: 4.72, CAD: 5.24, CHF: 8.1, NZD: 4.32,
};

export const SAY_FALLBACK = [
  '花有重开日，人无再少年。',
  '纸上得来终觉浅，绝知此事要躬行。',
  '长风破浪会有时，直挂云帆济沧海。',
  '念念不忘，必有回响。',
  '路虽远，行则将至；事虽难，做则必成。',
];

export interface City {
  label: string;
  value: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  { label: '北京', value: 'beijing', lat: 39.9042, lon: 116.4074 },
  { label: '上海', value: 'shanghai', lat: 31.2304, lon: 121.4737 },
  { label: '广州', value: 'guangzhou', lat: 23.1291, lon: 113.2644 },
  { label: '深圳', value: 'shenzhen', lat: 22.5431, lon: 114.0579 },
  { label: '杭州', value: 'hangzhou', lat: 30.2741, lon: 120.1551 },
  { label: '成都', value: 'chengdu', lat: 30.5728, lon: 104.0668 },
  { label: '重庆', value: 'chongqing', lat: 29.563, lon: 106.5516 },
  { label: '武汉', value: 'wuhan', lat: 30.5928, lon: 114.3055 },
  { label: '西安', value: 'xian', lat: 34.3416, lon: 108.9398 },
  { label: '南京', value: 'nanjing', lat: 32.0603, lon: 118.7969 },
  { label: '天津', value: 'tianjin', lat: 39.3434, lon: 117.3616 },
  { label: '苏州', value: 'suzhou', lat: 31.2989, lon: 120.5853 },
  { label: '长沙', value: 'changsha', lat: 28.2282, lon: 112.9388 },
  { label: '郑州', value: 'zhengzhou', lat: 34.7466, lon: 113.6254 },
  { label: '青岛', value: 'qingdao', lat: 36.0671, lon: 120.3826 },
  { label: '大连', value: 'dalian', lat: 38.914, lon: 121.6147 },
  { label: '厦门', value: 'xiamen', lat: 24.4798, lon: 118.0894 },
  { label: '福州', value: 'fuzhou', lat: 26.0745, lon: 119.2965 },
  { label: '济南', value: 'jinan', lat: 36.6512, lon: 117.1201 },
  { label: '沈阳', value: 'shenyang', lat: 41.8057, lon: 123.4315 },
  { label: '哈尔滨', value: 'haerbin', lat: 45.8038, lon: 126.5349 },
  { label: '昆明', value: 'kunming', lat: 24.8801, lon: 102.8329 },
  { label: '贵阳', value: 'guiyang', lat: 26.647, lon: 106.6302 },
  { label: '南宁', value: 'nanning', lat: 22.817, lon: 108.3665 },
  { label: '海口', value: 'haikou', lat: 20.044, lon: 110.1999 },
  { label: '兰州', value: 'lanzhou', lat: 36.0611, lon: 103.8343 },
  { label: '乌鲁木齐', value: 'wulumuqi', lat: 43.8256, lon: 87.6168 },
  { label: '石家庄', value: 'shijiazhuang', lat: 38.0428, lon: 114.5149 },
  { label: '合肥', value: 'hefei', lat: 31.8206, lon: 117.2272 },
  { label: '南昌', value: 'nanchang', lat: 28.682, lon: 115.8579 },
  { label: '香港', value: 'hongkong', lat: 22.3193, lon: 114.1694 },
  { label: '澳门', value: 'macao', lat: 22.1987, lon: 113.5439 },
  { label: '台北', value: 'taibei', lat: 25.033, lon: 121.5654 },
  { label: '东京', value: 'tokyo', lat: 35.6762, lon: 139.6503 },
  { label: '首尔', value: 'seoul', lat: 37.5665, lon: 126.978 },
  { label: '新加坡', value: 'singapore', lat: 1.3521, lon: 103.8198 },
  { label: '纽约', value: 'newyork', lat: 40.7128, lon: -74.006 },
  { label: '洛杉矶', value: 'losangeles', lat: 34.0522, lon: -118.2437 },
  { label: '伦敦', value: 'london', lat: 51.5074, lon: -0.1278 },
  { label: '巴黎', value: 'paris', lat: 48.8566, lon: 2.3522 },
  { label: '悉尼', value: 'sydney', lat: -33.8688, lon: 151.2093 },
];
