// 挂件类型 → 渲染器注册表；键集与 types.ts 的 WIDGET_CARD_TYPES 完全对齐（Record 保证编译期穷尽）
import type { ComponentType } from 'react';
import type { WidgetCardType } from '../../../api/types';
import type { CompProps } from './types';

import { WeatherCard } from './WeatherCard';
import { HotEventsCard } from './HotEventsCard';
import { ExchangeRateCard } from './ExchangeRateCard';
import { HistoryCard } from './HistoryCard';
import { BookmarksCard, DisguiseCard, SettingsCard } from './ActionCard';
import { CountdownCard } from './CountdownCard';
import { CountdownAggCard } from './CountdownAggCard';
import { MemoCard } from './MemoCard';
import { AnalogClockCard } from './AnalogClockCard';
import { DigitalClockCard } from './DigitalClockCard';
import { CalendarCard } from './CalendarCard';
import { IframeCard } from './IframeCard';
import { RmbUpperCard } from './RmbUpperCard';

export const WIDGET_RENDERERS: Record<WidgetCardType, ComponentType<CompProps>> = {
  countdown: CountdownCard,
  countdownAgg: CountdownAggCard,
  memo: MemoCard,
  analogClock: () => <AnalogClockCard />,
  digitalClock: () => <DigitalClockCard />,
  calendar: CalendarCard,
  iframe: IframeCard,
  rmbUpper: RmbUpperCard,
  weather: () => <WeatherCard />,
  hotEvents: () => <HotEventsCard />,
  exchangeRate: () => <ExchangeRateCard />,
  history: HistoryCard,
  bookmarks: BookmarksCard,
  settings: SettingsCard,
  disguise: DisguiseCard,
};
