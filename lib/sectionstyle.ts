import { PRESETS, type Pattern } from './eventdesign';

/** হোমপেজের সেকশন ও পেজ-হেডারের রং ও প্যাটার্ন। bg = "none" (সাদামাটা) অথবা eventdesign এর রঙের নাম (mint, mango ...) */
export type SecStyle = { bg: string; pat: Pattern; op: number; c1?: string; c2?: string; tx?: string };
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
/** পেজ-হেডারের ডিফল্ট: হিরো সেকশনের মতো সাদামাটা ব্যাকগ্রাউন্ডে শুধু হালকা প্যাটার্ন */
export const DEFAULT_PAGEHEAD: PageHeadStyle = { bg: 'none', pat: 'geo', op: 0.07 };

const PAT = ['none', 'geo', 'dots', 'stripes', 'waves', 'stars'];
const HEX = /^#[0-9a-fA-F]{6}$/;
export const cleanStyle = (r: Partial<SecStyle> | null | undefined, d: SecStyle = NO_STYLE): SecStyle => {
  const bg = typeof r?.bg === 'string' && (r.bg === 'none' || r.bg === 'custom' || PRESETS.some((p) => p.id === r.bg)) ? r.bg : d.bg;
  const out: SecStyle = {
    bg, pat: (PAT.includes(String(r?.pat)) ? r!.pat : d.pat) as Pattern,
    op: Math.min(0.4, Math.max(0.03, Number.isFinite(Number(r?.op)) ? Number(r?.op) : d.op)),
  };
  if (bg === 'custom') { out.c1 = HEX.test(String(r?.c1)) ? r!.c1 : '#0e5a43'; out.c2 = HEX.test(String(r?.c2)) ? r!.c2 : '#1b8a68'; out.tx = HEX.test(String(r?.tx)) ? r!.tx : '#ffffff'; }
  return out;
};

/** শৈলী থেকে CSS: ব্যাকগ্রাউন্ড, লেখার রং ও প্যাটার্নের রং */
export function styleCss(st: SecStyle): { box: React.CSSProperties | undefined; patColor: string; has: boolean; tinted: boolean; deep: boolean } {
  if (st.bg === 'custom') {
    const tx = st.tx ?? '#ffffff';
    return { box: { background: `linear-gradient(135deg, ${st.c1 ?? '#0e5a43'}, ${st.c2 ?? '#1b8a68'})`, color: tx, ['--muted' as string]: `color-mix(in srgb, ${tx} 72%, transparent)` }, patColor: tx, has: true, tinted: true, deep: tx.toLowerCase() > '#808080' };
  }
  const p = PRESETS.find((x) => x.id === st.bg);
  if (!p) return { box: undefined, patColor: 'var(--acc)', has: st.pat !== 'none', tinted: false, deep: false };
  return { box: { background: `linear-gradient(135deg, ${p.c1}, ${p.c2})`, color: p.text, ['--muted' as string]: `color-mix(in srgb, ${p.text} 72%, transparent)` }, patColor: p.text, has: true, tinted: true, deep: p.tone === 'deep' };
}
