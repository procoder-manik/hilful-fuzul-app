import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeDues } from '@/lib/dues';
import { addMonths, monthStart, todayBD } from '@/lib/dates';
import { ymLabel } from '@/lib/format';
import { notify } from './send';
import { T } from './templates';
import type { Settings } from '@/lib/types';

const daysBetween = (a: string, b: string) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 864e5);

/** (মাস, দিন) থেকে তারিখ; মাসে দিনটি না থাকলে (যেমন ফেব্রুয়ারিতে ২৯) পরের মাসের ১ তারিখ */
function dateIn(monthIso: string, day: number): string {
  const [y, m] = monthIso.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return day > last ? addMonths(monthIso, 1) : `${monthIso.slice(0, 8)}${String(day).padStart(2, '0')}`;
}

/**
 * সদস্য কত দিন পর স্বয়ংক্রিয়ভাবে স্থগিত হবে। ডেটাবেসের run_auto_freeze() এর নিয়মেই হিসাব:
 * শেষ বকেয়া মাসের পরের মাসগুলোর (ফ্রিজ সীমা পূর্ণ হওয়া পর্যন্ত) নির্ধারিত তারিখ পেরোলেই স্থগিত।
 */
export function freezeDate(overdue: string[], streak: number, s: Pick<Settings, 'freeze_months' | 'due_day'>): string | null {
  if (!overdue.length || streak < 1 || streak >= s.freeze_months) return null;
  const last = [...overdue].sort().at(-1)!;
  return dateIn(addMonths(last, s.freeze_months - streak), s.due_day + 1);
}

export type RunSummary = { checked: number; sent: Record<string, number>; frozenNow: number };

/** প্রতিদিন একবার: বকেয়া, শেষ তারিখ, স্থগিতের আগের সতর্কতা ও স্থগিতের বিজ্ঞপ্তি */
export async function runDailyNotifications(): Promise<RunSummary> {
  const admin = createAdminClient();
  const { data: sRow } = await admin.from('settings').select('*').eq('id', 1).single();
  const s = sRow as Settings;
  const org = s.short_name || s.org_name;
  const flags = { notify_email: s.notify_email, notify_sms: s.notify_sms };
  const today = todayBD(), cur = monthStart(today), day = Number(today.slice(8, 10));

  // ডেটাবেসের নিজস্ব দৈনিক কাজ আগেই চালিয়ে নিই (একই কাজ দুইবার চালালে ক্ষতি নেই)
  const { data: frozenNow } = await admin.rpc('run_auto_freeze');

  const [{ data: members }, { data: pays }, { data: profs }] = await Promise.all([
    admin.from('members').select('id, name, phone, email, join_date, reset_from, monthly_amount, status, frozen_at'),
    admin.from('payments').select('member_id, for_month').eq('type', 'monthly'),
    admin.from('profiles').select('id, member_id').not('member_id', 'is', null),
  ]);
  const paidBy = new Map<string, string[]>();
  for (const p of pays ?? []) if (p.for_month) (paidBy.get(p.member_id) ?? paidBy.set(p.member_id, []).get(p.member_id)!).push(p.for_month);
  const userOf = new Map((profs ?? []).map((p) => [p.member_id as string, p.id as string]));

  const sent: Record<string, number> = {};
  const go = async (kind: string, key: string, memberRow: { id: string; email: string | null; phone: string }, m: { title: string; body: string; sms: string }) => {
    const r = await notify({ memberId: memberRow.id, userId: userOf.get(memberRow.id) ?? null, email: memberRow.email, phone: memberRow.phone, kind, key, ...m, settings: flags });
    if (r.created) sent[kind] = (sent[kind] ?? 0) + 1;
  };

  for (const m of members ?? []) {
    if (m.status === 'frozen' && m.frozen_at && daysBetween(m.frozen_at, today) <= 7) {
      await go('frozen', m.frozen_at, m, T.frozen({ name: m.name, org, freezeMonths: s.freeze_months, fee: s.reg_fee }));
      continue;
    }
    if (m.status !== 'active') continue;

    const d = computeDues({ joinDate: m.join_date, resetFrom: m.reset_from, monthlyAmount: Number(m.monthly_amount), paidMonths: paidBy.get(m.id) ?? [], dueDay: s.due_day }, today);
    if (d.overdue.length) {
      const latest = [...d.overdue].sort().at(-1)!;
      await go('overdue', latest, m, T.overdue({ name: m.name, org, months: d.overdue.map((x) => ymLabel(x)), amount: d.dueAmount, freezeMonths: s.freeze_months }));
    } else if (!d.paidThisMonth && day >= s.due_day - 3 && day <= s.due_day) {
      await go('due_soon', cur, m, T.dueSoon({ name: m.name, org, month: ymLabel(cur), amount: Number(m.monthly_amount), dueDate: d.nextDueDate }));
    }

    const fz = freezeDate(d.overdue, d.streak, s);
    if (fz) {
      const left = daysBetween(today, fz);
      const msg = (days: number) => T.freezeWarn({ name: m.name, org, days, freezeDate: fz, freezeMonths: s.freeze_months, fee: s.reg_fee });
      if (left >= 0 && left <= 3) await go('freeze_warn_3', fz, m, msg(left));
      else if (left > 3 && left <= 7) await go('freeze_warn_7', fz, m, msg(left));
    }
  }
  await admin.from('settings').update({ notify_last_run: today }).eq('id', 1);
  return { checked: (members ?? []).length, sent, frozenNow: Number(frozenNow ?? 0) };
}
