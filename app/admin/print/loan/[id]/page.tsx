import { notFound } from 'next/navigation';
import { decRow } from '@/lib/crypto';
import { PrintBar } from '../../../_components/PrintButton';
import { DocHead, Sigs } from '../../DocHead';
import { requirePage, MONEY } from '@/lib/guard';
import { getSettings } from '@/lib/settings';
import { signedUrl } from '@/lib/storage';
import { addMonths } from '@/lib/dates';
import { bn, fd, tk } from '@/lib/format';

export default async function LoanSlip({ params, searchParams }: { params: { id: string }; searchParams: { auto?: string } }) {
  const { supabase } = await requirePage(MONEY);
  const [s, { data: l }] = await Promise.all([getSettings(), supabase.from('loans').select('*, members(name, member_no, phone, father_name, address)').eq('id', params.id).single()]);
  if (!l) notFound();
  const m = decRow(l.members) as { name: string; member_no: string; phone: string; father_name: string | null; address: string | null };
  const sig = await signedUrl(supabase, l.borrower_signature_url);
  const amt = Number(l.amount);
  const per = Math.round(amt / l.term_months);
  const day = l.issued_on.slice(8, 10);
  const schedule = l.mode === 'installment'
    ? Array.from({ length: l.term_months }, (_, i) => ({ n: i + 1, date: addMonths(l.issued_on, i + 1).slice(0, 8) + day, amount: i === l.term_months - 1 ? amt - per * (l.term_months - 1) : per }))
    : [];
  const copy = (tag: string) => (
    <div className="copy" key={tag}>
      <span className="tag">{tag}</span>
      <DocHead s={s} title="করজে হাসানা রসিদ" no={l.slip_no} />
      <table><tbody>
        <tr><td width="22%">ঋণগ্রহীতা</td><td><b>{m.name}</b> ({m.member_no})</td><td width="18%">মোবাইল</td><td>{bn(m.phone)}</td></tr>
        <tr><td>পিতার নাম</td><td>{m.father_name}</td><td>ঠিকানা</td><td>{m.address}</td></tr>
        <tr><td>ঋণের পরিমাণ</td><td><b style={{ fontSize: 15 }}>{tk(amt)}</b></td><td>প্রদানের তারিখ</td><td>{fd(l.issued_on)}</td></tr>
        <tr><td>কথায়</td><td colSpan={3}><span className="line" /></td></tr>
        <tr><td>মেয়াদ</td><td>{bn(l.term_months)} মাস ({l.mode === 'installment' ? 'মাসিক কিস্তি' : 'মেয়াদ শেষে একবারে'})</td><td>শেষ তারিখ</td><td><b>{fd(l.due_on)}</b></td></tr>
        <tr><td>জামিনদার</td><td>{l.guarantor_name}</td><td>জামিনদারের মোবাইল</td><td>{bn(l.guarantor_phone ?? '')}</td></tr>
        <tr><td>উদ্দেশ্য</td><td colSpan={3}>{l.purpose}</td></tr>
      </tbody></table>
      {schedule.length > 0 && (
        <table><thead><tr><th>কিস্তি</th><th>তারিখ</th><th>পরিমাণ</th><th>আদায়ের তারিখ</th><th>আদায়কারীর সই</th></tr></thead><tbody>
          {schedule.map((x) => <tr key={x.n}><td>{bn(x.n)}</td><td>{fd(x.date)}</td><td>{tk(x.amount)}</td><td /><td /></tr>)}
        </tbody></table>
      )}
      <b>শর্তাবলী:</b>
      <ol>{s.loan_terms.map((t) => <li key={t}>{t}</li>)}</ol>
      <p style={{ margin: '4px 0' }}>আমি উপরোক্ত শর্তে সম্পূর্ণ বিনা সুদে {tk(amt)} করজে হাসানা গ্রহণ করলাম এবং নির্ধারিত সময়ে ফেরত দিতে অঙ্গীকার করছি।</p>
      <Sigs items={[{ label: 'ঋণগ্রহীতার স্বাক্ষর', img: sig }, { label: 'জামিনদারের স্বাক্ষর' }, { label: 'কোষাধ্যক্ষ' }, { label: 'সভাপতি / সাধারণ সম্পাদক' }]} />
    </div>
  );
  return (
    <>
      <PrintBar back={`/admin/loans/${l.id}`} auto={!!searchParams.auto} />
      <div className="doc">{copy('সদস্য কপি')}<div className="cut">✂ এখান থেকে কাটুন</div>{copy('অফিস কপি (কার্বন কপি)')}</div>
    </>
  );
}
