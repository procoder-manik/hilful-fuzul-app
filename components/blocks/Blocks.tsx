import { SecWrap } from '../SecWrap';
import { Committee, Events, Hero, Ledger, Library, News, Qard, Services, Stats } from '../sections';
import { PageTitle } from '../cards';
import { CardsBlock, CtaBlock, FaqBlock, HeadingText, ImageText, NumbersBlock, ButtonsBlock, Spacer } from './Content';
import { getBooks, getCommittee, getDonations, getEvents, getLoans, getMonthly, getPosts, getPrograms, getStats, upcoming } from '@/lib/public';
import { getSiteSettings } from '@/lib/settings';
import { blockStyle, type Block } from '@/lib/blocks';
import { getLang } from '@/lib/lang';

const none = <T,>(v: T) => Promise.resolve(v);

/** ব্লকের তালিকা পর্দায় আঁকে: যে তথ্য লাগে শুধু সেটুকুই ডেটাবেস থেকে আনে। হোমপেজ ও নতুন পেজ দুটোতেই এটি ব্যবহার হয়। */
export async function Blocks({ blocks, pageTitle, body }: { blocks: Block[]; pageTitle?: string; body?: React.ReactNode }) {
  const on = blocks.filter((b) => b.on);
  const has = (...t: string[]) => on.some((b) => t.includes(b.type));
  const [s, st, monthly, loans, donations, programs, committee, posts, books, events] = await Promise.all([
    getSiteSettings(),
    has('hero', 'stats', 'ledger', 'library') ? getStats() : none(null),
    has('hero', 'ledger') ? getMonthly() : none([]),
    has('ledger') ? getLoans(40) : none([]),
    has('ledger') ? getDonations(40) : none([]),
    has('services') ? getPrograms() : none([]),
    has('committee') ? getCommittee() : none([]),
    has('news') ? getPosts(3) : none([]),
    has('library') ? getBooks() : none([]),
    has('hero', 'events') ? getEvents() : none([]),
  ]);
  const up = upcoming(events as Awaited<ReturnType<typeof getEvents>>);
  const heroEvent = up.find((e) => e.show_in_hero) ?? up[0];
  const view = (b: Block) => {
    const p = b.props;
    switch (b.type) {
      case 'page_header': { const en = getLang() === 'en'; return <PageTitle title={(en && p.title_en) || p.title || pageTitle || ''} sub={(en && p.text_en) || p.text || undefined} crumbs={p.crumbs !== '0'} align={p.align} style={blockStyle(b)} />; }
      case 'page_body': return body ?? null;
      case 'hero': return <Hero s={s} st={st!} monthly={monthly as never} next={heroEvent} />;
      case 'stats': return <Stats st={st!} />;
      case 'ledger': return <Ledger st={st!} monthly={monthly as never} loans={loans as never} donations={donations as never} />;
      case 'events': return <Events list={up} />;
      case 'services': return <Services list={programs as never} />;
      case 'qard': return <Qard s={s} />;
      case 'library': return <Library s={s} st={st!} books={books as never} />;
      case 'committee': return <Committee list={committee as never} />;
      case 'news': return <News list={posts as never} />;
      case 'heading_text': return <HeadingText p={p} />;
      case 'image_text': return <ImageText p={p} />;
      case 'cards': return <CardsBlock p={p} />;
      case 'numbers': return <NumbersBlock p={p} />;
      case 'faq': return <FaqBlock p={p} />;
      case 'buttons': return <ButtonsBlock p={p} />;
      case 'spacer': return <Spacer p={p} />;
      case 'cta': return <CtaBlock p={p} />;
      default: return null;
    }
  };
  return (
    <>
      {on.map((b) => {
        const node = view(b);
        if (!node) return null;
        // পেজ-হেডার নিজেই নিজের রং সামলায়, তাই আলাদা মোড়ক লাগে না
        return b.type === 'page_header' ? <div key={b.id}>{node}</div> : <SecWrap key={b.id} st={blockStyle(b)}><div>{node}</div></SecWrap>;
      })}
    </>
  );
}
