import 'server-only';
import { getLang } from './lang';
import * as F from './format';

/** পাবলিক সাইটের জন্য: ভিজিটরের ভাষা অনুযায়ী সংখ্যা, টাকা ও তারিখ */
export const bn = (x: string | number | null | undefined) => F.bn(x, getLang());
export const tk = (n: number | string | null | undefined) => F.tk(n, getLang());
export const fd = (iso?: string | null) => F.fd(iso, getLang());
export const ymLabel = (iso: string) => F.ymLabel(iso, getLang());
export const monthsShort = () => (getLang() === 'en' ? F.MONTHS_SHORT_EN : F.MONTHS_SHORT);
export const initials = F.initials;
