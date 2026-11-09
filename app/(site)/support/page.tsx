import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { BuiltinPage } from '@/components/blocks/BuiltinPage';
import { FAQ_DEFAULT } from '@/lib/builtin-content';
import { fillTokens } from '@/lib/tokens';
import { getSiteSettings } from '@/lib/settings';
import { faqSchema, graph } from '@/lib/schema';
import { getLang, getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('সহায়তা ও প্রশ্নোত্তর', 'Help and FAQ'), description: t('সদস্যপদ, মাসিক চাঁদা, বিনা সুদে ঋণ, সদস্যপদ স্থগিত ও পাঠাগার নিয়ে সাধারণ প্রশ্নের উত্তর।', 'Answers to common questions about membership, monthly contributions, interest-free loans, suspension and the library.'), alternates: { canonical: '/support' } };
}

export default async function Support() {
  const t = getT();
  const s = await getSiteSettings();
  const raw = (getLang() === 'en' ? FAQ_DEFAULT.en : FAQ_DEFAULT.bn).split('\n').filter(Boolean).map((l) => { const i = l.indexOf('|'); return [fillTokens(l.slice(0, i).trim(), s), fillTokens(l.slice(i + 1).trim(), s)] as [string, string]; });
  return (
    <>
      <JsonLd data={graph(s, [faqSchema(raw)], [[t('সহায়তা', 'Help'), '/support']])} />
      <BuiltinPage slug="support" title={t('সহায়তা ও প্রশ্নোত্তর', 'Help and FAQ')} />
    </>
  );
}
