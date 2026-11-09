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
  contact: { phone: string | null; email: string | null; address: string | null; facebook: string | null; whatsapp: string | null };
};
const url = (u: string) => (u.startsWith('http') ? u : `https://${u}`);

/** ফুটার: সাইটের লেআউটেও চলে, অ্যাডমিনের ডিজাইনারের প্রিভিউতেও (কোনো সার্ভার-নির্ভরতা নেই) */
export function FooterView({ cfg, lang, year, org, menus, contact }: Props) {
  const en = lang === 'en';
  const t = (b: string, e: string) => (en ? e : b);
  const style = cfg.bg === 'custom' ? { background: cfg.bgColor, color: cfg.textColor } : undefined;
  const links = (list: MenuNode[]) => list.map((n) => <Link key={n.id} href={n.url} target={n.newTab ? '_blank' : undefined}>{n.icon && <span aria-hidden="true">{n.icon} </span>}{n.label}</Link>);
  const col = (title: string, titleEn: string, list: MenuNode[]) => list.length > 0 && <div><b>{en ? titleEn || title : title}</b>{links(list)}</div>;
  const about = en ? cfg.aboutTextEn || cfg.aboutText : cfg.aboutText;
  const copy = en ? cfg.copyrightEn || cfg.copyright : cfg.copyright;
  return (
    <footer className={`foot fv fv-${cfg.bg}`} style={style}>
      <div className="wrap">
        <div className={`fv-grid fv-c${cfg.columns}`}>
          <div>
            {cfg.showLogo && <div className="brand" style={{ marginBottom: 10 }}><span className="logo">{org.logo ? <img src={org.logo} alt="" /> : <Logo />}</span><b style={{ fontFamily: 'var(--fd)' }}>{org.name}</b></div>}
            {cfg.showAbout && <p className="small fv-muted">{about || `${org.tagline ?? ''}${org.established ? t('। প্রতিষ্ঠা ', '. Founded ') + org.established : ''}${t('। মাদকমুক্ত, শিক্ষিত ও মানবিক সমাজ গড়াই আমাদের লক্ষ্য।', '. Our goal is a drug-free, educated and humane society.')}`}</p>}
            {cfg.showSocial && (contact.facebook || cfg.youtube || contact.whatsapp) && (
              <div className="fv-social">
                {contact.facebook && <a href={url(contact.facebook)} target="_blank" rel="noopener noreferrer">Facebook</a>}
                {cfg.youtube && <a href={cfg.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>}
                {contact.whatsapp && <a href={`https://wa.me/88${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
              </div>
            )}
            {cfg.showLang && <div style={{ marginTop: 12 }}><LangToggle /></div>}
          </div>
          {col(cfg.col1Title, cfg.col1TitleEn, menus.c1)}
          {col(cfg.col2Title, cfg.col2TitleEn, menus.c2)}
          {col(cfg.col3Title, cfg.col3TitleEn, menus.c3)}
          {cfg.showContact && (
            <div><b>{t('যোগাযোগ', 'Contact')}</b>
              {contact.phone && <a href={`tel:${contact.phone}`}><Icon name="phone" /> {contact.phone}</a>}
              {contact.email && <a href={`mailto:${contact.email}`}><Icon name="mail" /> {contact.email}</a>}
              {contact.address && <Link href="/contact"><Icon name="pin" /> {contact.address}</Link>}
            </div>
          )}
        </div>
        <div className="fv-bottom">
          <span className="small fv-muted">{copy || `© ${year} ${org.name}${t('। সর্বস্বত্ব সংরক্ষিত।', '. All rights reserved.')}`}</span>
          {cfg.showBottomLinks && menus.bottom.length > 0 && <span className="fv-bl">{links(menus.bottom)}</span>}
        </div>
      </div>
    </footer>
  );
}
