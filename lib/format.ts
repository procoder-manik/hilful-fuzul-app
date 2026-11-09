export type Lang = 'bn' | 'en';
const BN = '০১২৩৪৫৬৭৮৯';
export const MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
export const MONTHS_SHORT = ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
export const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTHS_SHORT_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** সংখ্যা: বাংলায় বাংলা অঙ্ক, ইংরেজিতে যেমন আছে তেমন */
export const bn = (x: string | number | null | undefined, lang: Lang = 'bn') => (lang === 'en' ? String(x ?? '') : String(x ?? '').replace(/\d/g, (d) => BN[+d]));
export const tk = (n: number | string | null | undefined, lang: Lang = 'bn') => '৳' + bn(Math.round(Number(n) || 0).toLocaleString('en-IN'), lang);

/** '2026-11-08' → '৮ নভেম্বর ২০২৬' / '8 November 2026' */
export function fd(iso?: string | null, lang: Lang = 'bn') {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return lang === 'en' ? `${d} ${MONTHS_EN[m - 1]} ${y}` : `${bn(d)} ${MONTHS[m - 1]} ${bn(y)}`;
}
/** '2026-11-01' বা '2026-11' → 'নভেম্বর ২০২৬' / 'November 2026' */
export function ymLabel(iso: string, lang: Lang = 'bn') {
  const [y, m] = iso.split('-').map(Number);
  return lang === 'en' ? `${MONTHS_EN[m - 1]} ${y}` : `${MONTHS[m - 1]} ${bn(y)}`;
}
export const initials = (name: string) => name.replace(/^মোঃ\s*/, '').trim().charAt(0) || '?';
