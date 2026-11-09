'use server';
import { redirect } from 'next/navigation';
import { normalizeEmail, normalizePhone, isValidPassword, PASSWORD_HINT } from '@/lib/auth';
import { errMsg, num, opt, str } from '@/lib/guard';
import { createLoginAccount } from '@/lib/login';
import { notify } from '@/lib/notify/send';
import { T } from '@/lib/notify/templates';
import { tooMany } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getT } from '@/lib/lang';
import { uploadMedia, uploadSignature } from '@/lib/storage';
import { encRow } from '@/lib/crypto';
import { sendVerifyCode } from '@/lib/verifymail';

export type RegisterState = { error?: string; loginHint?: boolean };

/** ফি পাঠানোর মাধ্যম (পোর্টালের ClaimForm ও অ্যাডমিনের আবেদন পাতার সাথে একই নাম) */
const PAY_METHODS = ['বিকাশ', 'নগদ', 'রকেট', 'ব্যাংক', 'হাতে নগদ (কোষাধ্যক্ষকে)'];

/** নিবন্ধন: অ্যাকাউন্ট ও প্রোফাইল তৈরি হয়, সাথে সাথে লগইন হয়ে প্রোফাইলে যায়। ভর্তি ফি দিয়ে কমিটির যাচাইয়ের পর সদস্যপদ চালু হয়। */
export async function registerAccount(_: RegisterState, f: FormData): Promise<RegisterState> {
  let userId: string | null = null;
  const admin = createAdminClient();
  const t = getT();
  try {
    if (str(f, 'website')) return { error: t('ত্রুটি হয়েছে', 'Something went wrong') };          // স্প্যাম বটের লুকানো ঘর
    if (tooMany('join', 5)) return { error: t('অল্প সময়ে অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।', 'Too many attempts, please try again later.') };

    const name = str(f, 'name');
    const phone = normalizePhone(str(f, 'phone'));
    const emailRaw = str(f, 'email');
    const email = emailRaw ? normalizeEmail(emailRaw) : null;
    const password = String(f.get('password') ?? '');
    const monthly = num(f, 'monthly_amount');
    if (name.length < 3) return { error: t('পূর্ণ নাম লিখুন', 'Enter your full name') };
    if (!str(f, 'father_name')) return { error: t('পিতার নাম লিখুন', 'Enter your father’s name') };
    if (!phone) return { error: t('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)', 'Enter a valid 11-digit mobile number') };
    if (!email) return { error: t('সঠিক ইমেইল ঠিকানা দিন (লগইন ও বিজ্ঞপ্তি এই ইমেইলে হবে)', 'Enter a valid email address (used for login and notices)') };
    if (!str(f, 'address')) return { error: t('ঠিকানা লিখুন', 'Enter your address') };
    if (!isValidPassword(password)) return { error: t(PASSWORD_HINT, 'Password must be at least 6 characters') };
    if (password !== String(f.get('password2') ?? '')) return { error: t('দুইবার একই পাসওয়ার্ড লিখুন', 'Passwords do not match') };
    if (monthly < 50) return { error: t('মাসিক চাঁদা কমপক্ষে ৫০ টাকা', 'Monthly contribution must be at least 50 taka') };
    if (!f.get('agree')) return { error: t('শর্তাবলীতে সম্মতি দিন', 'Please accept the terms') };

    // ভর্তি ফি জমার তথ্য (ঐচ্ছিক): মাধ্যম বাছলে মোবাইল ব্যাংকিং ও ব্যাংকে ট্রানজ্যাকশন আইডি লাগে
    const payMethod = str(f, 'pay_method');
    let payTrx = str(f, 'pay_trx').toUpperCase().replace(/\s+/g, '');
    if (payMethod && !PAY_METHODS.includes(payMethod)) return { error: t('পেমেন্টের মাধ্যম বেছে নিন', 'Choose a payment method') };
    const cash = payMethod === PAY_METHODS[4];
    if (cash) payTrx = '';
    if (payMethod && !cash && !/^[A-Z0-9._-]{4,40}$/.test(payTrx)) return { error: t('ট্রানজ্যাকশন আইডি সঠিকভাবে লিখুন (৪-৪০ অক্ষর, ইংরেজি অক্ষর ও সংখ্যা)', 'Enter a valid transaction ID (4 to 40 letters or digits)') };

    const { count: isMember } = await admin.from('members').select('id', { count: 'exact', head: true }).eq('phone', phone);
    if (isMember) return { error: t('এই মোবাইল নম্বরে আগেই একজন সদস্য আছেন। লগইন করুন।', 'A member with this number already exists. Please log in.'), loginHint: true };

    const photo_url = await uploadMedia(admin, f.get('photo'), 'applications');
    const signature_url = await uploadSignature(admin, str(f, 'signature'), 'applications');

    userId = await createLoginAccount({ phone, email, password, fullName: name, role: 'member', memberId: null });
    const { error } = await admin.from('applications').insert(encRow({
      user_id: userId, name, father_name: str(f, 'father_name'), mother_name: opt(f, 'mother_name'), phone, email, nid: opt(f, 'nid'), dob: opt(f, 'dob'),
      address: str(f, 'address'), occupation: opt(f, 'occupation'), nominee: opt(f, 'nominee'), monthly_amount: monthly, photo_url, signature_url,
      ...(payMethod ? { pay_method: payMethod, pay_trx: payTrx || null, pay_claimed_at: new Date().toISOString() } : {}),
    }));
    if (error) throw error;

    void sendVerifyCode(userId, email).catch(() => {});          // ইমেইলের মালিকানা যাচাইয়ের কোড
    const { data: s } = await admin.from('settings').select('org_name, short_name, reg_fee').eq('id', 1).single();
    await notify({ userId, kind: 'welcome', key: userId, email, phone, ...T.welcome({ name, org: s?.short_name || s?.org_name || 'সংগঠন', fee: Number(s?.reg_fee ?? 200) }) });

    // সাথে সাথে লগইন করিয়ে দিই
    const { error: se } = await createClient().auth.signInWithPassword({ email: email ?? `${phone}@${process.env.MEMBER_EMAIL_DOMAIN || 'members.hilfulfuzul.org'}`, password });
    if (se) return { error: t('নিবন্ধন সম্পন্ন হয়েছে। এখন লগইন পেজ থেকে ঢুকুন।', 'Registration complete. Please log in.'), loginHint: true };
  } catch (e) {
    if (userId) await admin.auth.admin.deleteUser(userId);          // অর্ধেক তৈরি অ্যাকাউন্ট রাখি না
    return { error: errMsg(e) };
  }
  redirect('/portal?welcome=1');
}
