import 'server-only';
import { bn, fd, tk } from '@/lib/format';
import type { Facts } from './facts';

/** API কী না থাকলে বা সার্ভিস বন্ধ থাকলে নিজস্ব নিয়মে উত্তর (বাংলা ও ইংরেজি), যাতে চ্যাটবট কখনো একেবারে নীরব না হয় */
export function ruleAnswer(q: string, f: Facts): { answer: string; unanswered: boolean } {
  const en = f.lang === 'en';
  const t = (b: string, e: string) => (en ? e : b);
  const N = (x: string | number) => bn(x, f.lang);
  const K = (x: number) => tk(x, f.lang);
  const D = (x: string) => fd(x, f.lang);
  const low = q.toLowerCase();
  const has = (...w: string[]) => w.some((x) => low.includes(x));
  const { s, stats, me } = f;
  const howto = has('কীভাবে', 'কিভাবে', 'নিয়ম', 'পাব', 'পেতে', 'হব', 'হতে চাই', 'শর্ত', 'how ', 'rules', 'can i', 'want to');
  const personal = has('আমার', 'বকেয়া', 'ডিউ', 'দিয়েছি', 'শেষ তারিখ', 'my ', 'due', 'overdue', 'balance', 'i paid', 'have i') || (has('আমি', 'i ') && !howto);
  const ok = (answer: string) => ({ answer, unanswered: false });
  const login = t('নিজের হিসাব দেখতে /login এ লগইন করুন।', 'Please log in at /login to see your own account.');

  if (f.applicant && (personal || has('যাচাই', 'verify', 'status', 'অবস্থা', 'approved', 'অনুমোদন'))) {
    return ok(f.applicant.status === 'rejected'
      ? t('আপনার আবেদনটি বাতিল হয়েছে। কমিটির সাথে যোগাযোগ করুন।', 'Your application was rejected. Please contact the committee.')
      : t(`আপনার আবেদন (নং ${N(f.applicant.appNo)}) কমিটির যাচাইয়ের অপেক্ষায়। ভর্তি ফি ${K(s.reg_fee)} ${f.applicant.claimed ? 'জমা দিয়েছেন বলে জানিয়েছেন, কমিটি মিলিয়ে দেখবে।' : 'এখনো জমা দেওয়ার কথা জানাননি। প্রোফাইলের পেমেন্টের মাধ্যম দেখে পাঠিয়ে জানান।'}`,
        `Your application (no. ${N(f.applicant.appNo)}) is waiting for committee verification. Joining fee ${K(s.reg_fee)}: ${f.applicant.claimed ? 'you reported paying; the committee will check it.' : 'you have not reported payment yet. Pay using a method in your profile and tell us.'}`));
  }
  if (personal && has('ঋণ', 'ধার', 'করজ', 'loan')) {
    if (!me) return ok(f.who === 'staff' ? t('সদস্যের ব্যক্তিগত হিসাব অ্যাডমিন প্যানেলে দেখুন।', 'Please see member records in the admin panel.') : login);
    return ok(me.loans.length ? me.loans.map((l) => t(`${l.slip}: ${K(l.amount)} নিয়েছেন, বাকি ${K(l.left)}, ফেরতের শেষ তারিখ ${D(l.due)}।`, `${l.slip}: borrowed ${K(l.amount)}, ${K(l.left)} left, due ${D(l.due)}.`)).join('\n') : t('আপনার নামে কোনো ঋণ নেই।', 'You have no loans.'));
  }
  if (personal && has('বই', 'book')) {
    if (!me) return ok(login);
    return ok(me.booksOut.length ? t('আপনার কাছে আছে: ', 'You currently have: ') + me.booksOut.map((b) => b.title).join(', ') : t('আপনার কাছে পাঠাগারের কোনো বই নেই।', 'You have no library books.'));
  }
  if (personal || has('অ্যাকাউন্ট', 'ব্যালেন্স', 'প্রোফাইল', 'account', 'profile')) {
    if (!me) return ok(f.who === 'staff' ? t('সদস্যের ব্যক্তিগত হিসাব অ্যাডমিন প্যানেলে দেখুন।', 'Please see member records in the admin panel.') : t('নিজের জমা ও বকেয়ার হিসাব দেখতে /login এ মোবাইল নম্বর বা ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।', 'To see your payments and dues, log in at /login with your mobile number or email and password.'));
    const status = me.status !== 'active' ? t('সদস্যপদ স্থগিত।', 'Membership is suspended.') : me.overdueMonths.length ? t(`বকেয়া ${N(me.overdueMonths.length)} মাস (${me.overdueMonths.join(', ')}), মোট ${K(me.dueAmount)}।`, `${N(me.overdueMonths.length)} month(s) overdue, total ${K(me.dueAmount)}.`) : me.paidThisMonth ? t('কোনো বকেয়া নেই, এই মাসের চাঁদা জমা আছে।', 'No dues; this month is paid.') : t('কোনো বকেয়া নেই। এই মাসের চাঁদা এখনো দেননি।', 'No overdue amount. This month’s contribution is not paid yet.');
    return ok(`${me.name}, ${status}\n${t(`এ পর্যন্ত মোট জমা ${K(me.totalPaid)}।`, `Total paid so far ${K(me.totalPaid)}.`)}\n${t(`পরবর্তী শেষ তারিখ ${D(me.nextDue)}।`, `Next due date ${D(me.nextDue)}.`)}${me.verified ? '' : '\n' + t('আপনি এখনো যাচাইকৃত সদস্য নন।', 'You are not a verified member yet.')}`);
  }
  if (has('সদস্য হ', 'মেম্বার', 'ভর্তি', 'আবেদন', 'জয়েন', 'নিবন্ধন', 'member', 'join', 'register', 'sign up')) {
    return ok(t(`সদস্য হতে /join পেজে নাম, মোবাইল ও পাসওয়ার্ড দিয়ে নিবন্ধন করুন, সাথে সাথে প্রোফাইল তৈরি হবে। ভর্তি ফি ${K(s.reg_fee)} জমা দিলে কমিটি যাচাই করে আপনাকে যাচাইকৃত সদস্য করবে। এরপর প্রতি মাসে নিজের সামর্থ্যমতো চাঁদা, শেষ তারিখ মাসের ${N(s.due_day)} তারিখ। টানা ${N(s.freeze_months)} মাস না দিলে সদস্যপদ স্থগিত হয়।`,
      `To join, register at /join with your name, mobile and password; your profile is created at once. Pay the ${K(s.reg_fee)} joining fee and the committee verifies you as a member. Then pay a monthly amount of your choice by the ${N(s.due_day)}th. Membership is suspended after ${N(s.freeze_months)} consecutive unpaid months.`));
  }
  if (has('অনুষ্ঠান', 'সভা', 'সেমিনার', 'ইভেন্ট', 'প্রোগ্রাম', 'event', 'meeting', 'seminar')) {
    const up = f.events.filter((e) => e.event_date >= f.today).slice(0, 3);
    return ok(up.length ? t('আসন্ন অনুষ্ঠান:\n', 'Upcoming events:\n') + up.map((e) => `${e.title}, ${D(e.event_date)}${e.venue ? ', ' + e.venue : ''}`).join('\n') : t('এখন কোনো অনুষ্ঠান নির্ধারিত নেই। নতুন অনুষ্ঠান হলে /events পেজে জানানো হবে।', 'No events are scheduled right now. New ones will appear at /events.'));
  }
  if (has('ঋণ', 'করজ', 'ধার', 'loan', 'borrow')) {
    return ok(t(`শুধু যাচাইকৃত সদস্যরা বিনা সুদে করজে হাসানা পান। মেয়াদ ৩, ৬ বা ১২ মাস। এ পর্যন্ত ${N(stats.borrowers)} জন ঋণ পেয়েছেন, মোট ${K(stats.total_loaned)}। আবেদনের জন্য কমিটির সাথে যোগাযোগ করুন।`,
      `Only verified members can get an interest-free loan, for 3, 6 or 12 months. So far ${N(stats.borrowers)} members have received ${K(stats.total_loaned)} in total. Contact the committee to apply.`));
  }
  if (has('টাকা জমা', 'পেমেন্ট', 'বিকাশ', 'নগদ', 'রকেট', 'ব্যাংক', 'pay', 'bkash', 'nagad', 'rocket', 'bank')) {
    return ok(s.pay_methods.length ? s.pay_methods.map((m) => `${m.label}${m.number ? ': ' + m.number : ''}`).join('\n') : (s.pay_info ?? t('কোষাধ্যক্ষের কাছে নগদ জমা দিন।', 'Pay cash to the treasurer.')));
  }
  if (has('কতজন', 'সদস্য সংখ্যা', 'মোট সদস্য', 'how many')) return ok(t(`মোট সদস্য ${N(stats.members)} জন, সক্রিয় ${N(stats.active_members)} জন।`, `${N(stats.members)} members in total, ${N(stats.active_members)} active.`));
  if (has('তহবিল', 'ফান্ড', 'মোট টাকা', 'কত টাকা', 'দান', 'fund', 'donat', 'total')) {
    return ok(t(`মোট তহবিল ${K(stats.total_fund)}। এই মাসে চাঁদা উঠেছে ${K(stats.month_collected)} ও ঋণ দেওয়া হয়েছে ${K(stats.month_loaned)}। পুরো হিসাব /transparency পেজে আছে।`,
      `Total fund ${K(stats.total_fund)}. This month ${K(stats.month_collected)} was collected and ${K(stats.month_loaned)} lent. Full accounts are at /transparency.`));
  }
  if (has('বই', 'পাঠাগার', 'লাইব্রেরি', 'book', 'library')) return ok(t(`পাঠাগারে ${N(stats.book_titles)} শিরোনামের ${N(stats.books)} কপি বই আছে। তালিকা ও খোঁজা যাবে /library পেজে।`, `The library has ${N(stats.books)} copies across ${N(stats.book_titles)} titles. Browse and search at /library.`));
  if (has('কুরআন', 'কোরআন', 'quran')) return ok(s.quran_info || t('কুরআন শিক্ষার সময়সূচির জন্য সংগঠনের সাথে যোগাযোগ করুন।', 'Please contact us for the Quran class schedule.'));
  if (has('ফোন', 'নম্বর', 'যোগাযোগ', 'ঠিকানা', 'কোথায়', 'ইমেইল', 'phone', 'contact', 'address', 'where', 'email')) {
    return ok([s.address && `${t('ঠিকানা', 'Address')}: ${s.address}`, s.phone && `${t('ফোন', 'Phone')}: ${N(s.phone)}`, s.email && `${t('ইমেইল', 'Email')}: ${s.email}`].filter(Boolean).join('\n') || t('যোগাযোগের জন্য /contact পেজে বার্তা পাঠান।', 'Send us a message at /contact.'));
  }
  return { answer: t('দুঃখিত, এই প্রশ্নের উত্তর এখন আমার কাছে নেই। /contact পেজে বার্তা পাঠান বা সংগঠনের ফোনে যোগাযোগ করুন।', 'Sorry, I do not have an answer to that right now. Please send a message at /contact or call the organisation.'), unanswered: true };
}
