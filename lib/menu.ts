import 'server-only';
import { cache } from 'react';
import { publicClient } from './supabase/public';
import { getLang } from './lang';
import { translateMany } from './translate';
import { getBooks, getEvents, getPosts, isNewBook, upcoming } from './public';
import { fd } from './fmt';
import { safeUrl } from './layoutcfg';

export const LOCATIONS: [string, string][] = [['header', 'হেডার মেনু'], ['footer-1', 'ফুটার কলাম ১'], ['footer-2', 'ফুটার কলাম ২'], ['footer-3', 'ফুটার কলাম ৩'], ['footer-bottom', 'ফুটারের নিচের লিংক']];
export const PAGES: [string, string][] = [['/', 'হোম'], ['/about', 'আমাদের কথা'], ['/services', 'সেবা'], ['/transparency', 'স্বচ্ছতা'], ['/library', 'পাঠাগার'], ['/library?cat=new', 'নতুন বই'], ['/events', 'অনুষ্ঠান'], ['/committee', 'কমিটি'], ['/news', 'সংবাদ'], ['/contact', 'যোগাযোগ'], ['/join', 'সদস্য হোন (নিবন্ধন)'], ['/login', 'লগইন'], ['/support', 'সহায়তা'], ['/terms', 'শর্তাবলী'], ['/privacy', 'গোপনীয়তা নীতি'], ['/form', 'প্রিন্টযোগ্য ফর্ম']];

export type MegaBlock = { type: 'books' | 'events' | 'news' | 'card'; title: string; title_en: string; count: number; text: string; text_en: string; image: string; href: string; cta: string; cta_en: string };
/** ডেটাবেসের সারি (অ্যাডমিন পেজের জন্য) */
export type MenuRow = { id: string; location: string; parent_id: string | null; label: string; label_en: string | null; url: string; new_tab: boolean; icon: string | null; descr: string | null; descr_en: string | null; sort: number; visible: boolean; is_mega: boolean; mega: { blocks?: Partial<MegaBlock>[] } };
/** ওয়েবসাইটে দেখানোর জন্য প্রস্তুত (বর্তমান ভাষায়) */
export type MenuNode = { id: string; label: string; url: string; newTab: boolean; icon: string | null; desc: string | null; isMega: boolean; blocks: MegaBlock[]; children: MenuNode[] };
export type MegaData = {
  books: { id: string; title: string; author: string | null; cover_url: string | null; isNew: boolean }[];
  events: { id: string; title: string; date: string; venue: string | null }[];
  news: { id: string; title: string; date: string; image_url: string | null }[];
};

const BLOCK_TYPES = ['books', 'events', 'news', 'card'] as const;
export function normalizeBlocks(mega: MenuRow['mega'] | null | undefined): MegaBlock[] {
  const arr = Array.isArray(mega?.blocks) ? mega!.blocks! : [];
  return arr.slice(0, 2).filter((b) => BLOCK_TYPES.includes(b?.type as never)).map((b) => ({
    type: b.type as MegaBlock['type'], title: String(b.title ?? '').slice(0, 60), title_en: String(b.title_en ?? '').slice(0, 60),
    count: Math.min(6, Math.max(1, Number(b.count) || 3)), text: String(b.text ?? '').slice(0, 200), text_en: String(b.text_en ?? '').slice(0, 200),
    image: safeUrl(b.image, ''), href: safeUrl(b.href, ''), cta: String(b.cta ?? '').slice(0, 40), cta_en: String(b.cta_en ?? '').slice(0, 40),
  }));
}

const row = (location: string, sort: number, label: string, label_en: string, url: string): MenuRow => ({ id: `d-${location}-${sort}`, location, parent_id: null, label, label_en, url, new_tab: false, icon: null, descr: null, descr_en: null, sort, visible: true, is_mega: false, mega: {} });
/** মেনুর টেবিল (SQL 005) না থাকলে এই বিকল্প মেনু দিয়ে সাইট চলে */
const DEFAULTS: Record<string, MenuRow[]> = {
  header: [row('header', 1, 'হোম', 'Home', '/'), row('header', 2, 'আমাদের কথা', 'About', '/about'), row('header', 3, 'সেবা', 'Services', '/services'), row('header', 4, 'স্বচ্ছতা', 'Transparency', '/transparency'), row('header', 5, 'পাঠাগার', 'Library', '/library'), row('header', 6, 'অনুষ্ঠান', 'Events', '/events'), row('header', 7, 'কমিটি', 'Committee', '/committee'), row('header', 8, 'সংবাদ', 'News', '/news'), row('header', 9, 'যোগাযোগ', 'Contact', '/contact')],
  'footer-1': [row('footer-1', 1, 'আমাদের কথা', 'About us', '/about'), row('footer-1', 2, 'কার্যনির্বাহী কমিটি', 'Executive committee', '/committee'), row('footer-1', 3, 'সংবাদ', 'News', '/news'), row('footer-1', 4, 'অনুষ্ঠান', 'Events', '/events')],
  'footer-2': [row('footer-2', 1, 'সদস্য হোন', 'Join us', '/join'), row('footer-2', 2, 'আয়-ব্যয়ের হিসাব', 'Accounts', '/transparency'), row('footer-2', 3, 'পাঠাগার', 'Library', '/library'), row('footer-2', 4, 'সহায়তা ও প্রশ্নোত্তর', 'Help and FAQ', '/support'), row('footer-2', 5, 'শর্তাবলী', 'Terms', '/terms'), row('footer-2', 6, 'গোপনীয়তা নীতি', 'Privacy policy', '/privacy')],
};
const BN = /[\u0980-\u09FF]/;

/** একটি জায়গার মেনু গাছ (২ স্তর: মূল আইটেম ও তার ভেতরের আইটেম), বর্তমান ভাষায় */
export const getMenu = cache(async (location: string, lang?: 'bn' | 'en'): Promise<MenuNode[]> => {
  let rows: MenuRow[];
  try {
    const { data, error } = await publicClient().from('menu_items').select('*').eq('location', location).order('sort');
    rows = error ? DEFAULTS[location] ?? [] : ((data ?? []) as MenuRow[]);
  } catch { rows = DEFAULTS[location] ?? []; }
  const en = (lang ?? getLang()) === 'en';
  // ইংরেজিতে: label_en থাকলে সেটা, না থাকলে বাংলা লেখাটি এআই দিয়ে অনুবাদ
  const need = en ? rows.flatMap((r) => [!r.label_en && BN.test(r.label) ? r.label : '', !r.descr_en && r.descr && BN.test(r.descr) ? r.descr : '']).filter(Boolean) : [];
  const tr = need.length ? await translateMany(need, 'en') : [];
  const map = new Map(need.map((n, i) => [n, tr[i]]));
  const L = (r: MenuRow) => (en ? r.label_en || map.get(r.label) || r.label : r.label);
  const D = (r: MenuRow) => (en ? r.descr_en || (r.descr ? map.get(r.descr) ?? r.descr : null) : r.descr);
  const node = (r: MenuRow): MenuNode => ({ id: r.id, label: L(r), url: safeUrl(r.url, '#'), newTab: r.new_tab, icon: r.icon, desc: D(r), isMega: r.is_mega && !r.parent_id, blocks: r.is_mega ? normalizeBlocks(r.mega) : [], children: [] });
  const top = rows.filter((r) => !r.parent_id).sort((a, b) => a.sort - b.sort).map(node);
  const byId = new Map(top.map((n) => [n.id, n]));
  rows.filter((r) => r.parent_id && byId.has(r.parent_id)).sort((a, b) => a.sort - b.sort).forEach((r) => byId.get(r.parent_id!)!.children.push(node(r)));
  return top;
});

/** মেগা মেনুর ব্লকে দেখানোর নতুন বই, আসন্ন অনুষ্ঠান ও সংবাদ (কোনো মেগা মেনু না থাকলে কিছুই আনে না) */
export async function getMegaData(menu: MenuNode[]): Promise<MegaData> {
  const types = new Set(menu.flatMap((n) => (n.isMega ? n.blocks.map((b) => b.type) : [])));
  const [books, events, news] = await Promise.all([
    types.has('books') ? getBooks() : Promise.resolve([]),
    types.has('events') ? getEvents() : Promise.resolve([]),
    types.has('news') ? getPosts(6) : Promise.resolve([]),
  ]);
  return {
    books: [...books].sort((a, b) => Number(isNewBook(b)) - Number(isNewBook(a)) || b.added_on.localeCompare(a.added_on)).slice(0, 6).map((b) => ({ id: b.id, title: b.title, author: b.author, cover_url: b.cover_url, isNew: isNewBook(b) })),
    events: upcoming(events).slice(0, 6).map((e) => ({ id: e.id, title: e.title, date: fd(e.event_date), venue: e.venue })),
    news: news.slice(0, 6).map((p) => ({ id: p.id, title: p.title, date: fd(p.published_on), image_url: p.image_url })),
  };
}
