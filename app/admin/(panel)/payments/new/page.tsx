import type { Metadata } from 'next';
import { PaymentForm, type PayMember } from '../../../_components/PaymentForm';
import { savePayments } from '../../../actions/payments';
import { MONEY, requirePage } from '@/lib/guard';
import { computeDues } from '@/lib/dues';
import { todayBD } from '@/lib/dates';
import { ymLabel } from '@/lib/format';
import { PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'চাঁদা জমা নিন' };

export default async function NewPayment({ searchParams }: { searchParams: { member?: string } }) {
  const { supabase } = await requirePage(MONEY);
  const [{ data: members }, { data: pays }, { data: s }] = await Promise.all([
    supabase.from('members').select('id, name, member_no, monthly_amount, join_date, reset_from, status').neq('status', 'cancelled').order('name'),
    supabase.from('payments').select('member_id, for_month').eq('type', 'monthly'),
    supabase.from('settings').select('due_day').eq('id', 1).single(),
  ]);
  const byMember = new Map<string, string[]>();
  (pays ?? []).forEach((p) => byMember.set(p.member_id, [...(byMember.get(p.member_id) ?? []), p.for_month]));
  const list: PayMember[] = (members ?? []).map((m) => {
    const d = computeDues({ joinDate: m.join_date, resetFrom: m.reset_from, monthlyAmount: Number(m.monthly_amount), paidMonths: byMember.get(m.id) ?? [], dueDay: s?.due_day ?? 10 });
    return { id: m.id, label: `${m.name} (${m.member_no})`, monthly: Number(m.monthly_amount), overdue: d.overdue.length, overdueLabels: d.overdue.map((x) => ymLabel(x)).join(', '), frozen: m.status === 'frozen' };
  });
  return (
    <>
      <PageHead title="চাঁদা জমা নিন" sub="জমা নেওয়ার পর রসিদ প্রিন্টের পাতা খুলবে" />
      <div style={{ maxWidth: 720 }}>
        {list.length ? <PaymentForm members={list} initial={searchParams.member} today={todayBD()} action={savePayments} /> : <div className="card muted">আগে সদস্য যোগ করুন।</div>}
      </div>
    </>
  );
}
