import { notFound } from 'next/navigation';
import { PrintBar } from '../../../_components/PrintButton';
import { DocHead, Sigs } from '../../DocHead';
import { requirePage, MONEY } from '@/lib/guard';
import { getSettings } from '@/lib/settings';
import { bn, fd, tk } from '@/lib/format';

export default async function DonationReceipt({ params, searchParams }: { params: { id: string }; searchParams: { auto?: string } }) {
  const { supabase } = await requirePage(MONEY);
  const [s, { data: d }] = await Promise.all([getSettings(), supabase.from('donations').select('*').eq('id', params.id).single()]);
  if (!d) notFound();
  const copy = (tag: string) => (
    <div className="copy" key={tag}>
      <span className="tag">{tag}</span>
      <DocHead s={s} title="দান গ্রহণের রসিদ" no={d.receipt_no} />
      <table><tbody>
        <tr><td width="32%">দাতা</td><td><b>{d.donor_name}</b>{d.phone ? `, ${bn(d.phone)}` : ''}</td></tr>
        <tr><td>খাত</td><td>{d.purpose}</td></tr>
        <tr><td>তারিখ ও মাধ্যম</td><td>{fd(d.donated_on)}, {d.method}</td></tr>
        <tr><td>পরিমাণ</td><td><b style={{ fontSize: 15 }}>{tk(d.amount)}</b></td></tr>
        <tr><td>কথায়</td><td><span className="line" /></td></tr>
      </tbody></table>
      <p style={{ margin: '6px 0 0' }}>আল্লাহ আপনার দান কবুল করুন। এই অর্থ নির্ধারিত খাতে ব্যয় করা হবে।</p>
      <Sigs items={[{ label: 'দাতা' }, { label: 'গ্রহণকারী (কোষাধ্যক্ষ)' }]} />
    </div>
  );
  return (
    <>
      <PrintBar back="/admin/donations" auto={!!searchParams.auto} />
      <div className="doc a5">{copy('দাতার কপি')}<div className="cut">✂ এখান থেকে কাটুন</div>{copy('অফিস কপি')}</div>
    </>
  );
}
