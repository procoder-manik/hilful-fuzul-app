import { EventBanner } from '@/components/EventBanner';
import { EventPopup } from '@/components/EventPopup';
import { JsonLd } from '@/components/JsonLd';
import { Committee, Events, Hero, JoinCta, Ledger, Library, News, Qard, Services, Stats } from '@/components/sections';
import { getBooks, getCommittee, getDonations, getEvents, getLoans, getMonthly, getPosts, getPrograms, getStats, upcoming } from '@/lib/public';
import { getSiteSettings } from '@/lib/settings';
import { graph } from '@/lib/schema';
import { SecWrap } from '@/components/SecWrap';
import { DEFAULT_ORDER } from '@/lib/sectionstyle';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [s, st, monthly, loans, donations, programs, committee, posts, books, events] = await Promise.all([
    getSiteSettings(), getStats(), getMonthly(), getLoans(40), getDonations(40), getPrograms(), getCommittee(), getPosts(3), getBooks(), getEvents(),
  ]);
  const up = upcoming(events);
  const popup = up.find((e) => e.show_popup);
  const heroEvent = up.find((e) => e.show_in_hero) ?? up[0];
  const cfg = s.home_sections?.length ? s.home_sections.filter((x) => x.on) : DEFAULT_ORDER.map((k) => ({ k, on: true } as { k: string; on: boolean; bg?: string; pat?: string; op?: number }));
  const P: Record<string, React.ReactNode> = {
    hero: <Hero s={s} st={st} monthly={monthly} next={heroEvent} />,
    stats: <Stats st={st} />,
    ledger: <Ledger st={st} monthly={monthly} loans={loans} donations={donations} />,
    events: <Events list={up} />,
    services: <Services list={programs} />,
    qard: <Qard s={s} />,
    library: <Library s={s} st={st} books={books} />,
    committee: <Committee list={committee} />,
    news: <News list={posts} />,
    cta: <JoinCta />,
  };
  return (
    <>
      <JsonLd data={graph(s)} />
      {cfg.filter((x) => P[x.k]).map((x) => <SecWrap key={x.k} st={x as never}><div>{P[x.k]}</div></SecWrap>)}
      {popup && <EventPopup id={popup.id} outcome={popup.outcome}><EventBanner e={popup} /></EventPopup>}
    </>
  );
}
