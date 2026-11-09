import Link from 'next/link';
import type { Metadata } from 'next';
import { FilterBar, Summary } from '../../_components/FilterBar';
import { MONEY, requirePage } from '@/lib/guard';
import { DATASETS } from '@/lib/datasets';
import { parseRange, rangeQS } from '@/lib/range';
import { bn, fd, tk } from '@/lib/format';
import { Badge, Empty, LOAN_ST, PageHead } from '@/lib/ui';
import type { PublicStats } from '@/lib/types';

export const metadata: Metadata = { title: 'করজে হাসানা' };

export default async function Loans({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { supabase } = await requirePage(MONEY);
  const range = parseRange(searchParams, 'all');
  const extra = { st: searchParams.st };
  const [rows, { data: st }] = await Promise.all([
    DATASETS.loans.load(supabase, range, extra) as Promise<{ id: string; slip_no: string; name: string; member_no: string; member_id: string; guarantor_name: string; amount: number; mode: string; issued_on: string; due_on: string; repaid: number; left: number; st: string }[]>,
    supabase.from('v_public_stats').select('*').single(),
  ]);
  const s = st as PublicStats;
  const sum = (k: 'amount' | 'repaid' | 'left') => rows.reduce((a, l) => a + l[k], 0);
  return (
    <>
      <PageHead title="করজে হাসানা" sub={`সব মিলিয়ে ${tk(s.total_loaned)} বিতরণ, ${tk(s.total_loaned - s.total_repaid)} বকেয়া, তহবিলে এখন ${tk(s.total_fund - s.total_loaned + s.total_repaid)}`}>
        <Link className="btn pri" href="/admin/loans/new">নতুন ঋণ (New loan)</Link>
      </PageHead>
      <FilterBar base="/admin/loans" range={range} extra={extra} exportKind="loans" search="নাম, মোবাইল, স্লিপ বা জামিনদার" />
      <Summary items={[['এই সময়ে ঋণ', `${bn(rows.length)}টি`, `${bn(new Set(rows.map((l) => l.member_id)).size)} জন নিয়েছেন`], ['মোট দেওয়া', tk(sum('amount'))], ['ফেরত এসেছে', tk(sum('repaid'))], ['বাকি', tk(sum('left'))]]} />
      <div className="seg wrapable" style={{ marginBottom: 12 }}>
        {[['', 'সব'], ['running', 'চলমান'], ['overdue', 'মেয়াদোত্তীর্ণ'], ['paid', 'পরিশোধিত']].map(([k, t]) => (
          <Link key={k} className={(searchParams.st ?? '') === k ? 'on' : ''} href={`/admin/loans?${rangeQS(range, { st: k })}`}>{t}</Link>
        ))}
        <a className="btn sm" style={{ marginLeft: 8 }} href={`/admin/export/repayments?${rangeQS(range, { format: 'xlsx' })}`} download>⬇ ঋণ ফেরতের তালিকা (Repayments list)</a>
      </div>
      <div className="card"><div className="scroll"><table className="tbl">
        <thead><tr><th>স্লিপ<small className="en-hint">(Slip)</small></th><th>সদস্য<small className="en-hint">(Member)</small></th><th>পরিমাণ<small className="en-hint">(Amount)</small></th><th>প্রদান / শেষ তারিখ<small className="en-hint">(Issued / due)</small></th><th>ফেরত / বাকি<small className="en-hint">(Repaid / balance)</small></th><th>অবস্থা<small className="en-hint">(Status)</small></th></tr></thead>
        <tbody>
          {rows.length === 0 && <Empty cols={6} text="এই সময়ে কোনো ঋণ নেই" />}
          {rows.map((l) => (
            <tr key={l.id}>
              <td><Link href={`/admin/loans/${l.id}`}><b>{l.slip_no}</b></Link></td>
              <td><Link href={`/admin/members/${l.member_id}`}><b>{l.name}</b></Link><div className="muted small">{l.member_no}, জামিনদার: {l.guarantor_name}</div></td>
              <td>{tk(l.amount)}<div className="muted small">{l.mode === 'installment' ? 'কিস্তিতে' : 'একবারে'}</div></td>
              <td>{fd(l.issued_on)}<div className="muted small">শেষ: {fd(l.due_on)}</div></td>
              <td>{tk(l.repaid)}<div className="muted small">বাকি {tk(l.left)}</div></td>
              <td><Badge map={LOAN_ST} k={l.st} /></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </>
  );
}
