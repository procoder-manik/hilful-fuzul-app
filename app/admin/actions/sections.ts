'use server';
import { revalidatePath } from 'next/cache';
import { CONTENT_ROLES } from '@/lib/content';
import { errMsg, logActivity, requireAction, str, type ActionState } from '@/lib/guard';
import { cleanStyle, DEFAULT_PAGEHEAD, SECTIONS } from '@/lib/sectionstyle';

/** হোমপেজের সেকশনের ক্রম, চালু/বন্ধ, রং ও প্যাটার্ন এবং পেজ-হেডারের রং ও প্যাটার্ন সংরক্ষণ (নতুন SQL লাগে না) */
export async function saveSections(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(CONTENT_ROLES);
    let raw: { sections?: { k?: string; on?: boolean; bg?: string; pat?: string; op?: number }[]; pagehead?: { bg?: string; pat?: string; op?: number } } = {};
    try { raw = JSON.parse(str(f, 'cfg') || '{}'); } catch { return { error: 'সেটিংস পড়া যায়নি, পাতাটি আবার খুলে চেষ্টা করুন' }; }
    const known = new Set(SECTIONS.map((x) => x.k));
    const seen = new Set<string>();
    const list = (raw.sections ?? []).filter((x) => x.k && known.has(x.k) && !seen.has(x.k) && seen.add(x.k)).map((x) => ({ k: x.k as string, on: x.on !== false, ...cleanStyle(x as never) }));
    SECTIONS.forEach((x) => { if (!seen.has(x.k)) list.push({ k: x.k, on: true, ...cleanStyle(null) }); });
    const { data: cur } = await supabase.from('settings').select('theme').eq('id', 1).single();
    const pagehead = cleanStyle(raw.pagehead as never, DEFAULT_PAGEHEAD);
    const { error } = await supabase.from('settings').update({ home_sections: list, theme: { ...((cur?.theme as Record<string, unknown> | null) ?? {}), pagehead }, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) throw error;
    await logActivity(supabase, user.id, 'হোমপেজের সেকশন ও পেজ-হেডারের সাজ হালনাগাদ');
    revalidatePath('/', 'layout');
    return { ok: 'সংরক্ষিত হয়েছে। ওয়েবসাইটে এখনই দেখা যাবে।', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
