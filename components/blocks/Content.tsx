import Link from 'next/link';
import { Icon, Pattern } from '../Icon';
import { CountUp } from '../CountUp';
import { SectionHead } from '../cards';
import { getLang } from '@/lib/lang';
import { bn as toBn } from '@/lib/fmt';

type P = Record<string, string>;
const en = () => getLang() === 'en';
/** বাংলা লেখা; ইংরেজি সংস্করণে ইংরেজি ঘর ভরা থাকলে সেটি */
const L = (p: P, k: string) => (en() && p[`${k}_en`] ? p[`${k}_en`] : p[k] ?? '');
const lines = (v: string | undefined) => (v ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
const isIn = (u: string) => u.startsWith('/') || u.startsWith('#');
const A = ({ href, className, children }: { href: string; className: string; children: React.ReactNode }) => (isIn(href) ? <Link className={className} href={href}>{children}</Link> : <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>);
const paras = (t: string) => t.split(/\n+/).filter(Boolean).map((x, i) => <p key={i}>{x}</p>);

export function HeadingText({ p }: { p: P }) {
  const c = p.align === 'center';
  return (
    <section className="sec bk-ht" style={{ textAlign: c ? 'center' : 'left' }}>
      <div className="wrap"><div className="bk-narrow" style={c ? { margin: '0 auto' } : undefined}>
        {p.tag && <span className="pill">{p.tag}</span>}
        <h2>{L(p, 'heading')}</h2>
        <div className="bk-text">{paras(L(p, 'text'))}</div>
        {p.btn && p.url && <div style={{ marginTop: 14 }}><A href={p.url} className="btn pri lg">{L(p, 'btn')}</A></div>}
      </div></div>
    </section>
  );
}

export function ImageText({ p }: { p: P }) {
  return (
    <section className="sec">
      <div className="wrap"><div className={`bk-it${p.side === 'right' ? ' r' : ''}`}>
        <div className="bk-img">{p.image ? <img src={p.image} alt="" loading="lazy" /> : <div className="bk-img-ph"><Icon name="image" /></div>}</div>
        <div className="bk-text-col">
          <h2>{L(p, 'heading')}</h2>
          <div className="bk-text">{paras(L(p, 'text'))}</div>
          {p.btn && p.url && <div style={{ marginTop: 14 }}><A href={p.url} className="btn pri">{L(p, 'btn')}</A></div>}
        </div>
      </div></div>
    </section>
  );
}

export function CardsBlock({ p }: { p: P }) {
  const items = lines(L(p, 'items') || p.items).map((l) => l.split('|').map((x) => x.trim()));
  const cols = ['2', '3', '4'].includes(p.cols) ? p.cols : '3';
  return (
    <section className="sec">
      <div className="wrap">
        {L(p, 'heading') && <SectionHead title={L(p, 'heading')} />}
        <div className={`bk-cards c${cols}`}>{items.map(([ic, t, tx], i) => <div className="bk-card" key={i}><span className="emo" aria-hidden="true">{ic}</span><h3>{t}</h3>{tx && <p>{tx}</p>}</div>)}</div>
      </div>
    </section>
  );
}

export function NumbersBlock({ p }: { p: P }) {
  const items = lines(p.items).map((l) => l.split('|').map((x) => x.trim()));
  const IC = ['coins', 'chart', 'handshake', 'users', 'heart', 'book'];
  const num = (v: string) => { const m = v.match(/^([\d০-৯,\.]+)(.*)$/); if (!m) return null; const n = Number(m[1].replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/,/g, '')); return Number.isFinite(n) ? [n, m[2]] as [number, string] : null; };
  return (
    <section style={{ padding: '10px 0 20px' }}>
      <div className="wrap"><div className="stats stats-color" style={{ gridTemplateColumns: `repeat(${Math.min(items.length || 1, 6)},1fr)` }}>
        {items.map(([v, l], i) => { const n = num(v); return (
          <div className={`stat sc${(i % 6) + 1}`} key={i}><span className="si" aria-hidden="true"><Icon name={IC[i % 6]} /></span><b>{n ? <><CountUp value={n[0]} />{n[1]}</> : v}</b><span className="sl">{l}</span></div>
        ); })}
      </div></div>
    </section>
  );
}

export function FaqBlock({ p }: { p: P }) {
  const items = lines(L(p, 'items') || p.items).map((l) => { const i = l.indexOf('|'); return i < 0 ? [l, ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; });
  return (
    <section className="sec">
      <div className="wrap"><div className="bk-narrow" style={{ margin: '0 auto' }}>
        {L(p, 'heading') && <SectionHead title={L(p, 'heading')} />}
        <div className="bk-faq">{items.map(([q, a], i) => <details key={i}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div></div>
    </section>
  );
}

export function ButtonsBlock({ p }: { p: P }) {
  const items = lines(p.items).map((l) => l.split('|').map((x) => x.trim()));
  return (
    <section style={{ padding: '24px 0' }}><div className="wrap"><div className="row" style={{ justifyContent: p.align === 'center' ? 'center' : 'flex-start' }}>
      {items.filter(([, u]) => u && /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(u)).map(([t, u, st], i) => <A key={i} href={u} className={`btn ${st === 'ghost' ? 'ghost' : 'pri'} lg`}>{t}</A>)}
    </div></div></section>
  );
}

export const Spacer = ({ p }: { p: P }) => <div aria-hidden="true" style={{ height: Number(p.h) || 40 }} />;

/** আহ্বানের ব্যানার: পাঁচ রঙ, হিরোর প্যাটার্নসহ */
export function CtaBlock({ p }: { p: P }) {
  const v = ['forest', 'gold', 'night', 'rose', 'light'].includes(p.variant) ? p.variant : 'forest';
  const perks = lines(p.perks);
  const IC = ['coins', 'handshake', 'eye'];
  const ok = (u: string) => u && /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(u);
  return (
    <section className="sec" style={{ paddingTop: 10 }}>
      <div className="wrap">
        <div className={`cta2 v-${v}`}>
          <Pattern />
          <span className="cta2-orb o1" aria-hidden="true" /><span className="cta2-orb o2" aria-hidden="true" />
          <div className="cta2-in">
            {L(p, 'tag') && <span className="cta2-tag"><Icon name="heart" /> {L(p, 'tag')}</span>}
            <h2>{L(p, 'title')}</h2>
            {L(p, 'text') && <p>{L(p, 'text')}</p>}
            {perks.length > 0 && <ul className="cta2-perks">{perks.map((x, i) => <li key={i}><Icon name={IC[i % 3]} /> {x}</li>)}</ul>}
            <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
              {p.btn1 && ok(p.url1) && <A href={p.url1} className="btn cta2-pri lg">{L(p, 'btn1')}</A>}
              {p.btn2 && ok(p.url2) && <A href={p.url2} className="btn cta2-gh lg">{L(p, 'btn2')}</A>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
void toBn;

/** সরল মার্কডাউন: "## শিরোনাম", "- তালিকা", বাকি সব অনুচ্ছেদ */
export function renderLite(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(<ul key={`u${out.length}`}>{list.map((x, i) => <li key={i}>{x}</li>)}</ul>); list = []; } };
  text.split('\n').map((x) => x.trim()).filter(Boolean).forEach((l, i) => {
    if (l.startsWith('- ')) { list.push(l.slice(2)); return; }
    flush();
    if (l.startsWith('## ')) out.push(<h2 key={`h${i}`}>{l.slice(3)}</h2>);
    else out.push(<p key={`p${i}`}>{l}</p>);
  });
  flush();
  return out;
}

export function Prose({ p }: { p: P }) {
  return (
    <section style={{ padding: '20px 0 60px' }}><div className={`wrap card prose`} style={{ maxWidth: p.width === 'wide' ? undefined : 820 }}>{renderLite(L(p, 'text'))}</div></section>
  );
}

export function ProseCards({ p, kpis }: { p: P; kpis?: React.ReactNode }) {
  return (
    <section className="sec" style={{ paddingTop: 20 }}><div className="wrap grid g2" style={{ alignItems: 'start' }}>
      <div className="card prose">{renderLite(L(p, 'left'))}</div>
      <div className="card prose">{renderLite(L(p, 'right'))}{p.kpis === '1' && kpis}</div>
    </div></section>
  );
}

export function TwoLists({ p, memberTerms, loanTerms }: { p: P; memberTerms: string[]; loanTerms: string[] }) {
  const own = p.from_settings !== '1';
  const a = own ? lines(L(p, 'items1') || p.items1) : memberTerms;
  const b = own ? lines(L(p, 'items2') || p.items2) : loanTerms;
  return (
    <section style={{ padding: '20px 0 60px' }}><div className="wrap grid g2" style={{ alignItems: 'start' }}>
      <div className="card"><h2 className="h2" style={{ marginTop: 0 }}>{L(p, 'h1')}</h2><ol className="terms">{a.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
      <div className="card"><h2 className="h2" style={{ marginTop: 0 }}>{L(p, 'h2')}</h2><ol className="terms">{b.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
    </div></section>
  );
}
