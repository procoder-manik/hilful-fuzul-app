import Link from 'next/link';
import type { Metadata } from 'next';
import { CollectionChart, DonutChart, MembersChart } from '@/components/Charts';
import { requirePage, ROLE_BN, STAFF } from '@/lib/guard';
import { ROLE_EN } from '@/lib/adminlabels';
import { bn, fd, MONTHS_SHORT, tk } from '@/lib/format';
import { todayBD } from '@/lib/dates';
import { Badge, Empty, loanStatus, PageHead, STATUS } from '@/lib/ui';
import type { PublicStats, Role } from '@/lib/types';

export const metadata: Metadata = { title: 'ড্যাশবোর্ড' };

export default async function Dashboard({ searchParams }: { searchParams: { denied?: string } }) {
  const { supabase, profile } = await requirePage(STAFF);
  const role = profile.role as Role;
  const isAdmin = role === 'admin';
  const sees = (r: Role[]) => r.includes(role);
  const today = todayBD();
  const head = (table: string) => supabase.from(table).select('id', { count: 'exact', head: true });
  const [stats, monthly, dues, loans, logs, newMembers, pendingApps, claimedApps, unreadMsgs, unansweredChats, overdueMembers, rAdmin, rTreasurer, rLibrarian, rEditor, rMember, rApplicant] = await Promise.all([
    supabase.from('v_public_stats').select('*').single(),
    supabase.from('v_monthly_summary').select('*').order('month'),
    supabase.from('v_member_dues').select('id, name, phone, status, overdue_months, monthly_amount').gt('overdue_months', 0).order('overdue_months', { ascending: false }).limit(10),
    supabase.from('loans').select('id, amount, due_on, slip_no, members(name), loan_repayments(amount)'),
    supabase.from('activity_log').select('action, created_at').order('created_at', { ascending: false }).limit(8),
    supabase.from('members').select('id', { count: 'exact', head: true }).gte('join_date', today.slice(0, 8) + '01'),
    head('applications').eq('status', 'pending'),
    head('applications').eq('status', 'pending').not('pay_claimed_at', 'is', null),     // SQL 004 এর আগে ত্রুটি দিলেও ঠিক আছে
    head('contact_messages').eq('is_read', false),
    head('chat_logs').eq('unanswered', true),
    supabase.from('v_member_dues').select('id', { count: 'exact', head: true }).gt('overdue_months', 0),
    head('profiles').eq('role', 'admin'),
    head('profiles').eq('role', 'treasurer'),
    head('profiles').eq('role', 'librarian'),
    head('profiles').eq('role', 'editor'),
    head('profiles').eq('role', 'member').not('member_id', 'is', null),
    head('profiles').eq('role', 'member').is('member_id', null),
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
        <Link className="btn pri" href="/admin/payments/new">চাঁদা জমা নিন (Take payment)</Link>
        <Link className="btn" href="/admin/loans/new">নতুন ঋণ (New loan)</Link>
      </PageHead>
      <h2 className="h2 dash-h">এখন মনোযোগ দরকার<small className="en-hint">(Needs attention)</small></h2>
      <div className="att-grid">
        {sees(['admin', 'treasurer']) && <Att href="/admin/applications" n={pendingApps.count ?? 0} tone="warn" bn="নতুন সদস্যপদের আবেদন" en="New applications" sub={(claimedApps.error ? 0 : claimedApps.count ?? 0) > 0 ? `${bn(claimedApps.count ?? 0)} জন ফি পাঠিয়েছেন, মিলিয়ে দেখুন (paid, please verify)` : 'অপেক্ষমাণ (pending)'} />}
        {sees(['admin', 'treasurer']) && <Att href="/admin/members/contact" n={overdueMembers.count ?? 0} tone="bad" bn="চাঁদা বকেয়া সদস্য" en="Members with overdue dues" sub="স্মরণ করিয়ে দিন (send a reminder)" />}
        {sees(['admin', 'treasurer']) && <Att href="/admin/loans" n={cnt.overdue} tone="bad" bn="মেয়াদোত্তীর্ণ ঋণ" en="Overdue loans" sub="ফেরতের তারিখ পেরিয়ে গেছে (past due date)" />}
        {sees(['admin', 'treasurer', 'editor']) && <Att href="/admin/messages" n={unreadMsgs.count ?? 0} tone="info" bn="না-পড়া বার্তা" en="Unread messages" sub="যোগাযোগ ফর্ম থেকে (from the contact form)" />}
        {sees(['admin', 'editor']) && <Att href="/admin/chats" n={unansweredChats.count ?? 0} tone="bad" bn="বট উত্তর দিতে পারেনি" en="Unanswered chats" sub="উত্তর শিখিয়ে দিন (teach the bot)" />}
      </div>

      {isAdmin && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>লগইন অ্যাকাউন্ট ও ভূমিকা<small className="en-hint">(Login accounts by role)</small></b>
            <Link className="small" href="/admin/users">কমিটির অ্যাক্সেস দেখুন (Manage staff)</Link>
          </div>
          <div className="roles">
            {([['admin', rAdmin.count], ['treasurer', rTreasurer.count], ['librarian', rLibrarian.count], ['editor', rEditor.count]] as [Role, number | null][]).map(([r, c]) => (
              <div key={r} className={`role-c r-${r}`}><b>{bn(c ?? 0)}</b><span>{ROLE_BN[r]}</span><small>({ROLE_EN[r]})</small></div>
            ))}
            <div className="role-c r-member"><b>{bn(rMember.count ?? 0)}</b><span>সদস্য (লগইনসহ)</span><small>(Members with login)</small></div>
            <div className="role-c r-applicant"><b>{bn(rApplicant.count ?? 0)}</b><span>আবেদনকারী (যাচাই বাকি)</span><small>(Applicants, not verified)</small></div>
          </div>
          <p className="muted small" style={{ margin: '10px 0 0' }}>
            কমিটির মোট {bn((rAdmin.count ?? 0) + (rTreasurer.count ?? 0) + (rLibrarian.count ?? 0) + (rEditor.count ?? 0))} জন (staff), সদস্য ও আবেদনকারী মিলিয়ে মোট {bn((rAdmin.count ?? 0) + (rTreasurer.count ?? 0) + (rLibrarian.count ?? 0) + (rEditor.count ?? 0) + (rMember.count ?? 0) + (rApplicant.count ?? 0))}টি লগইন অ্যাকাউন্ট।
          </p>
        </div>
      )}

      <h2 className="h2 dash-h">হিসাবের সারসংক্ষেপ<small className="en-hint">(Money & members at a glance)</small></h2>
      <div className="grid g4">
        <div className="kpi"><span>মোট তহবিল<small className="en-hint">(Total fund)</small></span><b>{tk(s.total_fund)}</b></div>
        <div className="kpi"><span>বর্তমানে হাতে আছে<small className="en-hint">(Cash in hand)</small></span><b>{tk(available)}</b></div>
        <div className="kpi"><span>এই মাসে সংগ্রহ<small className="en-hint">(Collected this month)</small></span><b>{tk(s.month_collected)}</b></div>
        <div className="kpi"><span>এই মাসে ঋণ বিতরণ<small className="en-hint">(Loans given this month)</small></span><b>{tk(s.month_loaned)}</b></div>
        <div className="kpi"><span>মোট / সক্রিয় সদস্য<small className="en-hint">(Total / active members)</small></span><b>{bn(s.members)} / {bn(s.active_members)}</b></div>
        <div className="kpi"><span>এই মাসে নতুন সদস্য<small className="en-hint">(New members this month)</small></span><b>{bn(newMembers.count ?? 0)}</b></div>
        <div className="kpi"><span>বকেয়া ঋণ<small className="en-hint">(Loans outstanding)</small></span><b>{tk(s.total_loaned - s.total_repaid)}</b></div>
        <div className="kpi"><span>মোট দান<small className="en-hint">(Total donations)</small></span><b>{tk(s.total_donations)}</b></div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card"><b>১২ মাস: সংগ্রহ, ঋণ বিতরণ ও ফেরত<small className="en-hint">(12 months: collected, loaned, repaid)</small></b><CollectionChart labels={labels} collected={m.map((x) => +x.collected)} loaned={m.map((x) => +x.loaned)} repaid={m.map((x) => +x.repaid)} /></div>
        <div className="card"><b>সদস্য বৃদ্ধি<small className="en-hint">(Member growth)</small></b><MembersChart labels={labels} members={m.map((x) => x.members)} /></div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card"><b>ঋণের অবস্থা<small className="en-hint">(Loan status)</small></b><DonutChart labels={['চলমান', 'পরিশোধিত', 'মেয়াদোত্তীর্ণ']} values={[cnt.running, cnt.paid, cnt.overdue]} colors={['#1673e6', '#1f9d55', '#e0352b']} /></div>
        <div className="card"><b>তহবিলের উৎস<small className="en-hint">(Fund sources)</small></b><DonutChart isMoney labels={['সদস্য চাঁদা', 'দান']} values={[+s.total_contributions, +s.total_donations]} colors={['#0e5a43', '#e8b44a']} /></div>
      </div>
      <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}><b>চাঁদা বকেয়া<small className="en-hint">(Overdue dues)</small></b><Link className="small" href="/admin/members?due=1">সব দেখুন (View all)</Link></div>
          <div className="scroll"><table className="tbl"><thead><tr><th>সদস্য<small className="en-hint">(Member)</small></th><th>বকেয়া<small className="en-hint">(Overdue)</small></th><th>অবস্থা<small className="en-hint">(Status)</small></th></tr></thead><tbody>
            {(dues.data ?? []).length === 0 && <Empty cols={3} text="কারো চাঁদা বকেয়া নেই" />}
            {(dues.data ?? []).map((d) => (
              <tr key={d.id}><td><Link href={`/admin/members/${d.id}`}><b>{d.name}</b></Link><div className="muted small">{bn(d.phone)}</div></td>
                <td><span className={`badge ${d.overdue_months >= 2 ? 'b-bad' : 'b-warn'}`}>{bn(d.overdue_months)} মাস</span> {tk(d.overdue_months * d.monthly_amount)}</td>
                <td><Badge map={STATUS} k={d.status} /></td></tr>
            ))}
          </tbody></table></div>
        </div>
        <div className="card">
          <b>মেয়াদোত্তীর্ণ ঋণ<small className="en-hint">(Overdue loans)</small></b>
          <div className="scroll"><table className="tbl"><thead><tr><th>সদস্য<small className="en-hint">(Member)</small></th><th>বাকি<small className="en-hint">(Balance)</small></th><th>শেষ তারিখ<small className="en-hint">(Due date)</small></th></tr></thead><tbody>
            {loanRows.filter((l) => l.st === 'overdue').length === 0 && <Empty cols={3} text="কোনো মেয়াদোত্তীর্ণ ঋণ নেই" />}
            {loanRows.filter((l) => l.st === 'overdue').map((l) => (
              <tr key={l.id}><td><Link href={`/admin/loans/${l.id}`}><b>{l.name}</b></Link></td><td>{tk(l.bal)}</td><td>{fd(l.due_on)}</td></tr>
            ))}
          </tbody></table></div>
          <b style={{ display: 'block', marginTop: 18 }}>সাম্প্রতিক কার্যক্রম<small className="en-hint">(Recent activity)</small></b>
          {(logs.data ?? []).map((x, i) => <div key={i} className="check small">{x.action}<span className="muted" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>{fd(x.created_at)}</span></div>)}
        </div>
      </div>
    </>
  );
}

/** "এখন মনোযোগ দরকার" এর একটি ঘর: বড় রঙিন সংখ্যা সবসময় পুরোপুরি দেখা যায় */
function Att({ href, n, tone, bn: b, en, sub }: { href: string; n: number; tone: 'bad' | 'warn' | 'info'; bn: string; en: string; sub: string }) {
  return (
    <Link href={href} className={`att ${n > 0 ? `att-${tone}` : 'att-zero'}`} aria-label={`${b}: ${bn(n)}`}>
      <span className="att-n">{n > 99 ? '৯৯+' : bn(n)}</span>
      <span className="att-t"><b>{b}<small className="en-hint">({en})</small></b><span className="muted small">{n > 0 ? sub : 'কিছু বাকি নেই (all clear)'}</span></span>
    </Link>
  );
}
