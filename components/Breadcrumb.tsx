'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from './LangProvider';

const LABELS: Record<string, [string, string]> = {
  about: ['আমাদের কথা', 'About'], services: ['সেবা', 'Services'], transparency: ['স্বচ্ছতা', 'Transparency'], library: ['পাঠাগার', 'Library'], events: ['অনুষ্ঠান', 'Events'],
  committee: ['কমিটি', 'Committee'], members: ['আমাদের সদস্য', 'Our members'], news: ['সংবাদ', 'News'], contact: ['যোগাযোগ', 'Contact'], join: ['সদস্য হোন', 'Join us'],
  support: ['সহায়তা', 'Help'], terms: ['শর্তাবলী', 'Terms'], privacy: ['গোপনীয়তা নীতি', 'Privacy'], form: ['সদস্য ফর্ম', 'Member form'], login: ['লগইন', 'Log in'], portal: ['আমার অ্যাকাউন্ট', 'My account'],
};

/** পেজের ওপরের পথ: হোম > সংবাদ > শিরোনাম */
export function Breadcrumb({ title }: { title: string }) {
  const { t } = useT();
  const path = usePathname() || '/';
  const parts = path.split('/').filter(Boolean);
  const first = parts[0] ? LABELS[parts[0]] : null;
  const crumbs: { label: string; href?: string }[] = [{ label: t('হোম', 'Home'), href: '/' }];
  if (parts.length > 1 && first) crumbs.push({ label: t(first[0], first[1]), href: `/${parts[0]}` });
  crumbs.push({ label: title });
  return (
    <nav className="crumbs" aria-label={t('পথ', 'Breadcrumb')}>
      {crumbs.map((c, i) => (
        <span key={i} className="crumb">
          {i > 0 && <i aria-hidden="true">›</i>}
          {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}
