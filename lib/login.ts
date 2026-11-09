import 'server-only';
import { createAdminClient } from './supabase/admin';
import { isValidPassword, normalizeEmail, normalizePhone, PASSWORD_HINT, phoneToEmail } from './auth';
import type { Role } from './types';

/**
 * লগইনে লেখা "মোবাইল বা ইমেইল" থেকে Supabase Auth এর আসল ইমেইল খুঁজে বের করে।
 * (ইমেইল ছাড়া সদস্যের অ্যাকাউন্ট ভেতরে নম্বর থেকে বানানো একটি ইমেইল দিয়ে থাকে)
 */
export async function resolveAuthEmail(identifier: string): Promise<string | null> {
  const id = identifier.trim();
  if (!id) return null;
  const admin = createAdminClient();
  const email = id.includes('@') ? normalizeEmail(id) : null;
  const phone = email ? null : normalizePhone(id);
  if (!email && !phone) return null;

  const q = admin.from('profiles').select('id');
  const { data } = await (email ? q.eq('email', email) : q.eq('phone', phone!)).limit(1).maybeSingle();
  if (data) {
    const { data: u } = await admin.auth.admin.getUserById(data.id);
    if (u?.user?.email) return u.user.email;
  }
  // পুরোনো অ্যাকাউন্টে profiles এ ফোন/ইমেইল না থাকলে সরাসরি অনুমান
  return email ?? phoneToEmail(phone!);
}

export type NewAccount = { phone: string | null; email: string | null; password: string; fullName: string; role?: Role; memberId?: string | null };

/** নতুন লগইন অ্যাকাউন্ট তৈরি (নিবন্ধন, কমিটির তৈরি সদস্য ও কমিটি সদস্যের জন্য একই পথ) */
export async function createLoginAccount(a: NewAccount): Promise<string> {
  if (!isValidPassword(a.password)) throw new Error(PASSWORD_HINT);
  const phone = a.phone ? normalizePhone(a.phone) : null;
  const email = a.email ? normalizeEmail(a.email) : null;
  if (a.phone && !phone) throw new Error('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)');
  if (a.email && !email) throw new Error('সঠিক ইমেইল ঠিকানা দিন');
  const authEmail = email ?? (phone ? phoneToEmail(phone) : null);
  if (!authEmail) throw new Error('মোবাইল নম্বর বা ইমেইল দিন');

  const admin = createAdminClient();
  const clash = async (col: 'phone' | 'email', v: string) =>
    !!(await (col === 'email' ? admin.from('profiles').select('id').eq('email', v) : admin.from('profiles').select('id').eq('phone', v)).limit(1).maybeSingle()).data;
  if (phone && (await clash('phone', phone))) throw new Error('এই মোবাইল নম্বরে আগেই একটি অ্যাকাউন্ট আছে। লগইন করুন।');
  if (email && (await clash('email', email))) throw new Error('এই ইমেইলে আগেই একটি অ্যাকাউন্ট আছে। লগইন করুন।');

  const { data, error } = await admin.auth.admin.createUser({
    email: authEmail, password: a.password, email_confirm: true,
    app_metadata: { role: a.role ?? 'member', member_id: a.memberId ?? null },
    user_metadata: { full_name: a.fullName },
  });
  if (error) throw new Error(/already|registered/i.test(error.message) ? 'এই মোবাইল বা ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন।' : error.message);
  const id = data.user.id;
  const { error: pe } = await admin.from('profiles').update({ phone, email, full_name: a.fullName, member_id: a.memberId ?? null }).eq('id', id);
  if (pe) {
    await admin.auth.admin.deleteUser(id);
    throw new Error(/duplicate|unique/i.test(pe.message) ? 'এই মোবাইল বা ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন।' : pe.message);
  }
  return id;
}

export async function setPassword(userId: string, password: string) {
  if (!isValidPassword(password)) throw new Error(PASSWORD_HINT);
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, { password });
  if (error) throw new Error(error.message);
}
