'use server';
import { revalidatePath } from 'next/cache';
import { normalizeEmail } from '@/lib/auth';
import { errMsg, logActivity, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { safeUrl } from '@/lib/layoutcfg';
import { warmTranslations } from '@/lib/translate';

/** ওয়েবসাইটের যোগাযোগের তথ্য: হেডার, ফুটার, যোগাযোগ পাতা, চ্যাটবট সবখানে এখান থেকেই যায় */
export async function saveContactInfo(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(['admin', 'editor']);
    const email = str(f, 'email');
    if (email && !normalizeEmail(email)) return { error: 'সঠিক ইমেইল ঠিকানা দিন' };
    const url = (k: string) => { const v = str(f, k); if (!v) return null; const u = safeUrl(/^https?:\/\//i.test(v) ? v : `https://${v}`, ''); return u || null; };
    const base = { phone: opt(f, 'phone'), email: email ? normalizeEmail(email) : null, whatsapp: opt(f, 'whatsapp'), facebook: url('facebook'), address: opt(f, 'address'), updated_at: new Date().toISOString() };
    const more = { phone2: opt(f, 'phone2'), youtube: url('youtube'), map_url: url('map_url'), office_hours: opt(f, 'office_hours') };
    let { error } = await supabase.from('settings').update({ ...base, ...more }).eq('id', 1);
    let warn = '';
    if (error && /column|schema cache/i.test(error.message)) {
      ({ error } = await supabase.from('settings').update(base).eq('id', 1));
      warn = ' (দ্বিতীয় ফোন, ইউটিউব, ম্যাপ ও অফিসের সময় রাখতে 007_site_polish.sql চালান)';
    }
    if (error) throw error;
    await logActivity(supabase, user.id, 'যোগাযোগের তথ্য হালনাগাদ');
    revalidatePath('/', 'layout');
    void warmTranslations();
    return { ok: `সংরক্ষিত হয়েছে, ওয়েবসাইটের সবখানে এখনই দেখা যাবে${warn}`, ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
