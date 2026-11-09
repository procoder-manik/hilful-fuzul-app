import 'server-only';
import { getSessionProfile, getSettings } from '@/lib/settings';
import { getBooks, getCommittee, getEvents, getPosts, getPrograms, getStats, isNewBook, type Book, type CommitteeMember, type EventRow, type Post, type Program } from '@/lib/public';
import { computeDues } from '@/lib/dues';
import { bn, fd, tk, ymLabel } from '@/lib/format';
import { todayBD } from '@/lib/dates';
import { getLang, type Lang } from '@/lib/lang';
import type { Application, Loan, Member, Payment, PublicStats, Settings } from '@/lib/types';

export type MeFacts = {
  name: string; memberNo: string; status: string; joinDate: string; monthly: number; verified: boolean; regPaid: boolean;
  totalPaid: number; paidThisMonth: boolean; overdueMonths: string[]; dueAmount: number; nextDue: string; streak: number;
  recent: { label: string; amount: number; on: string }[];
  loans: { slip: string; amount: number; issued: string; due: string; repaid: number; left: number; late: boolean }[];
  booksOut: { title: string; expected: string | null }[];
};
export type Who = 'guest' | 'member' | 'staff';
export type Facts = {
  who: Who; memberId: string | null; name: string | null; s: Settings; stats: PublicStats; events: EventRow[]; programs: Program[];
  committee: CommitteeMember[]; books: Book[]; posts: Post[]; me: MeFacts | null; today: string; lang: Lang;
  applicant: { name: string; appNo: number; status: string; claimed: string | null } | null;
};

/** প্রতিটি প্রশ্নে ডেটাবেস থেকে সর্বশেষ তথ্য আনে, তাই চ্যাটবট সবসময় হালনাগাদ থাকে */
export async function loadFacts(): Promise<Facts> {
  const [s, stats, events, programs, committee, books, posts, sess] = await Promise.all([
    getSettings(), getStats(), getEvents(), getPrograms(), getCommittee(), getBooks(), getPosts(5), getSessionProfile(),
  ]);
  const { supabase, user, profile } = sess;
  const who: Who = !user || !profile ? 'guest' : profile.role === 'member' ? 'member' : 'staff';
  let me: MeFacts | null = null;
  let applicant: Facts['applicant'] = null;

  if (who === 'member' && profile?.member_id) {
    // সেশনের নিজস্ব ক্লায়েন্ট, তাই ডেটাবেসের RLS নিয়মে শুধু নিজের তথ্যই আসে
    const [m, p, l, b] = await Promise.all([
      supabase.from('members').select('*').eq('id', profile.member_id).single(),
      supabase.from('payments').select('*').eq('member_id', profile.member_id).order('paid_on', { ascending: false }),
      supabase.from('loans').select('*, loan_repayments(amount, paid_on)').eq('member_id', profile.member_id).order('issued_on', { ascending: false }),
      supabase.from('book_lendings').select('out_on, expected_on, returned_on, books(title)').eq('member_id', profile.member_id).is('returned_on', null),
    ]);
    const member = m.data as Member | null;
    if (member) {
      const payments = (p.data ?? []) as Payment[];
      const loans = (l.data ?? []) as Loan[];
      const out = (b.data ?? []) as unknown as { expected_on: string | null; books: { title: string } | null }[];
      const d = computeDues({
        joinDate: member.join_date, resetFrom: member.reset_from, monthlyAmount: Number(member.monthly_amount),
        paidMonths: payments.filter((x) => x.type === 'monthly' && x.for_month).map((x) => x.for_month!), dueDay: s.due_day,
      });
      const label = (x: Payment) => (x.type === 'registration' ? 'ভর্তি ফি' : x.type === 'reactivation' ? 'পুনঃসক্রিয়করণ ফি' : x.for_month ? `${ymLabel(x.for_month)} এর চাঁদা` : 'চাঁদা');
      me = {
        name: member.name, memberNo: member.member_no, status: member.status, joinDate: member.join_date, monthly: Number(member.monthly_amount),
        verified: !!member.verified_at, regPaid: payments.some((x) => x.type === 'registration'),
        totalPaid: payments.reduce((a, x) => a + Number(x.amount), 0), paidThisMonth: d.paidThisMonth,
        overdueMonths: d.overdue.map((x) => ymLabel(x)), dueAmount: d.dueAmount, nextDue: d.nextDueDate, streak: d.streak,
        recent: payments.slice(0, 5).map((x) => ({ label: label(x), amount: Number(x.amount), on: x.paid_on })),
        loans: loans.map((x) => {
          const repaid = (x.loan_repayments ?? []).reduce((a, r) => a + Number(r.amount), 0);
          const left = Math.max(0, Number(x.amount) - repaid);
          return { slip: x.slip_no, amount: Number(x.amount), issued: x.issued_on, due: x.due_on, repaid, left, late: left > 0 && x.due_on < todayBD() };
        }),
        booksOut: out.map((x) => ({ title: x.books?.title ?? 'বই', expected: x.expected_on })),
      };
    }
  }
  if (who === 'member' && !profile?.member_id && user) {
    const { data } = await supabase.from('applications').select('name, app_no, status, pay_method, pay_trx, pay_claimed_at').eq('user_id', user.id).maybeSingle();
    const a = data as Pick<Application, 'name' | 'app_no' | 'status' | 'pay_method' | 'pay_trx' | 'pay_claimed_at'> | null;
    if (a) applicant = { name: a.name, appNo: a.app_no, status: a.status, claimed: a.pay_claimed_at ? `${a.pay_method ?? ''}${a.pay_trx ? ' ' + a.pay_trx : ''}`.trim() : null };
  }
  return { lang: getLang(), applicant, who, memberId: me ? profile?.member_id ?? null : null, name: me?.name ?? profile?.full_name ?? null, s, stats, events, programs, committee, books, posts, me, today: todayBD() };
}

export const dueLine = (me: MeFacts, s: Settings) => {
  if (me.status !== 'active') return `সদস্যপদ স্থগিত। আবার সক্রিয় হতে ${tk(s.reg_fee)} ফি দিয়ে কোষাধ্যক্ষের সাথে যোগাযোগ করতে হবে।`;
  if (me.overdueMonths.length) return `বকেয়া ${bn(me.overdueMonths.length)} মাস (${me.overdueMonths.join(', ')}), মোট ${tk(me.dueAmount)}। টানা ${bn(me.streak)} মাস বকেয়া, ${bn(s.freeze_months)} মাস হলে সদস্যপদ স্থগিত হয়।`;
  return me.paidThisMonth ? 'কোনো বকেয়া নেই, এই মাসের চাঁদা জমা আছে।' : `কোনো বকেয়া নেই। এই মাসের চাঁদা ${fd(me.nextDue)} এর মধ্যে দিতে হবে।`;
};

/** মডেলের জন্য সমস্ত তথ্য একটি পাঠযোগ্য লেখায় */
export function factsToText(f: Facts): string {
  const { s, stats, me } = f;
  const L: string[] = [];
  L.push(`আজকের তারিখ: ${fd(f.today)}`);
  L.push(`## সংগঠন\nনাম: ${s.org_name}\nপরিচিতি: ${s.tagline ?? ''}\nপ্রতিষ্ঠা: ${s.established ?? ''}\nঠিকানা: ${s.address ?? 'দেওয়া নেই'}\nফোন: ${s.phone ?? 'দেওয়া নেই'}${s.phone2 ? ', ' + s.phone2 : ''}\n${s.office_hours ? 'অফিসের সময়: ' + s.office_hours + '\n' : ''}ইমেইল: ${s.email ?? 'দেওয়া নেই'}\nহোয়াটসঅ্যাপ: ${s.whatsapp ?? 'দেওয়া নেই'}\nফেসবুক: ${s.facebook ?? 'দেওয়া নেই'}\nসাইটের পেজ: /join (সদস্য হোন), /transparency (হিসাব), /library (পাঠাগার), /events (অনুষ্ঠান), /committee (কমিটি), /contact (যোগাযোগ), /support (প্রশ্নোত্তর), /login (লগইন)`);
  L.push(`## সদস্যপদ ও চাঁদা\nভর্তি ফি: ${tk(s.reg_fee)} (একবার)। অনলাইনে /join পেজে ফর্ম পূরণ করে আবেদন করা যায়, কমিটি ফি নিয়ে অনুমোদন দেয়।\nনিবন্ধন: ওয়েবসাইটের /join পেজে নাম, মোবাইল ও পাসওয়ার্ড দিয়ে নিবন্ধন করলে সাথে সাথে প্রোফাইল তৈরি হয় ও লগইন হয়। ভর্তি ফি জমা দিয়ে কমিটির যাচাই হলে যাচাইকৃত সদস্য হওয়া যায়। লগইন মোবাইল নম্বর বা ইমেইল দিয়ে, সাথে পাসওয়ার্ড।\nবিজ্ঞপ্তি: চাঁদা জমা, বকেয়া, স্থগিতের ৭ ও ৩ দিন আগে সতর্কতা এবং স্থগিতের খবর প্রোফাইলে আসে; ইমেইল দিলে ইমেইলে, মোবাইল থাকলে SMS এ যায়।\nমাসিক চাঁদা: সদস্য নিজের সামর্থ্যমতো (৫০, ১০০, ৫০০, ১০০০ টাকা ইত্যাদি) ঠিক করেন।\nচাঁদার শেষ তারিখ: প্রতি মাসের ${bn(s.due_day)} তারিখ।\nস্থগিত নিয়ম: টানা ${bn(s.freeze_months)} মাস চাঁদা না দিলে সদস্যপদ নিজে থেকে স্থগিত হয়। আবার সদস্য হতে ${tk(s.reg_fee)} দিতে হয়। ভুলে স্থগিত হলে কমিটি ঠিক করে দিতে পারে।\n${s.pay_info ? 'টাকা জমা দেওয়ার নিয়ম: ' + s.pay_info : ''}`);
  if (s.pay_methods.length) L.push(`## টাকা জমা দেওয়ার মাধ্যম\n${s.pay_methods.map((m) => `- ${m.label}${m.number ? ': ' + m.number : ''}${m.note ? ' (' + m.note + ')' : ''}`).join('\n')}`);
  L.push(`## করজে হাসানা (বিনা সুদের ঋণ)\nশুধু সদস্যরা পান। কোনো সুদ বা বাড়তি অর্থ নেই। মেয়াদ ৩, ৬ বা ১২ মাস। ঋণের সময় রসিদ (স্লিপ) দেওয়া হয় ও স্বাক্ষর নেওয়া হয়। জামিনদার লাগে।${s.loan_terms.length ? '\nশর্তাবলী:\n' + s.loan_terms.map((t, i) => `${bn(i + 1)}। ${t}`).join('\n') : ''}\nসদস্যপদের শর্তাবলী:\n${s.member_terms.map((t, i) => `${bn(i + 1)}। ${t}`).join('\n')}`);
  L.push(`## সংগঠনের হিসাব (প্রকাশ্য)\nমোট তহবিল: ${tk(stats.total_fund)}\nমোট চাঁদা জমা: ${tk(stats.total_contributions)}\nমোট দান: ${tk(stats.total_donations)}\nমোট ঋণ দেওয়া হয়েছে: ${tk(stats.total_loaned)}\nঋণ ফেরত এসেছে: ${tk(stats.total_repaid)}\nএই মাসে চাঁদা উঠেছে: ${tk(stats.month_collected)}\nএই মাসে ঋণ দেওয়া হয়েছে: ${tk(stats.month_loaned)}\nমোট সদস্য: ${bn(stats.members)} জন (সক্রিয় ${bn(stats.active_members)} জন)\nঋণ পেয়েছেন: ${bn(stats.borrowers)} জন\nউপকৃত মানুষ: ${bn(stats.program_beneficiaries)}+ জন\nপাঠাগারে বই: ${bn(stats.books)} কপি (${bn(stats.book_titles)} শিরোনাম)`);
  const up = f.events.filter((e) => e.event_date >= f.today).slice(0, 4);
  L.push(`## আসন্ন অনুষ্ঠান\n${up.length ? up.map((e) => `- ${e.title}, ${fd(e.event_date)}${e.event_time ? ' ' + e.event_time : ''}${e.venue ? ', স্থান: ' + e.venue : ''}${e.topic ? ', বিষয়: ' + e.topic : ''}${e.chief_guest ? ', প্রধান অতিথি: ' + e.chief_guest : ''}${e.special_guest ? ', বিশেষ অতিথি: ' + e.special_guest : ''}`).join('\n') : 'এখন কোনো অনুষ্ঠান নির্ধারিত নেই।'}`);
  L.push(`## সেবা ও উদ্যোগ\n${f.programs.map((p) => `- ${p.title}${p.description ? ': ' + p.description : ''}${p.beneficiaries ? ` (উপকৃত ${bn(p.beneficiaries)} জন)` : ''}`).join('\n')}${s.quran_info ? '\nকুরআন শিক্ষা: ' + s.quran_info : ''}`);
  L.push(`## কমিটি\n${f.committee.map((c) => `- ${c.name}, ${c.role}${c.duty ? ' (' + c.duty + ')' : ''}`).join('\n')}`);
  const nw = f.books.filter(isNewBook).slice(0, 8);
  L.push(`## পাঠাগারের বই (শিরোনাম, লেখক, এখন আছে/মোট)\n${nw.length ? 'নতুন এসেছে: ' + nw.map((b) => b.title).join(', ') + '\n' : ''}${f.books.slice(0, 150).map((b) => `- ${b.title}${b.author ? ', ' + b.author : ''} (${bn(b.available)}/${bn(b.copies)})`).join('\n')}`);
  if (f.posts.length) L.push(`## সাম্প্রতিক সংবাদ\n${f.posts.map((p) => `- ${p.title} (${fd(p.published_on)})`).join('\n')}`);
  if (s.chat_notes?.trim()) L.push(`## কমিটির দেওয়া অতিরিক্ত তথ্য\n${s.chat_notes.trim()}`);

  if (me) {
    L.push(`## লগইন করা সদস্যের নিজের তথ্য (শুধু এই ব্যক্তিকেই বলা যাবে)\nনাম: ${me.name}\nসদস্য নম্বর: ${me.memberNo}\nযাচাই: ${me.verified ? 'যাচাইকৃত সদস্য' : 'এখনো যাচাই হয়নি'}\nভর্তি ফি: ${me.regPaid ? 'পরিশোধিত' : `বকেয়া (${tk(s.reg_fee)})`}\nসদস্যপদ: ${me.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}\nসদস্য হয়েছেন: ${fd(me.joinDate)}\nমাসিক চাঁদা: ${tk(me.monthly)}\nএ পর্যন্ত মোট জমা: ${tk(me.totalPaid)}\nচাঁদার অবস্থা: ${dueLine(me, s)}\nপরবর্তী চাঁদার শেষ তারিখ: ${fd(me.nextDue)}\nসাম্প্রতিক জমা: ${me.recent.length ? me.recent.map((r) => `${r.label} ${tk(r.amount)} (${fd(r.on)})`).join('; ') : 'নেই'}\nঋণ: ${me.loans.length ? me.loans.map((l) => `${l.slip}: ${tk(l.amount)} নিয়েছেন ${fd(l.issued)}, ফেরতের শেষ তারিখ ${fd(l.due)}, ফেরত দিয়েছেন ${tk(l.repaid)}, বাকি ${tk(l.left)}${l.late ? ' (মেয়াদ পেরিয়েছে)' : ''}`).join('; ') : 'কোনো ঋণ নেই'}\nনিয়ে রাখা বই: ${me.booksOut.length ? me.booksOut.map((b) => `${b.title}${b.expected ? ' (ফেরতের তারিখ ' + fd(b.expected) + ')' : ''}`).join(', ') : 'নেই'}`);
  } else if (f.applicant) {
    const a = f.applicant;
    L.push(`## নিবন্ধিত আবেদনকারী (এখনো সদস্য নন)\nনাম: ${a.name}, আবেদন নং ${bn(a.appNo)}\nঅবস্থা: ${a.status === 'rejected' ? 'আবেদন বাতিল' : 'কমিটির যাচাই অপেক্ষমাণ'}\nভর্তি ফি ${tk(s.reg_fee)}: ${a.claimed ? `জমা দিয়েছেন বলে জানিয়েছেন (${a.claimed}), কমিটি মিলিয়ে দেখবে` : 'এখনো জমা দেওয়ার কথা জানাননি, প্রোফাইলের "টাকা জমা দেওয়ার মাধ্যম" অনুযায়ী পাঠিয়ে জানাতে হবে'}\nযাচাই হলে তিনি যাচাইকৃত সদস্য হবেন ও বিজ্ঞপ্তি পাবেন।`);
  } else if (f.who === 'staff') {
    L.push('## ব্যবহারকারী\nইনি কমিটির সদস্য (অ্যাডমিন প্যানেলের লগইন)। সদস্যদের ব্যক্তিগত হিসাব এখান থেকে বলা যাবে না, অ্যাডমিন প্যানেল দেখতে বলুন।');
  } else {
    L.push('## ব্যবহারকারী\nইনি অতিথি (লগইন করেননি)। নিজের জমা, বকেয়া বা ঋণের হিসাব জানতে চাইলে /login এ লগইন করতে বলুন।');
  }
  return L.join('\n\n');
}
