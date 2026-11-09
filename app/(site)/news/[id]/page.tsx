import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { publicClient } from '@/lib/supabase/public';
import { getSiteSettings } from '@/lib/settings';
import { translateRows } from '@/lib/translate';
import { graph, siteUrl } from '@/lib/schema';
import { getLang, getT } from '@/lib/lang';
import { fd } from '@/lib/fmt';

async function getPost(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await publicClient().from('posts').select('*').eq('id', id).eq('is_published', true).maybeSingle();
  if (!data) return null;
  return (await translateRows([data as { id: string; title: string; body: string | null; image_url: string | null; published_on: string }], ['title', 'body']))[0];
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const t = getT();
  const p = await getPost(params.id);
  if (!p) return { title: t('সংবাদ পাওয়া যায়নি', 'News not found') };
  const desc = (p.body ?? '').slice(0, 155);
  return { title: p.title, description: desc, alternates: { canonical: `/news/${p.id}` }, openGraph: { type: 'article', title: p.title, description: desc, publishedTime: p.published_on, images: p.image_url ? [p.image_url] : undefined } };
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const t = getT();
  const [s, p] = await Promise.all([getSiteSettings(), getPost(params.id)]);
  if (!p) notFound();
  const url = `${siteUrl()}/news/${p.id}`;
  return (
    <>
      <JsonLd data={graph(s, [{ '@type': 'NewsArticle', headline: p.title, datePublished: p.published_on, image: p.image_url ?? undefined, mainEntityOfPage: url, author: { '@id': `${siteUrl()}/#org` }, publisher: { '@id': `${siteUrl()}/#org` }, inLanguage: getLang() === 'en' ? 'en' : 'bn-BD' }], [[t('সংবাদ', 'News'), '/news'], [p.title, `/news/${p.id}`]])} />
      <article className="wrap prose" style={{ maxWidth: 760, padding: '36px 18px 60px' }}>
        <Link href="/news" className="muted small">{t('সব সংবাদ', 'All news')}</Link>
        <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.6rem)', marginTop: 8 }}>{p.title}</h1>
        <p className="muted small">{fd(p.published_on)}</p>
        {p.image_url && <img src={p.image_url} alt="" style={{ borderRadius: 20, margin: '10px 0 20px', width: '100%' }} />}
        {(p.body ?? '').split('\n').filter(Boolean).map((para: string, i: number) => <p key={i}>{para}</p>)}
      </article>
    </>
  );
}
