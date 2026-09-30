// 壁纸层：设置驱动（壁纸/亮度/模糊/幻灯片轮播/纯色/双层渐变），双层交叉淡入 + 滤镜
import { useEffect, useState } from 'react';
import { useSite } from '../../store/site';

export default function WallpaperLayer() {
  const { settings } = useSite();
  const urls = settings.wallpaperUrls.split('\n').map((x) => x.trim()).filter(Boolean);
  const [slide, setSlide] = useState(0);

  // 幻灯片轮播（对齐参考「幻灯片轮播壁纸/壁纸轮播间隔」）
  useEffect(() => {
    if (!settings.wallpaperSlideshow || urls.length < 2) return;
    const ms = Math.max(5, settings.wallpaperInterval) * 1000;
    const t = setInterval(() => setSlide((i) => (i + 1) % urls.length), ms);
    return () => clearInterval(t);
  }, [settings.wallpaperSlideshow, settings.wallpaperInterval, urls.length]);

  const dim = settings.wallpaperDim ?? 0.8;
  const blur = settings.wallpaperBlur ?? 0;
  const filter = `brightness(${dim})${blur > 0 ? ` blur(${blur}px)` : ''}`;

  if (settings.colorMode === 'color') {
    return (
      <div className="ease-set fixed inset-0 z-0 h-screen w-screen scale-110 overflow-hidden">
        <div className="fixed inset-0 h-screen w-full" style={{ background: settings.color }} />
      </div>
    );
  }
  if (settings.colorMode === 'gradient') {
    return (
      <div className="ease-set fixed inset-0 z-0 h-screen w-screen overflow-hidden">
        <div
          className="fixed inset-0 h-screen w-full"
          style={{ background: `linear-gradient(135deg, ${settings.gradientFrom} 0%, ${settings.gradientTo} 100%)` }}
        />
      </div>
    );
  }
  const url = settings.wallpaperSlideshow && urls.length > 0 ? urls[slide % urls.length] : settings.wallpaper || '/images/wallpaper.webp';
  return (
    <div className="ease-set fixed inset-0 z-0 h-screen w-screen scale-110 overflow-hidden">
      <div
        className="fixed inset-0 h-screen w-full bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${url})`, filter }}
      />
    </div>
  );
}
