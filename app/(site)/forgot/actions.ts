'use server';
import { redirect } from 'next/navigation';
import { normalizeEmail, isValidPassword, PASSWORD_HINT } from '@/lib/auth';
import { checkCode, makeCode } from '@/lib/emailcode';
import { getT } from '@/lib/lang';
import { limitKey, tooMany } from '@/lib/ratelimit';
import { sendEmail, emailConfigured } from '@/lib/notify/send';
import { setPassword } from '@/lib/login';
import { createAdminClient } from '@/lib/supabase/admin';

export type ForgotState = { error?: string };

/** ইমেইলে ৬ সংখ্যার কোড পাঠায়। অ্যাকাউন্ট আছে কিনা বাইরে থেকে বোঝা যায় না (সবসময় একই উত্তর) */
export async function requestReset(_: ForgotState, f: FormData): Promise<ForgotState> {
  const t = getT();
  if (tooMany('forgot', 5)) return { error: t('অল্প সময়ে অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।', 'Too many attempts, please try again later.') };
  const email = normalizeEmail(String(f.get('email') ?? ''));
  if (!email) return { error: t('সঠিক ইমেইল ঠিকানা দিন', 'Enter a valid email address') };
  if (!emailConfigured()) return { error: t('ইমেইল পাঠানোর ব্যবস্থা এখনো চালু নেই। কোষাধ্যক্ষ বা অ্যাডমিনের সাথে যোগাযোগ করুন।', 'Email sending is not set up yet. Please contact the treasurer or admin.') };
  try {
    const admin = createAdminClient();
    const { data: p } = await admin.from('profiles').select('id').eq('email', email).limit(1).maybeSingle();
    if (p && !limitKey(`forgot:${email}`, 3, 30 * 60 * 1000)) {
      const { data: u } = await admin.auth.admin.getUserById(p.id);
      if (u?.user) {
        const code = makeCode('reset', p.id, email, u.user.updated_at ?? '');
        await sendEmail(email, t('পাসওয়ার্ড রিসেটের কোড', 'Your password reset code'), t(`আপনার পাসওয়ার্ড রিসেটের কোড: ${code}\\n\\nকোডটি ৩০ থেকে ৯০ মিনিট চলবে। আপনি অনুরোধ না করলে এই ইমেইল উপেক্ষা করুন।`, `Your password reset code: ${code}\\n\\nThis code works for 30 to 90 minutes. If you did not ask for it, ignore this email.`));
      }
    }
  } catch { /* বাইরে কিছু জানানো হয় না */ }
  redirect(`/forgot/reset?email=${encodeURIComponent(email)}`);
}

export async function resetPassword(_: ForgotState, f: FormData): Promise<ForgotState> {
  const t = getT();
  const email = normalizeEmail(String(f.get('email') ?? ''));
  const code = String(f.get('code') ?? '');
  const pw = String(f.get('password') ?? '');
  if (!email) return { error: t('সঠিক ইমেইল ঠিকানা দিন', 'Enter a valid email address') };
  if (!/^\d{6}$/.test(code.replace(/\D/g, ''))) return { error: t('ইমেইলে পাওয়া ৬ সংখ্যার কোড দিন', 'Enter the 6-digit code from your email') };
  if (!isValidPassword(pw)) return { error: t(PASSWORD_HINT, 'Password must be at least 6 characters') };
  if (pw !== String(f.get('password2') ?? '')) return { error: t('দুইবার একই পাসওয়ার্ড লিখুন', 'Passwords do not match') };
  if (tooMany('reset', 10) || limitKey(`reset:${email}`, 6)) return { error: t('অনেকবার ভুল কোড দেওয়া হয়েছে। কিছুক্ষণ পর নতুন কোড চেয়ে চেষ্টা করুন।', 'Too many wrong codes. Request a new code later.') };
  const bad = { error: t('কোড ভুল বা মেয়াদ শেষ। নতুন কোড চেয়ে নিন।', 'The code is wrong or expired. Request a new one.') };
  try {
    const admin = createAdminClient();
    const { data: p } = await admin.from('profiles').select('id').eq('email', email).limit(1).maybeSingle();
    if (!p) return bad;
    const { data: u } = await admin.auth.admin.getUserById(p.id);
    if (!u?.user || !checkCode('reset', p.id, email, code, u.user.updated_at ?? '')) return bad;
    await setPassword(p.id, pw);
  } catch (e) {
    return { error: e instanceof Error ? e.message : t('কাজটি সম্পন্ন হয়নি', 'Something went wrong') };
  }
  redirect('/login?reset=1');
}
