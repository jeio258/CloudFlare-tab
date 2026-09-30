// 外部数据信任边界：云同步 / 备份导入 / 分享 / 本地遗留数据的统一净化入口
// 规则：字段类型收敛 + url scheme 白名单（http/https）+ 非法值回落默认，防 javascript: 注入与畸形数据白屏
import type { BottomLink, HomeCard } from '../api/types';
import type { SiteSettings } from '../store/settings';

const isHttp = (u: string) => /^https?:\/\//i.test(u);
// 壁纸/图标类资源额外允许站内绝对路径
const isLocalPath = (u: string) => u.startsWith('/');
const asString = (v: unknown) => (typeof v === 'string' ? v : '');
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

const SIZES: readonly string[] = ['1x1', '2x1', '4x1', '1x2', '2x2', '4x2'];
const STYLES: readonly string[] = ['default', 'horizontal', 'vertical', 'image', 'text'];

export function normalizeCard(raw: unknown): HomeCard {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const url = asString(r.url);
  const size = asString(r.size);
  const style = asString(r.displayStyle);
  const color = (v: unknown) => (typeof v === 'string' && COLOR_RE.test(v) ? v : undefined);
  return {
    id: asString(r.id) || `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    title: asString(r.title),
    subTitle: asString(r.subTitle),
    // 卡片链接仅允许 http(s)，其余置空阻断 javascript: 等 scheme
    url: isHttp(url) ? url : '',
    icon: asString(r.icon),
    group: asString(r.group),
    displayStyle: (STYLES.includes(style) ? style : 'default') as HomeCard['displayStyle'],
    type: (asString(r.type) || 'link') as HomeCard['type'],
    config: asString(r.config),
    // size 白名单收敛（CardDeck 网格占格仅认六选项），畸形值回落默认 1x1
    size: (SIZES.includes(size) ? size : undefined) as HomeCard['size'],
    fontSize: typeof r.fontSize === 'number' && r.fontSize >= 9 && r.fontSize <= 32 ? r.fontSize : undefined,
    fontColor: color(r.fontColor),
    bgColor: color(r.bgColor),
  };
}

export function normalizeCards(raw: unknown): HomeCard[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === 'object').map(normalizeCard);
}

const asObjList = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object') : [];

export function normalizeSettings(raw: unknown): Partial<SiteSettings> {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out: Partial<SiteSettings> = {};
  const asset = (u: string) => (isHttp(u) || isLocalPath(u) ? u : '');

  // 底部链接：url 仅 http(s)（<a href> 直出，需阻断 javascript:）
  if (r.bottomLinks !== undefined) {
    out.bottomLinks = asObjList(r.bottomLinks)
      .slice(0, 20)
      .map<BottomLink>((l) => {
        const url = asString(l.url);
        return { name: asString(l.name), url: isHttp(url) ? url : '', icon: asString(l.icon) };
      });
  }

  // 自定义引擎：template 仅 http(s) 且含 %s（openUrl 经此跳转）
  if (r.customEngines !== undefined) {
    out.customEngines = asObjList(r.customEngines)
      .slice(0, 12)
      .map((c) => {
        const template = asString(c.template);
        return {
          id: asString(c.id) || `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          name: asString(c.name),
          template: isHttp(template) ? template : '',
          icon: asset(asString(c.icon)) || undefined,
        };
      })
      .filter((c) => c.template.includes('%s'));
  }

  // 壁纸/图片类：http(s) 或站内路径（注入 CSS url()/<img src>）
  if (typeof r.wallpaper === 'string') out.wallpaper = asset(r.wallpaper);
  if (typeof r.wallpaperUrls === 'string') {
    out.wallpaperUrls = r.wallpaperUrls
      .split('\n')
      .map((l) => asset(l.trim()))
      .filter(Boolean)
      .join('\n');
  }
  if (typeof r.clockImage === 'string') out.clockImage = asset(r.clockImage);
  return out;
}

// 记事本内容（云同步快照新增字段；键=卡片 id，值=文本）：键白名单 + 单条 10KB 上限，防快照膨胀与脏键
export function normalizeMemos(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (/^[A-Za-z0-9_-]{1,64}$/.test(k) && typeof v === 'string') out[k] = v.slice(0, 10000);
    }
  }
  return out;
}
