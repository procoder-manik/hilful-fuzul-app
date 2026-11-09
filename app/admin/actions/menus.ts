'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CONTENT_ROLES } from '@/lib/content';
import { errMsg, logActivity, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { safeUrl } from '@/lib/layoutcfg';
import { LOCATIONS, type MegaBlock } from '@/lib/menu';
import { uploadMedia } from '@/lib/storage';

const TYPES = ['books', 'events', 'news', 'card'];
const done = () => revalidatePath('/', 'layout');

/** মেনু আইটেম যোগ বা সম্পাদনা (ড্রপডাউনের ভেতরের আইটেম হলে parent_id থাকে; মেগা মেনু শুধু মূল আইটেমে) */
export async function saveMenuItem(id: string | null, location: string, _: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(CONTENT_ROLES);
    if (!LOCATIONS.some(([k]) => k === location)) return { error: 'অজানা মেনুর জায়গা' };
    const label = str(f, 'label');
    if (!label) return { error: 'মেনুর নাম দিন' };
    const url = str(f, 'url');
    const parentRaw = str(f, 'parent_id');

    let parent_id: string | null = null;
    if (parentRaw) {
      const { data: p } = await supabase.from('menu_items').select('id, parent_id, location').eq('id', parentRaw).maybeSingle();
      if (!p || p.location !== location || p.parent_id || parentRaw === id) return { error: 'ভুল মূল আইটেম বাছা হয়েছে (শুধু একই মেনুর শীর্ষ আইটেম বাছুন)' };
      parent_id = p.id;
    }
    if (id && parent_id) {
      const { count } = await supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('parent_id', id);
      if (count) return { error: 'এই আইটেমের নিজের ভেতরে আইটেম আছে, তাই এটিকে অন্যের ভেতরে রাখা যাবে না। আগে ভেতরের আইটেমগুলো সরান।' };
    }

    const is_mega = !parent_id && !!f.get('is_mega');
    const blocks: Partial<MegaBlock>[] = [];
    if (is_mega) {
      for (const i of [1, 2]) {
        const type = str(f, `b${i}_type`);
        if (!TYPES.includes(type)) continue;
        const uploaded = await uploadMedia(supabase, f.get(`b${i}_image`), 'menu');
        blocks.push({
          type: type as MegaBlock['type'], title: str(f, `b${i}_title`).slice(0, 60), title_en: str(f, `b${i}_title_en`).slice(0, 60), count: Math.min(6, Math.max(1, Number(str(f, `b${i}_count`)) || 3)),
          text: str(f, `b${i}_text`).slice(0, 200), text_en: str(f, `b${i}_text_en`).slice(0, 200), href: safeUrl(str(f, `b${i}_href`), ''),
          cta: str(f, `b${i}_cta`).slice(0, 40), cta_en: str(f, `b${i}_cta_en`).slice(0, 40), image: uploaded ?? str(f, `b${i}_image_old`),
        });
      }
    }
    const row = {
      location, parent_id, label: label.slice(0, 60), label_en: opt(f, 'label_en'), url: safeUrl(url, '#'), new_tab: !!f.get('new_tab'),
      icon: opt(f, 'icon')?.slice(0, 4) ?? null, descr: opt(f, 'descr')?.slice(0, 120) ?? null, descr_en: opt(f, 'descr_en')?.slice(0, 120) ?? null,
      visible: !!f.get('visible'), is_mega, mega: is_mega ? { blocks } : {},
    };
    if (id) {
      const { error } = await supabase.from('menu_items').update(row).eq('id', id);
      if (error) throw error;
    } else {
      const sib = supabase.from('menu_items').select('sort').eq('location', location).order('sort', { ascending: false }).limit(1);
      const { data: last } = await (parent_id ? sib.eq('parent_id', parent_id) : sib.is('parent_id', null));
      const { error } = await supabase.from('menu_items').insert({ ...row, sort: (last?.[0]?.sort ?? 0) + 1 });
      if (error) throw error;
    }
    await logActivity(supabase, user.id, `মেনু: "${label}" ${id ? 'হালনাগাদ' : 'যুক্ত'}`);
  } catch (e) {
    return { error: errMsg(e) };
  }
  done();
  redirect(`/admin/menus?loc=${location}`);
}

/** একই স্তরের ভাইদের মধ্যে ওপরে বা নিচে সরানো */
export async function moveMenuItem(id: string, dir: 'up' | 'down', _f: FormData) {
  const { supabase } = await requireAction(CONTENT_ROLES);
  const { data: it } = await supabase.from('menu_items').select('id, location, parent_id').eq('id', id).single();
  if (!it) return;
  const q = supabase.from('menu_items').select('id, sort').eq('location', it.location).order('sort').order('created_at');
  const { data: sib } = await (it.parent_id ? q.eq('parent_id', it.parent_id) : q.is('parent_id', null));
  const list = sib ?? [];
  const i = list.findIndex((x) => x.id === id), j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((x, k) => (x.sort !== k + 1 ? supabase.from('menu_items').update({ sort: k + 1 }).eq('id', x.id) : null)));
  done();
  revalidatePath('/admin/menus');
}

export async function deleteMenuItem(id: string, _f: FormData) {
  const { supabase, user } = await requireAction(CONTENT_ROLES);
  const { data: it } = await supabase.from('menu_items').select('label').eq('id', id).maybeSingle();
  await supabase.from('menu_items').delete().eq('id', id);     // ভেতরের আইটেমগুলোও সাথে মুছে যায়
  await logActivity(supabase, user.id, `মেনু থেকে "${it?.label ?? ''}" মুছে ফেলা হয়েছে`);
  done();
  revalidatePath('/admin/menus');
}
