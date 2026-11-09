/**
 * অ্যাডমিনের ইমেইল বদলানো (একই অ্যাকাউন্ট, একই পাসওয়ার্ড ও OTP, শুধু ইমেইল নতুন):
 *   npm run change-email -- নতুন@ইমেইল [পুরোনো@ইমেইল]
 * পুরোনো ইমেইল না দিলে .env.local এর ADMIN_EMAIL ধরা হয়; তাও না থাকলে একমাত্র অ্যাডমিনকে বেছে নেয়।
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
const norm = (v?: string) => v?.trim().toLowerCase();
const fail = (m: string) => { console.error(m); process.exitCode = 1; };

async function main() {
  const next = norm(process.argv[2]);
  const prev = norm(process.argv[3]) || norm(process.env.ADMIN_EMAIL);
  if (!next || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(next)) return fail('ব্যবহার: npm run change-email -- নতুন@ইমেইল [পুরোনো@ইমেইল]');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail('❌ .env.local এ NEXT_PUBLIC_SUPABASE_URL ও SUPABASE_SERVICE_ROLE_KEY দিন');
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const { data: profs } = await sb.from('profiles').select('id, role');
  const role = new Map((profs ?? []).map((p) => [p.id, p.role as string]));
  const adminIds = new Set((profs ?? []).filter((p) => p.role === 'admin').map((p) => p.id));

  const exists = data.users.find((x) => norm(x.email) === next);
  if (exists) {
    const r = role.get(exists.id) ?? 'অজানা';
    console.log(`ℹ️ ${next} ইমেইলে আগে থেকেই একটি অ্যাকাউন্ট আছে (ভূমিকা: ${r}), তাই নতুন করে বদলানোর দরকার নেই।`);
    if (r === 'admin') console.log('   এটি আগে থেকেই অ্যাডমিন। এই ইমেইল ও আপনার পাসওয়ার্ড দিয়ে /login?as=staff এ ঢুকুন।\n   পাসওয়ার্ড মনে না থাকলে চালান: npm run set-password -- ' + next + ' নতুনপাসওয়ার্ড');
    else console.log(`   এটিকে অ্যাডমিন বানাতে এবং নতুন পাসওয়ার্ড দিতে চালান:\n   npm run set-password -- ${next} নতুনপাসওয়ার্ড   (কমপক্ষে ৮ অক্ষর)`);
    const others = data.users.filter((x) => adminIds.has(x.id) && norm(x.email) !== next).map((x) => x.email);
    if (others.length) console.log(`   অন্য অ্যাডমিন অ্যাকাউন্ট: ${others.join(', ')} (দরকার না হলে অ্যাডমিন > কমিটির অ্যাক্সেস থেকে সরাতে পারেন)`);
    return;
  }

  let u = prev ? data.users.find((x) => norm(x.email) === prev) : undefined;
  if (!u) {
    const list = data.users.filter((x) => adminIds.has(x.id));
    if (!prev && list.length === 1) u = list[0];
    else return fail(`❌ পুরোনো অ্যাডমিন পাওয়া যায়নি। অ্যাডমিন ইমেইল: ${list.map((x) => x.email).join(', ') || '(কেউ নেই)'}\n   আবার চালান: npm run change-email -- ${next} পুরোনো@ইমেইল`);
  }
  if (!adminIds.has(u.id)) return fail(`❌ ${u.email} অ্যাডমিন নন, তাই বদলানো হলো না`);
  const r = await sb.auth.admin.updateUserById(u.id, { email: next, email_confirm: true, app_metadata: { ...u.app_metadata, email_verified: next } });
  if (r.error) throw r.error;
  const { error: pe } = await sb.from('profiles').update({ email: next }).eq('id', u.id);
  if (pe) console.log('⚠️ প্রোফাইলের ইমেইল হালনাগাদ হয়নি:', pe.message);
  console.log(`✓ অ্যাডমিনের ইমেইল ${u.email} থেকে ${next} করা হয়েছে (পাসওয়ার্ড ও OTP আগের মতোই)`);
  console.log(`এখন .env.local এ ADMIN_EMAIL=${next} করুন, তারপর /login?as=staff এ নতুন ইমেইল দিয়ে ঢুকুন।`);
}

main().catch((e) => { console.error('❌', e instanceof Error ? e.message : e); process.exitCode = 1; });