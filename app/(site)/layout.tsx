import { Icon } from '@/components/Icon';
import { TabBar } from '@/components/NavLinks';
import { ChatWidget } from '@/components/ChatWidget';
import { LangProvider } from '@/components/LangProvider';
import { HeaderView } from '@/components/site/HeaderView';
import { FooterView } from '@/components/site/FooterView';
import { getSessionProfile, getSiteSettings } from '@/lib/settings';
import { getLoans } from '@/lib/public';
import { getLang, getT } from '@/lib/lang';
import { footerCfg, headerCfg } from '@/lib/layoutcfg';
import { getMegaData, getMenu } from '@/lib/menu';
import { bn, tk } from '@/lib/fmt';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const t = getT();
  const lang = getLang();
  const [s, { user, profile }, loans, menu, f1, f2, f3, fb] = await Promise.all([
    getSiteSettings(), getSessionProfile(), getLoans(5), getMenu('header'), getMenu('footer-1'), getMenu('footer-2'), getMenu('footer-3'), getMenu('footer-bottom'),
  ]);
  const mega = await getMegaData(menu);
  const isStaff = !!profile && profile.role !== 'member';
  const account = !user ? '/login' : isStaff ? '/admin' : '/portal';
  const acctLabel: [string, string] = !user ? ['লগইন', 'Log in'] : isStaff ? ['ড্যাশবোর্ড', 'Dashboard'] : ['আমার অ্যাকাউন্ট', 'My account'];
  const news = [...(s.ticker ?? []), ...loans.map((l) => t(`${l.borrower} ${tk(l.amount)} করজে হাসানা পেয়েছেন`, `${l.borrower} received an interest-free loan of ${tk(l.amount)}`))];
  const year = bn(new Date().getFullYear());
  return (
    <LangProvider lang={lang}>
      <a href="#main" className="skip">{t('মূল অংশে যান', 'Skip to main content')}</a>
      <HeaderView cfg={headerCfg(s.header_cfg)} org={{ name: s.org_name, short: s.short_name, tagline: s.tagline, logo: s.logo_url }} menu={menu} mega={mega}
        account={{ href: account, label: t(acctLabel[0], acctLabel[1]) }} lang={lang} contact={{ phone: s.phone ? bn(s.phone) : null, email: s.email }} />
      {news.length > 0 && (
        <div className="ticker" role="marquee" aria-label={t('সর্বশেষ খবর', 'Latest news')}>
          <div className="ticker-label"><Icon name="news" /> {t('সর্বশেষ', 'Latest')}</div>
          <div className="ticker-view">
            <div className="ticker-track">
              {[0, 1].map((k) => <div key={k} className="ticker-set" aria-hidden={k === 1}>{news.map((x, i) => <span key={i}>{x}</span>)}</div>)}
            </div>
          </div>
        </div>
      )}
      <main id="main">{children}</main>
      <FooterView cfg={footerCfg(s.footer_cfg)} lang={lang} year={year} org={{ name: s.org_name, tagline: s.tagline, established: s.established, logo: s.logo_url }}
        menus={{ c1: f1, c2: f2, c3: f3, bottom: fb }} contact={{ phone: s.phone ? bn(s.phone) : null, email: s.email, address: s.address, facebook: s.facebook, whatsapp: s.whatsapp }} />
      <ChatWidget who={!user ? 'guest' : isStaff ? 'staff' : 'member'} name={profile?.full_name ?? null} shortName={s.short_name ?? s.org_name} enabled={s.chat_enabled} />
      <TabBar account={account} accountLabel={acctLabel} menu={menu} />
    </LangProvider>
  );
}
