import { getLang } from './lang';
import { bn, tk } from './fmt';
import type { Settings } from './types';

/** লেখার ভেতরের ছোট কোড ({reg_fee}, {due_day} ইত্যাদি) সেটিংসের আসল মানে বদলে দেয়, যাতে সেটিংস বদলালে লেখাও নিজে ঠিক থাকে */
export function fillTokens(text: string, s: Settings): string {
  if (!text || !text.includes('{')) return text;
  const en = getLang() === 'en';
  return text.replace(/\{(reg_fee|due_day|freeze_months|org_name|short_name|phone|email|address|established|pay_info)\}/g, (_, k: string) => {
    switch (k) {
      case 'reg_fee': return tk(s.reg_fee);
      case 'due_day': return bn(s.due_day);
      case 'freeze_months': return bn(s.freeze_months);
      case 'pay_info': return s.pay_info || (en ? 'You can give cash to the treasurer at the office.' : 'অফিসে কোষাধ্যক্ষের কাছে নগদ দিতে পারেন।');
      default: return String((s as unknown as Record<string, unknown>)[k] ?? '');
    }
  });
}
