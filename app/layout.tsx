import type { Metadata, Viewport } from 'next';
import { Baloo_Da_2, Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { THEME_SCRIPT } from '@/components/ThemeToggle';
import { getSiteSettings } from '@/lib/settings';
import { getLang, getT } from '@/lib/lang';
import { siteUrl } from '@/lib/schema';

const body = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
const display = Baloo_Da_2({ subsets: ['bengali', 'latin'], weight: ['500', '700', '800'], variable: '--font-display', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#eef2ee' }, { media: '(prefers-color-scheme: dark)', color: '#070b09' }],
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const t = getT();
  const desc = t(`${s.org_name}: বিনা সুদে করজে হাসানা, পাঠাগার, কুরআন শিক্ষা, ফ্রি স্বাস্থ্যসেবা, শীতবস্ত্র বিতরণ ও মাদকমুক্ত যুবসমাজ গঠনের স্বেচ্ছাসেবী সংগঠন।`, `${s.org_name}: a voluntary organisation offering interest-free loans, a library, Quran classes, free health checks, winter clothes and a drug-free youth community.`);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${s.org_name} | ${s.tagline ?? ''}`, template: `%s | ${s.short_name ?? s.org_name}` },
    description: desc,
    applicationName: s.org_name,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', locale: getLang() === 'en' ? 'en_US' : 'bn_BD', siteName: s.org_name, title: s.org_name, description: desc, images: s.logo_url ? [s.logo_url] : undefined },
    twitter: { card: 'summary_large_image', title: s.org_name, description: desc },
    icons: s.logo_url ? { icon: s.logo_url, apple: s.logo_url } : undefined,
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings();
  return (
    <html lang={getLang()} data-skin={s.theme?.skin ?? 'mango'} className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body>{children}</body>
    </html>
  );
}
