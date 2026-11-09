'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import type { HeaderCfg } from '@/lib/layoutcfg';
import type { MegaBlock, MegaData, MenuNode } from '@/lib/menu';

type Org = { name: string; short: string | null; tagline: string | null; logo: string | null };
type Props = { cfg: HeaderCfg; org: Org; menu: MenuNode[]; mega: MegaData; account: { href: string; label: string }; lang: 'bn' | 'en'; contact: { phone: string | null; email: string | null }; preview?: boolean };

const floating0 = (l: string) => (l === 'floating' ? 'hv-floating' : '');
const COVERS = ['#0e5a43', '#7a1f3d', '#1b3b6f', '#5b3a0e', '#3d2a6b', '#16413f'];

function Block({ b, mega, lang, close }: { b: MegaBlock; mega: MegaData; lang: 'bn' | 'en'; close: () => void }) {
  const en = lang === 'en';
  const title = en ? b.title_en || b.title : b.title;
  const head = title ? <h4>{title}</h4> : null;
  if (b.type === 'books') {
    const list = mega.books.slice(0, b.count);
    return (
      <div className="mb">{head}
        {list.length === 0 ? <p className="muted small">{en ? 'No books yet.' : 'এখনো কোনো বই নেই।'}</p> : (
          <div className="mb-books">{list.map((x, i) => (
            <Link key={x.id} href="/library" onClick={close} className="mb-book">
              <span className="mb-cover" style={x.cover_url ? { backgroundImage: `url('${x.cover_url}')` } : { background: COVERS[i % COVERS.length] }}>{!x.cover_url && x.title.slice(0, 2)}{x.isNew && <i>{en ? 'New' : 'নতুন'}</i>}</span>
              <span><b>{x.title}</b>{x.author && <small>{x.author}</small>}</span>
            </Link>))}</div>)}
      </div>
    );
  }
  if (b.type === 'events') {
    const list = mega.events.slice(0, b.count);
    return (
      <div className="mb">{head}
        {list.length === 0 ? <p className="muted small">{en ? 'No upcoming events.' : 'কোনো আসন্ন অনুষ্ঠান নেই।'}</p> : list.map((x) => (
          <Link key={x.id} href="/events" onClick={close} className="mb-row"><span className="mb-ic">📅</span><span><b>{x.title}</b><small>{x.date}{x.venue ? ` · ${x.venue}` : ''}</small></span></Link>))}
      </div>
    );
  }
  if (b.type === 'news') {
    const list = mega.news.slice(0, b.count);
    return (
      <div className="mb">{head}
        {list.length === 0 ? <p className="muted small">{en ? 'No news yet.' : 'এখনো কোনো সংবাদ নেই।'}</p> : list.map((x) => (
          <Link key={x.id} href={`/news/${x.id}`} onClick={close} className="mb-row">{x.image_url ? <span className="mb-th" style={{ backgroundImage: `url('${x.image_url}')` }} /> : <span className="mb-ic">📰</span>}<span><b>{x.title}</b><small>{x.date}</small></span></Link>))}
      </div>
    );
  }
  const text = en ? b.text_en || b.text : b.text, cta = en ? b.cta_en || b.cta : b.cta;
  return (
    <div className="mb mb-card" style={b.image ? { backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.65)),url('${b.image}')` } : undefined}>
      {title && <h4>{title}</h4>}{text && <p>{text}</p>}
      {cta && b.href && <Link href={b.href} className="btn sm" onClick={close}>{cta}</Link>}
    </div>
  );
}

export function HeaderView({ cfg, org, menu, mega, account, lang, contact, preview }: Props) {
  const real = usePathname();
  const path = preview ? '/' : real;
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  const en = lang === 'en';
  useEffect(() => setOpen(null), [path]);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, []);

  const active = (u: string) => { const base = u.split('?')[0]; return base === '/' ? path === '/' : base !== '#' && path.startsWith(base); };
  const dark = cfg.bg === 'accent' || cfg.bg === 'custom';
  const style = {
    '--hv-h': `${cfg.height}px`, '--hv-logo': `${cfg.logoSize}px`, '--hv-nav': `${cfg.navSize}px`,
    ...(cfg.bg === 'accent' ? { background: 'var(--acc)', color: '#fff' } : cfg.bg === 'custom' ? { background: cfg.bgColor, color: cfg.textColor } : cfg.bg === 'solid' ? { background: 'var(--surface)' } : {}),
  } as unknown as React.CSSProperties;
  const cls = ['top', 'hv', `hv-${cfg.layout}`, floating0(cfg.layout), `hv-n-${cfg.navStyle}`, `hv-a-${cfg.navAlign}`, dark ? 'hv-dark' : '', cfg.shadow ? 'hv-shadow' : '', cfg.sticky && !preview ? '' : 'hv-static'].filter(Boolean).join(' ');
  const close = () => setOpen(null);

  const navEl = (
    <nav className="nav hv-nav" aria-label={en ? 'Main menu' : 'প্রধান মেনু'}>
      {menu.map((n) => {
        const has = n.children.length > 0 || (n.isMega && n.blocks.length > 0);
        const isOpen = open === n.id;
        if (!has) return <Link key={n.id} href={n.url} target={n.newTab ? '_blank' : undefined} rel={n.newTab ? 'noopener noreferrer' : undefined} className={active(n.url) ? 'on' : ''} aria-current={active(n.url) ? 'page' : undefined}>{n.icon && <span aria-hidden="true">{n.icon} </span>}{n.label}</Link>;
        return (
          <div key={n.id} className={`nv has${n.isMega ? ' mega' : ''}${isOpen ? ' open' : ''}`} onMouseEnter={() => !preview && setOpen(n.id)}>
            <Link href={n.url} className={`nv-l${active(n.url) ? ' on' : ''}`} target={n.newTab ? '_blank' : undefined} onClick={close}>{n.icon && <span aria-hidden="true">{n.icon} </span>}{n.label}</Link>
            <button type="button" className="nv-c" aria-expanded={isOpen} aria-haspopup="true" aria-label={`${n.label} ${en ? 'submenu' : 'উপমেনু'}`} onClick={() => setOpen(isOpen ? null : n.id)}><Icon name="down" /></button>
            {isOpen && !n.isMega && (
              <div className="nv-dd" role="menu">{n.children.map((c) => <Link key={c.id} href={c.url} target={c.newTab ? '_blank' : undefined} onClick={close} role="menuitem">{c.icon && <span aria-hidden="true">{c.icon} </span>}<span><b>{c.label}</b>{c.desc && <small>{c.desc}</small>}</span></Link>)}</div>
            )}
            {isOpen && n.isMega && (
              <div className="nv-mega"><div className="wrap nv-mega-in">
                {n.children.length > 0 && <div className="nv-mega-links">{n.children.map((c) => <Link key={c.id} href={c.url} target={c.newTab ? '_blank' : undefined} onClick={close} className="nv-ml"><span className="nv-ml-i" aria-hidden="true">{c.icon || '•'}</span><span><b>{c.label}</b>{c.desc && <small>{c.desc}</small>}</span></Link>)}</div>}
                {n.blocks.length > 0 && <div className="nv-mega-blocks">{n.blocks.map((b, i) => <Block key={i} b={b} mega={mega} lang={lang} close={close} />)}</div>}
              </div></div>
            )}
          </div>
        );
      })}
    </nav>
  );
  const actions = (cls: string) => (
    <div className={`top-act ${cls}`}>
      {cfg.ctaOn && <Link className="btn pri sm hv-cta" href={cfg.ctaUrl}>{en ? cfg.ctaLabelEn || cfg.ctaLabel : cfg.ctaLabel}</Link>}
      {cfg.showTheme && <span className="hide-sm"><ThemeToggle /></span>}
      {cfg.showAccount && <Link className={`btn sm ${cfg.ctaOn ? '' : 'pri'}`} href={account.href}><Icon name="user" /> <span className="acct-t">{account.label}</span></Link>}
    </div>
  );
  const brand = (
    <Link href="/" className="brand">
      {cfg.showLogo && <span className="logo" style={{ width: cfg.logoSize, height: cfg.logoSize }}>{org.logo ? <img src={org.logo} alt="" /> : <Logo />}</span>}
      <span className="brand-t"><b><span className="n-full">{org.name}</span><span className="n-short">{cfg.showShortNameOnMobile ? org.short || org.name : org.name}</span></b>{cfg.showTagline && org.tagline && <small>{org.tagline}</small>}</span>
    </Link>
  );
  // মাঝখানে লোগোর লেআউটে লগইন ও বাটন ওপরের বারে যায় (টপবার বন্ধ থাকলেও শুধু বাটনের একটি পাতলা বার)
  const utilBar = cfg.layout === 'centered';
  const showBar = cfg.topbarOn || utilBar;
  const barStyle = cfg.topbarOn ? { background: cfg.topbarBg, color: cfg.topbarColor } : undefined;
  const floating = cfg.layout === 'floating';

  return (
    <>
      {showBar && (
        <div className={`hv-topbar${cfg.topbarOn ? ' hv-tb-on' : ' hv-util-only'}`} style={barStyle}>
          <div className="wrap hv-topbar-in">
            <span className="hv-tb-text">{cfg.topbarOn ? (en ? cfg.topbarTextEn || cfg.topbarText : cfg.topbarText) : ''}</span>
            <span className="hv-topbar-c">
              {cfg.topbarOn && cfg.topbarContact && contact.phone && <a href={`tel:${contact.phone}`}><Icon name="phone" /> {contact.phone}</a>}
              {cfg.topbarOn && cfg.topbarContact && contact.email && <a className="hide-sm" href={`mailto:${contact.email}`}><Icon name="mail" /> {contact.email}</a>}
              {utilBar && actions('hv-util-act')}
            </span>
          </div>
        </div>
      )}
      <header className={cls} style={floating ? undefined : style} ref={ref} onMouseLeave={() => !preview && setOpen(null)}>
        <div className="wrap top-in hv-in" style={floating ? style : undefined}>
          {brand}
          {cfg.layout !== 'tworow' && navEl}
          {cfg.layout === 'centered' ? actions('hv-act-inline') : actions('')}
        </div>
        {cfg.layout === 'tworow' && <div className={`hv-band hv-band-${cfg.band}`}><div className="wrap">{navEl}</div></div>}
      </header>
    </>
  );
}
