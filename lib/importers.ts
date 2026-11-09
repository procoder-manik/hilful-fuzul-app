import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeEmail, normalizePhone, toEnDigits } from './auth';
import { fetchAll, DATASETS } from './datasets';
import { todayBD } from './dates';
import type { Role } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Report = { total: number; valid: number; dup: number; errors: string[]; sample: string[]; inserted?: number };
type Prep = { rows: Record<string, unknown>[]; dup: number; errors: string[]; sample: string[] };
type Importer = { title: string; roles: Role[]; prepare: (sb: SupabaseClient, recs: Record<string, unknown>[]) => Promise<Prep>; table: string };

/* ---------- মান পড়া ---------- */
const S = (v: unknown) => (v === null || v === undefined ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v)).trim();
const money = (v: unknown) => { const n = typeof v === 'number' ? v : Number(toEnDigits(S(v)).replace(/[৳,\s]|tk|taka/gi, '')); return Number.isFinite(n) ? n : NaN; };
const yes = (v: unknown) => /^(হ্যাঁ|হা|yes|y|true|1|গোপন)$/i.test(S(v));
export function date(v: unknown): string | null {
  if (v instanceof Date && !isNaN(+v)) return v.toISOString().slice(0, 10);
  if (typeof v === 'number' && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + v * 864e5).toISOString().slice(0, 10);   // Excel এর তারিখ-সংখ্যা
  const s = toEnDigits(S(v));
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);          // ২৫/১২/২০২৫ (দিন/মাস/বছর)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}
const month = (v: unknown) => { const s = toEnDigits(S(v)); const m = s.match(/^(\d{4})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-01`; const d = date(v); return d ? d.slice(0, 8) + '01' : null; };

/** শিরোনাম সারি মিলিয়ে প্রতিটি সারিকে {key: মান} বানানো (বাংলা শিরোনাম বা ইংরেজি key দুটোই চলে) */
export function toRecords(kind: string, table: unknown[][]): { recs: Record<string, unknown>[]; unknown: string[] } {
  const ds = DATASETS[kind];
  const norm = (h: string) => h.replace(/[\s()_\-:*]/g, '').toLowerCase();
  const map = new Map<string, string>();
  ds.cols.forEach((c) => { map.set(norm(c.h), c.k); map.set(norm(c.k), c.k); });
  const extra: Record<string, string> = { মোবাইলনম্বর: 'phone', ফোন: 'phone', দাতারনাম: 'donor_name', নামবাংলা: 'name', পরিমাণটাকা: 'amount', টাকা: 'amount', মাস: 'for_month', বইয়েরনাম: 'title', নাম: kind === 'donations' ? 'donor_name' : kind === 'books' ? 'title' : 'name' };
  Object.entries(extra).forEach(([h, k]) => { if (!map.has(norm(h))) map.set(norm(h), k); });
  const [head, ...body] = table;
  const keys = (head ?? []).map((h) => map.get(norm(S(h))) ?? '');
  const unknown = (head ?? []).map(S).filter((h, i) => h && !keys[i]);
  const recs = body.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i]]).filter(([k]) => k)));
  return { recs, unknown };
}

const line = (i: number) => `লাইন ${i + 2}`;      // শিরোনাম ১ নম্বর লাইন

export const IMPORTERS: Record<string, Importer> = {
  members: {
    title: 'সদস্য', roles: ['admin', 'treasurer'], table: 'members',
    async prepare(sb, recs) {
      const have = new Set((await fetchAll<{ phone: string }>((a, b) => sb.from('members').select('phone').range(a, b))).map((m) => m.phone));
      const out: Prep = { rows: [], dup: 0, errors: [], sample: [] };
      recs.forEach((r, i) => {
        const name = S(r.name), phone = normalizePhone(S(r.phone));
        if (!name) return out.errors.push(`${line(i)}: নাম নেই`);
        if (!phone) return out.errors.push(`${line(i)}: মোবাইল নম্বর ঠিক নয় (${S(r.phone) || 'ফাঁকা'})`);
        if (have.has(phone)) { out.dup++; return; }
        const monthly = r.monthly_amount === undefined || S(r.monthly_amount) === '' ? 50 : money(r.monthly_amount);
        if (!(monthly > 0)) return out.errors.push(`${line(i)}: মাসিক চাঁদা ঠিক নয়`);
        const email = S(r.email) ? normalizeEmail(S(r.email)) : null;
        const frozen = /স্থগিত|frozen/i.test(S(r.status_bn));
        have.add(phone);
        out.rows.push({ name: name.slice(0, 120), phone, father_name: S(r.father_name) || null, mother_name: S(r.mother_name) || null, email, nid: S(r.nid) || null, dob: date(r.dob), address: S(r.address) || null, occupation: S(r.occupation) || null, nominee: S(r.nominee) || null, monthly_amount: monthly, join_date: date(r.join_date) ?? todayBD(), status: frozen ? 'frozen' : 'active', frozen_at: frozen ? todayBD() : null, verified_at: new Date().toISOString() });
        if (out.sample.length < 5) out.sample.push(`${name}, ${phone}, মাসিক ${monthly}`);
      });
      return out;
    },
  },
  donations: {
    title: 'দান', roles: ['admin', 'treasurer'], table: 'donations',
    async prepare(sb, recs) {
      const have = new Set((await fetchAll<{ receipt_no: string }>((a, b) => sb.from('donations').select('receipt_no').range(a, b))).map((d) => d.receipt_no));
      const out: Prep = { rows: [], dup: 0, errors: [], sample: [] };
      recs.forEach((r, i) => {
        const donor = S(r.donor_name), amount = money(r.amount), rc = S(r.receipt_no).toUpperCase();
        if (!donor) return out.errors.push(`${line(i)}: দাতার নাম নেই`);
        if (!(amount > 0)) return out.errors.push(`${line(i)}: পরিমাণ ঠিক নয়`);
        if (rc && have.has(rc)) { out.dup++; return; }
        const row: Record<string, unknown> = { donor_name: donor.slice(0, 120), amount, donated_on: date(r.donated_on) ?? todayBD(), phone: S(r.phone) || null, purpose: S(r.purpose) || 'সাধারণ তহবিল', method: S(r.method) || null, anonymous: yes(r.anonymous) };
        if (S(r.donor_title)) row.donor_title = S(r.donor_title).slice(0, 80);
        if (/^D-[A-Z0-9]{4,}$/.test(rc)) { row.receipt_no = rc; have.add(rc); }
        out.rows.push(row);
        if (out.sample.length < 5) out.sample.push(`${donor}, ${amount} টাকা, ${row.donated_on}`);
      });
      return out;
    },
  },
  payments: {
    title: 'চাঁদা জমা', roles: ['admin', 'treasurer'], table: 'payments',
    async prepare(sb, recs) {
      const [mem, pays] = await Promise.all([
        fetchAll<{ id: string; member_no: string; phone: string }>((a, b) => sb.from('members').select('id, member_no, phone').range(a, b)),
        fetchAll<{ member_id: string; type: string; for_month: string | null; receipt_no: string }>((a, b) => sb.from('payments').select('member_id, type, for_month, receipt_no').range(a, b)),
      ]);
      const byNo = new Map(mem.map((m) => [m.member_no.toUpperCase(), m.id])), byPhone = new Map(mem.map((m) => [m.phone, m.id]));
      const seen = new Set(pays.map((p) => `${p.member_id}|${p.type}|${p.for_month ?? ''}`)), rcs = new Set(pays.map((p) => p.receipt_no));
      const out: Prep = { rows: [], dup: 0, errors: [], sample: [] };
      recs.forEach((r, i) => {
        const id = byNo.get(S(r.member_no).toUpperCase()) ?? byPhone.get(normalizePhone(S(r.phone)) ?? '#');
        if (!id) return out.errors.push(`${line(i)}: সদস্য পাওয়া যায়নি (${S(r.member_no) || S(r.phone) || 'নম্বর নেই'})`);
        const t = S(r.type_bn) || 'মাসিক';
        const type = /ভর্তি|registration/i.test(t) ? 'registration' : /পুনঃ|reactivation/i.test(t) ? 'reactivation' : 'monthly';
        const fm = type === 'monthly' ? month(r.for_month) : null;
        if (type === 'monthly' && !fm) return out.errors.push(`${line(i)}: কোন মাসের চাঁদা তা নেই (যেমন 2026-10)`);
        const amount = money(r.amount);
        if (!(amount > 0)) return out.errors.push(`${line(i)}: পরিমাণ ঠিক নয়`);
        const rc = S(r.receipt_no).toUpperCase();
        const key = `${id}|${type}|${fm ?? ''}`;
        if ((type === 'monthly' && seen.has(key)) || (rc && rcs.has(rc))) { out.dup++; return; }
        seen.add(key);
        const row: Record<string, unknown> = { member_id: id, type, for_month: fm, amount, paid_on: date(r.paid_on) ?? todayBD(), method: S(r.method) || null, note: S(r.note) || null };
        if (/^R-[A-Z0-9]{4,}$/.test(rc)) { row.receipt_no = rc; rcs.add(rc); }
        out.rows.push(row);
        if (out.sample.length < 5) out.sample.push(`${S(r.member_no) || S(r.phone)}, ${type === 'monthly' ? fm!.slice(0, 7) : t}, ${amount} টাকা`);
      });
      return out;
    },
  },
  books: {
    title: 'বই', roles: ['admin', 'librarian'], table: 'books',
    async prepare(sb, recs) {
      const have = new Set((await fetchAll<{ title: string; author: string | null }>((a, b) => sb.from('books').select('title, author').range(a, b))).map((b) => `${b.title.trim().toLowerCase()}|${(b.author ?? '').trim().toLowerCase()}`));
      const out: Prep = { rows: [], dup: 0, errors: [], sample: [] };
      recs.forEach((r, i) => {
        const title = S(r.title);
        if (!title) return out.errors.push(`${line(i)}: বইয়ের নাম নেই`);
        const key = `${title.toLowerCase()}|${S(r.author).toLowerCase()}`;
        if (have.has(key)) { out.dup++; return; }
        have.add(key);
        const copies = Math.max(1, Math.round(money(r.copies)) || 1);
        out.rows.push({ title: title.slice(0, 160), author: S(r.author) || null, category: S(r.category) || null, copies, shelf: S(r.shelf) || null, added_on: date(r.added_on) ?? todayBD() });
        if (out.sample.length < 5) out.sample.push(`${title}${S(r.author) ? `, ${S(r.author)}` : ''} (${copies} কপি)`);
      });
      return out;
    },
  },
};
