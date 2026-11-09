/**
 * একমাত্র অ্যাডমিন ফোন হারালে: তার দুই-ধাপ (OTP) রিসেট করতে
 *   npm run reset-mfa -- admin@email.com
 * পরের লগইনে আবার নতুন করে অথেনটিকেটর অ্যাপ যুক্ত করার পাতা আসবে।
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
const email = process.argv[2]?.trim().toLowerCase();
if (!email) { console.error('ব্যবহার: npm run reset-mfa -- আপনার@ইমেইল'); process.exit(1); }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

(async () => {
  const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const u = data.users.find((x) => x.email?.toLowerCase() === email);
  if (!u) { console.error(`❌ ${email} নামে কোনো অ্যাকাউন্ট পাওয়া যায়নি`); process.exit(1); }
  const { data: f, error: e2 } = await sb.auth.admin.mfa.listFactors({ userId: u.id });
  if (e2) throw e2;
  for (const x of f?.factors ?? []) await sb.auth.admin.mfa.deleteFactor({ id: x.id, userId: u.id });
  console.log(`✓ ${email} এর দুই-ধাপ রিসেট হয়েছে (${f?.factors?.length ?? 0}টি অ্যাপ সরানো)। এখন লগইন করলে নতুন করে অ্যাপ যুক্ত করতে হবে।`);
})().catch((e) => { console.error('❌', e.message ?? e); process.exit(1); });
