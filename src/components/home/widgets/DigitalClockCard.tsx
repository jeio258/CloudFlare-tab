import { useEffect, useState } from 'react';
import { pad } from './pad';

export function DigitalClockCard() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex h-full w-full items-center justify-center font-bold text-ink" style={{ fontFamily: 'Roboto, arial, sans-serif', fontSize: 15 }}>
      {`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`}
    </div>
  );
}
