import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { BuiltinPage } from '@/components/blocks/BuiltinPage';
import { getSiteSettings } from '@/lib/settings';
import { graph } from '@/lib/schema';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('যোগাযোগ', 'Contact'), description: t('প্রশ্ন, পরামর্শ, দান বা স্বেচ্ছাসেবক হতে চাইলে যোগাযোগ করুন।', 'Get in touch with questions, suggestions, donations or to volunteer.'), alternates: { canonical: '/contact' } };
}

export default async function Contact() {
  const t = getT();
  const s = await getSiteSettings();
  return (
    <>
      <JsonLd data={graph(s, [{ '@type': 'ContactPage', name: t('যোগাযোগ', 'Contact') }], [[t('যোগাযোগ', 'Contact'), '/contact']])} />
      <BuiltinPage slug="contact" title={t('যোগাযোগ', 'Contact')} />
    </>
  );
}
