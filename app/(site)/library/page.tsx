import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { BookCover, PageTitle } from '@/components/cards';
import { getBooks, isNewBook } from '@/lib/public';
import { getSiteSettings } from '@/lib/settings';
import { graph, siteUrl } from '@/lib/schema';
import { getT } from '@/lib/lang';
import { bn } from '@/lib/fmt';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('পাঠাগার', 'Library'), description: t('ইসলামিক, জীবনমুখী ও শিক্ষামূলক বইয়ের তালিকা, নতুন বই এবং বিনামূল্যে কুরআন শিক্ষার তথ্য।', 'Islamic, life-skills and educational books, new arrivals and information about free Quran classes.'), alternates: { canonical: '/library' } };
}
export const dynamic = 'force-dynamic';

export default async function LibraryPage({ searchParams }: { searchParams: { q?: string; cat?: string } }) {
  const t = getT();
  const [s, all] = await Promise.all([getSiteSettings(), getBooks()]);
  const q = (searchParams.q ?? '').trim();
  const cat = searchParams.cat ?? '';
  const cats = Array.from(new Set(all.map((b) => b.category).filter(Boolean))) as string[];
  const books = all.filter((b) => (!cat || (cat === 'new' ? isNewBook(b) : b.category === cat)) && (!q || `${b.title} ${b.author ?? ''}`.includes(q)));
  const copies = all.reduce((a, b) => a + b.copies, 0);
  const out = all.reduce((a, b) => a + (b.copies - b.available), 0);
  const link = (c: string) => `/library?${new URLSearchParams({ ...(q ? { q } : {}), ...(c ? { cat: c } : {}) })}`;
  return (
    <>
      <JsonLd data={graph(s, [{ '@type': 'Library', name: `${s.org_name} ${t('পাঠাগার', 'Library')}`, parentOrganization: { '@id': `${siteUrl()}/#org` }, address: s.address ?? undefined, isAccessibleForFree: true }], [[t('পাঠাগার', 'Library'), '/library']])} />
      <PageTitle title={t('পাঠাগার', 'Library')} sub={t('পাঠাগারে বসে পড়ার জন্য সবার জন্য উন্মুক্ত। কুরআন শিক্ষার ক্লাসও এখানেই হয়।', 'Open to everyone to read at the library. Quran classes are held here too.')} />
      <section style={{ padding: '20px 0 60px' }}><div className="wrap">
        <div className="grid g4">
          <div className="kpi"><span>{t('শিরোনাম', 'Titles')}</span><b>{bn(all.length)}</b></div>
          <div className="kpi"><span>{t('মোট কপি', 'Total copies')}</span><b>{bn(copies)}</b></div>
          <div className="kpi"><span>{t('এখন পাঠকের কাছে', 'With readers now')}</span><b>{bn(out)}</b></div>
          <div className="kpi"><span>{t('নতুন বই', 'New books')}</span><b>{bn(all.filter(isNewBook).length)}</b></div>
        </div>
        <form className="row" style={{ margin: '20px 0 10px' }} role="search">
          <input name="q" defaultValue={q} placeholder={t('বই বা লেখকের নাম', 'Book or author name')} style={{ maxWidth: 320 }} aria-label={t('বই খুঁজুন', 'Search books')} />
          {cat && <input type="hidden" name="cat" value={cat} />}
          <button className="btn">{t('খুঁজুন', 'Search')}</button>
        </form>
        <div className="seg wrapable" style={{ marginBottom: 18 }}>
          <Link className={!cat ? 'on' : ''} href={link('')}>{t('সব', 'All')}</Link>
          <Link className={cat === 'new' ? 'on' : ''} href={link('new')}>{t('নতুন', 'New')}</Link>
          {cats.map((c) => <Link key={c} className={cat === c ? 'on' : ''} href={link(c)}>{c}</Link>)}
        </div>
        {books.length === 0 && <p className="muted">{t('এই নামে কোনো বই পাওয়া যায়নি।', 'No books found with that name.')}</p>}
        <div className="books">
          {books.map((b) => (
            <div key={b.id}>
              <BookCover b={b} />
              <div className="small" style={{ marginTop: 6 }}><b>{b.title}</b><div className="muted">{b.author}</div>
                <div className={b.available > 0 ? 'ok-t' : 'bad-t'}>{b.available > 0 ? t(`${bn(b.available)}/${bn(b.copies)} কপি পাঠাগারে`, `${bn(b.available)}/${bn(b.copies)} copies available`) : t('সব কপি পাঠকের কাছে', 'All copies are out')}{b.shelf ? `, ${b.shelf}` : ''}</div></div>
            </div>
          ))}
        </div>
        {s.quran_info && <div className="card row" style={{ marginTop: 24, flexWrap: 'nowrap' }}><div style={{ fontSize: '2rem' }} aria-hidden="true">📖</div><div><b>{t('কুরআন শিক্ষা', 'Quran classes')}</b><p className="muted small" style={{ margin: 0 }}>{s.quran_info}</p></div></div>}
      </div></section>
    </>
  );
}
