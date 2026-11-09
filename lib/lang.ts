import 'server-only';
import { cookies } from 'next/headers';
import type { Lang } from './format';

export type { Lang };
/** ভিজিটরের বেছে নেওয়া ভাষা (কুকিতে থাকে); না বেছে থাকলে বাংলা */
export const getLang = (): Lang => (cookies().get('lang')?.value === 'en' ? 'en' : 'bn');

/** t('বাংলা লেখা', 'English text'): বর্তমান ভাষার লেখাটি ফেরত দেয় */
export function getT() {
  const lang = getLang();
  return (bn: string, en: string) => (lang === 'en' ? en : bn);
}
