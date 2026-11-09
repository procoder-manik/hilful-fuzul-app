'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { computeDues } from '@/lib/dues';
import { addMonths, monthStart, todayBD } from '@/lib/dates';
import { errMsg, logActivity, MONEY, num, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { tk, ymLabel } from '@/lib/format';
import { notify } from '@/lib/notify/send';
import { T } from '@/lib/notify/templates';

export async function savePayments(_: ActionState, f: FormData): Promise<ActionState> {
  let ids: string[] = [];
  try {
    const { supabase, user } = await requireAction(MONEY);
    const memberId = str(f, 'member_id');
    const count = Math.min(24, Math.max(1, num(f, 'count')));
    const amount = num(f, 'amount');
    if (amount <= 0) return { error: 'পরিমাণ দিন' };
    const [{ data: m }, { data: pays }, { data: s }] = await Promise.all([
      supabase.from('members').select('*').eq('id', memberId).single(),
      supabase.from('payments').select('for_month').eq('member_id', memberId).eq('type', 'monthly'),
      supabase.from('settings').select('due_day').eq('id', 1).single(),
    ]);
    if (!m) return { error: 'সদস্য পাওয়া যায়নি' };
    const d = computeDues({ joinDate: m.join_date, resetFrom: m.reset_from, monthlyAmount: m.monthly_amount, paidMonths: (pays ?? []).map((p) => p.for_month), dueDay: s?.due_day ?? 10 });
    const months = d.months.filter((mo) => !d.paid.has(mo));
    let next = addMonths(monthStart(todayBD()), 1);
    while (months.length < count) { if (!d.paid.has(next)) months.push(next); next = addMonths(next, 1); }
    const chosen = months.slice(0, count);
    const rows = chosen.map((mo) => ({ member_id: memberId, type: 'monthly', for_month: mo, amount, paid_on: str(f, 'paid_on') || todayBD(), method: str(f, 'method'), note: opt(f, 'note'), created_by: user.id }));
    const { data, error } = await supabase.from('payments').insert(rows).select('id, receipt_no');
    if (error) throw error;
    ids = data.map((x) => x.id);
    if (f.get('unfreeze') && m.status === 'frozen') await supabase.rpc('unfreeze_member', { p_member: memberId });
    await logActivity(supabase, user.id, `${m.name} ${chosen.map((x) => ymLabel(x)).join(', ')} মাসের চাঁদা ${tk(amount * count)} জমা দিয়েছেন`);

    // জমার বিজ্ঞপ্তি: অ্যাপে, ইমেইল থাকলে ইমেইলে, ফোন থাকলে SMS এ
    const after = computeDues({ joinDate: m.join_date, resetFrom: m.reset_from, monthlyAmount: m.monthly_amount, paidMonths: [...(pays ?? []).map((p) => p.for_month), ...chosen], dueDay: s?.due_day ?? 10 });
    const { data: org } = await supabase.from('settings').select('org_name, short_name').eq('id', 1).single();
    const orgName = org?.short_name || org?.org_name || 'সংগঠন';
    const shown = chosen.length > 3 ? `${chosen.slice(0, 3).map((x) => ymLabel(x)).join(', ')} ও আরও ${chosen.length - 3}` : chosen.map((x) => ymLabel(x)).join(', ');
    await notify({
      memberId, kind: 'payment', key: ids.join(','),
      ...T.payment({ name: m.name, org: orgName, what: `${shown} মাসের চাঁদা`, amount: amount * count, receipt: (data ?? []).map((x) => x.receipt_no).join(', '), next: m.status === 'active' || f.get('unfreeze') ? after.nextDueDate : null }),
    });
    if (f.get('unfreeze') && m.status === 'frozen') await notify({ memberId, kind: 'reactivated', ...T.reactivated({ name: m.name, org: orgName }) });
  } catch (e) {
    return { error: errMsg(e) };
  }
  revalidatePath('/admin', 'layout');
  redirect(`/admin/print/receipt?ids=${ids.join(',')}&auto=1`);
}

export async function deletePayment(id: string, _f: FormData) {
  const { supabase, user } = await requireAction(MONEY);
  const { data: p } = await supabase.from('payments').select('amount, receipt_no, members(name)').eq('id', id).single();
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw new Error(errMsg(error));
  const name = (p?.members as unknown as { name: string } | null)?.name;
  await logActivity(supabase, user.id, `রসিদ ${p?.receipt_no} (${name}, ${tk(p?.amount)}) মুছে ফেলা হয়েছে`);
  revalidatePath('/admin', 'layout');
}
