'use server';
import { revalidatePath } from 'next/cache';
import { CONTENT_ROLES } from '@/lib/content';
import { errMsg, logActivity, requireAction, str, type ActionState } from '@/lib/guard';
import { footerCfg, headerCfg } from '@/lib/layoutcfg';

/** ডিজাইনারের ফর্ম থেকে আসা JSON যাচাই করে (সীমা ও রং ঠিক করে) তবেই রাখা হয় */
async function save(kind: 'header_cfg' | 'footer_cfg', f: FormData, label: string): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(CONTENT_ROLES);
    let raw: unknown = {};
    try { raw = JSON.parse(str(f, 'cfg') || '{}'); } catch { return { error: 'সেটিংস পড়া যায়নি, পাতাটি আবার খুলে চেষ্টা করুন' }; }
    const cfg = kind === 'header_cfg' ? headerCfg(raw) : footerCfg(raw);
    const { error } = await supabase.from('settings').update({ [kind]: cfg, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) throw error;
    await logActivity(supabase, user.id, `${label} ডিজাইন হালনাগাদ`);
    revalidatePath('/', 'layout');
    return { ok: `${label} সংরক্ষিত হয়েছে। ওয়েবসাইটে এখনই দেখা যাবে।`, ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
export const saveHeaderDesign = async (_: ActionState, f: FormData) => save('header_cfg', f, 'হেডার');
export const saveFooterDesign = async (_: ActionState, f: FormData) => save('footer_cfg', f, 'ফুটার');
