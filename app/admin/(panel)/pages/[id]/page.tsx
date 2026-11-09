import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageBuilder, type PageMeta } from './PageBuilder';
import { ConfirmButton } from '../../../_components/ActionForm';
import { resetBuiltin, savePage } from '../../../actions/pages';
import { builtinBySlug, PAGE_DATA_LINKS } from '@/lib/builtin';
import { defaultBlocks } from '@/lib/builtin-content';
import { CONTENT_ROLES } from '@/lib/content';
import { requirePage } from '@/lib/guard';
import { PageHead } from '@/lib/ui';
import { cleanBlocks, defaultHomeBlocks, newBlock } from '@/lib/blocks';

export const metadata: Metadata = { title: 'পেজ বিল্ডার' };

export default async function BuilderPage({ params }: { params: { id: string } }) {
  const { supabase } = await requirePage(CONTENT_ROLES);
  if (params.id === 'home') {
    const { data } = await supabase.from('settings').select('home_sections').eq('id', 1).single();
    const saved = cleanBlocks(data?.home_sections);
    return (
      <>
        <PageHead title="হোমপেজ সাজান" sub="কম্পোনেন্ট টেনে ছেড়ে ক্রম বদলান, নতুন যোগ করুন, প্রতিটির লেখা, রং ও প্যাটার্ন ঠিক করুন। যেমন আছে তেমনই শুরু হয়, আপনি বদলালে তবেই বদলায়।" />
        <PageBuilder initial={saved.length ? saved : defaultHomeBlocks()} meta={null} action={savePage.bind(null, 'home')} target="home" />
      </>
    );
  }
  if (params.id.startsWith('builtin-')) {
    const def = builtinBySlug(params.id.slice(8));
    if (!def) notFound();
    const { data: row } = await supabase.from('pages').select('blocks, seo').eq('slug', def.slug).maybeSingle();
    const saved = cleanBlocks(row?.blocks);
    const seo = (row?.seo ?? {}) as { draft?: boolean };
    const header = { ...newBlock('page_header'), props: { ...newBlock('page_header').props, title: def.title, title_en: def.title_en, text: def.text, text_en: def.text_en } };
    const dflt = defaultBlocks(def.slug);
    const start = saved.length ? saved : dflt ?? [header, newBlock('page_body')];
    return (
      <>
        <PageHead title={`পেজ সাজান: ${def.bn}`} sub="এই পেজের হেডার ও মূল কন্টেন্ট কম্পোনেন্ট হিসেবে সাজানো আছে। টেনে ছেড়ে ক্রম বদলান, ওপরে-নিচে নতুন কম্পোনেন্ট যোগ করুন, রং ও প্যাটার্ন দিন।">
          {row && <ConfirmButton action={resetBuiltin.bind(null, def.slug)} className="btn danger" label="ডিফল্টে ফিরুন (Reset)" confirm="আপনার সাজানো লেআউট মুছে এই পেজ আগের চেহারায় ফিরবে। নিশ্চিত?" />}
        </PageHead>
        <PageBuilder initial={start} meta={null} action={savePage.bind(null, params.id)} target={params.id} builtin={{ slug: def.slug, use: !!row && !seo.draft, hasBody: !dflt, links: PAGE_DATA_LINKS[def.slug] ?? [] }} />
      </>
    );
  }
  const { data } = await supabase.from('pages').select('*').eq('id', params.id).maybeSingle();
  if (!data) notFound();
  const seo = (data.seo ?? {}) as { title?: string; description?: string; draft?: boolean };
  const meta: PageMeta = { title: data.title, slug: data.slug, published: !seo.draft, inMenu: !!data.in_menu, seoTitle: seo.title ?? '', seoDesc: seo.description ?? '' };
  return (
    <>
      <PageHead title={`পেজ: ${data.title}`} sub="কম্পোনেন্ট টেনে ছেড়ে সাজান। প্রকাশ করলে পেজটি ওয়েবসাইটে খুলবে।" />
      <PageBuilder initial={cleanBlocks(data.blocks)} meta={meta} action={savePage.bind(null, data.id)} target={data.id} />
    </>
  );
}
