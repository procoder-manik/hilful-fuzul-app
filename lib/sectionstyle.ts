import { PRESETS, type Pattern } from './eventdesign';

/** হোমপেজের সেকশন ও পেজ-হেডারের রং ও প্যাটার্ন। bg = "none" (সাদামাটা) অথবা eventdesign এর রঙের নাম (mint, mango ...) */
export type SecStyle = { bg: string; pat: Pattern; op: number };
export type HomeSec = { k: string; on: boolean } & Partial<SecStyle>;
export type PageHeadStyle = SecStyle;

export const SECTIONS: { k: string; bn: string; en: string; info: string }[] = [
  { k: 'hero', bn: 'ওপরের মূল অংশ (হিরো)', en: 'Hero', info: 'শিরোনাম, সদস্য হোন বোতাম ও মোট তহবিলের কার্ড।' },
  { k: 'stats', bn: 'পরিসংখ্যানের সারি', en: 'Stats strip', info: 'মোট তহবিল, সদস্য, উপকৃত মানুষ, বইয়ের সংখ্যা।' },
  { k: 'ledger', bn: 'স্বচ্ছতার খাতা', en: 'Open ledger', info: 'চার্ট, ঋণ ও দাতাদের চলমান তালিকা।' },
  { k: 'events', bn: 'আসন্ন অনুষ্ঠান', en: 'Upcoming events', info: 'আসন্ন অনুষ্ঠানের ব্যানার।' },
  { k: 'services', bn: 'আমরা যা করি (সেবা)', en: 'What we do', info: 'সেবা ও কার্যক্রমের কার্ড।' },
  { k: 'qard', bn: 'করজে হাসানা', en: 'Interest-free loans', info: 'বিনা সুদের ঋণের পরিচয় ও নিয়ম।' },
  { k: 'library', bn: 'পাঠাগার', en: 'Library', info: 'নতুন বইয়ের সারি ও কুরআন শিক্ষার তথ্য।' },
  { k: 'committee', bn: 'যারা দায়িত্বে (কমিটি)', en: 'Committee', info: 'কমিটির সদস্যদের কার্ড।' },
  { k: 'news', bn: 'সংবাদ ও কার্যক্রম', en: 'News', info: 'সাম্প্রতিক সংবাদ।' },
  { k: 'cta', bn: 'সদস্য হওয়ার আহ্বান', en: 'Join call-to-action', info: 'নিচের "মাসে ৫০ টাকায় সদস্য হোন" অংশ।' },
];
export const DEFAULT_ORDER = SECTIONS.map((s) => s.k);

export const NO_STYLE: SecStyle = { bg: 'none', pat: 'none', op: 0.1 };
export const DEFAULT_PAGEHEAD: PageHeadStyle = { bg: 'mint', pat: 'geo', op: 0.12 };

const PAT = ['none', 'geo', 'dots', 'stripes', 'waves', 'stars'];
export const cleanStyle = (r: Partial<SecStyle> | null | undefined, d: SecStyle = NO_STYLE): SecStyle => ({
  bg: typeof r?.bg === 'string' && (r.bg === 'none' || PRESETS.some((p) => p.id === r.bg)) ? r.bg : d.bg,
  pat: (PAT.includes(String(r?.pat)) ? r!.pat : d.pat) as Pattern,
  op: Math.min(0.4, Math.max(0.03, Number.isFinite(Number(r?.op)) ? Number(r?.op) : d.op)),
});

/** শৈলী থেকে CSS: ব্যাকগ্রাউন্ড, লেখার রং ও প্যাটার্নের রং */
export function styleCss(st: SecStyle): { box: React.CSSProperties | undefined; patColor: string; has: boolean; tinted: boolean; deep: boolean } {
  const p = PRESETS.find((x) => x.id === st.bg);
  if (!p) return { box: undefined, patColor: 'var(--acc)', has: st.pat !== 'none', tinted: false, deep: false };
  return { box: { background: `linear-gradient(135deg, ${p.c1}, ${p.c2})`, color: p.text, ['--muted' as string]: `color-mix(in srgb, ${p.text} 72%, transparent)` }, patColor: p.text, has: true, tinted: true, deep: p.tone === 'deep' };
}
