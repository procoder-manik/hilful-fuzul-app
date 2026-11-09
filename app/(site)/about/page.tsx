import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { BuiltinPage } from '@/components/blocks/BuiltinPage';
import { getSiteSettings } from '@/lib/settings';
import { graph, siteUrl } from '@/lib/schema';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(); const s = await getSiteSettings();
  return { title: t('আমাদের কথা', 'About us'), description: t(`${s.org_name} এর লক্ষ্য, উদ্দেশ্য ও নামের পেছনের গল্প।`, `The mission, goals and the story behind the name of ${s.org_name}.`), alternates: { canonical: '/about' } };
}

export default async function About() {
  const t = getT();
  const s = await getSiteSettings();
  return (
    <>
      <JsonLd data={graph(s, [{ '@type': 'AboutPage', url: `${siteUrl()}/about`, about: { '@id': `${siteUrl()}/#org` } }], [[t('আমাদের কথা', 'About us'), '/about']])} />
      <BuiltinPage slug="about" title={t('আমাদের কথা', 'About us')} />
    </>
  );
}
