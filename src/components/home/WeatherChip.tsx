// 天气挂件（左下角小卡）：/api/getWeather，服务端代理 + 缓存；城市来自设置（对齐参考城市切换）
import { useFetch } from '../../lib/hooks';
import { useSite } from '../../store/site';

interface Weather {
  city: string;
  current_temperature: string;
  current_condition: string;
  weather_icon_id: string;
}

interface Wrapper {
  data: { city: string; weather: Weather };
}

export default function WeatherChip() {
  const { settings } = useSite();
  const city = settings.weatherCity || 'beijing';
  const { data, err } = useFetch<Wrapper>(`/api/getWeather?city=${encodeURIComponent(city)}`);
  const w = err ? null : (data?.data?.weather ?? null);

  if (!w) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm text-ink shadow-glass backdrop-blur-md">
      <img src={`/images/w${w.weather_icon_id}.png`} alt="" className="h-8 w-8" />
      <div className="leading-tight">
        <div className="font-semibold">{w.city}</div>
        <div className="text-xs text-gray-600">
          {w.current_temperature} {w.current_condition}
        </div>
      </div>
    </div>
  );
}
