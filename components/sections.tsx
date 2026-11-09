import Link from 'next/link';
import { CollectionChart, Sparkline } from './Charts';
import { CountUp } from './CountUp';
import { EventBanner } from './EventBanner';
import { Icon, Pattern } from './Icon';
import { BookCover, MemberCard, NewsCard, SectionHead, ServiceGrid } from './cards';
export { Qard } from './cards';
export { BookCover, MemberCard, NewsCard, PageTitle, SectionHead, ServiceGrid } from './cards';
import { bn, fd, initials, monthsShort, tk } from '@/lib/fmt';
import { getT } from '@/lib/lang';
import { type Book, type CommitteeMember, type EventRow, type MonthRow, type Post, type Program, type PublicDonation, type PublicLoan } from '@/lib/public';
import type { PublicStats, Settings } from '@/lib/types';

export function Hero({ s, st, monthly, next }: { s: Settings; st: PublicStats; monthly: MonthRow[]; next?: EventRow }) {
  const t = getT();
  const h = s.hero ?? {};
  return (
    <section className="hero">
      <Pattern />
      <div className="wrap hero-in">
        <div className="load-in">
          <span className="pill"><Icon name="shield" /> {s.established ? t(`${s.established} সাল থেকে এলাকার সেবায়`, `Serving the community since ${s.established}`) : t('এলাকার সেবায় নিবেদিত', 'Dedicated to serving the community')}</span>
          <h1>{h.title || t('মাদকমুক্ত যুবসমাজ', 'A drug-free youth community')}<span className="l2">{h.title2 || t('দ্বীনের পথে সুন্দর সমাজ', 'A beautiful society on the path of faith')}</span></h1>
          <p className="lead">{h.sub || t('আমরা সদস্যদের মাসিক সঞ্চয় থেকে বিনা সুদে ঋণ দিই, পাঠাগার চালাই, কুরআন শেখাই এবং এলাকার মানুষের পাশে দাঁড়াই। প্রতিটি টাকার হিসাব এখানে সবার জন্য খোলা।', 'We give interest-free loans from our members’ monthly savings, run a library, teach the Quran and stand by people in our area. Every taka is accounted for, openly, for everyone to see.')}</p>
          <div className="row" style={{ marginTop: 22 }}>
            <Link className="btn pri lg" href="/join"><Icon name="user" /> {t('সদস্য হোন', 'Join us')}</Link>
            <Link className="btn ghost lg" href="/transparency"><Icon name="eye" /> {t('হিসাব দেখুন', 'View accounts')}</Link>
          </div>
        </div>
        <div className="hero-card load-in d2">
          <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted small">{t('মোট তহবিল সংগ্রহ', 'Total fund raised')}</span><span className="badge b-ok">{t('সবার জন্য উন্মুক্ত', 'Open to all')}</span></div>
          <div className="big"><CountUp value={st.total_fund} money /></div>
          <Sparkline values={monthly.slice(-6).map((m) => Number(m.collected))} />
          <div className="hero-split">
            <div><span className="muted small">{t('এই মাসে সংগ্রহ', 'Collected this month')}</span><b>{tk(st.month_collected)}</b></div>
            <div><span className="muted small">{t('এই মাসে ঋণ বিতরণ', 'Loans this month')}</span><b>{tk(st.month_loaned)}</b></div>
            <div><span className="muted small">{t('বর্তমানে হাতে আছে', 'Currently in hand')}</span><b>{tk(st.total_fund - st.total_loaned + st.total_repaid)}</b></div>
            <div><span className="muted small">{t('ঋণ পেয়েছেন', 'Borrowers')}</span><b>{t(`${bn(st.borrowers)} জন সদস্য`, `${bn(st.borrowers)} members`)}</b></div>
          </div>
          {next && (
            <Link href="/events" className="hero-ev">
              <span style={{ fontSize: '1.4rem' }} aria-hidden="true">{String(next.design?.icon ?? '📅')}</span>
              <span><b>{next.title}</b><span className="muted small">{fd(next.event_date)}{next.event_time ? `, ${next.event_time}` : ''}</span></span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function Stats({ st }: { st: PublicStats }) {
  const t = getT();
  const items: [number, string, boolean][] = [[st.total_fund, t('মোট তহবিল', 'Total fund'), true], [st.month_collected, t('এই মাসে সংগ্রহ', 'This month'), true], [st.total_loaned, t('মোট বিনা সুদে ঋণ', 'Interest-free loans'), true], [st.members, t('মোট সদস্য', 'Members'), false], [st.program_beneficiaries + st.borrowers, t('উপকৃত মানুষ', 'People helped'), false], [st.books, t('পাঠাগারে বই', 'Library books'), false]];
  return (
    <section style={{ padding: '10px 0 20px' }}>
      <div className="wrap"><div className="stats load-in d3">{items.map(([v, l, m]) => <div className="stat" key={l}><b><CountUp value={v} money={m} /></b><span>{l}</span></div>)}</div></div>
    </section>
  );
}

export function Ledger({ st, monthly, loans, donations }: { st: PublicStats; monthly: MonthRow[]; loans: PublicLoan[]; donations: PublicDonation[] }) {
  const t = getT();
  const ms = monthsShort();
  const m6 = monthly.slice(-6);
  const cur = new Date().toISOString().slice(0, 7);
  const thisMonth = donations.filter((d) => d.donated_on.startsWith(cur));
  const lrows = loans.map((l) => (
    <div className="lrow" key={l.id}><div className="av">{initials(l.borrower)}</div><div><b>{l.borrower}</b><span className="muted small">{fd(l.issued_on)}, {t(`${bn(l.term_months)} মাস মেয়াদ`, `${bn(l.term_months)}-month term`)}</span></div><span className="amt">{tk(l.amount)}</span></div>
  ));
  const drows = donations.slice(0, 12).map((d) => (
    <div className="lrow" key={d.id}><div className="av"><Icon name="heart" /></div><div><b>{d.donor}</b><span className="muted small">{d.purpose}, {fd(d.donated_on)}</span></div><span className="amt">{tk(d.amount)}</span></div>
  ));
  return (
    <section className="sec">
      <div className="wrap">
        <SectionHead title={t('স্বচ্ছতার খাতা', 'Open ledger')} sub={t(`কে কত দিলেন, কে কত ঋণ পেলেন, সব হিসাব প্রতিদিন হালনাগাদ হয়। এই মাসে ${bn(thisMonth.length)} জন দাতা ${tk(thisMonth.reduce((a, d) => a + Number(d.amount), 0))} দান করেছেন।`, `Who gave how much and who received which loan is updated daily. This month ${bn(thisMonth.length)} donors gave ${tk(thisMonth.reduce((a, d) => a + Number(d.amount), 0))}.`)} href="/transparency" cta={t('পূর্ণ হিসাব', 'Full accounts')} />
        <div className="ledger">
          <div className="card"><b>{t('গত ৬ মাস: সংগ্রহ বনাম ঋণ', 'Last 6 months: collected vs loaned')}</b>
            <CollectionChart labels={m6.map((x) => ms[Number(x.month.slice(5, 7)) - 1])} collected={m6.map((x) => +x.collected)} loaned={m6.map((x) => +x.loaned)} repaid={m6.map((x) => +x.repaid)} />
          </div>
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}><b>{t('করজে হাসানা পেয়েছেন', 'Interest-free loans given')}</b><span className="badge b-info">{tk(st.total_loaned)}</span></div>
            {loans.length ? <div className="vscroll"><div className="vtrack">{lrows}<div aria-hidden="true">{lrows}</div></div></div> : <p className="muted">{t('এখনো কোনো ঋণ দেওয়া হয়নি।', 'No loans have been given yet.')}</p>}
          </div>
        </div>
        {donations.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}><b>{t('সাম্প্রতিক দাতাগণ', 'Recent donors')}</b><span className="muted small">{t('আল্লাহ সবার দান কবুল করুন', 'May Allah accept everyone’s giving')}</span></div>
            <div className="vscroll" style={{ height: 220 }}><div className="vtrack" style={{ animationDuration: '26s' }}>{drows}<div aria-hidden="true">{drows}</div></div></div>
          </div>
        )}
      </div>
    </section>
  );
}

export function Services({ list }: { list: Program[] }) {
  const t = getT();
  if (!list.length) return null;
  return <section className="sec" style={{ paddingTop: 20 }}><div className="wrap"><SectionHead title={t('আমরা যা করি', 'What we do')} sub={t('স্বাস্থ্য, শিক্ষা, খেলাধুলা আর বিপদে সহায়তা। সব কাজ চলে সদস্যদের চাঁদা ও শুভানুধ্যায়ীদের দানে।', 'Health, education, sports and help in hard times, all funded by members’ contributions and well-wishers’ donations.')} href="/services" cta={t('সব সেবা', 'All services')} /><ServiceGrid list={list.slice(0, 6)} /></div></section>;
}

export function Events({ list }: { list: EventRow[] }) {
  const t = getT();
  if (!list.length) return null;
  return <section className="sec" style={{ paddingTop: 10 }}><div className="wrap"><SectionHead title={t('আসন্ন অনুষ্ঠান', 'Upcoming events')} sub={t('সভা, সেমিনার ও সেবামূলক কর্মসূচিতে আপনাকে আমন্ত্রণ।', 'You are invited to our meetings, seminars and service programmes.')} href="/events" cta={t('সব অনুষ্ঠান', 'All events')} /><div className="grid g2">{list.slice(0, 2).map((e) => <EventBanner key={e.id} e={e} />)}</div></div></section>;
}

export function Library({ s, st, books }: { s: Settings; st: PublicStats; books: Book[] }) {
  const t = getT();
  return (
    <section className="sec" style={{ paddingTop: 10 }}>
      <div className="wrap">
        <SectionHead title={t('পাঠাগার', 'Library')} sub={t(`${bn(st.book_titles)} শিরোনামে মোট ${bn(st.books)}টি বই। ইসলামিক, জীবনমুখী ও শিক্ষামূলক বই পাঠাগারে বসে পড়ার সুযোগ।`, `${bn(st.books)} books across ${bn(st.book_titles)} titles. Islamic, life-skills and educational books to read at the library.`)} href="/library" cta={t('বইয়ের তালিকা', 'Book list')} />
        <div className="hscroll">{books.slice(0, 10).map((b) => <BookCover key={b.id} b={b} />)}</div>
        {s.quran_info && <div className="card row" style={{ marginTop: 16, flexWrap: 'nowrap' }}><div style={{ fontSize: '2rem' }} aria-hidden="true">📖</div><div><b>{t('কুরআন শিক্ষা', 'Quran classes')}</b><p className="muted small" style={{ margin: 0 }}>{s.quran_info}</p></div></div>}
      </div>
    </section>
  );
}

export function Committee({ list }: { list: CommitteeMember[] }) {
  const t = getT();
  if (!list.length) return null;
  return <section className="sec" style={{ paddingTop: 10 }}><div className="wrap"><SectionHead title={t('যারা দায়িত্বে', 'Who is in charge')} sub={t('নির্বাচিত কার্যনির্বাহী কমিটি সংগঠনের সব কাজের জন্য জবাবদিহি করে।', 'The elected executive committee is accountable for everything the organisation does.')} href="/committee" cta={t('পূর্ণ কমিটি', 'Full committee')} /><div className="team">{list.slice(0, 4).map((c) => <MemberCard key={c.id} c={c} />)}</div></div></section>;
}

export function News({ list }: { list: Post[] }) {
  const t = getT();
  if (!list.length) return null;
  return <section className="sec" style={{ paddingTop: 10 }}><div className="wrap"><SectionHead title={t('সংবাদ ও কার্যক্রম', 'News and activities')} href="/news" cta={t('সব সংবাদ', 'All news')} /><div className="grid g3">{list.slice(0, 3).map((p) => <NewsCard key={p.id} p={p} />)}</div></div></section>;
}

export function JoinCta() {
  const t = getT();
  return (
    <section className="sec" style={{ paddingTop: 10 }}>
      <div className="wrap"><div className="card cta">
        <h2>{t('মাসে ৫০ টাকায় সমাজ বদলের অংশ হোন', 'Be part of changing society for just 50 taka a month')}</h2>
        <p className="muted">{t('আপনার ছোট সঞ্চয় বিপদে পড়া একজন প্রতিবেশীর বড় ভরসা। সদস্যরা প্রয়োজনে নিজেও বিনা সুদে ঋণ নিতে পারেন।', 'Your small saving can be a big support for a neighbour in trouble. Members can also borrow interest-free when they need to.')}</p>
        <div className="row" style={{ justifyContent: 'center' }}><Link className="btn pri lg" href="/join">{t('সদস্য ফর্ম পূরণ করুন', 'Register as a member')}</Link><Link className="btn ghost lg" href="/form"><Icon name="print" /> {t('ফর্ম প্রিন্ট করুন', 'Print the form')}</Link></div>
      </div></div>
    </section>
  );
}
