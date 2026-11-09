'use server';
import { revalidatePath } from 'next/cache';
import { normalizePhone } from '@/lib/auth';
import { errMsg, logActivity, num, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { todayBD } from '@/lib/dates';

const ROLES = ['admin', 'treasurer', 'editor'] as const;

/** কেউ কোনো সেবা নিলে রেকর্ড (একসাথে অনেকের নাম লাইন ধরে দেওয়া যায়) */
export async function addServiceRecords(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction([...ROLES]);
    const pid = str(f, 'program_id');
    const { data: p } = pid ? await supabase.from('programs').select('id, title').eq('id', pid).maybeSingle() : { data: null };
    const service = p?.title ?? str(f, 'service');
    if (!service) return { error: 'সেবা বাছুন বা নাম লিখুন' };
    const lines = str(f, 'people').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 300);
    if (!lines.length) return { error: 'অন্তত একজনের নাম লিখুন' };
    const served_on = str(f, 'served_on') || todayBD();
    const quantity = Math.max(1, num(f, 'quantity') || 1);
    const note = opt(f, 'note');
    // প্রতি লাইনে: নাম, মোবাইল (মোবাইল ঐচ্ছিক)
    const rows = lines.map((l) => {
      const [name, ph] = l.split(/[,،|]/).map((x) => x.trim());
      return { program_id: p?.id ?? null, service, person_name: name.slice(0, 80), phone: ph ? normalizePhone(ph) ?? ph.slice(0, 20) : null, served_on, quantity, note, created_by: user.id };
    });
    const { error } = await supabase.from('service_records').insert(rows);
    if (error) throw new Error(/service_records/.test(error.message) ? 'আগে 006_records_admin.sql চালান' : error.message);
    await logActivity(supabase, user.id, `সেবা "${service}": ${rows.length} জনের রেকর্ড যোগ`);
    revalidatePath('/admin/services');
    return { ok: `${rows.length} জনের রেকর্ড যোগ হয়েছে`, ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

export async function deleteServiceRecord(id: string, _f: FormData) {
  const { supabase } = await requireAction([...ROLES]);
  await supabase.from('service_records').delete().eq('id', id);
  revalidatePath('/admin/services');
}
