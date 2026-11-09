'use server';
import { revalidatePath } from 'next/cache';
import { ADMIN, errMsg, logActivity, requireAction, str, type ActionState } from '@/lib/guard';

const EDIT = [...ADMIN, 'editor'] as const;

/** অনুত্তরিত প্রশ্নের সঠিক উত্তর বটের জ্ঞানভাণ্ডারে (সেটিংসের "অতিরিক্ত তথ্য") যোগ করে */
export async function teachBot(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction([...EDIT]);
    const id = str(f, 'id'), q = str(f, 'q').slice(0, 300), a = str(f, 'a');
    if (a.length < 3) return { error: 'উত্তরটি লিখুন' };
    if (a.length > 600) return { error: 'উত্তর ৬০০ অক্ষরের মধ্যে রাখুন' };
    const { data } = await supabase.from('settings').select('chat_notes').eq('id', 1).single();
    const next = [data?.chat_notes?.trim(), `প্রশ্ন: ${q}\nউত্তর: ${a}`].filter(Boolean).join('\n\n');
    if (next.length > 8000) return { error: 'বটের অতিরিক্ত তথ্য অনেক বড় হয়ে গেছে। সেটিংস থেকে পুরোনো অংশ কেটে ছোট করুন।' };
    const { error } = await supabase.from('settings').update({ chat_notes: next, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) throw error;
    if (id) await supabase.from('chat_logs').update({ unanswered: false }).eq('id', id);
    await logActivity(supabase, user.id, 'চ্যাটবটকে নতুন উত্তর শেখানো হয়েছে');
    revalidatePath('/admin/chats');
    return { ok: 'বট এখন থেকে এই প্রশ্নের উত্তর দিতে পারবে', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

export async function deleteChat(id: string) {
  const { supabase } = await requireAction([...EDIT]);
  await supabase.from('chat_logs').delete().eq('id', id);
  revalidatePath('/admin/chats');
}
