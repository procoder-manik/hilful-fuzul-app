'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { normalizePhone } from '@/lib/auth';
import { errMsg, LIBRARY, logActivity, num, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { uploadMedia } from '@/lib/storage';
import { todayBD } from '@/lib/dates';

export async function saveBook(id: string | null, _: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(LIBRARY);
    const title = str(f, 'title');
    if (!title) return { error: 'বইয়ের নাম দিন' };
    const cover_url = await uploadMedia(supabase, f.get('cover'), 'books');
    const row = { title, author: opt(f, 'author'), category: opt(f, 'category'), copies: Math.max(1, num(f, 'copies')), shelf: opt(f, 'shelf'), added_on: str(f, 'added_on') || todayBD(), ...(cover_url ? { cover_url } : {}) };
    const { error } = id ? await supabase.from('books').update(row).eq('id', id) : await supabase.from('books').insert(row);
    if (error) throw error;
    await logActivity(supabase, user.id, `বই ${id ? 'হালনাগাদ' : 'যুক্ত'}: ${title}`);
  } catch (e) {
    return { error: errMsg(e) };
  }
  revalidatePath('/admin/library', 'layout');
  redirect('/admin/library');
}

export async function deleteBook(id: string, _f: FormData) {
  const { supabase, user } = await requireAction(LIBRARY);
  const { data: b } = await supabase.from('books').select('title').eq('id', id).single();
  await supabase.from('books').delete().eq('id', id);
  await logActivity(supabase, user.id, `বই মুছে ফেলা হয়েছে: ${b?.title}`);
  revalidatePath('/admin/library', 'layout');
}

export async function lendBook(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(LIBRARY);
    const bookId = str(f, 'book_id');
    const [{ data: b }, { count }] = await Promise.all([
      supabase.from('books').select('title, copies').eq('id', bookId).single(),
      supabase.from('book_lendings').select('id', { count: 'exact', head: true }).eq('book_id', bookId).is('returned_on', null),
    ]);
    if (!b) return { error: 'বই বেছে নিন' };
    if ((count ?? 0) >= b.copies) return { error: 'এই বইয়ের সব কপি এখন পাঠকের কাছে' };
    let name = str(f, 'borrower_name');
    let phone = opt(f, 'borrower_phone');
    const memberId = opt(f, 'member_id');
    if (memberId) {
      const { data: m } = await supabase.from('members').select('name, phone').eq('id', memberId).single();
      name = m?.name ?? name; phone = m?.phone ?? phone;
    }
    if (!name) return { error: 'পাঠকের নাম দিন অথবা সদস্য বেছে নিন' };
    if (phone && !memberId) phone = normalizePhone(phone) ?? phone;
    const { error } = await supabase.from('book_lendings').insert({ book_id: bookId, member_id: memberId, borrower_name: name, borrower_phone: phone, out_on: str(f, 'out_on') || todayBD(), expected_on: opt(f, 'expected_on') });
    if (error) throw error;
    await logActivity(supabase, user.id, `${name} "${b.title}" বইটি নিয়েছেন`);
    revalidatePath('/admin/library', 'layout');
    return { ok: `"${b.title}" ${name} কে দেওয়া হয়েছে`, ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

export async function returnBook(id: string, _f: FormData) {
  const { supabase, user } = await requireAction(LIBRARY);
  const { data: l } = await supabase.from('book_lendings').update({ returned_on: todayBD() }).eq('id', id).select('borrower_name, books(title)').single();
  await logActivity(supabase, user.id, `${l?.borrower_name} "${(l?.books as unknown as { title: string } | null)?.title}" ফেরত দিয়েছেন`);
  revalidatePath('/admin/library', 'layout');
}

export async function deleteLending(id: string, _f: FormData) {
  const { supabase } = await requireAction(LIBRARY);
  await supabase.from('book_lendings').delete().eq('id', id);
  revalidatePath('/admin/library', 'layout');
}
