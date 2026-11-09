'use server';
import { revalidatePath } from 'next/cache';
import { CONTENT_ROLES } from '@/lib/content';
import { errMsg, logActivity, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { uploadMedia } from '@/lib/storage';
import { warmTranslations } from '@/lib/translate';
import { todayBD } from '@/lib/dates';
import { cleanDesign, designFromPreset, presetById, TEMPLATES } from '@/lib/eventdesign';

const refresh = () => { revalidatePath('/', 'layout'); revalidatePath('/events'); revalidatePath('/admin/events'); };

/** অনুষ্ঠান তৈরি বা সম্পাদনা: লেখা, পপআপ/হিরোর সুইচ ও ব্যানারের ডিজাইনসহ */
export async function saveEvent(id: string | null, _: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(CONTENT_ROLES);
    const title = str(f, 'title');
    const date = str(f, 'event_date');
    if (!title) return { error: 'অনুষ্ঠানের শিরোনাম দিন' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'সঠিক তারিখ দিন' };
    let raw: unknown = {};
    try { raw = JSON.parse(str(f, 'design') || '{}'); } catch { /* ডিফল্ট ডিজাইন */ }
    const design = cleanDesign(raw);
    const img = await uploadMedia(supabase, f.get('image'), 'events');
    if (img) design.image = img;
    if ((design.template === 'split' || design.template === 'image') && !design.image) design.template = 'gradient';
    const row = {
      title: title.slice(0, 160), topic: opt(f, 'topic')?.slice(0, 300) ?? null, event_date: date, event_time: opt(f, 'event_time')?.slice(0, 60) ?? null, venue: opt(f, 'venue')?.slice(0, 200) ?? null,
      chief_guest: opt(f, 'chief_guest')?.slice(0, 120) ?? null, special_guest: opt(f, 'special_guest')?.slice(0, 120) ?? null, presided_by: opt(f, 'presided_by')?.slice(0, 120) ?? null,
      outcome: opt(f, 'outcome')?.slice(0, 600) ?? null, show_popup: !!f.get('show_popup'), show_in_hero: !!f.get('show_in_hero'), design,
    };
    const { error } = id ? await supabase.from('events').update(row).eq('id', id) : await supabase.from('events').insert(row);
    if (error) throw error;
    await logActivity(supabase, user.id, `অনুষ্ঠান ${id ? 'হালনাগাদ' : 'যোগ'}: ${title}`);
    refresh();
    void warmTranslations();
    return { ok: id ? 'পরিবর্তন সংরক্ষিত হয়েছে' : 'অনুষ্ঠান যোগ হয়েছে। ওয়েবসাইটে দেখাচ্ছে।', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

export async function deleteEvent(id: string, _f: FormData) {
  const { supabase, user } = await requireAction(CONTENT_ROLES);
  const { data: e } = await supabase.from('events').select('title').eq('id', id).single();
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(errMsg(error));
  await logActivity(supabase, user.id, `অনুষ্ঠান মুছে ফেলা হয়েছে: ${e?.title}`);
  refresh();
}

/** বিগত কর্মসূচির নমুনা তালিকা (শীতবস্ত্র, ঈদের সেমাই-চিনি, ঈদের পোশাক, আর্থিক সহায়তা ইত্যাদি); একই নামের থাকলে বাদ। পরে নিজের তথ্য দিয়ে বদলে নিন। */
export async function addSamplePast(_: ActionState, _f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(CONTENT_ROLES);
    const y = Number(todayBD().slice(0, 4));
    const plan: [string, string][] = [['winter', `${y - 1}-01-15`], ['eidfood', `${y - 1}-04-08`], ['eiddress', `${y - 1}-04-09`], ['cash', `${y - 1}-06-20`], ['health', `${y - 1}-09-12`], ['antidrug', `${y - 1}-11-05`]];
    const { data: have } = await supabase.from('events').select('title');
    const titles = new Set((have ?? []).map((x) => x.title));
    const rows = plan.flatMap(([tid, date]) => {
      const t = TEMPLATES.find((x) => x.id === tid)!;
      if (titles.has(t.title)) return [];
      const design = designFromPreset(presetById(t.preset), { icon: t.icon, tag: 'সম্পন্ন কর্মসূচি', pattern: t.pattern });
      return [{ title: t.title, topic: t.topic, event_date: date, event_time: null, venue: t.venue, outcome: t.outcome || 'কর্মসূচিটি সফলভাবে সম্পন্ন হয়েছে।', show_popup: false, show_in_hero: false, design }];
    });
    if (!rows.length) return { ok: 'নমুনাগুলো আগেই যোগ করা আছে' };
    const { error } = await supabase.from('events').insert(rows);
    if (error) throw error;
    await logActivity(supabase, user.id, `বিগত কর্মসূচির ${rows.length}টি নমুনা যোগ করা হয়েছে`);
    refresh();
    return { ok: `${rows.length}টি বিগত কর্মসূচি যোগ হয়েছে। তারিখ ও বিবরণ নিজের তথ্য অনুযায়ী বদলে নিন।`, ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
