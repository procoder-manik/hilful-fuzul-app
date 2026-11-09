import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { MemberCard, PageTitle } from '@/components/cards';
import { getCommittee } from '@/lib/public';
import { getSiteSettings } from '@/lib/settings';
import { graph, siteUrl } from '@/lib/schema';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('কার্যনির্বাহী কমিটি', 'Executive committee'), description: t('সংগঠনের কার্যনির্বাহী কমিটির সদস্য, পদ ও দায়িত্ব।', 'Members, positions and responsibilities of the executive committee.'), alternates: { canonical: '/committee' } };
}

export default async function CommitteePage() {
  const t = getT();
  const [s, list] = await Promise.all([getSiteSettings(), getCommittee()]);
  const people = list.map((c) => ({ '@type': 'OrganizationRole', roleName: c.role, member: { '@type': 'Person', name: c.name } }));
  return (
    <>
      <JsonLd data={graph(s, [{ '@type': 'Organization', '@id': `${siteUrl()}/#org`, member: people }], [[t('কমিটি', 'Committee'), '/committee']])} />
      <PageTitle title={t('কার্যনির্বাহী কমিটি', 'Executive committee')} sub={t('কে কোন দায়িত্বে আছেন।', 'Who is responsible for what.')} />
      <section style={{ padding: '20px 0 60px' }}><div className="wrap"><div className="team">{list.map((c) => <MemberCard key={c.id} c={c} />)}</div></div></section>
    </>
  );
}
