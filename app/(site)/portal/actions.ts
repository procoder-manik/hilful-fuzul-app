'use server';
import { revalidatePath } from 'next/cache';
import { isValidPassword, normalizeEmail, PASSWORD_HINT } from '@/lib/auth';
import { errMsg, opt, str, type ActionState } from '@/lib/guard';
import { getSessionProfile } from '@/lib/settings';
import { getT } from '@/lib/lang';
import { uploadMedia } from '@/lib/storage';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { encRow } from '@/lib/crypto';
import { checkCode } from '@/lib/emailcode';
import { sendVerifyCode } from '@/lib/verifymail';
import { limitKey } from '@/lib/ratelimit';

/** সদস্য (বা আবেদনকারী) নিজের ব্যক্তিগত তথ্য সম্পাদনা করেন। টাকা-সংক্রান্ত ঘর (মাসিক চাঁদা, ফি) এখানে বদলানো যায় না। */
export async function updateMyProfile(_: ActionState, f: FormData): Promise<ActionState> {
  const t = getT();
  try {
    const { user, profile } = await getSessionProfile();
    if (!user || !profile) return { error: t('আবার লগইন করুন', 'Please log in again') };
    const name = str(f, 'name');
    if (name.length < 3) return { error: t('পূর্ণ নাম লিখুন', 'Enter your full name') };
    const emailRaw = str(f, 'email');
    const email = emailRaw ? normalizeEmail(emailRaw) : null;
    if (emailRaw && !email) return { error: t('সঠিক ইমেইল ঠিকানা দিন', 'Enter a valid email address') };

    const admin = createAdminClient();
    if (email) {
      const { data: clash } = await admin.from('profiles').select('id').eq('email', email).neq('id', user.id).limit(1).maybeSingle();
      if (clash) return { error: t('এই ইমেইলে অন্য একটি অ্যাকাউন্ট আছে', 'Another account already uses this email') };
    }
    const photo_url = await uploadMedia(admin, f.get('photo'), 'members');
    const fields = encRow({
      name, father_name: opt(f, 'father_name'), mother_name: opt(f, 'mother_name'), nid: opt(f, 'nid'), dob: opt(f, 'dob'),
      address: opt(f, 'address'), occupation: opt(f, 'occupation'), nominee: opt(f, 'nominee'), email,
      ...(photo_url ? { photo_url } : {}),
    });
    if (profile.member_id) {
      const { error } = await admin.from('members').update(fields).eq('id', profile.member_id);
      if (error) throw error;
    } else {
      const { error } = await admin.from('applications').update(fields).eq('user_id', user.id).eq('status', 'pending');
      if (error) throw error;
    }
    const { error: pe } = await admin.from('profiles').update({ full_name: name, email }).eq('id', user.id);
    if (pe) throw new Error(/duplicate|unique/i.test(pe.message) ? t('এই ইমেইলে অন্য একটি অ্যাকাউন্ট আছে', 'Another account already uses this email') : pe.message);
    revalidatePath('/portal');
    return { ok: t('তথ্য সংরক্ষিত হয়েছে', 'Your details have been saved'), ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

const METHODS = ['বিকাশ', 'নগদ', 'রকেট', 'ব্যাংক', 'হাতে নগদ (কোষাধ্যক্ষকে)'];

/** আবেদনকারী জানান কোন মাধ্যমে ভর্তি ফি পাঠিয়েছেন, যাতে কমিটি মিলিয়ে দেখতে পারে */
export async function claimPayment(_: ActionState, f: FormData): Promise<ActionState> {
  const t = getT();
  try {
    const { user, profile } = await getSessionProfile();
    if (!user || !profile || profile.member_id) return { error: t('এখন এটি প্রযোজ্য নয়', 'Not applicable right now') };
    const method = str(f, 'method'), trx = str(f, 'trx');
    if (!METHODS.includes(method)) return { error: t('মাধ্যম বেছে নিন', 'Choose a payment method') };
    if (method !== METHODS[4] && trx.length < 4) return { error: t('ট্রানজ্যাকশন আইডি লিখুন', 'Enter the transaction ID') };
    const { error } = await createAdminClient().from('applications').update({ pay_method: method, pay_trx: trx || null, pay_claimed_at: new Date().toISOString() }).eq('user_id', user.id).eq('status', 'pending');
    if (error) throw error;
    revalidatePath('/portal');
    return { ok: t('জানানোর জন্য ধন্যবাদ। কমিটি মিলিয়ে দেখে যাচাই করবে।', 'Thank you. The committee will check it and verify.'), ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

/** নিজের পাসওয়ার্ড বদলান */
export async function changePassword(_: ActionState, f: FormData): Promise<ActionState> {
  const t = getT();
  try {
    const pw = String(f.get('password') ?? ''), again = String(f.get('password2') ?? '');
    if (!isValidPassword(pw)) return { error: t(PASSWORD_HINT, 'Password must be at least 6 characters') };
    if (pw !== again) return { error: t('দুইবার একই পাসওয়ার্ড লিখুন', 'Passwords do not match') };
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) throw error;
    return { ok: t('পাসওয়ার্ড বদলানো হয়েছে। পরেরবার নতুন পাসওয়ার্ড দিয়ে লগইন করুন।', 'Password changed. Use the new password next time you log in.'), ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

export async function markNotificationsRead() {
  const { user, profile } = await getSessionProfile();
  if (!user) return;
  const admin = createAdminClient();
  const q = admin.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  await (profile?.member_id ? q.or(`user_id.eq.${user.id},member_id.eq.${profile.member_id}`) : q.eq('user_id', user.id));
  revalidatePath('/portal');
}

export async function resendEmailCode(_: ActionState, _f: FormData): Promise<ActionState> {
  const t = getT();
  const { user, profile } = await getSessionProfile();
  if (!user || !profile?.email) return { error: t('প্রোফাইলে ইমেইল দিন', 'Add an email to your profile first') };
  if (limitKey(`vsend:${user.id}`, 4)) return { error: t('অনেকবার চাওয়া হয়েছে, কিছুক্ষণ পর চেষ্টা করুন', 'Too many requests, try again later') };
  const ok = await sendVerifyCode(user.id, profile.email);
  return ok ? { ok: t(`${profile.email} এ কোড পাঠানো হয়েছে`, `A code was sent to ${profile.email}`), ts: Date.now() } : { error: t('ইমেইল পাঠানো যায়নি। ইমেইল পাঠানোর ব্যবস্থা চালু আছে কিনা অ্যাডমিনকে জিজ্ঞেস করুন।', 'Could not send the email. Ask the admin whether email sending is set up.') };
}

export async function verifyEmail(_: ActionState, f: FormData): Promise<ActionState> {
  const t = getT();
  const { user, profile } = await getSessionProfile();
  if (!user || !profile?.email) return { error: t('আবার লগইন করুন', 'Please log in again') };
  if (limitKey(`vcheck:${user.id}`, 8)) return { error: t('অনেকবার ভুল কোড দেওয়া হয়েছে, কিছুক্ষণ পর চেষ্টা করুন', 'Too many wrong codes, try again later') };
  if (!checkCode('verify', user.id, profile.email, str(f, 'code'))) return { error: t('কোড ভুল বা মেয়াদ শেষ। নতুন কোড চান।', 'Wrong or expired code. Request a new one.') };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { app_metadata: { ...(user.app_metadata ?? {}), email_verified: profile.email } });
  if (error) return { error: errMsg(error) };
  revalidatePath('/portal');
  return { ok: t('ইমেইল যাচাই হয়েছে। ধন্যবাদ!', 'Email verified. Thank you!'), ts: Date.now() };
}
