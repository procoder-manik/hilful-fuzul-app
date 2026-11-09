import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { Blocks } from '@/components/blocks/Blocks';
import { cleanBlocks } from '@/lib/blocks';
import { getSiteSettings } from '@/lib/settings';
import { publicClient } from '@/lib/supabase/public';
import { graph } from '@/lib/schema';

export const dynamic = 'force-dynamic';
type Row = { id: string; title: string; slug: string; blocks: unknown; seo: { title?: string; description?: string; draft?: boolean } | null };

async function load(slug: string): Promise<Row | null> {
  if (!/^[a-z0-9][a-z0-9-]{0,60}$/.test(slug)) return null;
  const { data } = await publicClient().from('pages').select('id, title, slug, blocks, seo').eq('slug', slug).maybeSingle();
  const r = data as Row | null;
  return r && !r.seo?.draft ? r : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug);
  if (!p) return {};
  return { title: p.seo?.title || p.title, description: p.seo?.description || undefined, alternates: { canonical: `/${p.slug}` } };
}

/** অ্যাডমিনের পেজ বিল্ডারে বানানো নতুন পেজ */
export default async function CustomPage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) notFound();
  const s = await getSiteSettings();
  return (
    <>
      <JsonLd data={graph(s, [], [[p.title, `/${p.slug}`]])} />
      <Blocks blocks={cleanBlocks(p.blocks)} pageTitle={p.title} />
    </>
  );
}
