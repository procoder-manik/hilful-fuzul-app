'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CONTENT_ROLES, KINDS } from '@/lib/content';
import { errMsg, logActivity, MONEY, requireAction, str, type ActionState } from '@/lib/guard';
import { uploadMedia } from '@/lib/storage';
import { warmTranslations } from '@/lib/translate';

export async function saveContent(kind: string, id: string | null, _: ActionState, f: FormData): Promise<ActionState> {
  const K = KINDS[kind];
  if (!K) return { error: 'অজানা ধরন' };
  try {
    const { supabase, user } = await requireAction(CONTENT_ROLES);
    const row: Record<string, unknown> = {};
    for (const fld of K.fields) {
      if (fld.type === 'image') { const url = await uploadMedia(supabase, f.get(fld.k), K.folder); if (url) row[fld.k] = url; continue; }
      if (fld.type === 'checkbox') { row[fld.k] = !!f.get(fld.k); continue; }
      const v = str(f, fld.k);
      if (fld.req && !v) return { error: `${fld.l} দিন` };
      row[fld.k] = fld.type === 'number' ? Number(v) || 0 : v || null;
    }
    const { error } = id ? await supabase.from(K.table).update(row).eq('id', id) : await supabase.from(K.table).insert(row);
    if (error) throw new Error(/column .* does not exist|schema cache/i.test(error.message) ? 'নতুন ঘরগুলো রাখতে আগে Supabase এ 006_records_admin.sql চালান' : error.message);
    await logActivity(supabase, user.id, `${K.title}: "${row.title ?? row.name}" ${id ? 'হালনাগাদ' : 'যুক্ত'}`);
  } catch (e) {
    return { error: errMsg(e) };
  }
  revalidatePath('/', 'layout');
  void warmTranslations();          // নতুন লেখা আগেভাগে ইংরেজি করে রাখি
  redirect(`/admin/content/${kind}`);
}

export async function deleteContent(kind: string, id: string, _f: FormData) {
  const K = KINDS[kind];
  const { supabase, user } = await requireAction(CONTENT_ROLES);
  await supabase.from(K.table).delete().eq('id', id);
  await logActivity(supabase, user.id, `${K.title} থেকে একটি এন্ট্রি মুছে ফেলা হয়েছে`);
  revalidatePath('/', 'layout');
}

const MSG_ROLES = [...new Set([...CONTENT_ROLES, ...MONEY])];
export async function markMessage(id: string, read: boolean, _f: FormData) {
  const { supabase } = await requireAction(MSG_ROLES);
  await supabase.from('contact_messages').update({ is_read: read }).eq('id', id);
  revalidatePath('/admin', 'layout');
}
export async function deleteMessage(id: string, _f: FormData) {
  const { supabase } = await requireAction(MSG_ROLES);
  await supabase.from('contact_messages').delete().eq('id', id);
  revalidatePath('/admin', 'layout');
}
