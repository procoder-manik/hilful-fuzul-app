import type { Metadata } from 'next';
import { ActionForm, Submit } from '../../../_components/ActionForm';
import { SignaturePad } from '../../../_components/SignaturePad';
import { createLoan } from '../../../actions/loans';
import { MONEY, requirePage } from '@/lib/guard';
import { todayBD } from '@/lib/dates';
import { tk } from '@/lib/format';
import { PageHead } from '@/lib/ui';
import type { PublicStats } from '@/lib/types';

export const metadata: Metadata = { title: 'নতুন করজে হাসানা' };

export default async function NewLoan({ searchParams }: { searchParams: { member?: string } }) {
  const { supabase } = await requirePage(MONEY);
  const [{ data: members }, { data: loans }, { data: st }] = await Promise.all([
    supabase.from('members').select('id, name, member_no, phone').eq('status', 'active').order('name'),
    supabase.from('loans').select('member_id, amount, loan_repayments(amount)'),
    supabase.from('v_public_stats').select('*').single(),
  ]);
  const running = new Set((loans ?? []).filter((l) => Number(l.amount) > (l.loan_repayments as { amount: number }[]).reduce((a, r) => a + Number(r.amount), 0)).map((l) => l.member_id));
  const eligible = (members ?? []).filter((m) => !running.has(m.id));
  const s = st as PublicStats;
  return (
    <>
      <PageHead title="নতুন করজে হাসানা" sub={`তহবিলে এখন ${tk(s.total_fund - s.total_loaned + s.total_repaid)} আছে। শুধু সক্রিয় ও চলমান ঋণ নেই এমন সদস্যদের দেখানো হচ্ছে।`} />
      <ActionForm action={createLoan} className="card" style={{ maxWidth: 820 }}>
        <label className="f"><span>সদস্য *</span>
          <select name="member_id" defaultValue={searchParams.member} required>
            {eligible.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.member_no})</option>)}
          </select>
        </label>
        {eligible.length === 0 && <div className="notice warn">ঋণ পাওয়ার মতো কোনো সদস্য নেই।</div>}
        <div className="grid g2" style={{ gap: '0 12px' }}>
          <label className="f"><span>ঋণের পরিমাণ (৳) *</span><input name="amount" type="number" min={100} step={50} required /></label>
          <label className="f"><span>মেয়াদ *</span><select name="term_months"><option value="3">৩ মাস</option><option value="6">৬ মাস</option><option value="12">১ বছর</option></select></label>
          <label className="f"><span>ফেরতের ধরন</span><select name="mode"><option value="lump">মেয়াদ শেষে একবারে</option><option value="installment">মাসিক কিস্তিতে</option></select></label>
          <label className="f"><span>প্রদানের তারিখ</span><input name="issued_on" type="date" defaultValue={todayBD()} max={todayBD()} /></label>
          <label className="f"><span>জামিনদারের নাম *</span><input name="guarantor_name" required /></label>
          <label className="f"><span>জামিনদারের মোবাইল</span><input name="guarantor_phone" inputMode="tel" /></label>
        </div>
        <label className="f"><span>ঋণের উদ্দেশ্য</span><input name="purpose" placeholder="যেমন চিকিৎসা, পড়াশোনা, ছোট ব্যবসা" /></label>
        <SignaturePad label="ঋণগ্রহীতার স্বাক্ষর (ঐচ্ছিক, প্রিন্ট করা রসিদেও হাতে সই নেওয়া যাবে)" />
        <label className="chk"><input type="checkbox" name="force" /> <span>তহবিলের বেশি হলেও দিন</span></label>
        <Submit>ঋণ প্রদান ও রসিদ প্রিন্ট</Submit>
      </ActionForm>
    </>
  );
}
