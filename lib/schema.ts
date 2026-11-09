import { getLang } from './lang';
import type { Settings } from './types';

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/**
 * প্রতিটি পেজের জন্য একটি মাত্র সম্মিলিত JSON-LD (@graph):
 * সংগঠন (NGO) + ওয়েবসাইট + সেই পেজের নিজস্ব অংশ (FAQ, Event, Article, Breadcrumb ইত্যাদি)
 */
export function graph(s: Settings, extra: object[] = [], crumbs: [string, string][] = []) {
  const url = siteUrl();
  const en = getLang() === 'en';
  const org = {
    '@type': 'NGO', '@id': `${url}/#org`, name: s.org_name, alternateName: s.short_name ?? undefined, url,
    logo: s.logo_url ?? undefined, description: s.tagline ?? undefined, foundingDate: s.established ?? undefined,
    email: s.email ?? undefined, telephone: s.phone ?? undefined,
    address: s.address ? { '@type': 'PostalAddress', streetAddress: s.address, addressCountry: 'BD' } : undefined,
    sameAs: s.facebook ? [s.facebook.startsWith('http') ? s.facebook : `https://${s.facebook}`] : undefined,
    knowsLanguage: ['bn', 'en'],
  };
  const site = { '@type': 'WebSite', '@id': `${url}/#website`, url, name: s.org_name, inLanguage: en ? 'en' : 'bn-BD', publisher: { '@id': `${url}/#org` } };
  const bc = crumbs.length
    ? [{ '@type': 'BreadcrumbList', itemListElement: [[en ? 'Home' : 'হোম', '/'], ...crumbs].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url + path })) }]
    : [];
  return { '@context': 'https://schema.org', '@graph': [org, site, ...bc, ...extra] };
}

export const faqSchema = (items: [string, string][]) => ({
  '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

export const eventSchema = (e: { title: string; topic: string | null; event_date: string; venue: string | null; chief_guest: string | null }, orgId: string) => ({
  '@type': 'Event', name: e.title, description: e.topic ?? undefined, startDate: e.event_date,
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled',
  location: { '@type': 'Place', name: e.venue ?? '', address: { '@type': 'PostalAddress', addressCountry: 'BD' } },
  organizer: { '@id': orgId }, performer: e.chief_guest ? { '@type': 'Person', name: e.chief_guest } : undefined,
  isAccessibleForFree: true,
});
