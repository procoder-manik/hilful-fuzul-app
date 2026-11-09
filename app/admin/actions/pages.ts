'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CONTENT_ROLES } from '@/lib/content';
import { errMsg, logActivity, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { cleanBlocks, newBlock, RESERVED_SLUGS } from '@/lib/blocks';
import { uploadMedia } from '@/lib/storage';
import { builtinBySlug } from '@/lib/builtin';

const SLUG = /^[a-z0-9][a-z0-9-]{1,60}$/;
const refresh = () => { revalidatePath('/', 'layout'); revalidatePath('/admin/pages'); };

/** নতুন পেজ: শিরোনাম ও ঠিকানা (slug) দিলে একটি খসড়া পেজ তৈরি হয়ে বিল্ডারে নিয়ে যায় */
export async function createPage(_: ActionState, f: FormData): Promise<ActionState> {
  let id = '';
  try {
    const { supabase, user } = await requireAction(CONTENT_ROLES);
    const title = str(f, 'title');
    const slug = str(f, 'slug').toLowerCase();
    if (!title) return { error: 'পেজের নাম দিন' };
    if (!SLUG.test(slug)) return { error: 'ঠিকানায় শুধু ইংরেজি ছোট অক্ষর, সংখ্যা ও হাইফেন (-) চলবে, যেমন: our-work' };
    if (RESERVED_SLUGS.includes(slug)) return { error: 'এই ঠিকানা সিস্টেমে আগে থেকেই ব্যবহৃত, অন্য একটি দিন' };
    const blocks = [{ ...newBlock('page_header'), props: { ...newBlock('page_header').props, title, text: '' } }, newBlock('heading_text')];
    const { data, error } = await supabase.from('pages').insert({ title, slug, in_menu: false, blocks, seo: { draft: true } }).select('id').single();
    if (error) throw new Error(/duplicate|unique/i.test(error.message) ? 'এই ঠিকানায় আগেই একটি পেজ আছে' : error.message);
    id = data.id;
    await logActivity(supabase, user.id, `নতুন পেজ তৈরি: ${title}`);
    refresh();
  } catch (e) {
    return { error: errMsg(e) };
  }
  redirect(`/admin/pages/${id}`);
}

/** হোমপেজ ('home') বা কোনো পেজের ব্লক, নাম, ঠিকানা, SEO ও মেনুর সেটিং সংরক্ষণ */
export async function savePage(target: string, _: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(CONTENT_ROLES);
    let raw: unknown = [];
    try { raw = JSON.parse(str(f, 'blocks') || '[]'); } catch { return { error: 'সেটিংস পড়া যায়নি, পাতাটি আবার খুলে চেষ্টা করুন' }; }
    const blocks = cleanBlocks(raw);
    if (target === 'home') {
      const { error } = await supabase.from('settings').update({ home_sections: blocks, updated_at: new Date().toISOString() }).eq('id', 1);
      if (error) throw error;
      await logActivity(supabase, user.id, 'হোমপেজের কম্পোনেন্ট হালনাগাদ');
      refresh();
      return { ok: 'হোমপেজ সংরক্ষিত হয়েছে। ওয়েবসাইটে এখনই দেখা যাবে।', ts: Date.now() };
    }
    if (target.startsWith('builtin-')) {
      const def = builtinBySlug(target.slice(8));
      if (!def) return { error: 'পেজটি পাওয়া যায়নি' };
      const use = !!f.get('published');
      const { data: have } = await supabase.from('pages').select('id').eq('slug', def.slug).maybeSingle();
      const row = { title: def.title, slug: def.slug, in_menu: false, blocks, seo: { draft: !use }, updated_at: new Date().toISOString() };
      const { error } = have ? await supabase.from('pages').update(row).eq('id', have.id) : await supabase.from('pages').insert(row);
      if (error) throw error;
      await logActivity(supabase, user.id, `পেজের সাজ সংরক্ষণ: ${def.bn}`);
      refresh();
      revalidatePath(`/${def.slug}`);
      return { ok: use ? `সংরক্ষিত হয়েছে। /${def.slug} পেজে আপনার সাজানো লেআউট দেখাচ্ছে।` : 'সংরক্ষিত হয়েছে, তবে "আমার লেআউট ব্যবহার করুন" টিক না থাকায় ওয়েবসাইটে এখনো আগের চেহারাই দেখাচ্ছে।', ts: Date.now() };
    }
    const title = str(f, 'title');
    const slug = str(f, 'slug').toLowerCase();
    if (!title) return { error: 'পেজের নাম দিন' };
    if (!SLUG.test(slug) || RESERVED_SLUGS.includes(slug)) return { error: 'ঠিকানা সঠিক নয় বা সিস্টেমে ব্যবহৃত। শুধু ইংরেজি ছোট অক্ষর, সংখ্যা ও হাইফেন চলবে।' };
    const published = !!f.get('published');
    const inMenu = !!f.get('in_menu');
    const seo = { title: opt(f, 'seo_title')?.slice(0, 120) ?? '', description: opt(f, 'seo_desc')?.slice(0, 300) ?? '', draft: !published };
    const { data: old } = await supabase.from('pages').select('slug').eq('id', target).single();
    const { error } = await supabase.from('pages').update({ title: title.slice(0, 160), slug, in_menu: inMenu, blocks, seo, updated_at: new Date().toISOString() }).eq('id', target);
    if (error) throw new Error(/duplicate|unique/i.test(error.message) ? 'এই ঠিকানায় আগেই আরেকটি পেজ আছে' : error.message);
    // হেডার মেনুতে যোগ বা সরানো (পুরোনো ঠিকানার আইটেমও সামলানো হয়)
    const urls = [`/${slug}`, ...(old?.slug && old.slug !== slug ? [`/${old.slug}`] : [])];
    const { data: have, error: me } = await supabase.from('menu_items').select('id, url').eq('location', 'header').in('url', urls);
    if (!me) {
      const cur = (have ?? []).find((x) => x.url === `/${slug}`);
      for (const h of have ?? []) if (h.url !== `/${slug}` || !inMenu) await supabase.from('menu_items').delete().eq('id', h.id);
      if (inMenu && !cur) {
        const { count } = await supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('location', 'header').is('parent_id', null);
        await supabase.from('menu_items').insert({ location: 'header', label: title.slice(0, 40), url: `/${slug}`, sort: (count ?? 0) + 1 });
      } else if (inMenu && cur) await supabase.from('menu_items').update({ label: title.slice(0, 40) }).eq('id', cur.id);
    }
    await logActivity(supabase, user.id, `পেজ সংরক্ষণ: ${title}`);
    refresh();
    revalidatePath(`/${slug}`);
    return { ok: published ? `সংরক্ষিত হয়েছে। পেজটি /${slug} ঠিকানায় চালু আছে।` : 'সংরক্ষিত হয়েছে (খসড়া, এখনো ওয়েবসাইটে দেখা যাবে না)।', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

export async function deletePage(id: string, _f: FormData) {
  const { supabase, user } = await requireAction(CONTENT_ROLES);
  const { data: p } = await supabase.from('pages').select('title, slug').eq('id', id).single();
  const { error } = await supabase.from('pages').delete().eq('id', id);
  if (error) throw new Error(errMsg(error));
  if (p?.slug) await supabase.from('menu_items').delete().eq('location', 'header').eq('url', `/${p.slug}`);
  await logActivity(supabase, user.id, `পেজ মুছে ফেলা: ${p?.title}`);
  refresh();
}

/** বিল্ডারের ছবির ঘরের জন্য: ছবি আপলোড করে লিংক ফেরত দেয় */
export async function uploadBlockImage(f: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const { supabase } = await requireAction(CONTENT_ROLES);
    const url = await uploadMedia(supabase, f.get('file'), 'pages');
    return url ? { url } : { error: 'ছবি বাছুন' };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

/** আগে থেকে তৈরি পেজের সাজ মুছে আগের ডিফল্ট চেহারায় ফেরা */
export async function resetBuiltin(slug: string, _f: FormData) {
  const { supabase, user } = await requireAction(CONTENT_ROLES);
  const def = builtinBySlug(slug);
  if (!def) throw new Error('পেজটি পাওয়া যায়নি');
  const { error } = await supabase.from('pages').delete().eq('slug', slug);
  if (error) throw new Error(errMsg(error));
  await logActivity(supabase, user.id, `পেজ ডিফল্টে ফেরানো হয়েছে: ${def.bn}`);
  refresh();
  revalidatePath(`/${slug}`);
}
