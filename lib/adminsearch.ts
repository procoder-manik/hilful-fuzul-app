import type { Role } from './types';

/** অ্যাডমিন সার্চের তালিকা: পাতা ও সেটিংসের অংশ। k = খোঁজার অতিরিক্ত শব্দ (বাংলা ও ইংরেজি) */
export type SearchItem = { t: string; en: string; href: string; k: string; roles: Role[]; group: string };
const ALL: Role[] = ['admin', 'treasurer', 'librarian', 'editor'];
const A: Role[] = ['admin'], M: Role[] = ['admin', 'treasurer'], E: Role[] = ['admin', 'editor'], L: Role[] = ['admin', 'librarian'];

export const SEARCH_ITEMS: SearchItem[] = [
  { t: 'ড্যাশবোর্ড', en: 'Dashboard', href: '/admin', k: 'home হোম সারসংক্ষেপ overview', roles: ALL, group: 'পাতা' },
  { t: 'রিপোর্ট', en: 'Reports', href: '/admin/reports', k: 'report হিসাব আয় ব্যয় নগদ প্রবাহ', roles: M, group: 'পাতা' },
  { t: 'চাঁদা জমা নিন', en: 'Take a payment', href: '/admin/payments/new', k: 'payment রসিদ receipt জমা', roles: M, group: 'পাতা' },
  { t: 'চাঁদা জমা তালিকা', en: 'Payments', href: '/admin/payments', k: 'payment contribution monthly মাসিক', roles: M, group: 'পাতা' },
  { t: 'করজে হাসানা (ঋণ)', en: 'Interest-free loans', href: '/admin/loans', k: 'loan ঋণ কর্জ borrower', roles: M, group: 'পাতা' },
  { t: 'নতুন ঋণ দিন', en: 'New loan', href: '/admin/loans/new', k: 'loan ঋণ প্রদান guarantor জামিনদার', roles: M, group: 'পাতা' },
  { t: 'দান', en: 'Donations', href: '/admin/donations', k: 'donation donor দাতা', roles: M, group: 'পাতা' },
  { t: 'সেবার রেকর্ড', en: 'Service records', href: '/admin/services', k: 'service সেবা ডায়াবেটিস শীতবস্ত্র', roles: ['admin', 'treasurer', 'editor'], group: 'পাতা' },
  { t: 'সব সদস্য', en: 'All members', href: '/admin/members', k: 'member সদস্য তালিকা list', roles: ALL, group: 'পাতা' },
  { t: 'নতুন সদস্য যোগ', en: 'New member', href: '/admin/members/new', k: 'add member সদস্য তৈরি', roles: M, group: 'পাতা' },
  { t: 'নতুন আবেদন', en: 'New applications', href: '/admin/applications', k: 'application আবেদন যাচাই অনুমোদন trx ট্রানজ্যাকশন bkash বিকাশ', roles: M, group: 'পাতা' },
  { t: 'স্থগিত ও বকেয়া সদস্য', en: 'Frozen & overdue', href: '/admin/members/contact', k: 'overdue frozen বকেয়া স্থগিত কল sms whatsapp', roles: M, group: 'পাতা' },
  { t: 'বিজ্ঞপ্তি', en: 'Notifications', href: '/admin/notifications', k: 'notification sms email ইমেইল', roles: M, group: 'পাতা' },
  { t: 'বই ও ধার', en: 'Books & lending', href: '/admin/library', k: 'library book পাঠাগার বই', roles: L, group: 'পাতা' },
  { t: 'অনুষ্ঠান ও কর্মসূচি', en: 'Events & programmes', href: '/admin/events', k: 'event আসন্ন upcoming অনুষ্ঠান সভা সেমিনার বিগত কর্মসূচি past', roles: E, group: 'পাতা' },
  { t: 'পপআপ (হোমপেজে অনুষ্ঠানের পপআপ)', en: 'Event popup', href: '/admin/events#popup', k: 'popup পপ আপ pop-up banner ব্যানার টেমপ্লেট template', roles: E, group: 'সেটিং' },
  { t: 'ব্যানারের রং ও প্যাটার্ন', en: 'Banner colours & patterns', href: '/admin/events', k: 'color colour রং pattern প্যাটার্ন হালকা গাঢ় light deep ডিজাইন', roles: E, group: 'সেটিং' },
  { t: 'পেজ বিল্ডার (নতুন পেজ, কম্পোনেন্ট)', en: 'Page builder', href: '/admin/pages', k: 'page builder new page নতুন পেজ create component কম্পোনেন্ট drag drop slug মেনুতে যোগ', roles: E, group: 'পাতা' },
  { t: 'হোমপেজ সাজান (কম্পোনেন্ট, ক্রম)', en: 'Edit home page', href: '/admin/pages/home', k: 'home হোমপেজ section সেকশন component কম্পোনেন্ট cta ব্যানার stats পরিসংখ্যান হিরো hero', roles: E, group: 'পাতা' },
  { t: 'সেকশন ও পেজ সাজ (পেজ-হেডারের রং)', en: 'Sections & page style', href: '/admin/sections', k: 'section সেকশন homepage হোমপেজ color রং pattern প্যাটার্ন page header পেজ হেডার breadcrumb ক্রম order cta', roles: E, group: 'পাতা' },
  { t: 'সেবার তালিকা', en: 'Services list', href: '/admin/content/programs', k: 'program সেবা কার্যক্রম', roles: E, group: 'পাতা' },
  { t: 'কমিটি ও টিম', en: 'Committee & team', href: '/admin/content/committee', k: 'committee কমিটি সভাপতি সম্পাদক', roles: E, group: 'পাতা' },
  { t: 'সংবাদ', en: 'News', href: '/admin/content/posts', k: 'news post সংবাদ খবর', roles: E, group: 'পাতা' },
  { t: 'মেনু', en: 'Menus', href: '/admin/menus', k: 'menu navigation মেগা মেনু ড্রপডাউন', roles: E, group: 'পাতা' },
  { t: 'হেডার ও ফুটার ডিজাইন', en: 'Header & footer design', href: '/admin/design', k: 'header footer হেডার ফুটার লোগো topbar ক্রেডিট কপিরাইট', roles: E, group: 'পাতা' },
  { t: 'যোগাযোগের তথ্য', en: 'Contact info', href: '/admin/contact-info', k: 'phone ফোন email ইমেইল ঠিকানা address map ম্যাপ whatsapp অফিসের সময়', roles: E, group: 'পাতা' },
  { t: 'বার্তা', en: 'Messages', href: '/admin/messages', k: 'message inbox যোগাযোগ ফর্ম', roles: ['admin', 'editor', 'treasurer'], group: 'পাতা' },
  { t: 'চ্যাট লগ', en: 'Chat log', href: '/admin/chats', k: 'chat bot বট প্রশ্ন শেখান', roles: E, group: 'পাতা' },
  { t: 'ইমপোর্ট ও ব্যাকআপ', en: 'Import & backup', href: '/admin/import', k: 'import export backup excel csv ব্যাকআপ', roles: ['admin', 'treasurer', 'librarian'], group: 'পাতা' },
  { t: 'সাইট হেলথ ও লগ', en: 'Site health & logs', href: '/admin/system', k: 'health log লগইন ইতিহাস সিস্টেম', roles: A, group: 'পাতা' },
  { t: 'কমিটির অ্যাক্সেস (ভূমিকা)', en: 'Staff access & roles', href: '/admin/users', k: 'role admin treasurer কোষাধ্যক্ষ ভূমিকা otp রিসেট user', roles: A, group: 'পাতা' },
  { t: 'আমার অ্যাকাউন্ট', en: 'My account', href: '/admin/account', k: 'password পাসওয়ার্ড profile', roles: ALL, group: 'পাতা' },
  { t: 'সেটিংস', en: 'Settings', href: '/admin/settings', k: 'settings সেটিং', roles: A, group: 'পাতা' },
  { t: 'সংগঠনের তথ্য (নাম, লোগো, ঠিকানা)', en: 'Organization info', href: '/admin/settings#set-org', k: 'name নাম logo লোগো tagline ট্যাগলাইন established প্রতিষ্ঠা short', roles: A, group: 'সেটিং' },
  { t: 'ভর্তি ফি ও মাসিক চাঁদার নিয়ম', en: 'Joining fee & dues rules', href: '/admin/settings#set-membership', k: 'fee ভর্তি ফি due day শেষ তারিখ freeze স্থগিত মাস', roles: A, group: 'সেটিং' },
  { t: 'টাকা জমা দেওয়ার মাধ্যম (বিকাশ, নগদ, রকেট)', en: 'Payment methods', href: '/admin/settings#set-pay', k: 'bkash nagad rocket বিকাশ নগদ রকেট bank ব্যাংক নম্বর', roles: A, group: 'সেটিং' },
  { t: 'বিজ্ঞপ্তির সেটিং (ইমেইল, SMS)', en: 'Notification settings', href: '/admin/settings#set-notify', k: 'email sms ইমেইল শর্তাবলী terms member loan ঋণের শর্ত', roles: A, group: 'সেটিং' },
  { t: 'হিরো, সংবাদ-পট্টি ও কুরআন শিক্ষা', en: 'Hero, news ticker & Quran info', href: '/admin/settings#set-website', k: 'hero হিরো শিরোনাম ticker ব্রেকিং নিউজ quran কুরআন', roles: A, group: 'সেটিং' },
  { t: 'চ্যাট সহকারী সেটিং', en: 'Chat assistant settings', href: '/admin/settings#set-chat', k: 'chat bot gemini openrouter api মডেল model', roles: A, group: 'সেটিং' },
  { t: 'থিম রং ও ঋণগ্রহীতার নাম', en: 'Theme colour & privacy', href: '/admin/settings#set-look', k: 'theme থিম skin রং borrower ঋণগ্রহীতা নাম গোপনীয়তা privacy', roles: A, group: 'সেটিং' },
  { t: 'ওয়েবসাইটের সদস্য পাতা (চালু/বন্ধ, টাকার অঙ্ক)', en: 'Public members page', href: '/admin/settings#set-members', k: 'members public সদস্য পাতা কার্ড money টাকা লুকান', roles: A, group: 'সেটিং' },
];

const norm = (s: string) => s.toLowerCase().normalize('NFC');
export function searchItems(q: string, role: Role): SearchItem[] {
  const toks = norm(q).split(/\s+/).filter(Boolean);
  const pool = SEARCH_ITEMS.filter((i) => i.roles.includes(role));
  if (!toks.length) return pool.filter((i) => i.group === 'পাতা').slice(0, 8);
  return pool
    .map((i) => { const hay = norm(`${i.t} ${i.en} ${i.k}`); const ok = toks.every((t) => hay.includes(t)); const head = norm(`${i.t} ${i.en}`); return { i, s: ok ? (toks.every((t) => head.includes(t)) ? 2 : 1) : 0 }; })
    .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.i).slice(0, 10);
}
