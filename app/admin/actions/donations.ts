'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { errMsg, logActivity, MONEY, num, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { todayBD } from '@/lib/dates';
import { tk } from '@/lib/format';

export async function createDonation(_: ActionState, f: FormData): Promise<ActionState> {
  let id = '';
  try {
    const { supabase, user } = await requireAction(MONEY);
    const amount = num(f, 'amount');
    if (!str(f, 'donor_name')) return { error: 'দাতার নাম দিন' };
    if (amount <= 0) return { error: 'পরিমাণ দিন' };
    // দাতা সদস্য হলে সদস্যের সাথে যুক্ত করি, যাতে তিনি নিজের প্রোফাইলে দানের রসিদ পান
    let member_id: string | null = null;
    const mno = str(f, 'member_no').toUpperCase();
    if (mno) {
      const { data: m } = await supabase.from('members').select('id').eq('member_no', mno).maybeSingle();
      if (!m) return { error: `${mno} নম্বরের কোনো সদস্য নেই` };
      member_id = m.id;
    }
    const row: Record<string, unknown> = {
      donor_name: str(f, 'donor_name'), anonymous: !!f.get('anonymous'), phone: opt(f, 'phone'), amount,
      purpose: str(f, 'purpose'), method: str(f, 'method'), donated_on: str(f, 'donated_on') || todayBD(), created_by: user.id,
    };
    if (opt(f, 'donor_title')) row.donor_title = opt(f, 'donor_title');
    if (member_id) row.member_id = member_id;
    const { data, error } = await supabase.from('donations').insert(row).select('id').single();
    if (error) throw new Error(/donor_title|member_id/.test(error.message) ? 'পদবী বা সদস্য নম্বর রাখতে আগে 006_records_admin.sql চালান' : error.message);
    id = data.id;
    await logActivity(supabase, user.id, `${str(f, 'donor_name')} ${tk(amount)} দান করেছেন (${str(f, 'purpose')})`);
  } catch (e) {
    return { error: errMsg(e) };
  }
  revalidatePath('/admin', 'layout');
  redirect(`/admin/print/donation/${id}?auto=1`);
}

export async function deleteDonation(id: string, _f: FormData) {
  const { supabase, user } = await requireAction(MONEY);
  const { data: d } = await supabase.from('donations').select('donor_name, amount').eq('id', id).single();
  await supabase.from('donations').delete().eq('id', id);
  await logActivity(supabase, user.id, `${d?.donor_name} এর ${tk(d?.amount)} দানের এন্ট্রি মুছে ফেলা হয়েছে`);
  revalidatePath('/admin', 'layout');
}
