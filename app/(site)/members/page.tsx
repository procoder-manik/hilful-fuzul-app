import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { PageTitle } from '@/components/cards';
import { MembersGrid } from './MembersGrid';
import { getPublicMembers } from '@/lib/public';
import { getSiteSettings } from '@/lib/settings';
import { graph } from '@/lib/schema';
import { getT } from '@/lib/lang';
import { bn } from '@/lib/fmt';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('আমাদের সদস্য', 'Our members'), description: t('সংগঠনের নিবন্ধিত সদস্যদের তালিকা।', 'The registered members of our organisation.'), alternates: { canonical: '/members' } };
}

export default async function MembersPage() {
  const t = getT();
  const [s, list] = await Promise.all([getSiteSettings(), getPublicMembers()]);
  if (s.members_page_on === false) notFound();
  return (
    <>
      <JsonLd data={graph(s, [], [[t('আমাদের সদস্য', 'Our members'), '/members']])} />
      <PageTitle title={t('আমাদের সদস্য', 'Our members')} sub={list ? t(`${bn(list.length)} জন নিবন্ধিত সদস্য। কার্ডে চাপলে বিস্তারিত দেখুন।`, `${list.length} registered members. Tap a card to see details.`) : undefined} />
      <section style={{ padding: '20px 0 60px' }}><div className="wrap">
        {list === null
          ? <div className="notice warn">{t('সদস্যদের তথ্য এই মুহূর্তে আনা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।', 'Member details cannot be loaded right now. Please try again shortly.')}</div>
          : <MembersGrid list={list} />}
      </div></section>
    </>
  );
}
