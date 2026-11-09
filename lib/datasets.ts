import 'server-only';
import { decRow } from './crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { todayBD } from './dates';
import { loanStatus } from './ui';
import type { Range } from './range';
import type { Col, Sheet } from './sheets';
import type { Role } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Q = any;
/** Supabase একবারে ১০০০ সারি দেয়; তাই পাতা ধরে সব আনি */
export async function fetchAll<T = Record<string, unknown>>(build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < 100000; i += 1000) {
    const { data, error } = await build(i, i + 999);
    if (error) throw new Error((error as { message?: string }).message ?? 'ডেটা আনা যায়নি');
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}
const span = (q: Q, col: string, r: Range) => { let x = q; if (r.from) x = x.gte(col, r.from); return x.lte(col, r.to).order(col, { ascending: r.sort === 'old' }); };
const has = (r: Range, ...vals: (string | null | undefined)[]) => !r.q || vals.some((v) => (v ?? '').toLowerCase().includes(r.q.toLowerCase()));
const TYPE: Record<string, string> = { monthly: 'মাসিক চাঁদা', registration: 'ভর্তি ফি', reactivation: 'পুনঃসক্রিয়করণ' };
const STATUS: Record<string, string> = { active: 'সক্রিয়', frozen: 'স্থগিত', cancelled: 'বাতিল' };
const LOAN: Record<string, string> = { paid: 'পরিশোধিত', running: 'চলমান', overdue: 'মেয়াদোত্তীর্ণ' };

export type Dataset = { title: string; roles: Role[]; cols: Col[]; load: (sb: SupabaseClient, r: Range, extra: Record<string, string | undefined>) => Promise<Record<string, unknown>[]> };

export const DATASETS: Record<string, Dataset> = {
  members: {
    title: 'সদস্য', roles: ['admin', 'treasurer'],
    cols: [{ k: 'member_no', h: 'সদস্য নম্বর' }, { k: 'name', h: 'নাম', w: 26 }, { k: 'father_name', h: 'পিতার নাম', w: 22 }, { k: 'mother_name', h: 'মাতার নাম', w: 22 }, { k: 'phone', h: 'মোবাইল', w: 15 }, { k: 'email', h: 'ইমেইল', w: 24 }, { k: 'nid', h: 'এনআইডি', w: 18 }, { k: 'dob', h: 'জন্ম তারিখ' }, { k: 'address', h: 'ঠিকানা', w: 30 }, { k: 'occupation', h: 'পেশা' }, { k: 'nominee', h: 'নমিনি', w: 20 }, { k: 'monthly_amount', h: 'মাসিক চাঁদা' }, { k: 'join_date', h: 'যোগদান' }, { k: 'status_bn', h: 'অবস্থা' }, { k: 'verified', h: 'যাচাইকৃত' }, { k: 'total_paid', h: 'মোট জমা' }, { k: 'overdue_months', h: 'বকেয়া মাস' }],
    async load(sb, r, x) {
      const [rows, dues] = await Promise.all([
        fetchAll((a, b) => { let q: Q = sb.from('members').select('*'); if (x.status) q = q.eq('status', x.status); return span(q, 'join_date', r).range(a, b); }),
        fetchAll<{ id: string; total_paid: number; overdue_months: number }>((a, b) => sb.from('v_member_dues').select('id, total_paid, overdue_months').range(a, b)),
      ]);
      const d = new Map(dues.map((v) => [v.id, v]));
      return rows.filter((m: any) => has(r, m.name, m.phone, m.member_no, m.email)).map((m: any) => ({ ...decRow(m), status_bn: STATUS[m.status] ?? m.status, verified: !!m.verified_at, total_paid: Number(d.get(m.id)?.total_paid ?? 0), overdue_months: d.get(m.id)?.overdue_months ?? 0 }))
        .filter((m: any) => !x.due || m.overdue_months > 0);
    },
  },
  payments: {
    title: 'চাঁদা জমা', roles: ['admin', 'treasurer'],
    cols: [{ k: 'receipt_no', h: 'রসিদ' }, { k: 'paid_on', h: 'তারিখ' }, { k: 'member_no', h: 'সদস্য নম্বর' }, { k: 'name', h: 'নাম', w: 26 }, { k: 'phone', h: 'মোবাইল', w: 15 }, { k: 'type_bn', h: 'ধরন' }, { k: 'for_month', h: 'কোন মাসের' }, { k: 'amount', h: 'পরিমাণ' }, { k: 'method', h: 'মাধ্যম' }, { k: 'note', h: 'নোট', w: 26 }],
    async load(sb, r, x) {
      const rows = await fetchAll((a, b) => { let q: Q = sb.from('payments').select('id, receipt_no, paid_on, type, for_month, amount, method, note, member_id, members(name, member_no, phone)'); if (x.type) q = q.eq('type', x.type); return span(q, 'paid_on', r).range(a, b); });
      return rows.map((p: any) => ({ ...p, name: p.members?.name, member_no: p.members?.member_no, phone: p.members?.phone, type_bn: TYPE[p.type] ?? p.type, for_month: p.for_month?.slice(0, 7) ?? '', amount: Number(p.amount) }))
        .filter((p: any) => has(r, p.name, p.phone, p.member_no, p.receipt_no));
    },
  },
  donations: {
    title: 'দান', roles: ['admin', 'treasurer'],
    cols: [{ k: 'receipt_no', h: 'রসিদ' }, { k: 'donated_on', h: 'তারিখ' }, { k: 'donor_name', h: 'দাতা', w: 26 }, { k: 'donor_title', h: 'পদবী', w: 22 }, { k: 'phone', h: 'মোবাইল', w: 15 }, { k: 'amount', h: 'পরিমাণ' }, { k: 'purpose', h: 'খাত', w: 18 }, { k: 'method', h: 'মাধ্যম' }, { k: 'anonymous', h: 'গোপন' }],
    async load(sb, r, x) {
      const rows = await fetchAll((a, b) => { let q: Q = sb.from('donations').select('*'); if (x.purpose) q = q.eq('purpose', x.purpose); return span(q, 'donated_on', r).range(a, b); });
      return rows.map((d: any) => ({ ...d, amount: Number(d.amount) })).filter((d: any) => has(r, d.donor_name, d.phone, d.receipt_no, d.donor_title));
    },
  },
  loans: {
    title: 'করজে হাসানা', roles: ['admin', 'treasurer'],
    cols: [{ k: 'slip_no', h: 'স্লিপ' }, { k: 'issued_on', h: 'প্রদানের তারিখ' }, { k: 'due_on', h: 'শেষ তারিখ' }, { k: 'member_no', h: 'সদস্য নম্বর' }, { k: 'name', h: 'নাম', w: 26 }, { k: 'phone', h: 'মোবাইল', w: 15 }, { k: 'amount', h: 'পরিমাণ' }, { k: 'term_months', h: 'মেয়াদ (মাস)' }, { k: 'mode_bn', h: 'ফেরতের ধরন' }, { k: 'repaid', h: 'ফেরত' }, { k: 'left', h: 'বাকি' }, { k: 'status_bn', h: 'অবস্থা' }, { k: 'guarantor_name', h: 'জামিনদার', w: 22 }, { k: 'guarantor_phone', h: 'জামিনদারের মোবাইল', w: 16 }, { k: 'purpose', h: 'উদ্দেশ্য', w: 24 }],
    async load(sb, r, x) {
      const today = todayBD();
      const rows = await fetchAll((a, b) => span(sb.from('loans').select('*, members(name, member_no, phone), loan_repayments(amount)'), 'issued_on', r).range(a, b));
      return rows.map((l: any) => {
        const repaid = (l.loan_repayments ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0);
        const st = loanStatus(Number(l.amount), repaid, l.due_on, today);
        return { ...l, name: l.members?.name, member_no: l.members?.member_no, phone: l.members?.phone, amount: Number(l.amount), repaid, left: Math.max(0, Number(l.amount) - repaid), st, status_bn: LOAN[st], mode_bn: l.mode === 'installment' ? 'কিস্তিতে' : 'একবারে' };
      }).filter((l: any) => (!x.st || l.st === x.st) && has(r, l.name, l.phone, l.member_no, l.slip_no, l.guarantor_name));
    },
  },
  repayments: {
    title: 'ঋণ ফেরত', roles: ['admin', 'treasurer'],
    cols: [{ k: 'receipt_no', h: 'রসিদ' }, { k: 'paid_on', h: 'তারিখ' }, { k: 'slip_no', h: 'ঋণের স্লিপ' }, { k: 'name', h: 'নাম', w: 26 }, { k: 'amount', h: 'পরিমাণ' }],
    async load(sb, r) {
      const rows = await fetchAll((a, b) => span(sb.from('loan_repayments').select('id, receipt_no, paid_on, amount, loans(slip_no, members(name, phone))'), 'paid_on', r).range(a, b));
      return rows.map((p: any) => ({ ...p, slip_no: p.loans?.slip_no, name: p.loans?.members?.name, phone: p.loans?.members?.phone, amount: Number(p.amount) })).filter((p: any) => has(r, p.name, p.phone, p.slip_no, p.receipt_no));
    },
  },
  books: {
    title: 'বই', roles: ['admin', 'librarian'],
    cols: [{ k: 'title', h: 'শিরোনাম', w: 30 }, { k: 'author', h: 'লেখক', w: 24 }, { k: 'category', h: 'বিভাগ', w: 16 }, { k: 'copies', h: 'কপি' }, { k: 'shelf', h: 'তাক' }, { k: 'added_on', h: 'যুক্ত হয়েছে' }],
    async load(sb, r) {
      const rows = await fetchAll((a, b) => span(sb.from('books').select('*'), 'added_on', r).range(a, b));
      return rows.filter((b: any) => has(r, b.title, b.author, b.category));
    },
  },
  lendings: {
    title: 'বই ধার', roles: ['admin', 'librarian'],
    cols: [{ k: 'title', h: 'বই', w: 28 }, { k: 'borrower_name', h: 'পাঠক', w: 24 }, { k: 'borrower_phone', h: 'মোবাইল', w: 15 }, { k: 'out_on', h: 'নিয়েছেন' }, { k: 'expected_on', h: 'ফেরতের তারিখ' }, { k: 'returned_on', h: 'ফেরত দিয়েছেন' }],
    async load(sb, r) {
      const rows = await fetchAll((a, b) => span(sb.from('book_lendings').select('*, books(title)'), 'out_on', r).range(a, b));
      return rows.map((l: any) => ({ ...l, title: l.books?.title })).filter((l: any) => has(r, l.title, l.borrower_name, l.borrower_phone));
    },
  },
  services: {
    title: 'সেবার রেকর্ড', roles: ['admin', 'treasurer', 'editor'],
    cols: [{ k: 'served_on', h: 'তারিখ' }, { k: 'service', h: 'সেবা', w: 24 }, { k: 'person_name', h: 'নাম', w: 26 }, { k: 'phone', h: 'মোবাইল', w: 15 }, { k: 'quantity', h: 'সংখ্যা' }, { k: 'note', h: 'নোট', w: 30 }],
    async load(sb, r, x) {
      const rows = await fetchAll((a, b) => { let q: Q = sb.from('service_records').select('*'); if (x.service) q = q.eq('service', x.service); return span(q, 'served_on', r).range(a, b); });
      return rows.filter((s: any) => has(r, s.person_name, s.phone, s.service, s.note));
    },
  },
};

/** এক ক্লিকে পুরো ব্যাকআপ: সব তালিকা আলাদা শিটে, সব সময়ের তথ্য */
export async function backupSheets(sb: SupabaseClient): Promise<Sheet[]> {
  const all: Range = { r: 'all', from: null, to: '9999-12-31', sort: 'old', label: '', q: '' };
  const sheets: Sheet[] = [];
  for (const k of ['members', 'payments', 'loans', 'repayments', 'donations', 'books', 'lendings', 'services']) {
    try { sheets.push({ name: DATASETS[k].title, cols: DATASETS[k].cols, rows: await DATASETS[k].load(sb, all, {}) }); } catch { /* টেবিল না থাকলে (পুরোনো SQL) বাদ */ }
  }
  const extra: [string, string, Col[]][] = [
    ['events', 'অনুষ্ঠান', [{ k: 'event_date', h: 'তারিখ' }, { k: 'title', h: 'শিরোনাম', w: 30 }, { k: 'topic', h: 'বিষয়', w: 30 }, { k: 'venue', h: 'স্থান' }, { k: 'chief_guest', h: 'প্রধান অতিথি', w: 22 }, { k: 'special_guest', h: 'বিশেষ অতিথি', w: 22 }, { k: 'outcome', h: 'পরবর্তী উদ্যোগ', w: 30 }]],
    ['programs', 'সেবার তালিকা', [{ k: 'icon', h: 'আইকন' }, { k: 'title', h: 'শিরোনাম', w: 26 }, { k: 'description', h: 'বিবরণ', w: 40 }, { k: 'beneficiaries', h: 'উপকৃত' }]],
    ['committee', 'কমিটি', [{ k: 'name', h: 'নাম', w: 24 }, { k: 'role', h: 'পদ', w: 20 }, { k: 'duty', h: 'দায়িত্ব', w: 30 }, { k: 'phone', h: 'মোবাইল', w: 15 }, { k: 'email', h: 'ইমেইল', w: 24 }]],
    ['posts', 'সংবাদ', [{ k: 'published_on', h: 'তারিখ' }, { k: 'title', h: 'শিরোনাম', w: 34 }, { k: 'body', h: 'লেখা', w: 60 }]],
    ['applications', 'আবেদন', [{ k: 'created_at', h: 'তারিখ' }, { k: 'name', h: 'নাম', w: 24 }, { k: 'phone', h: 'মোবাইল', w: 15 }, { k: 'email', h: 'ইমেইল', w: 24 }, { k: 'status', h: 'অবস্থা' }, { k: 'pay_method', h: 'পেমেন্টের মাধ্যম' }, { k: 'pay_trx', h: 'ট্রানজ্যাকশন' }]],
  ];
  for (const [t, name, cols] of extra) {
    try { sheets.push({ name, cols, rows: await fetchAll((a, b) => sb.from(t).select('*').range(a, b)) }); } catch { /* বাদ */ }
  }
  return sheets;
}
