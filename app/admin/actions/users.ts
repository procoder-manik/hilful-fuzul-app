'use server';
import { revalidatePath } from 'next/cache';
import { ADMIN, errMsg, logActivity, requireAction, ROLE_BN, str, type ActionState } from '@/lib/guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLoginAccount } from '@/lib/login';
import type { Role } from '@/lib/types';

const STAFF_ROLES: Role[] = ['admin', 'treasurer', 'librarian', 'editor'];

export async function addStaff(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(ADMIN);
    const email = str(f, 'email').toLowerCase();
    const password = str(f, 'password');
    const role = str(f, 'role') as Role;
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'সঠিক ইমেইল দিন' };
    if (password.length < 8) return { error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের দিন' };
    if (!STAFF_ROLES.includes(role)) return { error: 'ভূমিকা বেছে নিন' };
    const phone = str(f, 'phone');
    await createLoginAccount({ phone: phone || null, email, password, fullName: str(f, 'full_name'), role });
    await logActivity(supabase, user.id, `${email} কে ${ROLE_BN[role]} হিসেবে অ্যাক্সেস দেওয়া হয়েছে`);
    revalidatePath('/admin/users');
    return { ok: `${email}${phone ? ` বা ${phone}` : ''} এখন ${ROLE_BN[role]} হিসেবে লগইন করতে পারবেন`, ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

export async function changeRole(userId: string, _: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(ADMIN);
    const role = str(f, 'role') as Role;
    if (userId === user.id && role !== 'admin') return { error: 'নিজের অ্যাডমিন ভূমিকা নিজে সরাতে পারবেন না' };
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) throw error;
    await createAdminClient().auth.admin.updateUserById(userId, { app_metadata: { role } });
    await logActivity(supabase, user.id, `একজন কমিটি সদস্যের ভূমিকা ${ROLE_BN[role]} করা হয়েছে`);
    revalidatePath('/admin/users');
    return { ok: 'ভূমিকা বদলানো হয়েছে', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

export async function removeStaff(userId: string, _f: FormData) {
  const { supabase, user } = await requireAction(ADMIN);
  if (userId === user.id) throw new Error('নিজের অ্যাকাউন্ট নিজে মুছতে পারবেন না');
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  await logActivity(supabase, user.id, 'একজন কমিটি সদস্যের অ্যাক্সেস সরানো হয়েছে');
  revalidatePath('/admin/users');
}

/** ফোন হারালে বা অ্যাপ মুছে গেলে: ওই অ্যাডমিনের দুই-ধাপ রিসেট। পরের লগইনে নতুন করে অ্যাপ যুক্ত করতে হবে। */
export async function resetMfa(userId: string, _f: FormData) {
  const { supabase, user } = await requireAction(ADMIN);
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
  if (error) throw new Error(error.message);
  for (const f of data?.factors ?? []) await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId });
  await logActivity(supabase, user.id, userId === user.id ? 'নিজের দুই-ধাপ (OTP) রিসেট করা হয়েছে' : 'একজন কমিটি সদস্যের দুই-ধাপ (OTP) রিসেট করা হয়েছে');
  revalidatePath('/admin/users');
}
