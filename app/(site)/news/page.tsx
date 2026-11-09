import type { Metadata } from 'next';
import { BuiltinPage } from '@/components/blocks/BuiltinPage';
import { NewsCard } from '@/components/cards';
import { getPosts } from '@/lib/public';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('সংবাদ ও কার্যক্রম', 'News and activities'), description: t('সংগঠনের সাম্প্রতিক কার্যক্রম, ক্যাম্প, বিতরণ ও অনুষ্ঠানের খবর।', 'Latest activities, camps, distributions and events of the organisation.'), alternates: { canonical: '/news' } };
}
export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const t = getT();
  const posts = await getPosts(60);
  return (
    <>
      <BuiltinPage slug="news" title={t('সংবাদ ও কার্যক্রম', 'News and activities')}>
      <section style={{ padding: '20px 0 60px' }}><div className="wrap">
        {posts.length === 0 ? <p className="muted">{t('এখনো কোনো সংবাদ প্রকাশ হয়নি।', 'No news has been published yet.')}</p> : <div className="grid g3">{posts.map((p) => <NewsCard key={p.id} p={p} />)}</div>}
      </div></section>
      </BuiltinPage>
    </>
  );
}
