import { PrintBar } from '../../_components/PrintButton';
import { DocHead, Sigs } from '../DocHead';
import { requirePage, MONEY } from '@/lib/guard';
import { getSettings } from '@/lib/settings';
import { bn, fd, tk, ymLabel } from '@/lib/format';

const TYPE = { registration: 'ভর্তি ফি', reactivation: 'পুনঃসক্রিয়করণ ফি' } as Record<string, string>;

export default async function Receipt({ searchParams }: { searchParams: { ids?: string; auto?: string } }) {
  const { supabase } = await requirePage(MONEY);
  const ids = (searchParams.ids ?? '').split(',').filter((x) => /^[0-9a-f-]{36}$/.test(x)).slice(0, 24);
  const [s, { data }] = await Promise.all([getSettings(), supabase.from('payments').select('*, members(id, name, member_no, phone)').in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']).order('for_month')]);
  const rows = data ?? [];
  if (!rows.length) return <div className="notice">রসিদ পাওয়া যায়নি।</div>;
  const m = rows[0].members as { id: string; name: string; member_no: string; phone: string };
  const total = rows.reduce((a, p) => a + Number(p.amount), 0);
  const copy = (tag: string) => (
    <div className="copy" key={tag}>
      <span className="tag">{tag}</span>
      <DocHead s={s} title="চাঁদা জমার রসিদ" no={rows[0].receipt_no} />
      <table><tbody>
        <tr><td width="32%">সদস্য</td><td><b>{m.name}</b> ({m.member_no}), {bn(m.phone)}</td></tr>
        <tr><td>জমার তারিখ</td><td>{fd(rows[0].paid_on)}, {rows[0].method}</td></tr>
      </tbody></table>
      <table><thead><tr><th>বিবরণ</th><th>রসিদ নং</th><th style={{ textAlign: 'right' }}>পরিমাণ</th></tr></thead><tbody>
        {rows.map((p) => <tr key={p.id}><td>{p.type === 'monthly' ? `${ymLabel(p.for_month)} মাসের চাঁদা` : TYPE[p.type]}</td><td>{p.receipt_no}</td><td style={{ textAlign: 'right' }}>{tk(p.amount)}</td></tr>)}
        <tr><td colSpan={2}><b>মোট</b></td><td style={{ textAlign: 'right' }}><b>{tk(total)}</b></td></tr>
      </tbody></table>
      <p style={{ margin: '6px 0 0' }}>জাযাকাল্লাহু খাইরান। আপনার অবদান সমাজের কল্যাণে ব্যয় হবে।</p>
      <Sigs items={[{ label: 'প্রদানকারী' }, { label: 'গ্রহণকারী (কোষাধ্যক্ষ)' }]} />
    </div>
  );
  return (
    <>
      <PrintBar back={`/admin/members/${m.id}`} auto={!!searchParams.auto} />
      <div className="doc a5">{copy('সদস্য কপি')}<div className="cut">✂ এখান থেকে কাটুন</div>{copy('অফিস কপি')}</div>
    </>
  );
}
