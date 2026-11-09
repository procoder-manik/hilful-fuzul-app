/**
 * লগইন কেন হচ্ছে না, ধাপে ধাপে পরীক্ষা করে আসল কারণ বলে দেয়:
 *   npx tsx scripts/check-login.ts আপনার@ইমেইল আপনারপাসওয়ার্ড
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
const [email, password] = [process.argv[2]?.trim().toLowerCase(), process.argv[3]];
const ok = (m: string) => console.log('✅', m), bad = (m: string) => console.log('❌', m), info = (m: string) => console.log('   ', m);
if (!email || !password) { console.error('ব্যবহার: npx tsx scripts/check-login.ts আপনার@ইমেইল আপনারপাসওয়ার্ড'); process.exit(1); }

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('--- ১. .env.local এর চাবি');
  for (const [n, v] of [['NEXT_PUBLIC_SUPABASE_URL', url], ['NEXT_PUBLIC_SUPABASE_ANON_KEY', anon], ['SUPABASE_SERVICE_ROLE_KEY', svc]] as const) (v ? ok : bad)(`${n} ${v ? 'আছে' : 'নেই বা ফাঁকা'}`);
  if (!url || !anon || !svc) process.exit(1);
  if (anon === svc) bad('ANON চাবি আর SERVICE_ROLE চাবি একই! দুটো আলাদা হওয়ার কথা (Supabase > Project Settings > API)');
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) bad(`URL এর রূপ সন্দেহজনক: ${url} (হওয়া উচিত https://xxxxxxxx.supabase.co)`);

  const admin = createClient(url, svc, { auth: { persistSession: false } });
  console.log('--- ২. অ্যাকাউন্ট আছে কিনা');
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) { bad(`Supabase এর সাথে সংযোগ বা সার্ভিস চাবি ঠিক নয়: ${error.message}`); process.exit(1); }
  const u = data.users.find((x) => x.email?.toLowerCase() === email);
  if (!u) { bad(`${email} নামে কোনো অ্যাকাউন্ট নেই।`); info('অ্যাকাউন্টগুলো: ' + (data.users.map((x) => x.email).join(', ') || '(একটিও নেই)')); info('সমাধান: npx tsx scripts/set-password.ts ' + email + ' নতুনপাসওয়ার্ড   (অ্যাডমিন তৈরি করে দেবে)'); process.exit(1); }
  ok(`অ্যাকাউন্ট আছে (ইমেইল নিশ্চিত: ${u.email_confirmed_at ? 'হ্যাঁ' : 'না'})`);
  if (!u.email_confirmed_at) bad('ইমেইল নিশ্চিত করা নেই, তাই ঢুকতে দিচ্ছে না। set-password স্ক্রিপ্ট চালালে নিশ্চিত হয়ে যাবে।');

  console.log('--- ৩. প্রোফাইল ও রোল');
  const { data: p, error: pe } = await admin.from('profiles').select('role, member_id, phone, email').eq('id', u.id).maybeSingle();
  if (pe) bad(`প্রোফাইল পড়া যায়নি: ${pe.message}`);
  else if (!p) bad('এই অ্যাকাউন্টের প্রোফাইলই নেই। set-password স্ক্রিপ্ট চালালে তৈরি হবে।');
  else (p.role === 'admin' ? ok : bad)(`রোল: ${p.role}${p.role === 'admin' ? '' : ' (অ্যাডমিন প্যানেলের জন্য admin হতে হবে)'}`);

  console.log('--- ৪. পাসওয়ার্ড দিয়ে সাইন-ইন (ওয়েবসাইট যে চাবি ব্যবহার করে হুবহু সেটি দিয়ে)');
  const web = createClient(url, anon, { auth: { persistSession: false } });
  const r = await web.auth.signInWithPassword({ email, password });
  if (r.error) {
    bad(`সাইন-ইন ব্যর্থ: ${r.error.message}`);
    if (/invalid login credentials/i.test(r.error.message)) info('পাসওয়ার্ড ভুল। সমাধান: npx tsx scripts/set-password.ts ' + email + ' নতুনপাসওয়ার্ড');
    else if (/api key/i.test(r.error.message)) info('NEXT_PUBLIC_SUPABASE_ANON_KEY ভুল। Supabase > Project Settings > API থেকে "anon public" চাবিটি আবার কপি করুন।');
    else info('এটি পাসওয়ার্ডের সমস্যা নয়; ইন্টারনেট বা Supabase প্রজেক্ট (Paused কিনা) দেখুন।');
    process.exit(1);
  }
  ok('পাসওয়ার্ড ঠিক আছে, সাইন-ইন সফল');
  const { data: f } = await web.auth.mfa.listFactors();
  console.log('--- ৫. OTP (অথেনটিকেটর অ্যাপ)');
  const has = f?.totp?.some((x) => x.status === 'verified');
  info(has ? 'অ্যাপ যুক্ত আছে: লগইনের পর কোড চাইবে' : 'অ্যাপ এখনো যুক্ত হয়নি: লগইনের পর QR কোডের পাতা আসবে (এটা স্বাভাবিক)');
  console.log('\nসব ঠিক থাকলে এখন http://localhost:3000/login?as=staff এ ঢুকুন।');
})().catch((e) => { console.error('❌', e.message ?? e); process.exit(1); });
