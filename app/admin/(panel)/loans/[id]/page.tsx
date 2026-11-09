import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ActionForm, ConfirmButton, Submit } from '../../../_components/ActionForm';
import { addRepayment, deleteLoan, deleteRepayment } from '../../../actions/loans';
import { MONEY, requirePage } from '@/lib/guard';
import { bn, fd, tk } from '@/lib/format';
import { todayBD } from '@/lib/dates';
import { Badge, Empty, LOAN_ST, loanStatus, PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'ঋণের বিস্তারিত' };

export default async function LoanDetail({ params }: { params: { id: string } }) {
  const { supabase, profile } = await requirePage(MONEY);
  const { data: l } = await supabase.from('loans').select('*, members(id, name, member_no, phone), loan_repayments(id, amount, paid_on, receipt_no)').eq('id', params.id).single();
  if (!l) notFound();
  const reps = (l.loan_repayments as { id: string; amount: number; paid_on: string; receipt_no: string }[]).sort((a, b) => (a.paid_on < b.paid_on ? -1 : 1));
  const rep = reps.reduce((a, r) => a + Number(r.amount), 0);
  const bal = Number(l.amount) - rep;
  const m = l.members as { id: string; name: string; member_no: string; phone: string };
  const inst = l.mode === 'installment' ? Math.round(Number(l.amount) / l.term_months) : bal;
  return (
    <>
      <PageHead title={`ঋণ ${l.slip_no}`} sub={<><Link href={`/admin/members/${m.id}`}>{m.name}</Link>, {m.member_no}, {bn(m.phone)}</>}>
        <Link className="btn" href={`/admin/print/loan/${l.id}`}>রসিদ প্রিন্ট</Link>
      </PageHead>
      <div className="grid g4">
        <div className="kpi"><span>ঋণের পরিমাণ</span><b>{tk(l.amount)}</b></div>
        <div className="kpi"><span>ফেরত এসেছে</span><b>{tk(rep)}</b></div>
        <div className="kpi"><span>বাকি</span><b style={{ color: bal > 0 ? 'var(--danger)' : 'var(--ok)' }}>{tk(bal)}</b></div>
        <div className="kpi"><span>অবস্থা</span><b style={{ fontSize: '1rem' }}><Badge map={LOAN_ST} k={loanStatus(Number(l.amount), rep, l.due_on, todayBD())} /></b><span>শেষ তারিখ {fd(l.due_on)}</span></div>
      </div>
      <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <b>বিবরণ</b>
          <table className="tbl"><tbody>
            <tr><td className="muted">প্রদানের তারিখ</td><td>{fd(l.issued_on)}</td></tr>
            <tr><td className="muted">মেয়াদ</td><td>{bn(l.term_months)} মাস, {l.mode === 'installment' ? `মাসিক কিস্তি প্রায় ${tk(inst)}` : 'মেয়াদ শেষে একবারে'}</td></tr>
            <tr><td className="muted">জামিনদার</td><td>{l.guarantor_name} {l.guarantor_phone && `(${bn(l.guarantor_phone)})`}</td></tr>
            <tr><td className="muted">উদ্দেশ্য</td><td>{l.purpose || '-'}</td></tr>
          </tbody></table>
          {profile.role === 'admin' && <div style={{ marginTop: 14 }}><ConfirmButton action={deleteLoan.bind(null, l.id)} className="btn sm danger" label="ঋণের এন্ট্রি মুছুন" confirm="ভুল এন্ট্রি হলেই শুধু মুছুন। ঋণ ও এর সব ফেরতের হিসাব মুছে যাবে। নিশ্চিত?" /></div>}
        </div>
        <div className="card">
          <b>ফেরতের হিসাব</b>
          <div className="scroll"><table className="tbl"><thead><tr><th>তারিখ</th><th>রসিদ</th><th>পরিমাণ</th><th></th></tr></thead><tbody>
            {reps.length === 0 && <Empty cols={4} text="এখনো কোনো ফেরত আসেনি" />}
            {reps.map((r) => (
              <tr key={r.id}><td>{fd(r.paid_on)}</td><td className="small">{r.receipt_no}</td><td>{tk(r.amount)}</td>
                <td>{profile.role === 'admin' && <ConfirmButton action={deleteRepayment.bind(null, r.id, l.id)} className="btn sm danger" label="মুছুন" confirm="এই ফেরতের এন্ট্রি মুছবেন?" />}</td></tr>
            ))}
          </tbody></table></div>
          {bal > 0 && (
            <ActionForm action={addRepayment.bind(null, l.id)} className="row" style={{ marginTop: 14, alignItems: 'flex-end' }} resetOnSuccess>
              <label className="f" style={{ margin: 0 }}><span>পরিমাণ</span><input name="amount" type="number" min={1} max={bal} defaultValue={Math.min(inst, bal)} style={{ width: 130 }} required /></label>
              <label className="f" style={{ margin: 0 }}><span>তারিখ</span><input name="paid_on" type="date" defaultValue={todayBD()} max={todayBD()} /></label>
              <Submit>ফেরত গ্রহণ</Submit>
            </ActionForm>
          )}
        </div>
      </div>
    </>
  );
}
