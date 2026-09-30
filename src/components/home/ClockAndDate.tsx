// 时钟 + 日期：对齐 8801 参考默认态（Roboto 700；时钟 56px；日期 3 段：公历/星期/农历，gap 8px）
// 高级项对齐参考 clockAndDate 注册表：秒钟/时间高度/日期分段/阴影/透明度/对齐/替换为文本·图片·HTML
import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { lunar } from '../../lib/lunar';
import { useSite } from '../../store/site';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const pad = (n: number) => String(n).padStart(2, '0');
const ROBOTO = 'Roboto, arial, sans-serif';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function ClockAndDate() {
  const now = useNow();
  const { settings } = useSite();
  if (!settings.showClock) return null;
  const l = lunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const hour = settings.clock24h ? now.getHours() : (now.getHours() + 11) % 12 + 1;
  const timeText = settings.clockSeconds ? `${hour}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` : `${hour}:${pad(now.getMinutes())}`;
  const shellStyle: React.CSSProperties = {
    fontFamily: ROBOTO,
    opacity: settings.clockOpacity,
    alignItems: settings.clockAlign === 'left' ? 'flex-start' : settings.clockAlign === 'right' ? 'flex-end' : 'center',
    textShadow: settings.clockShadow ? '0 2px 8px rgba(0,0,0,0.5)' : undefined,
    textAlign: settings.clockAlign,
  };

  // 替换为自定义文本（主/副）
  if (settings.clockReplace === 'text') {
    return (
      <div className="flex flex-col text-white" style={shellStyle}>
        {settings.clockMainText && (
          <div style={{ fontSize: settings.clockMainHeight, lineHeight: `${settings.clockMainHeight}px`, fontWeight: settings.clockMainBold ? 700 : 400 }}>{settings.clockMainText}</div>
        )}
        {settings.clockSubOn && settings.clockSubText && (
          <div style={{ fontSize: settings.clockSubHeight, lineHeight: `${settings.clockSubHeight}px` }}>{settings.clockSubText}</div>
        )}
      </div>
    );
  }
  // 替换为图片 logo
  if (settings.clockReplace === 'image' && settings.clockImage) {
    return (
      <div className="flex flex-col items-center" style={{ opacity: settings.clockOpacity }}>
        <img src={settings.clockImage} alt="" style={{ height: settings.clockImageHeight }} />
      </div>
    );
  }
  // 替换为自定义 HTML（外部可污染字段——云同步/备份导入，DOMPurify 白名单净化防存储 XSS）
  if (settings.clockReplace === 'html' && settings.clockHtml) {
    return <div className="text-white" style={{ opacity: settings.clockOpacity }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(settings.clockHtml) }} />;
  }

  // 默认：时钟 + 日期（对齐 tab.kfkf.asia：`YYYY M D` 空格分隔，无星期/农历默认）
  const solar = [
    settings.dateYear ? `${now.getFullYear()}` : '',
    settings.dateMonth ? `${now.getMonth() + 1}` : '',
    settings.dateDay ? `${now.getDate()}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const lunarText = [
    settings.lunarYear ? `${l.year}年` : '',
    settings.lunarMonth ? `${l.leap}${l.month}月` : '',
    settings.lunarDay ? l.day : '',
  ].join('');
  const showLunar = settings.showLunar && !!(settings.lunarYear || settings.lunarMonth || settings.lunarDay);
  const showSolar = settings.dateYear || settings.dateMonth || settings.dateDay;
  // 移动端时钟按 37.5/56 比例缩放（对齐参考移动基线），默认值保持响应式 class
  const isDefaultHeight = settings.clockHeight === 56;
  return (
    <div className="flex flex-col gap-2 text-white" style={shellStyle}>
      <div
        className={isDefaultHeight ? 'text-[37.5px] font-bold leading-[37.5px] md:text-[56px] md:leading-[56px]' : 'font-bold'}
        style={isDefaultHeight ? undefined : { fontSize: settings.clockHeight, lineHeight: `${settings.clockHeight}px` }}
      >
        {timeText}
      </div>
      {settings.showDate && (
        <div className="flex gap-2 text-base font-bold leading-4">
          {showSolar && solar && <div>{solar}</div>}
          {settings.showWeek && <div>{`星期${WEEK[now.getDay()]}`}</div>}
          {showLunar && lunarText && <div>{lunarText}</div>}
        </div>
      )}
    </div>
  );
}
