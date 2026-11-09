/** আগে থেকে তৈরি পেজগুলো: পেজ বিল্ডারে খুলে সাজানোর জন্য নাম, শিরোনাম ও বিবরণের ডিফল্ট (বাংলা ও English) */
export type BuiltinDef = { slug: string; bn: string; en: string; title: string; title_en: string; text: string; text_en: string };
export const BUILTIN: BuiltinDef[] = [
  { slug: 'about', bn: 'আমাদের কথা', en: 'About us', title: 'আমাদের কথা', title_en: 'About us', text: 'একটি অরাজনৈতিক, স্বেচ্ছাসেবী সামাজিক সংগঠন।', text_en: 'A non-political, voluntary social organisation.' },
  { slug: 'services', bn: 'সেবা ও কার্যক্রম', en: 'Services', title: 'সেবা ও কার্যক্রম', title_en: 'Services and activities', text: 'বিনামূল্যে, সবার জন্য। আপনার দান এই কাজগুলোকে চালু রাখে।', text_en: 'Free, for everyone. Your donations keep this work going.' },
  { slug: 'transparency', bn: 'স্বচ্ছতা ও হিসাব', en: 'Transparency', title: 'স্বচ্ছতা ও হিসাব', title_en: 'Transparency and accounts', text: 'প্রতিটি টাকার উৎস ও ব্যবহার সবার জন্য উন্মুক্ত। তথ্য প্রতিদিন হালনাগাদ হয়।', text_en: 'The source and use of every taka is open to all. Data is updated daily.' },
  { slug: 'library', bn: 'পাঠাগার', en: 'Library', title: 'পাঠাগার', title_en: 'Library', text: 'পাঠাগারে বসে পড়ার জন্য সবার জন্য উন্মুক্ত। কুরআন শিক্ষার ক্লাসও এখানেই হয়।', text_en: 'Open to everyone to read at the library. Quran classes are held here too.' },
  { slug: 'events', bn: 'অনুষ্ঠান ও সভা', en: 'Events', title: 'অনুষ্ঠান ও সভা', title_en: 'Events and meetings', text: 'সভা, সেমিনার ও কর্মসূচির সময়সূচি। সবাই আমন্ত্রিত।', text_en: 'Schedule of meetings, seminars and programmes. Everyone is invited.' },
  { slug: 'committee', bn: 'কার্যনির্বাহী কমিটি', en: 'Committee', title: 'কার্যনির্বাহী কমিটি', title_en: 'Executive committee', text: 'কে কোন দায়িত্বে আছেন।', text_en: 'Who is responsible for what.' },
  { slug: 'members', bn: 'আমাদের সদস্য', en: 'Our members', title: 'আমাদের সদস্য', title_en: 'Our members', text: 'নিবন্ধিত সদস্যদের তালিকা। কার্ডে চাপলে বিস্তারিত দেখুন।', text_en: 'Registered members. Tap a card to see details.' },
  { slug: 'news', bn: 'সংবাদ ও কার্যক্রম', en: 'News', title: 'সংবাদ ও কার্যক্রম', title_en: 'News and activities', text: '', text_en: '' },
  { slug: 'contact', bn: 'যোগাযোগ', en: 'Contact', title: 'যোগাযোগ', title_en: 'Contact', text: 'প্রশ্ন, পরামর্শ বা দান করতে চাইলে যোগাযোগ করুন।', text_en: 'Reach out with questions, suggestions or if you would like to donate.' },
  { slug: 'join', bn: 'সদস্য হোন (নিবন্ধন)', en: 'Join us', title: 'সদস্য হোন', title_en: 'Join us', text: 'এককালীন ভর্তি ফি এবং প্রতি মাসে আপনার সামর্থ্য অনুযায়ী চাঁদা।', text_en: 'A one-time joining fee and a monthly contribution that suits you.' },
  { slug: 'support', bn: 'সহায়তা ও প্রশ্নোত্তর', en: 'Help & FAQ', title: 'সহায়তা ও প্রশ্নোত্তর', title_en: 'Help and FAQ', text: '', text_en: '' },
  { slug: 'terms', bn: 'শর্তাবলী', en: 'Terms', title: 'শর্তাবলী', title_en: 'Terms and conditions', text: '', text_en: '' },
  { slug: 'privacy', bn: 'গোপনীয়তা নীতি', en: 'Privacy policy', title: 'গোপনীয়তা নীতি', title_en: 'Privacy policy', text: '', text_en: '' },
];
export const builtinBySlug = (s: string) => BUILTIN.find((b) => b.slug === s);

/** পেজের মূল কন্টেন্টের তথ্য যেখান থেকে বদলায় (কোডে বাঁধা অংশ নয়, ডেটাবেসের তথ্য) */
export const PAGE_DATA_LINKS: Record<string, [string, string][]> = {
  transparency: [['হিসাব নিজে থেকে হালনাগাদ হয়। দান যোগ করতে', '/admin/donations'], ['ঋণ যোগ করতে', '/admin/loans']],
  library: [['বই যোগ বা বদলাতে', '/admin/library']],
  events: [['অনুষ্ঠান যোগ বা বদলাতে', '/admin/events']],
  committee: [['কমিটির সদস্য বদলাতে', '/admin/content/committee']],
  members: [['সদস্য পাতার সুইচ বদলাতে', '/admin/settings#set-members']],
  news: [['সংবাদ যোগ বা বদলাতে', '/admin/content/posts']],
  join: [['ভর্তি ফি, পেমেন্টের মাধ্যম ও শর্তাবলী বদলাতে', '/admin/settings']],
};
export const BLOCK_DATA_LINKS: Record<string, [string, string]> = {
  hero: ['হিরোর লেখা বদলাতে সেটিংস', '/admin/settings#set-website'],
  services: ['সেবা যোগ বা বদলাতে', '/admin/content/programs'], service_grid: ['সেবা যোগ বা বদলাতে', '/admin/content/programs'],
  events: ['অনুষ্ঠান যোগ বা বদলাতে', '/admin/events'], library: ['বই যোগ বা বদলাতে', '/admin/library'],
  committee: ['কমিটির সদস্য বদলাতে', '/admin/content/committee'], news: ['সংবাদ যোগ বা বদলাতে', '/admin/content/posts'],
  contact_us: ['ফোন, ইমেইল, ঠিকানা বদলাতে', '/admin/contact-info'], two_lists: ['সেটিংসের শর্তাবলী বদলাতে', '/admin/settings#set-notify'],
};

export const TOKEN_HELP = '{reg_fee} ভর্তি ফি, {due_day} চাঁদার শেষ তারিখ, {freeze_months} স্থগিতের মাস, {org_name} সংগঠনের নাম, {phone}, {email}, {address}, {pay_info}';
