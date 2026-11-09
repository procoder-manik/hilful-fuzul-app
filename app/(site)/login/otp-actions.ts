'use server';
import { redirect } from 'next/navigation';
import { toEnDigits } from '@/lib/auth';
import { getT } from '@/lib/lang';
import { tooMany } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type OtpState = { error?: string; qr?: string; secret?: string; factorId?: string };
const safe = (n: string) => (n.startsWith('/') && !n.startsWith('//') && !n.includes('\\') && n.startsWith('/admin') ? n : '/admin');
const six = (f: FormData) => toEnDigits(String(f.get('code') ?? '')).replace(/\D/g, '');

async function adminUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?as=staff');
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (p?.role !== 'admin') redirect('/admin');
  return supabase;
}

/** লগইনের পর অথেনটিকেটর অ্যাপের ৬ সংখ্যার কোড যাচাই */
export async function verifyOtp(_: OtpState, f: FormData): Promise<OtpState> {
  const t = getT();
  if (tooMany('otp', 10)) return { error: t('অল্প সময়ে অনেকবার চেষ্টা হয়েছে। ১০ মিনিট পর আবার চেষ্টা করুন।', 'Too many attempts. Try again in 10 minutes.') };
  const supabase = await adminUser();
  const code = six(f);
  if (code.length !== 6) return { error: t('অ্যাপে দেখানো ৬ সংখ্যার কোড দিন', 'Enter the 6-digit code shown in your app') };
  const { data: fs } = await supabase.auth.mfa.listFactors();
  const factor = fs?.totp?.find((x) => x.status === 'verified');
  if (!factor) redirect('/login/setup-otp');
  const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId: factor.id });
  if (e1 || !ch) return { error: t('যাচাই শুরু করা যায়নি, আবার চেষ্টা করুন', 'Could not start verification, please try again') };
  const { error } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: ch.id, code });
  if (error) {
    try { const { data: { user } } = await supabase.auth.getUser(); await createAdminClient().from('login_events').insert({ user_id: user?.id ?? null, identifier: user?.email ?? null, role: 'admin', audience: 'staff', ok: false, reason: 'ভুল OTP কোড' }); } catch { /* বাদ */ }
    return { error: t('কোড ভুল অথবা মেয়াদ শেষ। অ্যাপের নতুন কোডটি দিন।', 'Wrong or expired code. Enter the new code from your app.') };
  }
  redirect(safe(String(f.get('next') ?? '')));
}

/** প্রথমবার: অথেনটিকেটর অ্যাপের জন্য QR কোড তৈরি। আগের অসম্পূর্ণ চেষ্টা মুছে নতুন করে শুরু */
export async function startEnroll(): Promise<OtpState> {
  const t = getT();
  const supabase = await adminUser();
  const { data: fs } = await supabase.auth.mfa.listFactors();
  if (fs?.totp?.some((x) => x.status === 'verified')) redirect('/login/otp');
  for (const x of fs?.all ?? []) if (x.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: x.id });
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `HF-${Date.now()}` });
  if (error || !data) return { error: t('শুরু করা যায়নি। Supabase এর Authentication > Sign In / Providers এ "MFA" চালু আছে কিনা দেখুন।', 'Could not start. Check that MFA is enabled in Supabase under Authentication > Sign In / Providers.') + (error ? ` (${error.message})` : '') };
  if (data.type !== 'totp') return { error: t('অথেনটিকেটর অ্যাপের ধরন পাওয়া যায়নি', 'Authenticator type unavailable') };
  return { qr: data.totp.qr_code, secret: data.totp.secret, factorId: data.id };
}

/** অ্যাপে যুক্ত করার পর প্রথম কোড দিয়ে নিশ্চিত করা; সফল হলে এই সেশন পুরোপুরি যাচাইকৃত */
export async function confirmEnroll(factorId: string, _: OtpState, f: FormData): Promise<OtpState> {
  const t = getT();
  if (tooMany('otp', 10)) return { error: t('অল্প সময়ে অনেকবার চেষ্টা হয়েছে। ১০ মিনিট পর আবার চেষ্টা করুন।', 'Too many attempts. Try again in 10 minutes.'), factorId };
  const supabase = await adminUser();
  const code = six(f);
  if (code.length !== 6) return { error: t('অ্যাপে দেখানো ৬ সংখ্যার কোড দিন', 'Enter the 6-digit code shown in your app'), factorId };
  const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId });
  if (e1 || !ch) return { error: t('যাচাই শুরু করা যায়নি, "আবার শুরু করুন" চাপুন', 'Could not start verification; press “Start again”'), factorId };
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
  if (error) return { error: t('কোড ভুল অথবা মেয়াদ শেষ। অ্যাপের নতুন কোডটি দিন।', 'Wrong or expired code. Enter the new code from your app.'), factorId };
  redirect('/admin');
}
