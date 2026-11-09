import Link from 'next/link';
import type { Metadata } from 'next';
import { FilterBar, Summary } from '../../_components/FilterBar';
import { requirePage, STAFF } from '@/lib/guard';
import { DATASETS } from '@/lib/datasets';
import { parseRange, rangeQS } from '@/lib/range';
import { bn, fd, initials, tk } from '@/lib/format';
import { Badge, Empty, PageHead, STATUS } from '@/lib/ui';

export const metadata: Metadata = { title: 'সদস্য' };
const SHOW = 300;
type Row = { id: string; member_no: string; name: string; phone: string; photo_url: string | null; join_date: string; monthly_amount: number; total_paid: number; overdue_months: number; status: string; verified: boolean };

export default async function Members({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { supabase, profile } = await requirePage(STAFF);
  const range = parseRange(searchParams, 'all');
  const extra = { status: searchParams.status, due: searchParams.due };
  const [rows, everyone] = await Promise.all([
    DATASETS.members.load(supabase, range, extra) as Promise<Row[]>,
    DATASETS.members.load(supabase, { ...range, r: 'all', from: null, q: '' }, {}) as Promise<Row[]>,
  ]);
  const cnt = (f: (m: Row) => boolean) => bn(everyone.filter(f).length);
  const canEdit = ['admin', 'treasurer'].includes(profile.role);
  const seg = (o: Record<string, string>) => `/admin/members?${rangeQS(range, o)}`;
  return (
    <>
      <PageHead title="সদস্য" sub="টানা বকেয়া হলে সদস্যপদ প্রতিদিন সকালে স্বয়ংক্রিয়ভাবে স্থগিত হয়। তারিখের ফিল্টার যোগদানের তারিখ ধরে।">
        {canEdit && <Link className="btn pri" href="/admin/members/new">নতুন সদস্য (New member)</Link>}
        {canEdit && <Link className="btn" href="/admin/members/contact">স্থগিত ও বকেয়াদের সাথে যোগাযোগ (Contact frozen & overdue)</Link>}
        <Link className="btn" href="/admin/print/member/blank">খালি ফর্ম প্রিন্ট (Print blank form)</Link>
      </PageHead>
      <Summary items={[['মোট সদস্য', cnt(() => true)], ['সক্রিয়', cnt((m) => m.status === 'active')], ['স্থগিত', cnt((m) => m.status === 'frozen')], ['বকেয়া আছে', cnt((m) => m.overdue_months > 0)]]} />
      <FilterBar base="/admin/members" range={range} extra={extra} exportKind={canEdit ? 'members' : undefined} search="নাম, মোবাইল, সদস্য নম্বর বা ইমেইল" />
      <div className="seg wrapable" style={{ marginBottom: 12 }}>
        <Link className={!searchParams.status && !searchParams.due ? 'on' : ''} href={seg({})}>সব (All)</Link>
        <Link className={searchParams.status === 'active' ? 'on' : ''} href={seg({ status: 'active' })}>সক্রিয় (Active)</Link>
        <Link className={searchParams.status === 'frozen' ? 'on' : ''} href={seg({ status: 'frozen' })}>স্থগিত (Frozen)</Link>
        <Link className={searchParams.due ? 'on' : ''} href={seg({ due: '1' })}>বকেয়া আছে (Overdue)</Link>
      </div>
      <div className="card">
        <div className="muted small" style={{ marginBottom: 6 }}>এই ফিল্টারে {bn(rows.length)} জন</div>
        <div className="scroll"><table className="tbl">
          <thead><tr><th>সদস্য<small className="en-hint">(Member)</small></th><th>যোগদান<small className="en-hint">(Joined)</small></th><th>মাসিক<small className="en-hint">(Monthly)</small></th><th>মোট জমা<small className="en-hint">(Total paid)</small></th><th>বকেয়া<small className="en-hint">(Overdue)</small></th><th>অবস্থা<small className="en-hint">(Status)</small></th></tr></thead>
          <tbody>
            {rows.length === 0 && <Empty cols={6} text="কোনো সদস্য পাওয়া যায়নি" />}
            {rows.slice(0, SHOW).map((m) => (
              <tr key={m.id}>
                <td><Link href={`/admin/members/${m.id}`} className="row" style={{ gap: 10, flexWrap: 'nowrap', textDecoration: 'none' }}>
                  <span className="av">{m.photo_url ? <img src={m.photo_url} alt="" /> : initials(m.name)}</span>
                  <span><b>{m.name}</b> {m.verified && <span title="যাচাইকৃত সদস্য" style={{ color: 'var(--ok)' }}>✓</span>}<span className="muted small" style={{ display: 'block' }}>{m.member_no}, {bn(m.phone)}</span></span>
                </Link></td>
                <td>{fd(m.join_date)}</td><td>{tk(m.monthly_amount)}</td><td>{tk(m.total_paid)}</td>
                <td>{m.overdue_months ? <span className="badge b-bad">{bn(m.overdue_months)} মাস</span> : <span className="badge b-ok">নেই</span>}</td>
                <td><Badge map={STATUS} k={m.status} /></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {rows.length > SHOW && <p className="muted small">প্রথম {bn(SHOW)} জন দেখানো হলো। সবাইকে দেখতে খুঁজুন বা Excel এ নামান।</p>}
      </div>
    </>
  );
}
