import Link from 'next/link';
import type { Metadata } from 'next';
import { ConfirmButton } from '../../_components/ActionForm';
import { FilterBar, Summary } from '../../_components/FilterBar';
import { deletePayment } from '../../actions/payments';
import { MONEY, requirePage } from '@/lib/guard';
import { DATASETS } from '@/lib/datasets';
import { parseRange } from '@/lib/range';
import { bn, fd, tk, ymLabel } from '@/lib/format';
import { Empty, PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'চাঁদা জমা' };
const SHOW = 300;

export default async function Payments({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { supabase } = await requirePage(MONEY);
  const range = parseRange(searchParams, '30');
  const extra = { type: searchParams.type };
  const rows = await DATASETS.payments.load(supabase, range, extra) as { id: string; receipt_no: string; paid_on: string; type: string; type_bn: string; for_month: string; amount: number; method: string | null; note: string | null; member_id: string; name: string; member_no: string }[];
  const total = rows.reduce((a, p) => a + p.amount, 0);
  const people = new Set(rows.map((p) => p.member_id)).size;
  const typeLink = (t: string) => `/admin/payments?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v) as [string, string][]), type: t }).toString().replace(/&?type=$/, '')}`;
  return (
    <>
      <PageHead title="চাঁদা জমা" sub="সদস্যদের মাসিক চাঁদা, ভর্তি ফি ও পুনঃসক্রিয়করণ ফি। সময়সীমা বেছে দেখুন, Excel বা CSV তে নামিয়ে রাখুন।">
        <Link className="btn pri" href="/admin/payments/new">চাঁদা জমা নিন (Take payment)</Link>
      </PageHead>
      <FilterBar base="/admin/payments" range={range} extra={extra} exportKind="payments" search="নাম, মোবাইল, সদস্য বা রসিদ নম্বর" />
      <Summary items={[['মোট জমা', tk(total)], ['জমার সংখ্যা', bn(rows.length)], ['কতজন সদস্য', `${bn(people)} জন`], ['গড় জমা', tk(rows.length ? total / rows.length : 0)]]} />
      <div className="seg wrapable" style={{ marginBottom: 12 }}>
        {[['', 'সব ধরন'], ['monthly', 'মাসিক চাঁদা'], ['registration', 'ভর্তি ফি'], ['reactivation', 'পুনঃসক্রিয়করণ']].map(([k, n]) => <Link key={k} href={typeLink(k)} className={(searchParams.type ?? '') === k ? 'on' : ''}>{n}</Link>)}
      </div>
      <div className="card"><div className="scroll"><table className="tbl">
        <thead><tr><th>তারিখ<small className="en-hint">(Date)</small></th><th>সদস্য<small className="en-hint">(Member)</small></th><th>বিবরণ<small className="en-hint">(Details)</small></th><th>মাধ্যম<small className="en-hint">(Method)</small></th><th>পরিমাণ<small className="en-hint">(Amount)</small></th><th></th></tr></thead>
        <tbody>
          {rows.length === 0 && <Empty cols={6} text="এই সময়ে কোনো জমা নেই" />}
          {rows.slice(0, SHOW).map((p) => (
            <tr key={p.id}>
              <td>{fd(p.paid_on)}<div className="muted small">{p.receipt_no}</div></td>
              <td><Link href={`/admin/members/${p.member_id}`}><b>{p.name}</b></Link><div className="muted small">{p.member_no}</div></td>
              <td>{p.type === 'monthly' ? `${ymLabel(p.for_month)} এর চাঁদা` : p.type_bn}{p.note && <div className="muted small">{p.note}</div>}</td>
              <td>{p.method}</td><td><b>{tk(p.amount)}</b></td>
              <td><div className="acts"><Link className="btn sm" href={`/admin/print/receipt?ids=${p.id}`}>রসিদ</Link>
                <ConfirmButton action={deletePayment.bind(null, p.id)} className="btn sm danger" label="মুছুন" confirm="এই জমার এন্ট্রি মুছে ফেলবেন? রসিদ বাতিল হয়ে যাবে।" /></div></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {rows.length > SHOW && <p className="muted small">প্রথম {bn(SHOW)}টি দেখানো হলো, মোট {bn(rows.length)}টি। সবগুলো দেখতে Excel এ নামান বা সময়সীমা ছোট করুন।</p>}</div>
    </>
  );
}
