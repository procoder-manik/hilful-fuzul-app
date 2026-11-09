'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { errMsg, logActivity, MONEY, num, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { uploadSignature } from '@/lib/storage';
import { todayBD } from '@/lib/dates';
import { tk } from '@/lib/format';

export async function createLoan(_: ActionState, f: FormData): Promise<ActionState> {
  let id = '';
  try {
    const { supabase, user } = await requireAction(MONEY);
    const amount = num(f, 'amount');
    const term = num(f, 'term_months');
    if (amount < 100) return { error: 'ঋণের পরিমাণ কমপক্ষে ১০০ টাকা' };
    if (![3, 6, 12].includes(term)) return { error: 'মেয়াদ বেছে নিন' };
    if (!str(f, 'guarantor_name')) return { error: 'জামিনদারের নাম দিন' };
    const { data: st } = await supabase.from('v_public_stats').select('total_fund, total_loaned, total_repaid').single();
    const available = st ? st.total_fund - st.total_loaned + st.total_repaid : 0;
    if (amount > available && !f.get('force')) return { error: `তহবিলে এখন ${tk(available)} আছে। তবুও দিতে চাইলে নিচের "তহবিলের বেশি হলেও দিন" চিহ্নিত করুন।` };
    const sig = await uploadSignature(supabase, str(f, 'signature'), 'loans');
    const { data, error } = await supabase.from('loans').insert({
      member_id: str(f, 'member_id'), amount, term_months: term, mode: str(f, 'mode') === 'installment' ? 'installment' : 'lump',
      issued_on: str(f, 'issued_on') || todayBD(), guarantor_name: str(f, 'guarantor_name'), guarantor_phone: opt(f, 'guarantor_phone'),
      purpose: opt(f, 'purpose'), borrower_signature_url: sig, created_by: user.id,
    }).select('id, slip_no, members(name)').single();
    if (error) throw error;
    id = data.id;
    const name = (data.members as unknown as { name: string } | null)?.name;
    await logActivity(supabase, user.id, `${name} কে ${tk(amount)} করজে হাসানা দেওয়া হয়েছে (${data.slip_no})`);
  } catch (e) {
    return { error: errMsg(e) };
  }
  revalidatePath('/admin', 'layout');
  redirect(`/admin/print/loan/${id}?auto=1`);
}

export async function addRepayment(loanId: string, _: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(MONEY);
    const amount = num(f, 'amount');
    if (amount <= 0) return { error: 'পরিমাণ দিন' };
    const { error } = await supabase.from('loan_repayments').insert({ loan_id: loanId, amount, paid_on: str(f, 'paid_on') || todayBD(), created_by: user.id });
    if (error) throw error;
    const { data: l } = await supabase.from('loans').select('slip_no, members(name)').eq('id', loanId).single();
    await logActivity(supabase, user.id, `${(l?.members as unknown as { name: string } | null)?.name} ${tk(amount)} ঋণ ফেরত দিয়েছেন (${l?.slip_no})`);
    revalidatePath('/admin', 'layout');
    return { ok: `${tk(amount)} ফেরত গ্রহণ করা হয়েছে`, ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

export async function deleteRepayment(id: string, loanId: string, _f: FormData) {
  const { supabase, user } = await requireAction(['admin']);
  await supabase.from('loan_repayments').delete().eq('id', id);
  await logActivity(supabase, user.id, 'একটি ঋণ ফেরতের এন্ট্রি মুছে ফেলা হয়েছে');
  revalidatePath(`/admin/loans/${loanId}`);
}

export async function deleteLoan(id: string, _f: FormData) {
  const { supabase, user } = await requireAction(['admin']);
  const { data: l } = await supabase.from('loans').select('slip_no').eq('id', id).single();
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw new Error(errMsg(error));
  await logActivity(supabase, user.id, `ঋণ ${l?.slip_no} মুছে ফেলা হয়েছে`);
  revalidatePath('/admin', 'layout');
  redirect('/admin/loans');
}
