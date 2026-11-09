import Link from 'next/link';
import { Breadcrumb } from './Breadcrumb';
import { getSettings } from '@/lib/settings';
import { cleanStyle, DEFAULT_PAGEHEAD, styleCss, type SecStyle } from '@/lib/sectionstyle';
import { fd, initials, tk, bn } from '@/lib/fmt';
import { getT } from '@/lib/lang';
import type { Settings } from '@/lib/types';
import { isNewBook, type Book, type CommitteeMember, type Post, type Program } from '@/lib/public';

export function SectionHead({ title, sub, href, cta }: { title: string; sub?: string; href?: string; cta?: string }) {
  return (
    <div className="sec-h">
      <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
      {href && <Link className="btn ghost" href={href}>{cta}</Link>}
    </div>
  );
}

export async function PageTitle({ title, sub, style, crumbs = true, align }: { title: string; sub?: string; style?: Partial<SecStyle> | null; crumbs?: boolean; align?: string }) {
  const own = style && (style.bg && style.bg !== 'none' || style.pat && style.pat !== 'none') ? cleanStyle(style) : null;
  const st = own ?? cleanStyle((await getSettings()).theme?.pagehead as never, DEFAULT_PAGEHEAD);
  const c = styleCss(st);
  return (
    <section className={`page-title ph2${align === 'center' ? ' center' : ''}${c.tinted ? ' secbg-c' : ''}${c.deep ? ' secbg-deep' : ''}`} style={c.box}>
      {st.pat !== 'none' && <div className={`sec-pat bnp-${st.pat}`} style={{ opacity: st.op, color: c.patColor }} aria-hidden="true" />}
      <div className="wrap">
        {crumbs && <Breadcrumb title={title} />}
        <h1>{title}</h1>
        {sub && <p className="lead">{sub}</p>}
      </div>
    </section>
  );
}

export function ServiceGrid({ list }: { list: Program[] }) {
  const t = getT();
  return (
    <div className="svc">
      {list.map((p) => (
        <div className="svc-i" key={p.id}>
          <div className="emo" aria-hidden="true">{p.icon}</div>
          <div><h3>{p.title}</h3><p>{p.description}</p>{p.beneficiaries > 0 && <span className="badge b-ok" style={{ marginTop: 8 }}>{bn(p.beneficiaries)}{t('+ জন উপকৃত', '+ people helped')}</span>}</div>
        </div>
      ))}
    </div>
  );
}

const COVERS = [['#0e5a43', '#1b8a68'], ['#7a1f3d', '#c2456a'], ['#1b3b6f', '#3f7fd0'], ['#5b3a0e', '#b07a2a'], ['#3d2a6b', '#7a5fc4'], ['#16413f', '#2f8f86']];
export function BookCover({ b }: { b: Book }) {
  const t = getT();
  let h = 0; for (const c of b.title) h = (h + c.charCodeAt(0)) % COVERS.length;
  const [a, z] = COVERS[h];
  return (
    <div className="cover" style={b.cover_url ? { backgroundImage: `url('${b.cover_url}')`, backgroundSize: 'cover' } : { background: `linear-gradient(150deg, ${a}, ${z})` }}>
      {isNewBook(b) && <span className="nw">{t('নতুন', 'New')}</span>}
      {!b.cover_url && <><small>{b.category}</small><b>{b.title}</b><small>{b.author}</small></>}
    </div>
  );
}

export function MemberCard({ c }: { c: CommitteeMember }) {
  return <div className="mem"><div className="av">{c.photo_url ? <img src={c.photo_url} alt="" /> : initials(c.name)}</div><h3>{c.name}</h3><div className="role">{c.role}</div>{c.duty && <p className="muted small">{c.duty}</p>}</div>;
}

export function NewsCard({ p }: { p: Post }) {
  return (
    <Link className="card news" href={`/news/${p.id}`}>
      {p.image_url && <img src={p.image_url} alt="" />}
      <span className="muted small">{fd(p.published_on)}</span>
      <h3>{p.title}</h3>
      <p className="muted small">{(p.body ?? '').slice(0, 120)}{(p.body ?? '').length > 120 ? '...' : ''}</p>
    </Link>
  );
}

export function Qard({ s, over }: { s: Settings; over?: { tag?: string; heading?: string; text?: string; steps?: [string, string][] } }) {
  const t = getT();
  const steps = [
    [t('সদস্য হোন', 'Become a member'), t(`ফর্ম পূরণ করে ${tk(s.reg_fee)} ভর্তি ফি দিন।`, `Fill in the form and pay the ${tk(s.reg_fee)} joining fee.`)],
    [t('মাসিক সঞ্চয় করুন', 'Save every month'), t('৫০, ১০০, ৫০০ বা সামর্থ্য অনুযায়ী প্রতি মাসে জমা দিন।', 'Deposit 50, 100, 500 or whatever you can afford each month.')],
    [t('প্রয়োজনে আবেদন করুন', 'Apply when in need'), t('একজন জামিনদারসহ কোষাধ্যক্ষের কাছে আবেদন করুন।', 'Apply to the treasurer with one guarantor.')],
    [t('মেয়াদে ফেরত দিন', 'Repay on time'), t('৩, ৬ বা ১২ মাসে একবারে বা কিস্তিতে ফেরত।', 'Repay in 3, 6 or 12 months, in one go or by instalments.')],
  ];
  const shown = over?.steps?.length ? over.steps : steps;
  return (
    <section className="sec" style={{ paddingTop: 10 }}>
      <div className="wrap"><div className="qard">
        <div style={{ padding: '30px 26px 6px' }}>
          <span className="pill on-dark">{over?.tag || t('বিনা সুদে, শুধু সদস্যদের জন্য', 'Interest-free, for members only')}</span>
          <h2>{over?.heading || t('করজে হাসানা কীভাবে পাবেন', 'How to get an interest-free loan')}</h2>
          <p className="soft" style={{ maxWidth: '60ch' }}>{over?.text || t('কোনো সুদ নেই, কোনো লুকানো খরচ নেই। যত টাকা নেবেন, ঠিক তত টাকাই ফেরত দেবেন।', 'No interest and no hidden charges. You repay exactly what you borrowed.')}</p>
        </div>
        <ol className="steps">{shown.map(([a, d]) => <li className="step" key={a}><b>{a}</b><p className="soft small">{d}</p></li>)}</ol>
      </div></div>
    </section>
  );
}
