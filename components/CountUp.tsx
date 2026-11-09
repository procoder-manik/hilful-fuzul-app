'use client';
import { useEffect, useRef, useState } from 'react';
import { bn as fbn } from '@/lib/format';
import { useLang } from './LangProvider';

/** স্ক্রিনে এলে সংখ্যা ০ থেকে গুনে ওঠে (রিডিউসড মোশনে সরাসরি দেখায়) */
export function CountUp({ value, money }: { value: number; money?: boolean }) {
  const lang = useLang();
  const fmt = (n: number) => (money ? '৳' : '') + fbn(Math.round(n).toLocaleString('en-IN'), lang);
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(value);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setV(0);
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => { const k = Math.min(1, (t - t0) / 1200); setV(value * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <span ref={ref}>{fmt(v)}</span>;
}
