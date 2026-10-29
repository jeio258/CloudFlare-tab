import { useFetch } from '../../../lib/hooks';
import { useSite } from '../../../store/site';

export function WeatherCard() {
  const { settings } = useSite();
  const { data, err } = useFetch<{ data: { weather: { city: string; current_temperature: string; current_condition: string; weather_icon_id: string } } }>(
    `/api/getWeather?city=${encodeURIComponent(settings.weatherCity || 'beijing')}`
  );
  const w = data?.data?.weather;
  if (err) return <div className="text-center text-[10px] text-gray-400">天气失败</div>;
  if (!w) return <div className="text-center text-[10px] text-gray-400">加载中…</div>;
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 px-2">
      <img src={`/images/w${w.weather_icon_id}.png`} alt="" className="h-8 w-8 object-contain" />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[10px] text-gray-500">{w.city}</div>
        <div className="text-xs font-semibold text-ink">
          {w.current_temperature} {w.current_condition}
        </div>
      </div>
    </div>
  );
}
