import { Qard } from '../cards';
import { getLang } from '@/lib/lang';
import type { Settings } from '@/lib/types';

/** করজে হাসানার ধাপ: লেখা ফাঁকা থাকলে আগের (ডিফল্ট) লেখা, ভরা থাকলে অ্যাডমিনের লেখা */
export function QardBlock({ s, p }: { s: Settings; p: Record<string, string> }) {
  const en = getLang() === 'en';
  const L = (k: string) => (en && p[`${k}_en`] ? p[`${k}_en`] : p[k]) || '';
  const steps = L('steps').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf('|'); return (i < 0 ? [x, ''] : [x.slice(0, i).trim(), x.slice(i + 1).trim()]) as [string, string]; });
  return <Qard s={s} over={{ tag: L('tag'), heading: L('heading'), text: L('text'), steps }} />;
}
