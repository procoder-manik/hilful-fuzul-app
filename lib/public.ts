import 'server-only';
import { cache } from 'react';
import { publicClient } from './supabase/public';
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
