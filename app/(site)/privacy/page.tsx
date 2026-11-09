import type { Metadata } from 'next';
import { BuiltinPage } from '@/components/blocks/BuiltinPage';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('গোপনীয়তা নীতি', 'Privacy policy'), description: t('সদস্যদের ব্যক্তিগত তথ্য কীভাবে সংরক্ষণ ও ব্যবহার করা হয়।', 'How members’ personal information is stored and used.'), alternates: { canonical: '/privacy' } };
}

export default async function Privacy() {
  const t = getT();
  return <BuiltinPage slug="privacy" title={t('গোপনীয়তা নীতি', 'Privacy policy')} />;
}
