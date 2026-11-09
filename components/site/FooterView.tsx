import Link from 'next/link';
import { Icon } from '../Icon';
import { Logo } from '../Logo';
import { LangToggle } from '../LangToggle';
import type { FooterCfg } from '@/lib/layoutcfg';
import type { MenuNode } from '@/lib/menu';

type Props = {
  cfg: FooterCfg; lang: 'bn' | 'en'; year: string;
  org: { name: string; tagline: string | null; established: string | null; logo: string | null };
  menus: { c1: MenuNode[]; c2: MenuNode[]; c3: MenuNode[]; bottom: MenuNode[] };
  contact: { phone: string | null; phone2?: string | null; email: string | null; address: string | null; facebook: string | null; whatsapp: string | null; youtube?: string | null; mapUrl?: string | null; officeHours?: string | null };
};
const url = (u: string) => (u.startsWith('http') ? u : `https://${u}`);

/** ফুটার: চারটি নকশা; সাইটের লেআউটেও চলে, অ্যাডমিনের ডিজাইনারের প্রিভিউতেও (কোনো সার্ভার-নির্ভরতা নেই) */
export function FooterView({ cfg, lang, year, org, menus, contact }: Props) {
  const en = lang === 'en';
  const t = (b: string, e: string) => (en ? e || b : b);
  const style = cfg.bg === 'custom' ? { background: cfg.bgColor, color: cfg.textColor } : undefined;
  const links = (list: MenuNode[]) => list.map((n) => <Link key={n.id} href={n.url} target={n.newTab ? '_blank' : undefined}>{n.icon && <span aria-hidden="true">{n.icon} </span>}{n.label}</Link>);
  const col = (title: string, titleEn: string, list: MenuNode[]) => list.length > 0 && <div className="fv-col"><b>{t(title, titleEn)}</b>{links(list)}</div>;
  const youtube = contact.youtube || cfg.youtube;
  const brand = cfg.showLogo && <div className="brand fv-brand"><span className="logo">{org.logo ? <img src={org.logo} alt="" /> : <Logo />}</span><b>{org.name}</b></div>;
  const about = cfg.showAbout && <p className="small fv-muted">{t(cfg.aboutText, cfg.aboutTextEn) || `${org.tagline ?? ''}${org.established ? t('। প্রতিষ্ঠা ', '. Founded ') + org.established : ''}${t('। মাদকমুক্ত, শিক্ষিত ও মানবিক সমাজ গড়াই আমাদের লক্ষ্য।', '. Our goal is a drug-free, educated and humane society.')}`}</p>;
  const social = cfg.showSocial && (contact.facebook || youtube || contact.whatsapp) && (
    <div className="fv-social">
      {contact.facebook && <a href={url(contact.facebook)} target="_blank" rel="noopener noreferrer">Facebook</a>}
      {youtube && <a href={url(youtube)} target="_blank" rel="noopener noreferrer">YouTube</a>}
      {contact.whatsapp && <a href={`https://wa.me/88${contact.whatsapp.replace(/\D/g, '').replace(/^88/, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
    </div>
  );
  const langEl = cfg.showLang && <div className="fv-lang"><LangToggle /></div>;
  const contactCol = cfg.showContact && (contact.phone || contact.email || contact.address) && (
    <div className="fv-col"><b>{t('যোগাযোগ', 'Contact')}</b>
      {contact.phone && <a href={`tel:${contact.phone}`}><Icon name="phone" /> {contact.phone}</a>}
      {contact.phone2 && <a href={`tel:${contact.phone2}`}><Icon name="phone" /> {contact.phone2}</a>}
      {contact.email && <a href={`mailto:${contact.email}`}><Icon name="mail" /> {contact.email}</a>}
      {contact.address && (contact.mapUrl ? <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer"><Icon name="pin" /> {contact.address}</a> : <Link href="/contact"><Icon name="pin" /> {contact.address}</Link>)}
      {contact.officeHours && <span className="fv-line"><Icon name="clock" /> {contact.officeHours}</span>}
    </div>
  );
  const custom = (cfg.customTitle || cfg.customText) && (
    <div className="fv-col"><b>{t(cfg.customTitle, cfg.customTitleEn)}</b><p className="small fv-muted" style={{ whiteSpace: 'pre-line' }}>{t(cfg.customText, cfg.customTextEn)}</p></div>
  );
  const copyText = (t(cfg.copyright, cfg.copyrightEn) || `© {year} ${org.name}${t('। সর্বস্বত্ব সংরক্ষিত।', '. All rights reserved.')}`).replaceAll('{year}', year);
  const credit = cfg.creditName && (
    <span className="fv-credit">{t(cfg.creditPrefix, cfg.creditPrefixEn)}{' '}
      {cfg.creditUrl ? <a href={cfg.creditUrl} target="_blank" rel="noopener">{cfg.creditName}</a> : <b>{cfg.creditName}</b>}
    </span>
  );
  const bottom = (
    <div className="fv-bottom">
      <span className="small fv-muted">{copyText}</span>
      <span className="fv-bottom-r">
        {cfg.showBottomLinks && menus.bottom.length > 0 && <span className="fv-bl">{links(menus.bottom)}</span>}
        {credit}
      </span>
      {t(cfg.extraText, cfg.extraTextEn) && <span className="fv-extra small fv-muted">{t(cfg.extraText, cfg.extraTextEn)}</span>}
    </div>
  );

  if (cfg.style === 'centered') {
    const inline = [...menus.c1, ...menus.c2, ...menus.c3];
    return (
      <footer className={`foot fv fv-${cfg.bg} fv-centered`} style={style}>
        <div className="wrap">
          {brand}{about}
          {inline.length > 0 && <nav className="fv-inline" aria-label={t('ফুটার মেনু', 'Footer menu')}>{links(inline)}</nav>}
          {cfg.showContact && (contact.phone || contact.email) && <div className="fv-inline fv-contact-inline">{contact.phone && <a href={`tel:${contact.phone}`}><Icon name="phone" /> {contact.phone}</a>}{contact.email && <a href={`mailto:${contact.email}`}><Icon name="mail" /> {contact.email}</a>}{contact.address && <span><Icon name="pin" /> {contact.address}</span>}</div>}
          {social}{langEl}{bottom}
        </div>
      </footer>
    );
  }
  if (cfg.style === 'minimal') {
    return (
      <footer className={`foot fv fv-${cfg.bg} fv-minimal`} style={style}>
        <div className="wrap">
          <div className="fv-min-row">
            {brand}
            <nav className="fv-inline" aria-label={t('ফুটার মেনু', 'Footer menu')}>{links([...menus.c1, ...menus.c2].slice(0, 8))}</nav>
            {langEl}
          </div>
          {bottom}
        </div>
      </footer>
    );
  }
  return (
    <footer className={`foot fv fv-${cfg.bg} fv-${cfg.style}`} style={style}>
      <div className="wrap">
        {cfg.style === 'cta' && (
          <div className="fv-ctaband">
            <div><h2>{t(cfg.ctaTitle, cfg.ctaTitleEn)}</h2>{cfg.ctaText && <p>{t(cfg.ctaText, cfg.ctaTextEn)}</p>}</div>
            {cfg.ctaBtn && <Link className="btn lg" href={cfg.ctaUrl}>{t(cfg.ctaBtn, cfg.ctaBtnEn)}</Link>}
          </div>
        )}
        <div className={`fv-grid fv-c${cfg.columns}`}>
          <div className="fv-col">{brand}{about}{social}{langEl}</div>
          {col(cfg.col1Title, cfg.col1TitleEn, menus.c1)}
          {col(cfg.col2Title, cfg.col2TitleEn, menus.c2)}
          {col(cfg.col3Title, cfg.col3TitleEn, menus.c3)}
          {custom}
          {contactCol}
        </div>
        {bottom}
      </div>
    </footer>
  );
}
