import { bn, fd, tk } from '@/lib/format';

export type Msg = { title: string; body: string; sms: string };
const sign = (org: string) => `\n\n${org}`;

export const T = {
  welcome: (o: { name: string; org: string; fee: number }): Msg => ({
    title: 'নিবন্ধন সম্পন্ন, এখন ভর্তি ফি জমা দিন',
    body: `আসসালামু আলাইকুম ${o.name}। ${o.org} এ নিবন্ধনের জন্য ধন্যবাদ। আপনার প্রোফাইল তৈরি হয়েছে।\nসদস্যপদ যাচাই সম্পন্ন করতে ${tk(o.fee)} ভর্তি ফি জমা দিন। কিভাবে জমা দেবেন তা আপনার প্রোফাইলে দেওয়া আছে। কমিটি টাকা পেয়ে যাচাই করলে আপনি যাচাইকৃত সদস্য হবেন।${sign(o.org)}`,
    sms: `${o.org}: নিবন্ধন সম্পন্ন। সদস্য হতে ${tk(o.fee)} ভর্তি ফি জমা দিন। বিস্তারিত প্রোফাইলে।`,
  }),
  approved: (o: { name: string; org: string; memberNo: string; monthly: number; dueDay: number; fee: number }): Msg => ({
    title: 'অভিনন্দন, আপনি এখন যাচাইকৃত সদস্য',
    body: `${o.name}, আপনার ${tk(o.fee)} ভর্তি ফি পেয়েছি এবং সদস্যপদ যাচাই সম্পন্ন হয়েছে। সদস্য নম্বর ${o.memberNo}।\nপ্রতি মাসে ${tk(o.monthly)} চাঁদা মাসের ${bn(o.dueDay)} তারিখের মধ্যে জমা দিতে হবে।${sign(o.org)}`,
    sms: `${o.org}: অভিনন্দন ${o.name}, আপনি যাচাইকৃত সদস্য (নম্বর ${o.memberNo})। মাসিক চাঁদা ${tk(o.monthly)}, প্রতি মাসের ${bn(o.dueDay)} তারিখের মধ্যে।`,
  }),
  rejected: (o: { name: string; org: string }): Msg => ({
    title: 'সদস্যপদের আবেদন বাতিল',
    body: `${o.name}, দুঃখিত, আপনার সদস্যপদের আবেদনটি এখন গ্রহণ করা যাচ্ছে না। বিস্তারিত জানতে কমিটির সাথে যোগাযোগ করুন।${sign(o.org)}`,
    sms: `${o.org}: আপনার আবেদনটি গ্রহণ করা যায়নি। বিস্তারিত জানতে কমিটির সাথে যোগাযোগ করুন।`,
  }),
  payment: (o: { name: string; org: string; what: string; amount: number; receipt: string; next: string | null }): Msg => ({
    title: `${tk(o.amount)} জমা পাওয়া গেছে`,
    body: `${o.name}, ${o.what} বাবদ ${tk(o.amount)} জমা পেয়েছি। রসিদ নম্বর ${o.receipt}। আলহামদুলিল্লাহ, জাযাকাল্লাহু খাইরান।${o.next ? `\nপরবর্তী চাঁদার শেষ তারিখ ${fd(o.next)}।` : ''}${sign(o.org)}`,
    sms: `${o.org}: ${o.what} ${tk(o.amount)} জমা পেয়েছি (রসিদ ${o.receipt})।${o.next ? ` পরবর্তী শেষ তারিখ ${fd(o.next)}।` : ''}`,
  }),
  overdue: (o: { name: string; org: string; months: string[]; amount: number; freezeMonths: number }): Msg => ({
    title: `${bn(o.months.length)} মাসের চাঁদা বকেয়া`,
    body: `${o.name}, আপনার ${o.months.join(', ')} মাসের চাঁদা বকেয়া আছে, মোট ${tk(o.amount)}। দয়া করে দ্রুত জমা দিন।\nটানা ${bn(o.freezeMonths)} মাস বকেয়া থাকলে সদস্যপদ স্বয়ংক্রিয়ভাবে স্থগিত হয়ে যাবে।${sign(o.org)}`,
    sms: `${o.org}: ${o.name}, ${bn(o.months.length)} মাসের চাঁদা বকেয়া (${tk(o.amount)})। দ্রুত জমা দিন। টানা ${bn(o.freezeMonths)} মাস বকেয়ায় সদস্যপদ স্থগিত হয়।`,
  }),
  dueSoon: (o: { name: string; org: string; month: string; amount: number; dueDate: string }): Msg => ({
    title: 'চাঁদা জমার শেষ তারিখ ঘনিয়ে এসেছে',
    body: `${o.name}, ${o.month} মাসের চাঁদা ${tk(o.amount)} আগামী ${fd(o.dueDate)} এর মধ্যে জমা দিন।${sign(o.org)}`,
    sms: `${o.org}: ${o.month} মাসের চাঁদা ${tk(o.amount)}, শেষ তারিখ ${fd(o.dueDate)}।`,
  }),
  freezeWarn: (o: { name: string; org: string; days: number; freezeDate: string; freezeMonths: number; fee: number }): Msg => ({
    title: `সতর্কতা: ${bn(o.days)} দিন পর সদস্যপদ স্থগিত হবে`,
    body: `${o.name}, আপনার টানা চাঁদা বকেয়া থাকায় ${fd(o.freezeDate)} তারিখে (${bn(o.days)} দিন পর) টানা ${bn(o.freezeMonths)} মাস বকেয়া পূর্ণ হবে এবং সদস্যপদ স্থগিত হয়ে যাবে। স্থগিত হলে আবার সদস্য হতে ${tk(o.fee)} ফি দিতে হবে।\nএখনই বকেয়া চাঁদা জমা দিয়ে স্থগিত হওয়া এড়ান।${sign(o.org)}`,
    sms: `${o.org}: সতর্কতা! ${o.name}, ${bn(o.days)} দিন পর (${fd(o.freezeDate)}) বকেয়ার কারণে সদস্যপদ স্থগিত হবে। এখনই বকেয়া জমা দিন।`,
  }),
  frozen: (o: { name: string; org: string; freezeMonths: number; fee: number }): Msg => ({
    title: 'আপনার সদস্যপদ স্থগিত হয়েছে',
    body: `${o.name}, টানা ${bn(o.freezeMonths)} মাস চাঁদা বকেয়া থাকায় আপনার সদস্যপদ স্থগিত হয়েছে। আবার সক্রিয় হতে ${tk(o.fee)} ফি দিয়ে কোষাধ্যক্ষের সাথে যোগাযোগ করুন। ভুলবশত হয়ে থাকলে অর্থাৎ চাঁদা দিয়েছেন কিন্তু হিসাবে ওঠেনি, রসিদ নিয়ে কমিটিকে জানান।${sign(o.org)}`,
    sms: `${o.org}: ${o.name}, বকেয়ার কারণে আপনার সদস্যপদ স্থগিত হয়েছে। সক্রিয় হতে ${tk(o.fee)} ফি দিয়ে কোষাধ্যক্ষের সাথে যোগাযোগ করুন।`,
  }),
  reactivated: (o: { name: string; org: string }): Msg => ({
    title: 'আপনার সদস্যপদ আবার সক্রিয়',
    body: `${o.name}, আপনার সদস্যপদ আবার সক্রিয় করা হয়েছে। নিয়মিত চাঁদা জমা দিয়ে সংগঠনের পাশে থাকুন।${sign(o.org)}`,
    sms: `${o.org}: ${o.name}, আপনার সদস্যপদ আবার সক্রিয় হয়েছে।`,
  }),
};
