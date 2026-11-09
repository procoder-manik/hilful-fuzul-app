import type { Metadata } from 'next';
import { EventBanner } from '@/components/EventBanner';
import { JsonLd } from '@/components/JsonLd';
import { PageTitle } from '@/components/cards';
import { getEvents, past, upcoming } from '@/lib/public';
import { getSiteSettings } from '@/lib/settings';
import { eventSchema, graph, siteUrl } from '@/lib/schema';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('অনুষ্ঠান ও সভা', 'Events and meetings'), description: t('আসন্ন সভা, সেমিনার ও সেবামূলক কর্মসূচির সময়, স্থান, প্রধান অতিথি ও বিশেষ অতিথির তথ্য।', 'Time, venue, chief guest and special guest of upcoming meetings, seminars and service programmes.'), alternates: { canonical: '/events' } };
}
export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const t = getT();
  const [s, all] = await Promise.all([getSiteSettings(), getEvents()]);
  const up = upcoming(all), done = past(all);
  return (
    <>
      <JsonLd data={graph(s, up.map((e) => eventSchema(e, `${siteUrl()}/#org`)), [[t('অনুষ্ঠান', 'Events'), '/events']])} />
      <PageTitle title={t('অনুষ্ঠান ও সভা', 'Events and meetings')} sub={t('সভা, সেমিনার ও কর্মসূচির সময়সূচি। সবাই আমন্ত্রিত।', 'Schedule of meetings, seminars and programmes. Everyone is invited.')} />
      <section style={{ padding: '20px 0 60px' }}><div className="wrap">
        <h2>{t('আসন্ন', 'Upcoming')}</h2>
        {up.length === 0 ? <p className="muted">{t('এই মুহূর্তে কোনো আসন্ন অনুষ্ঠান নেই।', 'There are no upcoming events right now.')}</p> : (
          <div className="grid g2">{up.map((e) => <div key={e.id}><EventBanner e={e} />{e.outcome && <p className="muted small" style={{ margin: '10px 6px 0' }}><b>{t('পরবর্তী উদ্যোগ:', 'Next steps:')}</b> {e.outcome}</p>}</div>)}</div>
        )}
        {done.length > 0 && <><h2 style={{ marginTop: 36 }}>{t('সম্পন্ন অনুষ্ঠান', 'Past events')}</h2><div className="grid g2">{done.map((e) => <EventBanner key={e.id} e={e} />)}</div></>}
      </div></section>
    </>
  );
}
