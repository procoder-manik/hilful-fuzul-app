import type { Metadata } from 'next';
import Link from 'next/link';
import { FilterBar } from '../../_components/FilterBar';
import { MONEY, requirePage } from '@/lib/guard';
import { DATASETS, fetchAll } from '@/lib/datasets';
import { parseRange, rangeQS } from '@/lib/range';
import { bn, tk } from '@/lib/format';
import { PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'রিপোর্ট' };
type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default async function Reports({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { supabase } = await requirePage(MONEY);
  const range = { ...parseRange(searchParams, '30'), q: '' };
  const safe = async (p: Promise<Any[]>) => { try { return await p; } catch { return []; } };
  const [members, pays, dons, loans, reps, svc, lend, apps, frozen] = await Promise.all([
    safe(DATASETS.members.load(supabase, range, {})), safe(DATASETS.payments.load(supabase, range, {})), safe(DATASETS.donations.load(supabase, range, {})),
    safe(DATASETS.loans.load(supabase, range, {})), safe(DATASETS.repayments.load(supabase, range, {})), safe(DATASETS.services.load(supabase, range, {})),
    safe(DATASETS.lendings.load(supabase, range, {})),
    safe(fetchAll((a, b) => { let q = supabase.from('applications').select('id, status, created_at'); if (range.from) q = q.gte('created_at', range.from); return q.lte('created_at', `${range.to}T23:59:59`).range(a, b); })),
    safe(fetchAll((a, b) => { let q = supabase.from('members').select('id, frozen_at').not('frozen_at', 'is', null); if (range.from) q = q.gte('frozen_at', range.from); return q.lte('frozen_at', range.to).range(a, b); })),
  ]);
  const sum = (rows: Any[], k = 'amount') => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0);
  const uniq = (rows: Any[], f: (r: Any) => string) => new Set(rows.map(f)).size;
  const svcBy = new Map<string, { n: number; people: Set<string> }>();
  svc.forEach((r) => { const v = svcBy.get(r.service) ?? { n: 0, people: new Set() }; v.n += Number(r.quantity); v.people.add((r.phone || r.person_name).trim()); svcBy.set(r.service, v); });
  const qs = rangeQS(range);
  const Card = ({ t, v, sub, href }: { t: string; v: string; sub?: string; href?: string }) => <Link href={href ?? '#'} className="kpi" style={{ textDecoration: 'none', color: 'inherit' }}><span>{t}</span><b>{v}</b>{sub && <span>{sub}</span>}</Link>;
  return (
    <>
      <PageHead title="রিপোর্ট" sub="বেছে নেওয়া সময়ে কী কী হলো: কতজন দান করলেন, কতজন ঋণ নিলেন, কতজন সেবা নিলেন। যেকোনো কার্ডে চাপলে বিস্তারিত তালিকা খুলবে।">
        <a className="btn" href="/admin/export/backup?format=xlsx" download>⬇ পুরো ব্যাকআপ (Excel)</a>
      </PageHead>
      <FilterBar base="/admin/reports" range={range} search={false} />
      <h2 className="h2">টাকার হিসাব</h2>
      <div className="grid g4">
        <Card t="চাঁদা জমা" v={tk(sum(pays))} sub={`${bn(pays.length)}টি জমা, ${bn(uniq(pays, (r) => r.member_id))} জন সদস্য`} href={`/admin/payments?${qs}`} />
        <Card t="দান" v={tk(sum(dons))} sub={`${bn(dons.length)}টি দান, ${bn(uniq(dons, (r) => (r.phone || r.donor_name).trim()))} জন দাতা`} href={`/admin/donations?${qs}`} />
        <Card t="ঋণ দেওয়া হয়েছে" v={tk(sum(loans))} sub={`${bn(loans.length)}টি ঋণ, ${bn(uniq(loans, (r) => r.member_id))} জন নিয়েছেন`} href={`/admin/loans?${qs}`} />
        <Card t="ঋণ ফেরত এসেছে" v={tk(sum(reps))} sub={`${bn(reps.length)}টি কিস্তি/ফেরত`} href={`/admin/loans?${qs}`} />
      </div>
      <div className="grid g3" style={{ marginTop: 12 }}>
        <div className="kpi"><span>মোট আয় (চাঁদা + দান)</span><b>{tk(sum(pays) + sum(dons))}</b></div>
        <div className="kpi"><span>নিট নগদ প্রবাহ (আয় + ফেরত − ঋণ)</span><b>{tk(sum(pays) + sum(dons) + sum(reps) - sum(loans))}</b></div>
        <div className="kpi"><span>ভর্তি ফি</span><b>{tk(sum(pays.filter((p) => p.type === 'registration')))}</b><span>{bn(pays.filter((p) => p.type === 'registration').length)} জন</span></div>
      </div>
      <h2 className="h2">মানুষ</h2>
      <div className="grid g4">
        <Card t="নতুন সদস্য" v={`${bn(members.length)} জন`} href={`/admin/members?${qs}`} />
        <Card t="নতুন নিবন্ধন (আবেদন)" v={`${bn(apps.length)}টি`} sub={`${bn(apps.filter((a) => a.status === 'pending').length)}টি অপেক্ষমাণ`} href="/admin/applications" />
        <Card t="স্থগিত হয়েছেন" v={`${bn(frozen.length)} জন`} href="/admin/members/contact?group=frozen" />
        <Card t="বই নিয়েছেন" v={`${bn(lend.length)} বার`} sub={`${bn(uniq(lend, (r) => (r.borrower_phone || r.borrower_name).trim()))} জন পাঠক`} href="/admin/library/lendings" />
      </div>
      <h2 className="h2">সেবা: কতজন কী সেবা নিলেন</h2>
      <div className="card">
        {svcBy.size === 0 ? <p className="muted" style={{ margin: 0 }}>এই সময়ে কোনো সেবার রেকর্ড নেই। <Link href="/admin/services">সেবার রেকর্ড</Link> পাতায় যোগ করুন।</p> : (
          <div className="scroll"><table className="tbl"><thead><tr><th>সেবা</th><th>কতজন মানুষ</th><th>মোট সংখ্যা</th></tr></thead><tbody>
            {[...svcBy.entries()].sort((a, b) => b[1].n - a[1].n).map(([s, v]) => <tr key={s}><td><Link href={`/admin/services?${rangeQS(range, { service: s })}`}>{s}</Link></td><td>{bn(v.people.size)} জন</td><td>{bn(v.n)}</td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </>
  );
}
