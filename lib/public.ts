import 'server-only';
import { cache } from 'react';
import { publicClient } from './supabase/public';
import { createAdminClient } from './supabase/admin';
import { todayBD } from './dates';
import { translateRows } from './translate';
import type { PublicStats } from './types';

export type EventRow = {
  id: string; title: string; topic: string | null; event_date: string; event_time: string | null; venue: string | null;
  chief_guest: string | null; special_guest: string | null; presided_by: string | null; outcome: string | null;
  show_popup: boolean; show_in_hero: boolean; design: Record<string, string | number>;
};
export type Program = { id: string; icon: string | null; title: string; description: string | null; beneficiaries: number };
export type CommitteeMember = { id: string; name: string; role: string; duty: string | null; photo_url: string | null; bio?: string | null; facebook?: string | null; is_founder?: boolean };
export type Post = { id: string; title: string; body: string | null; image_url: string | null; published_on: string };
export type Book = { id: string; title: string; author: string | null; category: string | null; copies: number; shelf: string | null; cover_url: string | null; added_on: string; available: number };
export type PublicLoan = { id: string; borrower: string; amount: number; term_months: number; issued_on: string; due_on: string; status: string };
export type PublicDonation = { id: string; donor: string; amount: number; purpose: string | null; donated_on: string };
export type MonthRow = { month: string; collected: number; loaned: number; repaid: number; members: number };

const EMPTY_STATS: PublicStats = { total_fund: 0, total_contributions: 0, total_donations: 0, total_loaned: 0, total_repaid: 0, month_collected: 0, month_loaned: 0, members: 0, active_members: 0, borrowers: 0, program_beneficiaries: 0, books: 0, book_titles: 0 };

export const getStats = cache(async () => ((await publicClient().from('v_public_stats').select('*').single()).data as PublicStats) ?? EMPTY_STATS);
export const getMonthly = cache(async () => ((await publicClient().from('v_monthly_summary').select('*').order('month')).data ?? []) as MonthRow[]);
export const getLoans = cache(async (limit = 200) => ((await publicClient().from('v_public_loans').select('*').order('issued_on', { ascending: false }).limit(limit)).data ?? []) as PublicLoan[]);
export const getDonations = cache(async (limit = 200) => ((await publicClient().from('v_public_donations').select('*').order('donated_on', { ascending: false }).limit(limit)).data ?? []) as PublicDonation[]);
export const getPrograms = cache(async () => translateRows(((await publicClient().from('programs').select('*').order('sort')).data ?? []) as Program[], ['title', 'description']));
export const getCommittee = cache(async () => {
  const c = publicClient();
  const r = await c.from('committee').select('id, name, role, duty, photo_url, sort, bio, facebook, is_founder').order('sort');
  let rows = (r.data ?? []) as unknown as CommitteeMember[];
  if (r.error) rows = ((await c.from('committee').select('id, name, role, duty, photo_url, sort').order('sort')).data ?? []) as unknown as CommitteeMember[];   // SQL 006 চালানোর আগে
  return translateRows(rows, ['name', 'role', 'duty', 'bio']);
});
export const getPosts = cache(async (limit = 30) => translateRows(((await publicClient().from('posts').select('id, title, body, image_url, published_on').eq('is_published', true).order('published_on', { ascending: false }).limit(limit)).data ?? []) as Post[], ['title', 'body']));
export const getBooks = cache(async () => ((await publicClient().from('v_book_availability').select('*').order('added_on', { ascending: false })).data ?? []) as Book[]);
export const getEvents = cache(async () => translateRows(((await publicClient().from('events').select('*').order('event_date')).data ?? []) as EventRow[], ['title', 'topic', 'venue', 'chief_guest', 'special_guest', 'presided_by', 'outcome']));
export const upcoming = (ev: EventRow[]) => ev.filter((e) => e.event_date >= todayBD());
export const past = (ev: EventRow[]) => ev.filter((e) => e.event_date < todayBD()).reverse();
export const isNewBook = (b: Book) => b.added_on >= new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);

export type PublicMember = {
  id: string; member_no: string; name: string; photo_url: string | null; join_date: string; status: string; verified: boolean; months_since: number;
  monthly_amount: number | null; total_paid: number | null; paid_months: number; loan_count: number; loan_total: number | null; loan_balance: number | null;
  books_borrowed: number; money_visible: boolean;
};

/**
 * ওয়েবসাইটের সদস্য পাতা। প্রথমে পাবলিক ভিউ (SQL 008) থেকে পড়ে; ভিউ না থাকলে সার্ভার থেকে সরাসরি একই তথ্য হিসাব করে (ফোন, ঠিকানা, এনআইডি, ইমেইল কখনোই নেওয়া হয় না),
 * তাই SQL চালানো না থাকলেও পাতা কাজ করে। শুধু "লুকানো" ও "টাকার অঙ্ক বন্ধ" সুইচ দুটি SQL 008 এর পরে কাজ করে।
 */
export const getPublicMembers = cache(async (): Promise<PublicMember[] | null> => {
  const v = await publicClient().from('v_public_members').select('*').order('join_date', { ascending: true }).limit(2000);
  if (!v.error) return (v.data ?? []) as PublicMember[];
  try {
    const db = createAdminClient();
    const st = await db.from('settings').select('members_page_on, members_show_money').eq('id', 1).single();
    const on = st.error ? true : st.data?.members_page_on !== false;
    const money = st.error ? true : st.data?.members_show_money !== false;
    if (!on) return [];
    let mq = await db.from('members').select('id, member_no, name, photo_url, join_date, status, verified_at, monthly_amount, public_hidden').neq('status', 'cancelled').order('join_date').limit(2000);
    if (mq.error) mq = await db.from('members').select('id, member_no, name, photo_url, join_date, status, verified_at, monthly_amount').neq('status', 'cancelled').order('join_date').limit(2000) as typeof mq;
    if (mq.error) return null;
    const [pay, loans, reps, books] = await Promise.all([
      db.from('payments').select('member_id, amount, type').limit(50000),
      db.from('loans').select('id, member_id, amount').limit(20000),
      db.from('loan_repayments').select('loan_id, amount').limit(50000),
      db.from('book_lendings').select('member_id').not('member_id', 'is', null).limit(50000),
    ]);
    const paid = new Map<string, { sum: number; months: number }>();
    (pay.data ?? []).forEach((p) => { const c = paid.get(p.member_id) ?? { sum: 0, months: 0 }; c.sum += Number(p.amount); if (p.type === 'monthly') c.months++; paid.set(p.member_id, c); });
    const repaid = new Map<string, number>();
    (reps.data ?? []).forEach((r) => repaid.set(r.loan_id, (repaid.get(r.loan_id) ?? 0) + Number(r.amount)));
    const ln = new Map<string, { n: number; total: number; back: number }>();
    (loans.data ?? []).forEach((l) => { const c = ln.get(l.member_id) ?? { n: 0, total: 0, back: 0 }; c.n++; c.total += Number(l.amount); c.back += repaid.get(l.id) ?? 0; ln.set(l.member_id, c); });
    const bk = new Map<string, number>();
    (books.data ?? []).forEach((b) => bk.set(b.member_id as string, (bk.get(b.member_id as string) ?? 0) + 1));
    const now = new Date();
    return (mq.data ?? []).filter((m) => !(m as { public_hidden?: boolean }).public_hidden).map((m) => {
      const j = new Date(m.join_date);
      const p = paid.get(m.id) ?? { sum: 0, months: 0 };
      const l = ln.get(m.id) ?? { n: 0, total: 0, back: 0 };
      return {
        id: m.id, member_no: m.member_no, name: m.name, photo_url: m.photo_url, join_date: m.join_date, status: m.status, verified: !!m.verified_at,
        months_since: Math.max(1, (now.getFullYear() - j.getFullYear()) * 12 + now.getMonth() - j.getMonth() + 1),
        monthly_amount: money ? Number(m.monthly_amount) : null, total_paid: money ? p.sum : null, paid_months: p.months,
        loan_count: l.n, loan_total: money ? l.total : null, loan_balance: money ? Math.max(l.total - l.back, 0) : null, books_borrowed: bk.get(m.id) ?? 0, money_visible: money,
      } as PublicMember;
    });
  } catch {
    return null;
  }
});
