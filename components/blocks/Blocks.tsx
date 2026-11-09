import { SecWrap } from '../SecWrap';
import { Committee, Events, Hero, Ledger, Library, News, Services, Stats } from '../sections';
import { PageTitle } from '../cards';
import { CardsBlock, CtaBlock, FaqBlock, HeadingText, ImageText, NumbersBlock, ButtonsBlock, Spacer, Prose, ProseCards, TwoLists } from './Content';
import { ContactSection } from '@/app/(site)/contact/ContactSection';
import { ServiceGrid } from '../cards';
import { QardBlock } from './QardBlock';
import { fillTokens } from '@/lib/tokens';
import { bn as toBn } from '@/lib/fmt';
import { getT } from '@/lib/lang';
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
    has('hero', 'stats', 'ledger', 'library', 'prose_cards') ? getStats() : none(null),
    has('hero', 'ledger') ? getMonthly() : none([]),
    has('ledger') ? getLoans(40) : none([]),
    has('ledger') ? getDonations(40) : none([]),
    has('services', 'service_grid') ? getPrograms() : none([]),
    has('committee') ? getCommittee() : none([]),
    has('news') ? getPosts(3) : none([]),
    has('library') ? getBooks() : none([]),
    has('hero', 'events') ? getEvents() : none([]),
  ]);
  const up = upcoming(events as Awaited<ReturnType<typeof getEvents>>);
  const heroEvent = up.find((e) => e.show_in_hero) ?? up[0];
  const view = (b0: Block) => {
    const p: Record<string, string> = Object.fromEntries(Object.entries(b0.props).map(([k, v]) => [k, fillTokens(v, s)]));
    const b = b0;
    switch (b.type) {
      case 'page_header': { const en = getLang() === 'en'; return <PageTitle title={(en && p.title_en) || p.title || pageTitle || ''} sub={(en && p.text_en) || p.text || undefined} crumbs={p.crumbs !== '0'} align={p.align} style={blockStyle(b)} />; }
      case 'page_body': return body ?? null;
      case 'hero': return <Hero s={s} st={st!} monthly={monthly as never} next={heroEvent} />;
      case 'stats': return <Stats st={st!} />;
      case 'ledger': return <Ledger st={st!} monthly={monthly as never} loans={loans as never} donations={donations as never} />;
      case 'events': return <Events list={up} />;
      case 'services': return <Services list={programs as never} />;
      case 'qard': return <QardBlock s={s} p={p} />;
      case 'prose': return <Prose p={p} />;
      case 'prose_cards': return <ProseCards p={p} kpis={st ? <Kpis st={st} s={s} /> : null} />;
      case 'two_lists': return <TwoLists p={p} memberTerms={s.member_terms} loanTerms={s.loan_terms} />;
      case 'contact_us': return <ContactSection s={s} formTitle={(getLang() === 'en' && p.form_title_en) || p.form_title} showForm={p.show_form !== '0'} showCards={p.show_cards !== '0'} />;
      case 'service_grid': return <section className="sec" style={{ paddingTop: 20 }}><div className="wrap"><ServiceGrid list={programs as never} /></div></section>;
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
        // পেজ-হেডার নিজেই নিজের রং সামলায়, তাই আলাদা রঙের মোড়ক লাগে না
        const inner = b.type === 'page_header' ? <div>{node}</div> : <SecWrap st={blockStyle(b)}><div>{node}</div></SecWrap>;
        // অ্যাডমিনের বাছা ওপরে-নিচের প্যাডিং (সেকশনের ভেতরের ফাঁক) ও মার্জিন (সেকশনের বাইরের ফাঁক)
        const has = (k: 'pt' | 'pb' | 'mt' | 'mb') => typeof b[k] === 'number';
        if (!has('pt') && !has('pb') && !has('mt') && !has('mb')) return <div key={b.id}>{inner}</div>;
        const style = { ...(has('pt') ? { '--blk-pt': `${b.pt}px` } : {}), ...(has('pb') ? { '--blk-pb': `${b.pb}px` } : {}), ...(has('mt') ? { marginTop: b.mt } : {}), ...(has('mb') ? { marginBottom: b.mb } : {}) } as React.CSSProperties;
        return <div key={b.id} className={`blk${has('pt') ? ' blk-pt' : ''}${has('pb') ? ' blk-pb' : ''}`} style={style}>{inner}</div>;
      })}
    </>
  );
}

function Kpis({ st, s }: { st: NonNullable<Awaited<ReturnType<typeof getStats>>>; s: { established: string | null } }) {
  const t = getT();
  return (
    <div className="grid g2" style={{ gap: 10 }}>
      <div className="kpi"><span>{t('সদস্য', 'Members')}</span><b>{toBn(st.members)}</b></div>
      <div className="kpi"><span>{t('উপকৃত মানুষ', 'People helped')}</span><b>{toBn(st.program_beneficiaries + st.borrowers)}+</b></div>
      <div className="kpi"><span>{t('পাঠাগারে বই', 'Library books')}</span><b>{toBn(st.books)}</b></div>
      <div className="kpi"><span>{t('প্রতিষ্ঠা', 'Founded')}</span><b>{s.established}</b></div>
    </div>
  );
}
