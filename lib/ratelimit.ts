import 'server-only';
import { headers } from 'next/headers';

const hits = new Map<string, number[]>();

/** একই আইপি থেকে নির্দিষ্ট সময়ে অতিরিক্ত ফর্ম জমা ঠেকায় (সংগঠনের একটি কম্পিউটারে চললে এটাই যথেষ্ট) */
export function tooMany(scope: string, max = 5, windowMs = 10 * 60 * 1000): boolean {
  const h = headers();
  const ip = (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'local').split(',')[0].trim();
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return recent.length > max;
}

/** আইপির বদলে নিজের কী ধরে সীমা (যেমন একটি ইমেইলের কোড-চেষ্টা)। সীমা পেরোলে true */
export function limitKey(key: string, max = 6, windowMs = 30 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}
