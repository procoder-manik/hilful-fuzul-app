'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/Icon';
import type { Role } from '@/lib/types';

const ALL: Role[] = ['admin', 'treasurer', 'librarian', 'editor'];
type Item = { href: string; label: string; icon: string; roles: Role[] };
/** মূল আইটেম (মোটা, বড়) আর ভাগের ভেতরের আইটেম (ছোট, ভেতরে সরানো); প্রত্যেকটির পাশে মানানসই আইকন */
const TOP: Item = { href: '/admin', label: 'ড্যাশবোর্ড', icon: 'gauge', roles: ALL };
const GROUPS: { title: string; icon: string; items: Item[] }[] = [
  { title: 'হিসাব-নিকাশ', icon: 'coins', items: [
    { href: '/admin/reports', label: 'রিপোর্ট', icon: 'report', roles: ['admin', 'treasurer'] },
    { href: '/admin/payments', label: 'চাঁদা জমা', icon: 'coins', roles: ['admin', 'treasurer'] },
    { href: '/admin/loans', label: 'করজে হাসানা', icon: 'handshake', roles: ['admin', 'treasurer'] },
    { href: '/admin/donations', label: 'দান', icon: 'gift', roles: ['admin', 'treasurer'] },
    { href: '/admin/services', label: 'সেবার রেকর্ড', icon: 'clipboard', roles: ['admin', 'treasurer', 'editor'] },
  ] },
  { title: 'সদস্য', icon: 'users', items: [
    { href: '/admin/members', label: 'সব সদস্য', icon: 'users', roles: ALL },
    { href: '/admin/applications', label: 'নতুন আবেদন', icon: 'file', roles: ['admin', 'treasurer'] },
    { href: '/admin/members/contact', label: 'স্থগিত ও বকেয়া', icon: 'alert', roles: ['admin', 'treasurer'] },
    { href: '/admin/notifications', label: 'বিজ্ঞপ্তি', icon: 'bell', roles: ['admin', 'treasurer'] },
  ] },
  { title: 'পাঠাগার', icon: 'book', items: [{ href: '/admin/library', label: 'বই ও ধার', icon: 'book', roles: ['admin', 'librarian'] }] },
  { title: 'ওয়েবসাইট', icon: 'globe', items: [
    { href: '/admin/content/programs', label: 'সেবার তালিকা', icon: 'layers', roles: ['admin', 'editor'] },
    { href: '/admin/content/committee', label: 'কমিটি ও টিম', icon: 'users', roles: ['admin', 'editor'] },
    { href: '/admin/content/posts', label: 'সংবাদ', icon: 'news', roles: ['admin', 'editor'] },
    { href: '/admin/menus', label: 'মেনু', icon: 'list', roles: ['admin', 'editor'] },
    { href: '/admin/design', label: 'হেডার ও ফুটার', icon: 'palette', roles: ['admin', 'editor'] },
    { href: '/admin/contact-info', label: 'যোগাযোগের তথ্য', icon: 'contact', roles: ['admin', 'editor'] },
  ] },
  { title: 'যোগাযোগ', icon: 'inbox', items: [
    { href: '/admin/messages', label: 'বার্তা', icon: 'inbox', roles: ['admin', 'editor', 'treasurer'] },
    { href: '/admin/chats', label: 'চ্যাট লগ', icon: 'chat', roles: ['admin', 'editor'] },
  ] },
  { title: 'সিস্টেম', icon: 'shield', items: [
    { href: '/admin/import', label: 'ইমপোর্ট ও ব্যাকআপ', icon: 'upload', roles: ['admin', 'treasurer', 'librarian'] },
    { href: '/admin/system', label: 'সাইট হেলথ ও লগ', icon: 'activity', roles: ['admin'] },
    { href: '/admin/users', label: 'কমিটির অ্যাক্সেস', icon: 'key', roles: ['admin'] },
    { href: '/admin/account', label: 'আমার অ্যাকাউন্ট', icon: 'user', roles: ALL },
  ] },
];
const BOTTOM: Item = { href: '/admin/settings', label: 'সেটিংস', icon: 'gear', roles: ['admin'] };
const HREFS = [TOP, BOTTOM, ...GROUPS.flatMap((g) => g.items)].map((i) => i.href);

export function Sidebar({ role, pending, unread = 0, unanswered = 0 }: { role: Role; pending: number; unread?: number; unanswered?: number }) {
  const path = usePathname();
  const best = HREFS.filter((h) => (h === '/admin' ? path === '/admin' : path === h || path.startsWith(h + '/'))).sort((a, b) => b.length - a.length)[0];
  const badge = (h: string) => (h === '/admin/applications' ? pending : h === '/admin/chats' ? unanswered : h === '/admin/messages' ? unread : 0);
  const link = (i: Item, main = false) => (
    <Link key={i.href} href={i.href} className={`${main ? 'side-main' : 'side-sub'}${best === i.href ? ' on' : ''}`} aria-current={best === i.href ? 'page' : undefined}>
      <Icon name={i.icon} /><span>{i.label}</span>{badge(i.href) > 0 && <span className="cnt">{badge(i.href).toLocaleString('bn-BD')}</span>}
    </Link>
  );
  return (
    <nav className="side" aria-label="অ্যাডমিন মেনু">
      {link(TOP, true)}
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => i.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={g.title} className="side-g" role="group" aria-label={g.title}>
            <span className="side-h"><Icon name={g.icon} />{g.title}</span>
            {items.map((i) => link(i))}
          </div>
        );
      })}
      <div className="side-foot">
        {BOTTOM.roles.includes(role) && link(BOTTOM, true)}
        <form action="/auth/signout" method="post"><button className="side-main side-out"><Icon name="logout" /><span>বের হোন</span></button></form>
      </div>
    </nav>
  );
}
