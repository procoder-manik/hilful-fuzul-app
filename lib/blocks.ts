import { cleanStyle, type SecStyle } from './sectionstyle';

/** পেজ বিল্ডারের কম্পোনেন্ট: হোমপেজ ও নতুন পেজ দুই জায়গাতেই এগুলো দিয়ে সাজানো হয়। সার্ভার ও ক্লায়েন্ট দুই জায়গাতেই চলে। */
export type FieldKind = 'text' | 'textarea' | 'select' | 'checkbox' | 'image';
export type Field = { k: string; bn: string; en: string; kind: FieldKind; info?: string; options?: [string, string][]; rows?: number; max?: number };
export type BlockDef = { type: string; bn: string; en: string; icon: string; info: string; group: 'live' | 'content' | 'cta' | 'page'; fields: Field[]; defaults: Record<string, string> };

const VARIANTS: [string, string][] = [['forest', 'গাঢ় সবুজ (Forest)'], ['gold', 'সোনালি (Gold)'], ['night', 'রাতের নীল (Night)'], ['rose', 'গোলাপি (Rose)'], ['light', 'হালকা (Light)']];
const ALIGN: [string, string][] = [['left', 'বাঁয়ে (Left)'], ['center', 'মাঝে (Center)']];

export const BLOCKS: BlockDef[] = [
  { type: 'page_header', bn: 'পেজের হেডার', en: 'Page header', icon: 'file', group: 'content', info: 'পথ (হোম › পেজ), শিরোনাম ও বিবরণ। সাধারণত পেজের একদম ওপরে বসে।', defaults: { title: '', title_en: '', text: '', text_en: '', crumbs: '1', align: 'left' },
    fields: [
      { k: 'title', bn: 'শিরোনাম', en: 'Title', kind: 'text', info: 'ফাঁকা রাখলে পেজের নাম বসবে।' }, { k: 'title_en', bn: 'শিরোনাম (English)', en: 'Title (English)', kind: 'text' },
      { k: 'text', bn: 'বিবরণ', en: 'Description', kind: 'textarea', rows: 2 }, { k: 'text_en', bn: 'বিবরণ (English)', en: 'Description (English)', kind: 'textarea', rows: 2 },
      { k: 'crumbs', bn: 'পথ (Breadcrumb) দেখান', en: 'Show breadcrumb', kind: 'checkbox' }, { k: 'align', bn: 'লেখার অবস্থান', en: 'Alignment', kind: 'select', options: ALIGN },
    ] },
  { type: 'hero', bn: 'হিরো (মূল অংশ)', en: 'Hero', icon: 'home', group: 'live', info: 'শিরোনাম, সদস্য হোন বোতাম ও মোট তহবিলের কার্ড। লেখা বদলাতে সেটিংস পাতার "ওয়েবসাইট" অংশে যান।', defaults: {}, fields: [] },
  { type: 'stats', bn: 'পরিসংখ্যান', en: 'Live statistics', icon: 'chart', group: 'live', info: 'মোট তহবিল, সদস্য, উপকৃত মানুষ ও বইয়ের সংখ্যা, নিজে থেকে হালনাগাদ হয়।', defaults: {}, fields: [] },
  { type: 'ledger', bn: 'স্বচ্ছতার খাতা', en: 'Open ledger', icon: 'eye', group: 'live', info: 'চার্ট, ঋণ ও দাতাদের চলমান তালিকা।', defaults: {}, fields: [] },
  { type: 'events', bn: 'আসন্ন অনুষ্ঠান', en: 'Upcoming events', icon: 'calendar', group: 'live', info: 'অনুষ্ঠান পাতায় বানানো আসন্ন অনুষ্ঠানের ব্যানার।', defaults: {}, fields: [] },
  { type: 'services', bn: 'সেবা', en: 'Services', icon: 'layers', group: 'live', info: 'সেবার তালিকার কার্ড।', defaults: {}, fields: [] },
  { type: 'qard', bn: 'করজে হাসানা', en: 'Interest-free loans', icon: 'handshake', group: 'live', info: 'বিনা সুদের ঋণের ধাপ।', defaults: {}, fields: [] },
  { type: 'library', bn: 'পাঠাগার', en: 'Library', icon: 'book', group: 'live', info: 'নতুন বইয়ের সারি ও কুরআন শিক্ষার তথ্য।', defaults: {}, fields: [] },
  { type: 'committee', bn: 'কমিটি', en: 'Committee', icon: 'users', group: 'live', info: 'কমিটির সদস্যদের কার্ড।', defaults: {}, fields: [] },
  { type: 'news', bn: 'সংবাদ', en: 'News', icon: 'news', group: 'live', info: 'সাম্প্রতিক সংবাদ।', defaults: {}, fields: [] },
  { type: 'heading_text', bn: 'শিরোনাম ও লেখা', en: 'Heading & text', icon: 'file', group: 'content', info: 'ছোট ট্যাগ, বড় শিরোনাম, লেখা ও ঐচ্ছিক বোতাম।', defaults: { tag: '', heading: 'এখানে শিরোনাম', heading_en: '', text: 'এখানে আপনার লেখা বসান।', text_en: '', align: 'left', btn: '', btn_en: '', url: '' },
    fields: [
      { k: 'tag', bn: 'ছোট ট্যাগ', en: 'Small tag', kind: 'text' }, { k: 'heading', bn: 'শিরোনাম', en: 'Heading', kind: 'text' }, { k: 'heading_en', bn: 'শিরোনাম (English)', en: 'Heading (English)', kind: 'text' },
      { k: 'text', bn: 'লেখা', en: 'Text', kind: 'textarea', rows: 5, info: 'নতুন লাইনে লিখলে নতুন অনুচ্ছেদ হবে।' }, { k: 'text_en', bn: 'লেখা (English)', en: 'Text (English)', kind: 'textarea', rows: 4 },
      { k: 'align', bn: 'অবস্থান', en: 'Alignment', kind: 'select', options: ALIGN }, { k: 'btn', bn: 'বোতামের লেখা', en: 'Button text', kind: 'text' }, { k: 'btn_en', bn: 'বোতামের লেখা (English)', en: 'Button text (English)', kind: 'text' }, { k: 'url', bn: 'বোতামের লিংক', en: 'Button link', kind: 'text', info: 'যেমন /join বা https://...' },
    ] },
  { type: 'image_text', bn: 'ছবি ও লেখা', en: 'Image & text', icon: 'image', group: 'content', info: 'একপাশে ছবি, অন্যপাশে শিরোনাম ও লেখা।', defaults: { image: '', side: 'left', heading: 'এখানে শিরোনাম', heading_en: '', text: 'এখানে আপনার লেখা বসান।', text_en: '', btn: '', btn_en: '', url: '' },
    fields: [
      { k: 'image', bn: 'ছবি', en: 'Image', kind: 'image' }, { k: 'side', bn: 'ছবি কোন পাশে', en: 'Image side', kind: 'select', options: [['left', 'বাঁয়ে (Left)'], ['right', 'ডানে (Right)']] },
      { k: 'heading', bn: 'শিরোনাম', en: 'Heading', kind: 'text' }, { k: 'heading_en', bn: 'শিরোনাম (English)', en: 'Heading (English)', kind: 'text' },
      { k: 'text', bn: 'লেখা', en: 'Text', kind: 'textarea', rows: 5 }, { k: 'text_en', bn: 'লেখা (English)', en: 'Text (English)', kind: 'textarea', rows: 4 },
      { k: 'btn', bn: 'বোতামের লেখা', en: 'Button text', kind: 'text' }, { k: 'btn_en', bn: 'বোতামের লেখা (English)', en: 'Button text (English)', kind: 'text' }, { k: 'url', bn: 'বোতামের লিংক', en: 'Button link', kind: 'text' },
    ] },
  { type: 'cards', bn: 'কার্ডের সারি', en: 'Card grid', icon: 'grid', group: 'content', info: 'আইকন, শিরোনাম ও ছোট লেখাসহ কয়েকটি কার্ড (সেবা, সুবিধা, ধাপ ইত্যাদির জন্য)।', defaults: { heading: 'আমাদের সুবিধা', heading_en: '', items: '🤲 | বিনা সুদে ঋণ | প্রয়োজনে সদস্যরা বিনা সুদে ঋণ নিতে পারেন।\n📚 | পাঠাগার | ইসলামিক ও জীবনমুখী বইয়ের সংগ্রহ।\n🩺 | স্বাস্থ্যসেবা | বিনামূল্যে প্রেসার ও সুগার পরীক্ষা।', cols: '3' },
    fields: [
      { k: 'heading', bn: 'ভাগের শিরোনাম', en: 'Section heading', kind: 'text' }, { k: 'heading_en', bn: 'ভাগের শিরোনাম (English)', en: 'Section heading (English)', kind: 'text' },
      { k: 'items', bn: 'কার্ডগুলো', en: 'Cards', kind: 'textarea', rows: 7, info: 'প্রতি লাইনে একটি কার্ড: আইকন | শিরোনাম | লেখা' }, { k: 'cols', bn: 'কয়টি কলাম', en: 'Columns', kind: 'select', options: [['2', '২'], ['3', '৩'], ['4', '৪']] },
    ] },
  { type: 'numbers', bn: 'নিজের সংখ্যার সারি', en: 'Custom numbers', icon: 'gauge', group: 'content', info: 'নিজের লেখা সংখ্যা ও নাম, পরিসংখ্যানের মতো রঙিন ঘরে।', defaults: { items: '১০০+ | সক্রিয় সদস্য\n৫০০+ | উপকৃত মানুষ\n২০+ | সেবামূলক কর্মসূচি' },
    fields: [{ k: 'items', bn: 'সংখ্যাগুলো', en: 'Numbers', kind: 'textarea', rows: 6, info: 'প্রতি লাইনে একটি: সংখ্যা | নাম' }] },
  { type: 'faq', bn: 'প্রশ্নোত্তর', en: 'FAQ', icon: 'chat', group: 'content', info: 'চাপলে খোলে এমন প্রশ্ন ও উত্তরের তালিকা।', defaults: { heading: 'সচরাচর প্রশ্ন', heading_en: '', items: 'সদস্য হতে কত টাকা লাগে? | ভর্তি ফি ও মাসিক চাঁদা সেটিংসে ঠিক করা আছে। নিবন্ধন পাতায় দেখুন।\nকীভাবে ঋণ পাব? | সদস্য হয়ে একজন জামিনদারসহ কোষাধ্যক্ষের কাছে আবেদন করুন।' },
    fields: [{ k: 'heading', bn: 'শিরোনাম', en: 'Heading', kind: 'text' }, { k: 'heading_en', bn: 'শিরোনাম (English)', en: 'Heading (English)', kind: 'text' }, { k: 'items', bn: 'প্রশ্ন ও উত্তর', en: 'Questions', kind: 'textarea', rows: 7, info: 'প্রতি লাইনে একটি: প্রশ্ন | উত্তর' }] },
  { type: 'buttons', bn: 'বোতামের সারি', en: 'Button row', icon: 'link', group: 'content', info: 'এক বা একাধিক বোতাম, যেকোনো পাতায় নিয়ে যাওয়ার জন্য।', defaults: { items: 'সদস্য হোন | /join | primary\nহিসাব দেখুন | /transparency | ghost', align: 'center' },
    fields: [{ k: 'items', bn: 'বোতামগুলো', en: 'Buttons', kind: 'textarea', rows: 4, info: 'প্রতি লাইনে একটি: লেখা | লিংক | primary বা ghost' }, { k: 'align', bn: 'অবস্থান', en: 'Alignment', kind: 'select', options: ALIGN }] },
  { type: 'spacer', bn: 'ফাঁকা জায়গা', en: 'Spacer', icon: 'down', group: 'content', info: 'দুই অংশের মাঝে বাড়তি ফাঁক।', defaults: { h: '40' }, fields: [{ k: 'h', bn: 'উচ্চতা', en: 'Height', kind: 'select', options: [['20', 'ছোট (20px)'], ['40', 'মাঝারি (40px)'], ['80', 'বড় (80px)'], ['120', 'অনেক বড় (120px)']] }] },
  { type: 'cta', bn: 'আহ্বানের ব্যানার (CTA)', en: 'Call-to-action banner', icon: 'heart', group: 'cta', info: 'সদস্য হওয়ার বা অন্য কিছুর আহ্বানের বড় ব্যানার, পাঁচ রঙে। হিরোর মতো প্যাটার্নসহ।', defaults: { variant: 'forest', tag: 'আপনিও হোন এই পরিবারের অংশ', tag_en: '', title: 'মাসে ৫০ টাকায় সমাজ বদলের অংশ হোন', title_en: '', text: 'আপনার ছোট সঞ্চয় বিপদে পড়া একজন প্রতিবেশীর বড় ভরসা। সদস্যরা প্রয়োজনে নিজেও বিনা সুদে ঋণ নিতে পারেন।', text_en: '', perks: 'মাসে মাত্র ৫০ টাকা থেকে\nপ্রয়োজনে বিনা সুদে ঋণ\nপ্রতিটি টাকার হিসাব সবার জন্য খোলা', btn1: 'সদস্য ফর্ম পূরণ করুন', btn1_en: '', url1: '/join', btn2: 'ফর্ম প্রিন্ট করুন', btn2_en: '', url2: '/form' },
    fields: [
      { k: 'variant', bn: 'ব্যানারের রং', en: 'Variant', kind: 'select', options: VARIANTS }, { k: 'tag', bn: 'ছোট ট্যাগ', en: 'Tag', kind: 'text' }, { k: 'tag_en', bn: 'ছোট ট্যাগ (English)', en: 'Tag (English)', kind: 'text' },
      { k: 'title', bn: 'শিরোনাম', en: 'Title', kind: 'text' }, { k: 'title_en', bn: 'শিরোনাম (English)', en: 'Title (English)', kind: 'text' }, { k: 'text', bn: 'লেখা', en: 'Text', kind: 'textarea', rows: 3 }, { k: 'text_en', bn: 'লেখা (English)', en: 'Text (English)', kind: 'textarea', rows: 3 },
      { k: 'perks', bn: 'সুবিধার ব্যাজ', en: 'Perk badges', kind: 'textarea', rows: 3, info: 'প্রতি লাইনে একটি। ফাঁকা রাখলে ব্যাজ আসবে না।' },
      { k: 'btn1', bn: 'প্রথম বোতাম', en: 'Button 1', kind: 'text' }, { k: 'btn1_en', bn: 'প্রথম বোতাম (English)', en: 'Button 1 (English)', kind: 'text' }, { k: 'url1', bn: 'প্রথম বোতামের লিংক', en: 'Button 1 link', kind: 'text' },
      { k: 'btn2', bn: 'দ্বিতীয় বোতাম', en: 'Button 2', kind: 'text' }, { k: 'btn2_en', bn: 'দ্বিতীয় বোতাম (English)', en: 'Button 2 (English)', kind: 'text' }, { k: 'url2', bn: 'দ্বিতীয় বোতামের লিংক', en: 'Button 2 link', kind: 'text' },
    ] },
];
export const BODY_BLOCK: BlockDef = { type: 'page_body', bn: 'পেজের মূল কন্টেন্ট', en: 'Page content', icon: 'file', group: 'page', info: 'এই পেজের নিজস্ব অংশ (যেমন সেবার তালিকা, ফর্ম, হিসাবের চার্ট)। এর ওপরে বা নিচে অন্য কম্পোনেন্ট বসানো যায়, রং ও প্যাটার্নও বদলানো যায়।', defaults: {}, fields: [] };
BLOCKS.push(BODY_BLOCK);
export const BLOCK_MAP = Object.fromEntries(BLOCKS.map((b) => [b.type, b])) as Record<string, BlockDef>;

export type Block = { id: string; type: string; on: boolean; props: Record<string, string> } & Partial<SecStyle>;

const safeUrl = (v: string) => (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(v.trim()) ? v.trim().slice(0, 300) : '');
const newId = () => Math.random().toString(36).slice(2, 10);

/** সংরক্ষিত JSON (নতুন বা পুরোনো {k, on, bg...} ধরন) থেকে নিরাপদ ব্লকের তালিকা */
export function cleanBlocks(raw: unknown, max = 60): Block[] {
  if (!Array.isArray(raw)) return [];
  const out: Block[] = [];
  const ids = new Set<string>();
  for (const x of raw.slice(0, max)) {
    if (!x || typeof x !== 'object') continue;
    const r = x as Record<string, unknown>;
    const type = String(r.type ?? r.k ?? '');
    const def = BLOCK_MAP[type];
    if (!def) continue;
    let id = typeof r.id === 'string' && /^[a-z0-9_-]{1,24}$/i.test(r.id) ? r.id : type === r.k ? type : newId();
    if (ids.has(id)) id = newId();
    ids.add(id);
    const rp = (r.props && typeof r.props === 'object' ? r.props : {}) as Record<string, unknown>;
    const props: Record<string, string> = {};
    for (const f of def.fields) {
      let v = rp[f.k] == null ? def.defaults[f.k] ?? '' : String(rp[f.k]);
      v = v.slice(0, f.kind === 'textarea' ? 4000 : 400);
      if (f.kind === 'select' && f.options && !f.options.some(([o]) => o === v)) v = def.defaults[f.k] ?? f.options[0][0];
      if (f.kind === 'checkbox') v = v === '1' ? '1' : '0';
      if (f.k === 'url' || f.k === 'url1' || f.k === 'url2') v = safeUrl(v);
      if (f.kind === 'image') v = /^https?:\/\//.test(v) ? v.slice(0, 500) : '';
      props[f.k] = v;
    }
    out.push({ id, type, on: r.on !== false, props, ...cleanStyle(r as never) });
  }
  return out;
}
export const blockStyle = (b: Block): SecStyle => cleanStyle(b as never);
export const newBlock = (type: string): Block => ({ id: newId(), type, on: true, props: { ...(BLOCK_MAP[type]?.defaults ?? {}) }, bg: 'none', pat: 'none', op: 0.1 });
export const DEFAULT_HOME = ['hero', 'stats', 'ledger', 'events', 'services', 'qard', 'library', 'committee', 'news', 'cta'];
export const defaultHomeBlocks = (): Block[] => DEFAULT_HOME.map((t) => ({ ...newBlock(t), id: t }));
export const RESERVED_SLUGS = ['admin', 'api', 'auth', 'login', 'portal', 'join', 'about', 'services', 'transparency', 'library', 'events', 'committee', 'members', 'news', 'contact', 'support', 'terms', 'privacy', 'form', 'robots.txt', 'sitemap.xml', 'favicon.ico', '_next'];
