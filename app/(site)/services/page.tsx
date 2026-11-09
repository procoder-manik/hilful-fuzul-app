import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { BuiltinPage } from '@/components/blocks/BuiltinPage';
import { Qard, ServiceGrid } from '@/components/cards';
import { getPrograms } from '@/lib/public';
import { getSiteSettings } from '@/lib/settings';
import { graph, siteUrl } from '@/lib/schema';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('সেবা ও কার্যক্রম', 'Services and activities'), description: t('বিনামূল্যে ডায়াবেটিস ও প্রেসার পরীক্ষা, শীতবস্ত্র বিতরণ, শিক্ষাবৃত্তি, কুরআন শিক্ষা, খেলাধুলা ও বিনা সুদে করজে হাসানা।', 'Free diabetes and blood pressure checks, winter clothes, scholarships, Quran classes, sports and interest-free loans.'), alternates: { canonical: '/services' } };
}

export default async function ServicesPage() {
  const t = getT();
  const [s, list] = await Promise.all([getSiteSettings(), getPrograms()]);
  const offers = list.map((p) => ({ '@type': 'Offer', price: 0, priceCurrency: 'BDT', itemOffered: { '@type': 'Service', name: p.title, description: p.description ?? undefined, provider: { '@id': `${siteUrl()}/#org` }, areaServed: s.address ?? 'Bangladesh' } }));
  return (
    <>
      <JsonLd data={graph(s, [{ '@type': 'OfferCatalog', name: t('সেবা ও কার্যক্রম', 'Services and activities'), itemListElement: offers }], [[t('সেবা', 'Services'), '/services']])} />
      <BuiltinPage slug="services" title={t('সেবা ও কার্যক্রম', 'Services and activities')} sub={t('বিনামূল্যে, সবার জন্য। আপনার দান এই কাজগুলোকে চালু রাখে।', 'Free, for everyone. Your donations keep this work going.')}>
      <section className="sec" style={{ paddingTop: 20 }}><div className="wrap"><ServiceGrid list={list} /></div></section>
      <Qard s={s} />
      </BuiltinPage>
    </>
  );
}
