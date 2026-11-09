/**
 * অ্যাডমিন (বা যেকোনো) অ্যাকাউন্টের পাসওয়ার্ড নতুন করে বসানো ও অ্যাডমিন রোল ঠিক করা:
 *   npx tsx scripts/set-password.ts আপনার@ইমেইল নতুনপাসওয়ার্ড
 * অ্যাকাউন্ট না থাকলে অ্যাডমিন হিসেবে নতুন তৈরি করে দেয়।
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
const [email, password] = [process.argv[2]?.trim().toLowerCase(), process.argv[3]];
if (!email || !password) { console.error('ব্যবহার: npx tsx scripts/set-password.ts আপনার@ইমেইল নতুনপাসওয়ার্ড'); process.exit(1); }
if (password.length < 8) { console.error('❌ অ্যাডমিনের পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের দিন'); process.exit(1); }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('❌ .env.local এ NEXT_PUBLIC_SUPABASE_URL ও SUPABASE_SERVICE_ROLE_KEY দিন'); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  let u = data.users.find((x) => x.email?.toLowerCase() === email);
  if (u) {
    const r = await sb.auth.admin.updateUserById(u.id, { password, email_confirm: true, app_metadata: { ...u.app_metadata, role: 'admin' } });
    if (r.error) throw r.error;
    console.log(`✓ ${email} এর পাসওয়ার্ড বদলানো হয়েছে`);
  } else {
    const r = await sb.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role: 'admin' }, user_metadata: { full_name: 'অ্যাডমিন' } });
    if (r.error) throw r.error;
    u = r.data.user;
    console.log(`✓ ${email} নামে নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি হয়েছে`);
  }
  // প্রোফাইলে রোল অ্যাডমিন করা (লগইনের পর প্যানেল খোলে এই রোল দেখে)
  const { data: p } = await sb.from('profiles').select('id, role').eq('id', u!.id).maybeSingle();
  if (!p) await sb.from('profiles').insert({ id: u!.id, role: 'admin', full_name: 'অ্যাডমিন' });
  else if (p.role !== 'admin') await sb.from('profiles').update({ role: 'admin' }).eq('id', u!.id);
  const { data: after } = await sb.from('profiles').select('role').eq('id', u!.id).single();
  console.log(`✓ প্রোফাইলের রোল: ${after?.role}`);
  console.log('এখন /login?as=staff এ এই ইমেইল ও পাসওয়ার্ড দিয়ে ঢুকুন।');
})().catch((e) => { console.error('❌', e.message ?? e); process.exit(1); });
