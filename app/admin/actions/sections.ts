'use server';
import { revalidatePath } from 'next/cache';
import { CONTENT_ROLES } from '@/lib/content';
import { errMsg, logActivity, requireAction, str, type ActionState } from '@/lib/guard';
import { cleanStyle, DEFAULT_PAGEHEAD } from '@/lib/sectionstyle';

/** সব ভেতরের পাতার হেডার এলাকার রং ও প্যাটার্ন সংরক্ষণ (নতুন SQL লাগে না)। হোমপেজের কম্পোনেন্ট এখন পেজ বিল্ডারে সাজানো হয়। */
export async function saveSections(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(CONTENT_ROLES);
    let raw: { pagehead?: { bg?: string; pat?: string; op?: number } } = {};
    try { raw = JSON.parse(str(f, 'cfg') || '{}'); } catch { return { error: 'সেটিংস পড়া যায়নি, পাতাটি আবার খুলে চেষ্টা করুন' }; }
    const { data: cur } = await supabase.from('settings').select('theme').eq('id', 1).single();
    const pagehead = cleanStyle(raw.pagehead as never, DEFAULT_PAGEHEAD);
    const { error } = await supabase.from('settings').update({ theme: { ...((cur?.theme as Record<string, unknown> | null) ?? {}), pagehead }, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) throw error;
    await logActivity(supabase, user.id, 'পেজ-হেডারের সাজ হালনাগাদ');
    revalidatePath('/', 'layout');
    return { ok: 'সংরক্ষিত হয়েছে। ওয়েবসাইটে এখনই দেখা যাবে।', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
