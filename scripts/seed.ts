/**
 * ডেমো ডেটা ও প্রথম অ্যাডমিন তৈরি:  npm run seed
 * বারবার চালালেও সমস্যা নেই; আগে থেকে থাকা সদস্য বা অ্যাকাউন্ট আবার তৈরি হয় না।
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { phoneToEmail } from '../lib/auth';
import { addMonths, monthRange, monthStart, todayBD } from '../lib/dates';

config({ path: '.env.local' });
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('❌ .env.local ফাইলে NEXT_PUBLIC_SUPABASE_URL এবং SUPABASE_SERVICE_ROLE_KEY দিন');
  process.exit(1);
}
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

/** নতুন তৈরি হলে true; আগে থেকে থাকলে false। প্রোফাইলে ফোন/ইমেইল বসিয়ে দেয়, যাতে দুইভাবেই লগইন চলে */
async function ensureUser(email: string, password: string, app: Record<string, string>, fullName: string, contact: { phone?: string; email?: string } = {}) {
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: app, user_metadata: { full_name: fullName } });
  if (error && !/already/i.test(error.message)) throw error;
  if (data?.user) await sb.from('profiles').update({ phone: contact.phone ?? null, email: contact.email ?? null }).eq('id', data.user.id);
  return !error;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const must = (r: { data: any; error: { message: string } | null }, what: string): any => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data;
};

async function main() {
  const today = todayBD();
  const cur = monthStart(today);

  // ---- সেটিংস ----
  must(await sb.from('settings').update({
    address: 'আমবাগান, সদর, বাংলাদেশ', phone: '01700000000', email: 'info@hilfulfuzul.org', whatsapp: '01700000000',
    ticker: ['মাসিক চাঁদা প্রতি মাসের ১০ তারিখের মধ্যে জমা দিন', 'প্রতি শুক্রবার বাদ আসর ফ্রি ডায়াবেটিস ও প্রেসার পরীক্ষা', 'পাঠাগারে নতুন ইসলামিক ও জীবনমুখী বই এসেছে'],
    member_terms: ['সদস্য হতে এককালীন ২০০ টাকা ভর্তি ফি দিতে হবে।', 'প্রতি মাসের নির্ধারিত তারিখের মধ্যে নিজের নির্বাচিত মাসিক চাঁদা (৫০ টাকা বা তার বেশি) জমা দিতে হবে।', 'টানা ৩ মাস চাঁদা বকেয়া থাকলে সদস্যপদ স্বয়ংক্রিয়ভাবে স্থগিত হবে এবং পুনরায় ২০০ টাকা দিয়ে সক্রিয় করতে হবে।', 'মাদক সেবন বা মাদক ব্যবসার সাথে জড়িত থাকলে সদস্যপদ বাতিল হবে।', 'জমাকৃত চাঁদা সংগঠনের তহবিলের অংশ, যা করজে হাসানা ও সমাজসেবায় ব্যবহৃত হবে।'],
    loan_terms: ['এই ঋণ সম্পূর্ণ বিনা সুদে (করজে হাসানা) প্রদান করা হলো।', 'শুধু সক্রিয় সদস্যরা ঋণ পাবেন এবং একসাথে একটির বেশি ঋণ চলমান রাখা যাবে না।', 'নির্ধারিত মেয়াদ শেষে অথবা নির্ধারিত কিস্তিতে সম্পূর্ণ অর্থ ফেরত দিতে হবে।', 'একজন জামিনদার থাকবেন, যিনি ঋণগ্রহীতা অর্থ ফেরত না দিলে দায়বদ্ধ থাকবেন।', 'ঋণগ্রহীতা ও জামিনদার রসিদে স্বাক্ষর করে ঋণ গ্রহণ স্বীকার করছেন। অফিস কপি সংগঠনে সংরক্ষিত থাকবে।'],
    pay_info: 'বিকাশ/নগদ (পার্সোনাল): 01700000000। রেফারেন্সে সদস্য নম্বর লিখুন, অথবা কোষাধ্যক্ষের কাছে নগদ জমা দিন।',
    pay_methods: [
      { kind: 'bkash', label: 'বিকাশ (পার্সোনাল)', number: '01700000000', note: 'সেন্ড মানি করে রেফারেন্সে সদস্য নম্বর বা নাম লিখুন' },
      { kind: 'nagad', label: 'নগদ (পার্সোনাল)', number: '01700000000', note: 'সেন্ড মানি করে ট্রানজ্যাকশন আইডি জানান' },
      { kind: 'rocket', label: 'রকেট', number: '017000000009', note: '' },
      { kind: 'bank', label: 'ব্যাংক হিসাব (ইসলামী ব্যাংক, সঞ্চয়ী)', number: 'হিসাব নং ২০৫০১২৩৪৫৬৭৮৯০১', note: 'হিসাবের নাম: হিলফুল ফুজুল পাঠাগার ও যুব সংঘ' },
      { kind: 'cash', label: 'সরাসরি কোষাধ্যক্ষকে', number: 'পাঠাগার অফিসে, প্রতি শুক্রবার বাদ আসর', note: 'নগদ দিলে রসিদ নিয়ে নিন' },
    ],
    quran_info: 'প্রতি শনি, সোম, বুধ ও বৃহস্পতিবার বাদ মাগরিব পাঠাগার হলে কুরআন শিক্ষা। ছোট থেকে বয়স্ক সবার জন্য বিনামূল্যে।',
  }).eq('id', 1), 'settings');
  console.log('✓ সেটিংস');

  // ---- প্রথম অ্যাডমিন ----
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hilfulfuzul.org';
  const adminPass = process.env.ADMIN_PASSWORD || 'change-this-password';
  const adminPhone = process.env.ADMIN_PHONE?.replace(/\D/g, '').replace(/^880/, '0') || undefined;
  const createdAdmin = await ensureUser(adminEmail, adminPass, { role: 'admin' }, 'অ্যাডমিন', { email: adminEmail.toLowerCase(), phone: adminPhone });
  console.log(createdAdmin ? `✓ অ্যাডমিন তৈরি: ${adminEmail}` : `• অ্যাডমিন আগে থেকেই আছে: ${adminEmail}`);

  // ---- ডেমো সদস্য (সাথে লগইন) ----
  const demo: { name: string; phone: string; job: string; fee: number; ago: number; skip: number }[] = [
    { name: 'মোঃ আব্দুর রহিম', phone: '01711223344', job: 'কৃষক', fee: 100, ago: 8, skip: 0 },
    { name: 'মোঃ কামরুল হাসান', phone: '01812345678', job: 'ব্যবসায়ী', fee: 200, ago: 12, skip: 0 },
    { name: 'সাইফুল ইসলাম', phone: '01913456789', job: 'শিক্ষক', fee: 50, ago: 6, skip: 1 },
    { name: 'মোঃ জাহিদুল ইসলাম', phone: '01715678901', job: 'দোকানদার', fee: 100, ago: 10, skip: 0 },
    { name: 'মোঃ শাহিন আলম', phone: '01556789123', job: 'দিনমজুর', fee: 50, ago: 9, skip: 4 },
    { name: 'নাজমুল হক', phone: '01934567891', job: 'চাকরিজীবী', fee: 500, ago: 14, skip: 0 },
  ];
  const ids: string[] = [];
  for (const d of demo) {
    const existing = must(await sb.from('members').select('id').eq('phone', d.phone).maybeSingle(), 'member lookup');
    if (existing) { ids.push(existing.id); continue; }
    const join = addMonths(cur, -d.ago).slice(0, 8) + '05';
    const m = must(await sb.from('members').insert({ name: d.name, phone: d.phone, occupation: d.job, address: 'আমবাগান', monthly_amount: d.fee, join_date: join, verified_at: new Date().toISOString() }).select('id').single(), 'member insert');
    ids.push(m.id);
    const months = monthRange(join, addMonths(cur, -1));
    const rows = [
      { member_id: m.id, type: 'registration', amount: 200, paid_on: join, method: 'নগদ' },
      ...months.slice(0, months.length - d.skip).map((mo) => ({ member_id: m.id, type: 'monthly', for_month: mo, amount: d.fee, paid_on: mo.slice(0, 8) + '07', method: 'বিকাশ' })),
    ];
    must(await sb.from('payments').insert(rows), 'payments');
    const pw = d.phone.slice(-6);
    await ensureUser(phoneToEmail(d.phone)!, pw, { role: 'member', member_id: m.id }, d.name, { phone: d.phone });
    console.log(`✓ সদস্য ${d.name}  (লগইন: ${d.phone}, পাসওয়ার্ড ${pw})`);
  }

  // ---- ঋণ ----
  const { count: loanCount } = await sb.from('loans').select('id', { count: 'exact', head: true });
  if (!loanCount) {
    const l1 = must(await sb.from('loans').insert({ member_id: ids[0], amount: 10000, term_months: 6, mode: 'installment', issued_on: addMonths(cur, -3).slice(0, 8) + '04', guarantor_name: demo[3].name, guarantor_phone: demo[3].phone, purpose: 'চিকিৎসা' }).select('id').single(), 'loan');
    must(await sb.from('loan_repayments').insert([1, 2].map((k) => ({ loan_id: l1.id, amount: 1667, paid_on: addMonths(cur, -3 + k).slice(0, 8) + '04' }))), 'repayments');
    must(await sb.from('loans').insert({ member_id: ids[1], amount: 5000, term_months: 3, mode: 'lump', issued_on: today, guarantor_name: demo[5].name, guarantor_phone: demo[5].phone, purpose: 'ছোট ব্যবসা' }), 'loan 2');
    console.log('✓ ঋণ');
  }

  // ---- দান, বই, অনুষ্ঠান, সেবা, কমিটি (শুধু খালি থাকলে) ----
  const empty = async (t: string) => ((await sb.from(t).select('id', { count: 'exact', head: true })).count ?? 0) === 0;
  if (await empty('donations')) {
    must(await sb.from('donations').insert([
      { donor_name: 'আলহাজ্ব আব্দুল মজিদ', anonymous: false, amount: 5000, purpose: 'শীতবস্ত্র', donated_on: today },
      { donor_name: 'মোঃ সেলিম রেজা (সৌদি প্রবাসী)', anonymous: false, amount: 10000, purpose: 'করজে হাসানা', donated_on: addMonths(cur, -1).slice(0, 8) + '12' },
      { donor_name: 'ডাঃ নুরুল আমিন', anonymous: false, amount: 3000, purpose: 'স্বাস্থ্যসেবা', donated_on: addMonths(cur, -2).slice(0, 8) + '20' },
      { donor_name: 'গোপন দাতা', anonymous: true, amount: 2000, purpose: 'সাধারণ তহবিল', donated_on: today },
    ]), 'donations');
    console.log('✓ দান');
  }
  if (await empty('books')) {
    must(await sb.from('books').insert([
      ['রিয়াদুস সালেহীন', 'ইমাম নববী', 'হাদিস', 3], ['আর রাহীকুল মাখতূম', 'সফিউর রহমান মুবারকপুরী', 'সীরাত', 4],
      ['হিসনুল মুসলিম', 'সাঈদ ইবনে আলী আল কাহতানী', 'দোয়া', 6], ['প্যারাডক্সিক্যাল সাজিদ', 'আরিফ আজাদ', 'জীবনমুখী', 3],
      ['নূরানী কায়দা', 'সংকলিত', 'কুরআন শিক্ষা', 15], ['মাদককে না বলুন', 'সংকলিত', 'সচেতনতা', 5],
    ].map(([title, author, category, copies]) => ({ title, author, category, copies }))), 'books');
    console.log('✓ বই');
  }
  if (await empty('events')) {
    must(await sb.from('events').insert({
      title: 'মাদকমুক্ত যুবসমাজ গঠনে আমাদের করণীয়', topic: 'আলোচনা সভা ও সচেতনতা সেমিনার',
      event_date: new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10), event_time: 'বিকাল ৩টা', venue: 'আমবাগান সরকারি প্রাথমিক বিদ্যালয় মাঠ',
      chief_guest: 'জনাব মোঃ আনোয়ার হোসেন, উপজেলা নির্বাহী অফিসার', special_guest: 'মাওলানা আব্দুল হালিম', presided_by: 'সভাপতি',
      outcome: 'প্রতিটি পাড়ায় মাদকবিরোধী স্বেচ্ছাসেবক দল গঠন।', show_popup: true, show_in_hero: true,
      design: { template: 'gradient', c1: '#0e5a43', c2: '#1b8a68', angle: 135, text: '#ffffff', accent: '#e8b44a', font: 'Baloo Da 2', size: 30, icon: '🕌', tag: 'আসন্ন অনুষ্ঠান' },
    }), 'events');
    console.log('✓ অনুষ্ঠান');
  }
  if (await empty('programs')) {
    must(await sb.from('programs').insert([
      ['🩸', 'বিনামূল্যে ডায়াবেটিস পরীক্ষা', 'প্রতি শুক্রবার বাদ আসর রক্তে শর্করা মেপে দেওয়া হয়।', 640],
      ['🫀', 'বিনামূল্যে রক্তচাপ পরিমাপ', 'যেকোনো দিন পাঠাগারে এসে প্রেসার মাপাতে পারেন।', 910],
      ['🧥', 'শীতবস্ত্র বিতরণ', 'প্রতি শীতে অসহায় পরিবারের মাঝে কম্বল ও গরম কাপড়।', 1150],
      ['🎓', 'মেধাবী শিক্ষার্থী বৃত্তি', 'অসচ্ছল মেধাবীদের বই, ফি ও মাসিক সহায়তা।', 48],
      ['⚽', 'খেলাধুলার সরঞ্জাম ও জার্সি', 'বল, ব্যাট, নেট ও দলের জার্সি প্রদান এবং মাঠ পরিচর্যা।', 220],
      ['📖', 'কুরআন শিক্ষা', 'সপ্তাহে ৪ দিন ছোট থেকে বয়স্ক সবার জন্য বিনামূল্যে।', 135],
    ].map(([icon, title, description, beneficiaries], i) => ({ icon, title, description, beneficiaries, sort: i }))), 'programs');
    console.log('✓ সেবা');
  }
  if (await empty('committee')) {
    must(await sb.from('committee').insert([
      ['নাজমুল হক', 'সভাপতি', 'সার্বিক তত্ত্বাবধান ও সভা পরিচালনা'], ['সাইফুল ইসলাম', 'সাধারণ সম্পাদক', 'দাপ্তরিক কাজ ও যোগাযোগ'],
      ['মোঃ কামরুল হাসান', 'কোষাধ্যক্ষ', 'তহবিল, চাঁদা আদায় ও ঋণের হিসাব'], ['মোঃ জাহিদুল ইসলাম', 'পাঠাগার সম্পাদক', 'বই সংগ্রহ ও পাঠক সেবা'],
    ].map(([name, role, duty], i) => ({ name, role, duty, sort: i }))), 'committee');
    console.log('✓ কমিটি');
  }

  if (await empty('posts')) {
    must(await sb.from('posts').insert([
      { title: 'ফ্রি ডায়াবেটিস ক্যাম্পে ২১২ জনের পরীক্ষা', published_on: addMonths(cur, -1).slice(0, 8) + '18', body: 'গত শুক্রবার পাঠাগার হলে আয়োজিত ক্যাম্পে ২১২ জনের রক্তে শর্করা ও রক্তচাপ পরীক্ষা করা হয়।\nঝুঁকিপূর্ণ ৩১ জনকে চিকিৎসকের পরামর্শ নিতে বলা হয়েছে।' },
      { title: 'পাঠাগারে নতুন বই সংযোজন', published_on: addMonths(cur, -1).slice(0, 8) + '02', body: 'তাফসীর, হাদিস ও সীরাত বিষয়ে নতুন বই এসেছে। সবাই পাঠাগারে বসে পড়তে পারবেন।' },
      { title: 'আন্তঃপাড়া ফুটবল টুর্নামেন্ট সম্পন্ন', published_on: addMonths(cur, -2).slice(0, 8) + '15', body: '৮টি দলের অংশগ্রহণে টুর্নামেন্ট শেষ হয়েছে। সব দলকে নতুন জার্সি ও বল দেওয়া হয়েছে।' },
    ]), 'posts');
    console.log('✓ সংবাদ');
  }

  // ---- স্বয়ংক্রিয় ফ্রিজ এখনই একবার চালানো ----
  const { data: frozen, error } = await sb.rpc('run_auto_freeze');
  console.log(error ? `! ফ্রিজ চালানো যায়নি: ${error.message}` : `✓ স্বয়ংক্রিয় ফ্রিজ: ${frozen} জন স্থগিত`);
  console.log('\n✅ ডেমো ডেটা তৈরি সম্পন্ন। এখন npm run dev চালান।');
}

main().catch((e) => {
  console.error('❌', e.message ?? e);
  process.exit(1);
});
