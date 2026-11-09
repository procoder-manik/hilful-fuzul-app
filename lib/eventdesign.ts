/** অনুষ্ঠান ও পপআপ ব্যানারের ডিজাইন: রঙের ভেরিয়েন্ট (হালকা ও গাঢ়), প্যাটার্ন ও রেডিমেড টেমপ্লেট। সার্ভার ও ক্লায়েন্ট দুই জায়গাতেই চলে। */

export type Design = {
  template: 'gradient' | 'split' | 'image'; c1: string; c2: string; angle: number; text: string; accent: string; tagText: string;
  font: string; size: number; icon: string; tag: string; image: string; pattern: Pattern; patternOpacity: number; preset: string;
};
export type Pattern = 'none' | 'geo' | 'dots' | 'stripes' | 'waves' | 'stars';

export const DEFAULT_TAG = 'আসন্ন অনুষ্ঠান';
export const DEFAULT_DESIGN: Design = { template: 'gradient', c1: '#0e5a43', c2: '#1b8a68', angle: 135, text: '#ffffff', accent: '#e8b44a', tagText: '#2a1d00', font: 'Baloo Da 2', size: 30, icon: '🕌', tag: DEFAULT_TAG, image: '', pattern: 'geo', patternOpacity: 0.12, preset: 'mango' };

export type Preset = { id: string; name: string; en: string; tone: 'deep' | 'light'; c1: string; c2: string; text: string; accent: string; tagText: string };
export const PRESETS: Preset[] = [
  { id: 'mango', name: 'আমপাতা', en: 'Mango green', tone: 'deep', c1: '#0e5a43', c2: '#1b8a68', text: '#ffffff', accent: '#e8b44a', tagText: '#2a1d00' },
  { id: 'river', name: 'নদী', en: 'River blue', tone: 'deep', c1: '#0b3d91', c2: '#2a7de1', text: '#ffffff', accent: '#5ac8fa', tagText: '#052a52' },
  { id: 'dusk', name: 'সন্ধ্যা', en: 'Dusk purple', tone: 'deep', c1: '#3b2a8c', c2: '#7a4bd8', text: '#ffffff', accent: '#f0a6ca', tagText: '#3a0f2a' },
  { id: 'rose', name: 'গোলাপি', en: 'Deep rose', tone: 'deep', c1: '#8c1d4a', c2: '#d93a5c', text: '#ffffff', accent: '#ffd166', tagText: '#3a2600' },
  { id: 'gold', name: 'সোনালি', en: 'Golden brown', tone: 'deep', c1: '#7a4a00', c2: '#d9941c', text: '#ffffff', accent: '#fff1c2', tagText: '#4a2e00' },
  { id: 'night', name: 'রাত', en: 'Midnight', tone: 'deep', c1: '#0b1b2b', c2: '#1d3b57', text: '#ffffff', accent: '#e8b44a', tagText: '#2a1d00' },
  { id: 'forest', name: 'গহিন বন', en: 'Forest', tone: 'deep', c1: '#0a2e22', c2: '#0e6b4a', text: '#ffffff', accent: '#9be7c0', tagText: '#06281c' },
  { id: 'mint', name: 'পুদিনা', en: 'Soft mint', tone: 'light', c1: '#e3f6ee', c2: '#bfead4', text: '#0b3d2b', accent: '#0e8a5f', tagText: '#ffffff' },
  { id: 'sky', name: 'আকাশি', en: 'Sky', tone: 'light', c1: '#e4f0ff', c2: '#c2dbff', text: '#0b2a5c', accent: '#1f6fd6', tagText: '#ffffff' },
  { id: 'lilac', name: 'ল্যাভেন্ডার', en: 'Lavender', tone: 'light', c1: '#efe8ff', c2: '#d9c9ff', text: '#2a1a63', accent: '#7a4bd8', tagText: '#ffffff' },
  { id: 'peach', name: 'পিচ', en: 'Peach', tone: 'light', c1: '#fff0e1', c2: '#ffd7ac', text: '#5a2b00', accent: '#d97a00', tagText: '#ffffff' },
  { id: 'blush', name: 'গোলাপ', en: 'Blush', tone: 'light', c1: '#ffe8ee', c2: '#ffc6d4', text: '#5c0f2a', accent: '#d93a5c', tagText: '#ffffff' },
  { id: 'cream', name: 'ক্রিম সোনা', en: 'Cream gold', tone: 'light', c1: '#fff7de', c2: '#ffe59b', text: '#4a3500', accent: '#b07a00', tagText: '#ffffff' },
];

export const PATTERNS: [Pattern, string, string][] = [
  ['none', 'কোনো প্যাটার্ন নয়', 'No pattern'], ['geo', 'জ্যামিতিক (হিরোর মতো)', 'Geometric'], ['dots', 'বিন্দু', 'Dots'],
  ['stripes', 'কোণাকুণি দাগ', 'Diagonal stripes'], ['waves', 'ঢেউ', 'Waves'], ['stars', 'তারা', 'Stars'],
];

export const ICONS = ['🕌', '📅', '🎓', '🧥', '🍚', '👕', '🤲', '🩺', '📖', '🌙', '🩸', '🌳', '🚫', '🤝', '🎉', '⚽'];

/** রেডিমেড টেমপ্লেট: বেছে নিলে লেখা ও ডিজাইন একসাথে বসে যায়, তারপর নিজের মতো বদলানো যায় */
export type Template = { id: string; name: string; en: string; icon: string; title: string; topic: string; tag: string; preset: string; pattern: Pattern; venue: string; time: string; outcome: string };
export const TEMPLATES: Template[] = [
  { id: 'meeting', name: 'সাধারণ সভা', en: 'General meeting', icon: '🤝', title: 'সাধারণ সভা', topic: 'সদস্যদের পরামর্শ ও আগামী পরিকল্পনা', tag: 'আসন্ন সভা', preset: 'mango', pattern: 'geo', venue: 'সংগঠনের কার্যালয়', time: 'বিকাল ৫:০০', outcome: '' },
  { id: 'seminar', name: 'সেমিনার', en: 'Seminar', icon: '🎓', title: 'সেমিনার', topic: 'মাদকমুক্ত যুবসমাজ গঠনে আমাদের করণীয়', tag: 'আসন্ন সেমিনার', preset: 'river', pattern: 'dots', venue: 'এলাকার কমিউনিটি হল', time: 'সকাল ১০:০০', outcome: '' },
  { id: 'winter', name: 'শীতবস্ত্র বিতরণ', en: 'Winter clothes', icon: '🧥', title: 'শীতবস্ত্র বিতরণ কর্মসূচি', topic: 'দুস্থ ও অসহায় মানুষের মাঝে কম্বল ও গরম কাপড় বিতরণ', tag: 'সেবা কর্মসূচি', preset: 'night', pattern: 'stars', venue: 'সংগঠনের কার্যালয়', time: 'সকাল ১০:০০', outcome: 'শীতার্ত মানুষের মাঝে কম্বল ও গরম কাপড় বিতরণ করা হয়েছে।' },
  { id: 'eidfood', name: 'ঈদে সেমাই-চিনি বিতরণ', en: 'Eid food pack', icon: '🍚', title: 'ঈদ উপহার: সেমাই, চিনি ও খাদ্যসামগ্রী বিতরণ', topic: 'গরিব ও দুঃখী পরিবারের ঈদের আনন্দ ভাগ করে নিতে', tag: 'ঈদ কর্মসূচি', preset: 'gold', pattern: 'geo', venue: 'সংগঠনের কার্যালয়', time: 'সকাল ৯:০০', outcome: 'অসহায় পরিবারগুলোর হাতে সেমাই, চিনি ও খাদ্যসামগ্রী পৌঁছে দেওয়া হয়েছে।' },
  { id: 'eiddress', name: 'ঈদের পোশাক বিতরণ', en: 'Eid clothes', icon: '👕', title: 'ঈদের নতুন পোশাক বিতরণ', topic: 'এতিম ও দুস্থ শিশুদের মুখে ঈদের হাসি ফোটাতে', tag: 'ঈদ কর্মসূচি', preset: 'blush', pattern: 'stars', venue: 'সংগঠনের কার্যালয়', time: 'সকাল ১০:০০', outcome: 'এতিম ও দুস্থ শিশুদের মাঝে নতুন পোশাক বিতরণ করা হয়েছে।' },
  { id: 'cash', name: 'দুস্থদের আর্থিক সহায়তা', en: 'Cash aid', icon: '🤲', title: 'দুস্থদের আর্থিক সহায়তা প্রদান', topic: 'অসুস্থ, বিধবা ও অসহায় মানুষের পাশে', tag: 'সেবা কর্মসূচি', preset: 'forest', pattern: 'waves', venue: 'সংগঠনের কার্যালয়', time: 'বিকাল ৪:০০', outcome: 'তালিকাভুক্ত দুস্থ পরিবারগুলোকে আর্থিক সহায়তা দেওয়া হয়েছে।' },
  { id: 'health', name: 'ফ্রি স্বাস্থ্য ক্যাম্প', en: 'Free health camp', icon: '🩺', title: 'ফ্রি স্বাস্থ্য পরীক্ষা ক্যাম্প', topic: 'ডায়াবেটিস, প্রেসার ও সাধারণ স্বাস্থ্য পরীক্ষা বিনামূল্যে', tag: 'আসন্ন ক্যাম্প', preset: 'mint', pattern: 'dots', venue: 'এলাকার কমিউনিটি হল', time: 'সকাল ৯:০০ থেকে দুপুর ১:০০', outcome: '' },
  { id: 'quran', name: 'কুরআন শিক্ষা ও কিরাত', en: 'Quran programme', icon: '📖', title: 'কুরআন শিক্ষা ও কিরাত প্রতিযোগিতা', topic: 'শিশু-কিশোরদের কুরআন তিলাওয়াতের আসর', tag: 'আসন্ন আয়োজন', preset: 'lilac', pattern: 'geo', venue: 'পাঠাগার প্রাঙ্গণ', time: 'বাদ আসর', outcome: '' },
  { id: 'iftar', name: 'ইফতার মাহফিল', en: 'Iftar gathering', icon: '🌙', title: 'ইফতার মাহফিল', topic: 'সবাই মিলে ইফতার ও দোয়া', tag: 'আসন্ন মাহফিল', preset: 'dusk', pattern: 'stars', venue: 'সংগঠনের কার্যালয়', time: 'আসরের পর', outcome: '' },
  { id: 'blood', name: 'রক্তদান কর্মসূচি', en: 'Blood donation', icon: '🩸', title: 'স্বেচ্ছায় রক্তদান কর্মসূচি', topic: 'একটি রক্তের ব্যাগ, একটি প্রাণ', tag: 'আসন্ন কর্মসূচি', preset: 'rose', pattern: 'waves', venue: 'এলাকার কমিউনিটি হল', time: 'সকাল ১০:০০', outcome: '' },
  { id: 'tree', name: 'বৃক্ষরোপণ', en: 'Tree planting', icon: '🌳', title: 'বৃক্ষরোপণ কর্মসূচি', topic: 'সবুজ গড়ি, পরিবেশ বাঁচাই', tag: 'আসন্ন কর্মসূচি', preset: 'cream', pattern: 'dots', venue: 'এলাকার খোলা মাঠ', time: 'সকাল ৮:০০', outcome: '' },
  { id: 'antidrug', name: 'মাদকবিরোধী র‍্যালি', en: 'Anti-drug rally', icon: '🚫', title: 'মাদকবিরোধী র‍্যালি ও সচেতনতা সভা', topic: 'মাদককে না বলি, সুস্থ জীবন গড়ি', tag: 'আসন্ন র‍্যালি', preset: 'sky', pattern: 'stripes', venue: 'এলাকার প্রধান সড়ক', time: 'সকাল ৯:০০', outcome: '' },
];

const HEX = /^#[0-9a-fA-F]{6}$/;
const clamp = (n: unknown, a: number, b: number, d: number) => { const x = Number(n); return Number.isFinite(x) ? Math.min(b, Math.max(a, x)) : d; };
const color = (v: unknown, d: string) => (typeof v === 'string' && HEX.test(v) ? v : d);
const text = (v: unknown, d: string, max: number) => (typeof v === 'string' ? v.slice(0, max) : d);

/** ক্লায়েন্ট থেকে আসা ডিজাইন JSON কে নিরাপদ ও সঠিক রূপে আনে */
export function cleanDesign(raw: unknown): Design {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const D = DEFAULT_DESIGN;
  const image = typeof r.image === 'string' && /^https?:\/\//.test(r.image) ? r.image.slice(0, 500) : '';
  return {
    template: r.template === 'split' || r.template === 'image' ? r.template : 'gradient',
    c1: color(r.c1, D.c1), c2: color(r.c2, D.c2), angle: clamp(r.angle, 0, 360, D.angle), text: color(r.text, D.text), accent: color(r.accent, D.accent), tagText: color(r.tagText, D.tagText),
    font: D.font, size: clamp(r.size, 20, 48, D.size), icon: text(r.icon, D.icon, 8), tag: text(r.tag, D.tag, 40) || D.tag, image,
    pattern: (['none', 'geo', 'dots', 'stripes', 'waves', 'stars'] as const).includes(r.pattern as Pattern) ? (r.pattern as Pattern) : 'none',
    patternOpacity: clamp(r.patternOpacity, 0, 0.4, D.patternOpacity), preset: text(r.preset, '', 20),
  };
}

export const designFromPreset = (p: Preset, base: Partial<Design> = {}): Design => ({ ...DEFAULT_DESIGN, ...base, c1: p.c1, c2: p.c2, text: p.text, accent: p.accent, tagText: p.tagText, preset: p.id });
export const presetById = (id: string) => PRESETS.find((p) => p.id === id) ?? PRESETS[0];
