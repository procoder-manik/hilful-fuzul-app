import Link from 'next/link';
import type { Metadata } from 'next';
import { ActionForm, ConfirmButton, Submit } from '../../_components/ActionForm';
import { FilterBar, Summary } from '../../_components/FilterBar';
import { createDonation, deleteDonation } from '../../actions/donations';
import { MONEY, requirePage } from '@/lib/guard';
import { DATASETS } from '@/lib/datasets';
import { parseRange, rangeQS } from '@/lib/range';
import { bn, fd, tk } from '@/lib/format';
import { todayBD } from '@/lib/dates';
import { Empty, PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'দান' };
const PURPOSES = ['সাধারণ তহবিল', 'করজে হাসানা', 'শীতবস্ত্র', 'শিক্ষাবৃত্তি', 'খেলাধুলা', 'পাঠাগার', 'স্বাস্থ্যসেবা'];
const SHOW = 300;

export default async function Donations({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { supabase } = await requirePage(MONEY);
  const range = parseRange(searchParams, '30');
  const extra = { purpose: searchParams.purpose };
  const rows = await DATASETS.donations.load(supabase, range, extra) as { id: string; receipt_no: string; donated_on: string; donor_name: string; donor_title: string | null; phone: string | null; amount: number; purpose: string; method: string | null; anonymous: boolean }[];
  const total = rows.reduce((a, d) => a + d.amount, 0);
  const donors = new Set(rows.map((d) => (d.phone || d.donor_name).trim())).size;
  const top = rows.reduce((m, d) => (d.amount > m ? d.amount : m), 0);
  // দাতাভিত্তিক মোট (একই মোবাইল বা নাম এক দাতা)
  const by = new Map<string, { name: string; title: string | null; amount: number; n: number }>();
  for (const d of rows) { const k = (d.phone || d.donor_name).trim(); const v = by.get(k) ?? { name: d.donor_name, title: d.donor_title, amount: 0, n: 0 }; v.amount += d.amount; v.n++; by.set(k, v); }
  const ranking = [...by.values()].sort((a, b) => b.amount - a.amount).slice(0, 8);
  return (
    <>
      <PageHead title="দান" sub="কে কত দান করলেন, কোন খাতে। সময়সীমা ও খাত বেছে দেখুন, Excel বা CSV তে নামিয়ে রাখুন।" />
      <FilterBar base="/admin/donations" range={range} extra={extra} exportKind="donations" search="দাতার নাম, মোবাইল, পদবী বা রসিদ" />
      <Summary items={[['মোট দান', tk(total)], ['দানের সংখ্যা', bn(rows.length)], ['কতজন দাতা', `${bn(donors)} জন`], ['সবচেয়ে বড় দান', tk(top)]]} />
      <div className="seg wrapable" style={{ marginBottom: 12 }}>
        <Link href={`/admin/donations?${rangeQS(range)}`} className={!searchParams.purpose ? 'on' : ''}>সব খাত</Link>
        {PURPOSES.map((p) => <Link key={p} href={`/admin/donations?${rangeQS(range, { purpose: p })}`} className={searchParams.purpose === p ? 'on' : ''}>{p}</Link>)}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 340px', alignItems: 'start' }}>
        <div>
          <div className="card"><div className="scroll"><table className="tbl">
            <thead><tr><th>তারিখ</th><th>দাতা</th><th>খাত</th><th>পরিমাণ</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && <Empty cols={5} text="এই সময়ে কোনো দান নেই" />}
              {rows.slice(0, SHOW).map((d) => (
                <tr key={d.id}>
                  <td>{fd(d.donated_on)}<div className="muted small">{d.receipt_no}</div></td>
                  <td><b>{d.donor_name}</b>{d.donor_title && <div className="muted small">{d.donor_title}</div>}{d.anonymous && <div className="muted small">ওয়েবসাইটে নাম দেখাবে না</div>}</td>
                  <td>{d.purpose}<div className="muted small">{d.method}</div></td><td><b>{tk(d.amount)}</b></td>
                  <td><div className="acts"><Link className="btn sm" href={`/admin/print/donation/${d.id}`}>রসিদ</Link>
                    <ConfirmButton action={deleteDonation.bind(null, d.id)} className="btn sm danger" label="মুছুন" confirm="এই দানের এন্ট্রি মুছবেন?" /></div></td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {rows.length > SHOW && <p className="muted small">প্রথম {bn(SHOW)}টি দেখানো হলো, মোট {bn(rows.length)}টি। সব দেখতে Excel এ নামান।</p>}</div>
          {ranking.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}><b>এই সময়ে সবচেয়ে বেশি দান করেছেন</b>
              {ranking.map((r, i) => <div key={i} className="check" style={{ justifyContent: 'space-between' }}><span><b>{bn(i + 1)}. {r.name}</b>{r.title && <span className="muted small"> ({r.title})</span>} <span className="muted small">{bn(r.n)} বার</span></span><b>{tk(r.amount)}</b></div>)}
            </div>
          )}
        </div>
        <ActionForm action={createDonation} className="card">
          <b>দান গ্রহণ</b>
          <label className="f" style={{ marginTop: 10 }}><span>দাতার নাম *</span><input name="donor_name" required /></label>
          <label className="f"><span>পদবী / পরিচয় (যেমন: শিক্ষক, প্রবাসী, ব্যবসায়ী)</span><input name="donor_title" maxLength={80} /></label>
          <label className="f"><span>মোবাইল</span><input name="phone" inputMode="tel" /></label>
          <label className="f"><span>সদস্য নম্বর (দাতা সদস্য হলে, যেমন HF-101)</span><input name="member_no" autoCapitalize="characters" /></label>
          <label className="f"><span>পরিমাণ (৳) *</span><input name="amount" type="number" min={1} required /></label>
          <label className="f"><span>খাত</span><select name="purpose">{PURPOSES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label className="f"><span>মাধ্যম</span><select name="method"><option>নগদ (হাতে)</option><option>বিকাশ</option><option>নগদ</option><option>রকেট</option><option>ব্যাংক</option></select></label>
          <label className="f"><span>তারিখ</span><input name="donated_on" type="date" defaultValue={todayBD()} max={todayBD()} /></label>
          <label className="chk"><input type="checkbox" name="anonymous" /> <span>ওয়েবসাইটে নাম প্রকাশ করা হবে না</span></label>
          <Submit>সংরক্ষণ ও রসিদ</Submit>
        </ActionForm>
      </div>
    </>
  );
}
