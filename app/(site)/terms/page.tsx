import type { Metadata } from 'next';
import { BuiltinPage } from '@/components/blocks/BuiltinPage';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('শর্তাবলী', 'Terms and conditions'), description: t('সদস্যপদ ও করজে হাসানার শর্তাবলী।', 'Terms for membership and interest-free loans.'), alternates: { canonical: '/terms' } };
}

export default async function Terms() {
  const t = getT();
  return <BuiltinPage slug="terms" title={t('শর্তাবলী', 'Terms and conditions')} />;
}
