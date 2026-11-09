import { todayBD } from './dates';
import { fd } from './format';

/** তালিকার ফিল্টার: সময়সীমা (৭/১৫/৩০ দিন, ৬ মাস, ১ বছর, সব, নিজের তারিখ) ও ক্রম (নতুন/পুরোনো) */
export const PRESETS: [string, string][] = [['7', '৭ দিন'], ['15', '১৫ দিন'], ['30', '৩০ দিন'], ['180', '৬ মাস'], ['365', '১ বছর'], ['all', 'সব সময়']];
export type Range = { r: string; from: string | null; to: string; sort: 'new' | 'old'; label: string; q: string };

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const minus = (iso: string, days: number) => new Date(Date.parse(iso + 'T00:00:00Z') - days * 864e5).toISOString().slice(0, 10);

export function parseRange(sp: Record<string, string | undefined>, def = '30'): Range {
  const today = todayBD();
  const sort = sp.sort === 'old' ? 'old' : 'new';
  const q = (sp.q ?? '').replace(/[,()*%\\]/g, ' ').trim().slice(0, 60);
  if (sp.r === 'custom' && ISO.test(sp.from ?? '') && ISO.test(sp.to ?? '')) {
    const [a, b] = [sp.from!, sp.to!].sort();
    return { r: 'custom', from: a, to: b, sort, q, label: `${fd(a)} থেকে ${fd(b)}` };
  }
  const r = PRESETS.some(([k]) => k === sp.r) ? sp.r! : def;
  if (r === 'all') return { r, from: null, to: today, sort, q, label: 'সব সময়' };
  const days = Number(r);
  return { r, from: minus(today, days - 1), to: today, sort, q, label: `গত ${PRESETS.find(([k]) => k === r)![1]} (${fd(minus(today, days - 1))} থেকে আজ)` };
}

/** একই ফিল্টার রেখে লিংক বানানো (এক্সপোর্ট, পরের পাতা ইত্যাদি) */
export function rangeQS(x: Range, extra: Record<string, string | undefined> = {}): string {
  const p = new URLSearchParams();
  p.set('r', x.r);
  if (x.r === 'custom' && x.from) { p.set('from', x.from); p.set('to', x.to); }
  if (x.sort === 'old') p.set('sort', 'old');
  if (x.q) p.set('q', x.q);
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
  return p.toString();
}
