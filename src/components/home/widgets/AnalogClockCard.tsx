import { useEffect, useRef } from 'react';

export function AnalogClockCard() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => {
      const cv = ref.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const s = cv.width;
      const c = s / 2;
      ctx.clearRect(0, 0, s, s);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c, c, c - 2, 0, Math.PI * 2);
      ctx.stroke();
      const now = new Date();
      const hand = (angle: number, len: number, width: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.lineTo(c + len * Math.sin(angle), c - len * Math.cos(angle));
        ctx.stroke();
      };
      const h = ((now.getHours() % 12) + now.getMinutes() / 60) * ((Math.PI * 2) / 12);
      const m = (now.getMinutes() + now.getSeconds() / 60) * ((Math.PI * 2) / 60);
      const sec = now.getSeconds() * ((Math.PI * 2) / 60);
      hand(h, c * 0.45, 2, '#333');
      hand(m, c * 0.65, 1.5, '#666');
      hand(sec, c * 0.75, 0.8, '#de0f17');
    };
    draw();
    const t = setInterval(draw, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex h-full w-full items-center justify-center">
      <canvas ref={ref} width={56} height={56} />
    </div>
  );
}
