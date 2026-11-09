'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveAuthEmail } from '@/lib/login';
import { normalizeEmail, normalizePhone } from '@/lib/auth';
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

/** লগইন সেবায় সমস্যার আসল কারণ বাংলায়: কোন চাবি সার্ভারে বসানো নেই, তা বলে দেয় */
function envProblem(e: unknown): string {
  const t = getT();
  const need = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'].filter((k) => !process.env[k]);
  const detail = e instanceof Error ? e.message.slice(0, 120) : '';
  if (need.length) return t(`সার্ভারে এই চাবি বসানো নেই: ${need.join(', ')}। হোস্টিং (যেমন Vercel) এর Environment Variables এ বসিয়ে আবার ডিপ্লয় করুন।`, `These server settings are missing: ${need.join(', ')}. Add them in your hosting Environment Variables and redeploy.`);
  return t('লগইন সেবায় সমস্যা হচ্ছে (পাসওয়ার্ড ভুল নয়)। Supabase এর চাবি ও ইন্টারনেট দেখুন। বিবরণ: ', 'The login service has a problem (not a wrong password). Check your Supabase keys and internet. Details: ') + detail;
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

  // ইমেইল দিয়ে সরাসরি লগইন (অ্যাডমিন চাবির ওপর নির্ভর করে না, তাই সবচেয়ে নির্ভরযোগ্য)। পুরোনো মোবাইল-নম্বর অ্যাকাউন্টের জন্য নম্বর থেকে খুঁজে নেওয়ার ব্যবস্থা থাকে।
  const supabase = createClient();
  const isEmail = id.includes('@');
  const emailId = isEmail ? normalizeEmail(id) : null;
  if (isEmail && !emailId) return { error: t('সঠিক ইমেইল ঠিকানা দিন', 'Enter a valid email address') };
  if (!isEmail && !normalizePhone(id)) return { error: t('আপনার ইমেইল ঠিকানা দিন (পুরোনো সদস্য হলে মোবাইল নম্বরও চলবে)', 'Enter your email address (older members may still use a mobile number)') };
  const attempt = (e: string) => supabase.auth.signInWithPassword({ email: e, password });
  const wrong = (m: string) => /invalid login credentials/i.test(m);
  let res;
  try {
    if (emailId) {
      res = await attempt(emailId);
      if (res.error && wrong(res.error.message)) {                       // প্রোফাইলের ইমেইল ও লগইনের ভেতরের ইমেইল আলাদা হলে
        const alt = await resolveAuthEmail(emailId).catch(() => null);
        if (alt && alt !== emailId) res = await attempt(alt);
      }
    } else {
      const alt = await resolveAuthEmail(id);
      if (!alt) return { error: t('সঠিক মোবাইল নম্বর বা ইমেইল দিন', 'Enter a valid mobile number or email') };
      res = await attempt(alt);
    }
  } catch (e) {
    return { error: envProblem(e) };
  }
  const { data, error } = res;
  if (error || !data.user) {
    const m = error?.message ?? '';
    await logLogin({ identifier: id, audience, ok: false, reason: wrong(m) ? 'ভুল পাসওয়ার্ড বা অ্যাকাউন্ট নেই' : m.slice(0, 80) });
    if (!error || wrong(m)) return { error: t('ইমেইল অথবা পাসওয়ার্ড সঠিক নয়', 'Email or password is incorrect') };
    // পাসওয়ার্ড ভুল নয়, অন্য সমস্যা (যেমন সার্ভারে Supabase চাবি বসানো নেই বা ইন্টারনেট নেই): আসল কারণ দেখাই
    return { error: envProblem(new Error(m)) };
  }

  const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
  const role = p?.role ?? 'member';
  const staff = role !== 'member';
  // পাসওয়ার্ড ঠিক থাকলেও ভুল ট্যাবে ঢুকতে দেওয়া হয় না
  await logLogin({ user_id: data.user.id, identifier: id, role, audience, ok: (audience === 'staff') === staff, reason: (audience === 'staff') === staff ? undefined : 'ভুল ট্যাব' });
  if (audience === 'member' && staff) { await supabase.auth.signOut(); return { error: t('এটি কমিটির অ্যাকাউন্ট। উপরের "কমিটি ও অ্যাডমিন" ট্যাব থেকে লগইন করুন।', 'This is a committee account. Please use the “Committee & admin” tab above.') }; }
  if (audience === 'staff' && !staff) { await supabase.auth.signOut(); return { error: t('এটি সদস্যের অ্যাকাউন্ট। উপরের "সদস্য" ট্যাব থেকে লগইন করুন।', 'This is a member account. Please use the “Member” tab above.') }; }

  if (role === 'admin' && (await mfaRequired(supabase))) {
    const { data: fs } = await supabase.auth.mfa.listFactors();
    const has = !!fs?.totp?.some((x) => x.status === 'verified');
    redirect(`${has ? '/login/otp' : '/login/setup-otp'}${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  }
  redirect(next && (staff || !next.startsWith('/admin')) ? next : staff ? '/admin' : '/portal');
}
