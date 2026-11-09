import Link from 'next/link';
import type { Metadata } from 'next';
import { CollectionChart, DonutChart, MembersChart } from '@/components/Charts';
import { requirePage, STAFF } from '@/lib/guard';
import { bn, fd, MONTHS_SHORT, tk } from '@/lib/format';
import { todayBD } from '@/lib/dates';
import { Badge, Empty, loanStatus, PageHead, STATUS } from '@/lib/ui';
import type { PublicStats } from '@/lib/types';

export const metadata: Metadata = { title: 'ড্যাশবোর্ড' };

export default async function Dashboard({ searchParams }: { searchParams: { denied?: string } }) {
  const { supabase } = await requirePage(STAFF);
  const today = todayBD();
  const [stats, monthly, dues, loans, logs, newMembers] = await Promise.all([
    supabase.from('v_public_stats').select('*').single(),
    supabase.from('v_monthly_summary').select('*').order('month'),
    supabase.from('v_member_dues').select('id, name, phone, status, overdue_months, monthly_amount').gt('overdue_months', 0).order('overdue_months', { ascending: false }).limit(10),
    supabase.from('loans').select('id, amount, due_on, slip_no, members(name), loan_repayments(amount)'),
    supabase.from('activity_log').select('action, created_at').order('created_at', { ascending: false }).limit(8),
    supabase.from('members').select('id', { count: 'exact', head: true }).gte('join_date', today.slice(0, 8) + '01'),
  ]);
  const s = stats.data as PublicStats;
  const m = (monthly.data ?? []) as { month: string; collected: number; loaned: number; repaid: number; members: number }[];
  const labels = m.map((x) => MONTHS_SHORT[Number(x.month.slice(5, 7)) - 1]);
  const loanRows = (loans.data ?? []).map((l) => {
    const rep = (l.loan_repayments as { amount: number }[]).reduce((a, r) => a + Number(r.amount), 0);
    return { ...l, name: (l.members as unknown as { name: string })?.name, bal: Number(l.amount) - rep, st: loanStatus(Number(l.amount), rep, l.due_on, today) };
  });
  const cnt = { running: 0, paid: 0, overdue: 0 } as Record<string, number>;
  loanRows.forEach((l) => cnt[l.st]++);
  const available = s.total_fund - s.total_loaned + s.total_repaid;

  return (
    <>
      {searchParams.denied && <div className="notice">ওই পেজটি দেখার অনুমতি আপনার ভূমিকায় নেই।</div>}
      <PageHead title="ড্যাশবোর্ড" sub={fd(today)}>
        <Link className="btn pri" href="/admin/payments/new">চাঁদা জমা নিন</Link>
        <Link className="btn" href="/admin/loans/new">নতুন ঋণ</Link>
      </PageHead>
      <div className="grid g4">
        <div className="kpi"><span>মোট তহবিল</span><b>{tk(s.total_fund)}</b></div>
        <div className="kpi"><span>বর্তমানে হাতে আছে</span><b>{tk(available)}</b></div>
        <div className="kpi"><span>এই মাসে সংগ্রহ</span><b>{tk(s.month_collected)}</b></div>
        <div className="kpi"><span>এই মাসে ঋণ বিতরণ</span><b>{tk(s.month_loaned)}</b></div>
        <div className="kpi"><span>মোট / সক্রিয় সদস্য</span><b>{bn(s.members)} / {bn(s.active_members)}</b></div>
        <div className="kpi"><span>এই মাসে নতুন সদস্য</span><b>{bn(newMembers.count ?? 0)}</b></div>
        <div className="kpi"><span>বকেয়া ঋণ</span><b>{tk(s.total_loaned - s.total_repaid)}</b></div>
        <div className="kpi"><span>মোট দান</span><b>{tk(s.total_donations)}</b></div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card"><b>১২ মাস: সংগ্রহ, ঋণ বিতরণ ও ফেরত</b><CollectionChart labels={labels} collected={m.map((x) => +x.collected)} loaned={m.map((x) => +x.loaned)} repaid={m.map((x) => +x.repaid)} /></div>
        <div className="card"><b>সদস্য বৃদ্ধি</b><MembersChart labels={labels} members={m.map((x) => x.members)} /></div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card"><b>ঋণের অবস্থা</b><DonutChart labels={['চলমান', 'পরিশোধিত', 'মেয়াদোত্তীর্ণ']} values={[cnt.running, cnt.paid, cnt.overdue]} colors={['#1673e6', '#1f9d55', '#e0352b']} /></div>
        <div className="card"><b>তহবিলের উৎস</b><DonutChart isMoney labels={['সদস্য চাঁদা', 'দান']} values={[+s.total_contributions, +s.total_donations]} colors={['#0e5a43', '#e8b44a']} /></div>
      </div>
      <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}><b>চাঁদা বকেয়া</b><Link className="small" href="/admin/members?due=1">সব দেখুন</Link></div>
          <div className="scroll"><table className="tbl"><thead><tr><th>সদস্য</th><th>বকেয়া</th><th>অবস্থা</th></tr></thead><tbody>
            {(dues.data ?? []).length === 0 && <Empty cols={3} text="কারো চাঁদা বকেয়া নেই" />}
            {(dues.data ?? []).map((d) => (
              <tr key={d.id}><td><Link href={`/admin/members/${d.id}`}><b>{d.name}</b></Link><div className="muted small">{bn(d.phone)}</div></td>
                <td><span className={`badge ${d.overdue_months >= 2 ? 'b-bad' : 'b-warn'}`}>{bn(d.overdue_months)} মাস</span> {tk(d.overdue_months * d.monthly_amount)}</td>
                <td><Badge map={STATUS} k={d.status} /></td></tr>
            ))}
          </tbody></table></div>
        </div>
        <div className="card">
          <b>মেয়াদোত্তীর্ণ ঋণ</b>
          <div className="scroll"><table className="tbl"><thead><tr><th>সদস্য</th><th>বাকি</th><th>শেষ তারিখ</th></tr></thead><tbody>
            {loanRows.filter((l) => l.st === 'overdue').length === 0 && <Empty cols={3} text="কোনো মেয়াদোত্তীর্ণ ঋণ নেই" />}
            {loanRows.filter((l) => l.st === 'overdue').map((l) => (
              <tr key={l.id}><td><Link href={`/admin/loans/${l.id}`}><b>{l.name}</b></Link></td><td>{tk(l.bal)}</td><td>{fd(l.due_on)}</td></tr>
            ))}
          </tbody></table></div>
          <b style={{ display: 'block', marginTop: 18 }}>সাম্প্রতিক কার্যক্রম</b>
          {(logs.data ?? []).map((x, i) => <div key={i} className="check small">{x.action}<span className="muted" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>{fd(x.created_at)}</span></div>)}
        </div>
      </div>
    </>
  );
}
