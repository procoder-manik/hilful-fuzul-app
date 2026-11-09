'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/lib/types';

const ALL: Role[] = ['admin', 'treasurer', 'librarian', 'editor'];
type Item = { href: string; label: string; roles: Role[] };
/** ভাগ করে সাজানো মেনু: যার যে অংশের অনুমতি আছে শুধু সেটুকুই দেখা যায় */
const GROUPS: { title: string; items: Item[] }[] = [
  { title: 'মূল', items: [
    { href: '/admin', label: 'ড্যাশবোর্ড', roles: ALL },
    { href: '/admin/reports', label: 'রিপোর্ট', roles: ['admin', 'treasurer'] },
  ] },
  { title: 'হিসাব', items: [
    { href: '/admin/payments', label: 'চাঁদা জমা', roles: ['admin', 'treasurer'] },
    { href: '/admin/loans', label: 'করজে হাসানা', roles: ['admin', 'treasurer'] },
    { href: '/admin/donations', label: 'দান', roles: ['admin', 'treasurer'] },
    { href: '/admin/services', label: 'সেবার রেকর্ড', roles: ['admin', 'treasurer', 'editor'] },
  ] },
  { title: 'সদস্য', items: [
    { href: '/admin/members', label: 'সদস্য', roles: ALL },
    { href: '/admin/applications', label: 'আবেদন', roles: ['admin', 'treasurer'] },
    { href: '/admin/members/contact', label: 'স্থগিত ও বকেয়া', roles: ['admin', 'treasurer'] },
    { href: '/admin/notifications', label: 'বিজ্ঞপ্তি', roles: ['admin', 'treasurer'] },
  ] },
  { title: 'পাঠাগার', items: [{ href: '/admin/library', label: 'বই ও ধার', roles: ['admin', 'librarian'] }] },
  { title: 'ওয়েবসাইট', items: [
    { href: '/admin/content/programs', label: 'সেবার তালিকা', roles: ['admin', 'editor'] },
    { href: '/admin/content/committee', label: 'কমিটি ও টিম', roles: ['admin', 'editor'] },
    { href: '/admin/content/posts', label: 'সংবাদ', roles: ['admin', 'editor'] },
    { href: '/admin/menus', label: 'মেনু', roles: ['admin', 'editor'] },
    { href: '/admin/design', label: 'হেডার ও ফুটার', roles: ['admin', 'editor'] },
    { href: '/admin/messages', label: 'বার্তা', roles: ['admin', 'editor', 'treasurer'] },
    { href: '/admin/chats', label: 'চ্যাট লগ', roles: ['admin', 'editor'] },
  ] },
  { title: 'সিস্টেম', items: [
    { href: '/admin/import', label: 'ইমপোর্ট ও ব্যাকআপ', roles: ['admin', 'treasurer', 'librarian'] },
    { href: '/admin/system', label: 'সাইট হেলথ ও লগ', roles: ['admin'] },
    { href: '/admin/users', label: 'কমিটির অ্যাক্সেস', roles: ['admin'] },
    { href: '/admin/account', label: 'আমার অ্যাকাউন্ট', roles: ALL },
    { href: '/admin/settings', label: 'সেটিংস', roles: ['admin'] },
  ] },
];
const HREFS = GROUPS.flatMap((g) => g.items.map((i) => i.href));

export function Sidebar({ role, pending, unread = 0, unanswered = 0 }: { role: Role; pending: number; unread?: number; unanswered?: number }) {
  const path = usePathname();
  // সবচেয়ে লম্বা মিল পাওয়া লিংকটিই চিহ্নিত হয় (যেমন /admin/members/contact এ "স্থগিত ও বকেয়া")
  const best = HREFS.filter((h) => (h === '/admin' ? path === '/admin' : path === h || path.startsWith(h + '/'))).sort((a, b) => b.length - a.length)[0];
  const badge = (h: string) => (h === '/admin/applications' ? pending : h === '/admin/chats' ? unanswered : h === '/admin/messages' ? unread : 0);
  return (
    <nav className="side" aria-label="অ্যাডমিন মেনু">
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => i.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={g.title} className="side-g">
            <span className="side-h">{g.title}</span>
            {items.map((i) => (
              <Link key={i.href} href={i.href} className={best === i.href ? 'on' : ''} aria-current={best === i.href ? 'page' : undefined}>
                {i.label}{badge(i.href) > 0 && <span className="cnt">{badge(i.href).toLocaleString('bn-BD')}</span>}
              </Link>
            ))}
          </div>
        );
      })}
      <form action="/auth/signout" method="post"><button className="side-out">বের হোন</button></form>
    </nav>
  );
}
