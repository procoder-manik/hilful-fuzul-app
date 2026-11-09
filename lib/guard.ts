import 'server-only';
import { redirect } from 'next/navigation';
import { getSessionProfile } from './settings';
import { adminAal, mfaRequired, otpPath } from './mfa';
import type { Role } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

export const STAFF: Role[] = ['admin', 'treasurer', 'librarian', 'editor'];
export const MONEY: Role[] = ['admin', 'treasurer'];
export const LIBRARY: Role[] = ['admin', 'librarian'];
export const ADMIN: Role[] = ['admin'];

export const ROLE_BN: Record<Role, string> = { admin: 'অ্যাডমিন', treasurer: 'কোষাধ্যক্ষ', librarian: 'পাঠাগার সম্পাদক', editor: 'কনটেন্ট সম্পাদক', member: 'সদস্য' };

/** পেজের জন্য: অনুমতি না থাকলে ড্যাশবোর্ডে ফেরত */
export async function requirePage(roles: Role[]) {
  const s = await getSessionProfile();
  if (!s.user || !s.profile) redirect('/login?next=/admin');
  if (!roles.includes(s.profile.role)) redirect('/admin?denied=1');
  if (s.profile.role === 'admin' && (await mfaRequired(s.supabase))) { const a = await adminAal(s.supabase); if (a !== 'ok') redirect(otpPath(a)); }
  return s as typeof s & { user: NonNullable<typeof s.user>; profile: NonNullable<typeof s.profile> };
}

/** সার্ভার অ্যাকশনের জন্য: অনুমতি না থাকলে error */
export async function requireAction(roles: Role[]) {
  const s = await getSessionProfile();
  if (!s.user || !s.profile || !roles.includes(s.profile.role)) throw new Error('এই কাজের অনুমতি আপনার নেই');
  if (s.profile.role === 'admin' && (await mfaRequired(s.supabase)) && (await adminAal(s.supabase)) !== 'ok') throw new Error('অ্যাডমিনের OTP যাচাই সম্পন্ন হয়নি। আবার লগইন করুন।');
  return s as typeof s & { user: NonNullable<typeof s.user>; profile: NonNullable<typeof s.profile> };
}

export async function logActivity(supabase: SupabaseClient, actor: string, action: string) {
  await supabase.from('activity_log').insert({ actor, action });
}

export type ActionState = { ok?: string; error?: string; ts?: number };

/** অ্যাকশনের error গুলোকে বাংলা বার্তায় রূপান্তর */
export function errMsg(e: unknown): string {
  const m = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: string }).message) : String(e);
  if (/duplicate key.*phone/i.test(m)) return 'এই মোবাইল নম্বরে আগেই একজন সদস্য আছেন';
  if (/one_payment_per_month|duplicate key.*payments/i.test(m)) return 'এই মাসের চাঁদা আগেই জমা আছে';
  if (/already been registered|already exists/i.test(m)) return 'এই নম্বর বা ইমেইলে আগেই লগইন অ্যাকাউন্ট আছে';
  if (/violates foreign key/i.test(m)) return 'এই তথ্যের সাথে অন্য হিসাব যুক্ত আছে, তাই মুছে ফেলা যাবে না';
  return m;
}

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
export const num = (fd: FormData, k: string) => Number(String(fd.get(k) ?? '').replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))) || 0;
export const opt = (fd: FormData, k: string) => str(fd, k) || null;
