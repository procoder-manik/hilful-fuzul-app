import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm, ConfirmButton, Submit } from '../../_components/ActionForm';
import { FilterBar, Summary } from '../../_components/FilterBar';
import { addServiceRecords, deleteServiceRecord } from '../../actions/services';
import { requirePage } from '@/lib/guard';
import { DATASETS } from '@/lib/datasets';
import { parseRange, rangeQS } from '@/lib/range';
import { bn, fd } from '@/lib/format';
import { todayBD } from '@/lib/dates';
import { Empty, PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'সেবার রেকর্ড' };
type Rec = { id: string; served_on: string; service: string; person_name: string; phone: string | null; quantity: number; note: string | null };

export default async function Services({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { supabase } = await requirePage(['admin', 'treasurer', 'editor']);
  const range = parseRange(searchParams, '30');
  const extra = { service: searchParams.service };
  let rows: Rec[] = [], missing = false;
  try { rows = await DATASETS.services.load(supabase, range, extra) as Rec[]; } catch { missing = true; }
  const { data: programs } = await supabase.from('programs').select('id, icon, title').order('sort');
  const by = new Map<string, number>();
  rows.forEach((r) => by.set(r.service, (by.get(r.service) ?? 0) + r.quantity));
  const people = new Set(rows.map((r) => (r.phone || r.person_name).trim())).size;
  return (
    <>
      <PageHead title="সেবার রেকর্ড" sub="কে কোন সেবা নিলেন (ডায়াবেটিস পরীক্ষা, প্রেসার মাপা, শীতবস্ত্র, শিক্ষাবৃত্তি ইত্যাদি)। রিপোর্টে কোন সময়ে কতজন উপকৃত হলেন তা এখান থেকে আসে।" />
      {missing && <div className="notice">সেবার রেকর্ড রাখতে আগে Supabase এ <b>006_records_admin.sql</b> চালান।</div>}
      <FilterBar base="/admin/services" range={range} extra={extra} exportKind="services" search="নাম, মোবাইল বা সেবা" />
      <Summary items={[['মোট সেবা দেওয়া হয়েছে', bn(rows.reduce((a, r) => a + r.quantity, 0))], ['কতজন মানুষ', `${bn(people)} জন`], ['কত ধরনের সেবা', bn(by.size)], ['রেকর্ড', bn(rows.length)]]} />
      {by.size > 0 && <div className="seg wrapable" style={{ marginBottom: 12 }}>
        <Link href={`/admin/services?${rangeQS(range)}`} className={!searchParams.service ? 'on' : ''}>সব সেবা</Link>
        {[...by.entries()].sort((a, b) => b[1] - a[1]).map(([s, n]) => <Link key={s} href={`/admin/services?${rangeQS(range, { service: s })}`} className={searchParams.service === s ? 'on' : ''}>{s} ({bn(n)})</Link>)}
      </div>}
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 360px', alignItems: 'start' }}>
        <div className="card"><div className="scroll"><table className="tbl">
          <thead><tr><th>তারিখ<small className="en-hint">(Date)</small></th><th>সেবা<small className="en-hint">(Service)</small></th><th>নাম<small className="en-hint">(Name)</small></th><th>সংখ্যা<small className="en-hint">(Count)</small></th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 && <Empty cols={5} text="এই সময়ে কোনো রেকর্ড নেই" />}
            {rows.slice(0, 400).map((r) => (
              <tr key={r.id}><td>{fd(r.served_on)}</td><td>{r.service}{r.note && <div className="muted small">{r.note}</div>}</td><td><b>{r.person_name}</b>{r.phone && <div className="muted small">{bn(r.phone)}</div>}</td><td>{bn(r.quantity)}</td>
                <td><ConfirmButton action={deleteServiceRecord.bind(null, r.id)} className="btn sm danger" label="মুছুন" confirm="এই রেকর্ড মুছবেন?" /></td></tr>
            ))}
          </tbody>
        </table></div></div>
        <ActionForm action={addServiceRecords} className="card" resetOnSuccess>
          <b>সেবা দেওয়ার রেকর্ড যোগ</b>
          <label className="f" style={{ marginTop: 10 }}><span>সেবা<small className="en-hint">(Service)</small></span><select name="program_id">{(programs ?? []).map((p) => <option key={p.id} value={p.id}>{p.icon} {p.title}</option>)}<option value="">অন্য (নিচে লিখুন)</option></select></label>
          <label className="f"><span>অন্য সেবার নাম (তালিকায় না থাকলে)<small className="en-hint">(Other service name)</small></span><input name="service" /></label>
          <label className="f"><span>যারা সেবা নিলেন (প্রতি লাইনে একজন: নাম, মোবাইল)<small className="en-hint">(People served)</small></span><textarea name="people" rows={6} placeholder={'মোঃ রফিক, 01711000000\nআয়েশা খাতুন'} required /></label>
          <div className="grid g2" style={{ gap: '0 8px' }}>
            <label className="f"><span>তারিখ<small className="en-hint">(Date)</small></span><input name="served_on" type="date" defaultValue={todayBD()} max={todayBD()} /></label>
            <label className="f"><span>প্রতিজন কতটি<small className="en-hint">(Quantity per person)</small></span><input name="quantity" type="number" min={1} defaultValue={1} /></label>
          </div>
          <label className="f"><span>নোট (যেমন: সুগার ৮.২, কম্বল ১টি)<small className="en-hint">(Note)</small></span><input name="note" /></label>
          <Submit>রেকর্ড যোগ করুন (Add record)</Submit>
        </ActionForm>
      </div>
    </>
  );
}
