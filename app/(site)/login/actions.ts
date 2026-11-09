'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveAuthEmail } from '@/lib/login';
import { getT } from '@/lib/lang';
import { mfaRequired } from '@/lib/mfa';
import { tooMany } from '@/lib/ratelimit';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export type LoginState = { error?: string };

/** ব্যর্থ চেষ্টায় পরিচয় আংশিক লুকানো থাকে (017****344, ra***@mail.com) */
const mask = (id: string) => (id.includes('@') ? id.replace(/^(.{2}).*(@.*)$/, '$1***$2') : id.replace(/^(.{3}).*(.{3})$/, '$1****$2'));
async function logLogin(e: { user_id?: string | null; identifier: string; role?: string | null; audience: string; ok: boolean; reason?: string }) {
  try {
    const h = headers();
    await createAdminClient().from('login_events').insert({
      user_id: e.user_id ?? null, identifier: e.ok ? e.identifier.slice(0, 80) : mask(e.identifier).slice(0, 80), role: e.role ?? null, audience: e.audience, ok: e.ok, reason: e.reason ?? null,
      ip: (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '').split(',')[0].trim().slice(0, 60) || null, user_agent: (h.get('user-agent') ?? '').slice(0, 200) || null,
    });
  } catch { /* টেবিল না থাকলে (SQL 006 এর আগে) চুপচাপ বাদ */ }
}

const safe = (n: string) => (n.startsWith('/') && !n.startsWith('//') && !n.includes('\\') ? n : '');

/** সদস্য ও কমিটি আলাদা ট্যাব থেকে ঢোকে। অ্যাডমিন হলে পাসওয়ার্ডের পর অথেনটিকেটর অ্যাপের OTP লাগে */
export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const t = getT();
  const audience = form.get('audience') === 'staff' ? 'staff' : 'member';
  const next = safe(String(form.get('next') || ''));
  const id = String(form.get('identifier') || '').trim();
  const password = String(form.get('password') || '');
  if (!id || !password) return { error: t('মোবাইল নম্বর বা ইমেইল এবং পাসওয়ার্ড দিন', 'Enter your mobile number or email and password') };
  if (tooMany('login', 12)) return { error: t('অল্প সময়ে অনেকবার চেষ্টা হয়েছে। ১০ মিনিট পর আবার চেষ্টা করুন।', 'Too many attempts. Please try again in 10 minutes.') };

  const email = await resolveAuthEmail(id);
  if (!email) return { error: t('সঠিক ১১ সংখ্যার মোবাইল নম্বর (01XXXXXXXXX) অথবা ইমেইল দিন', 'Enter a valid 11-digit mobile number (01XXXXXXXXX) or an email') };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    const m = error?.message ?? '';
    await logLogin({ identifier: id, audience, ok: false, reason: /invalid login credentials/i.test(m) ? 'ভুল পাসওয়ার্ড বা অ্যাকাউন্ট নেই' : m.slice(0, 80) });
    if (!error || /invalid login credentials/i.test(m)) return { error: t('মোবাইল নম্বর/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়', 'Mobile number/email or password is incorrect') };
    // পাসওয়ার্ড ভুল নয়, অন্য সমস্যা (যেমন .env.local এর Supabase চাবি ভুল বা ইন্টারনেট নেই): আসল কারণ দেখাই
    return { error: t('লগইন সেবায় সমস্যা হচ্ছে (পাসওয়ার্ড ভুল নয়)। .env.local এর NEXT_PUBLIC_SUPABASE_ANON_KEY ও ইন্টারনেট দেখুন। বিবরণ: ', 'The login service has a problem (not a wrong password). Check NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and your internet. Details: ') + m.slice(0, 120) };
  }

  const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
  const role = p?.role ?? 'member';
  const staff = role !== 'member';
  // পাসওয়ার্ড ঠিক থাকলেও ভুল ট্যাবে ঢুকতে দেওয়া হয় না
  await logLogin({ user_id: data.user.id, identifier: id, role, audience, ok: (audience === 'staff') === staff, reason: (audience === 'staff') === staff ? undefined : 'ভুল ট্যাব' });
  if (audience === 'member' && staff) { await supabase.auth.signOut(); return { error: t('এটি কমিটির অ্যাকাউন্ট। উপরের "কমিটি ও অ্যাডমিন" ট্যাব থেকে লগইন করুন।', 'This is a committee account. Please use the “Committee & admin” tab above.') }; }
  if (audience === 'staff' && !staff) { await supabase.auth.signOut(); return { error: t('এটি সদস্যের অ্যাকাউন্ট। উপরের "সদস্য" ট্যাব থেকে লগইন করুন।', 'This is a member account. Please use the “Member” tab above.') }; }

  if (role === 'admin' && mfaRequired()) {
    const { data: fs } = await supabase.auth.mfa.listFactors();
    const has = !!fs?.totp?.some((x) => x.status === 'verified');
    redirect(`${has ? '/login/otp' : '/login/setup-otp'}${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  }
  redirect(next && (staff || !next.startsWith('/admin')) ? next : staff ? '/admin' : '/portal');
}
