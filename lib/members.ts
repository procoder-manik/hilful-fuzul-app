import 'server-only';
import { createLoginAccount, setPassword } from './login';

/** সদস্যের জন্য লগইন অ্যাকাউন্ট তৈরি (কমিটি সদস্য যোগ করলে বা আবেদন অনুমোদনের সময়) */
export async function createMemberLogin(memberId: string, phone: string, password: string, fullName: string, email?: string | null) {
  return createLoginAccount({ phone, email: email ?? null, password, fullName, role: 'member', memberId });
}

/** সদস্য পাসওয়ার্ড ভুলে গেলে কোষাধ্যক্ষ নতুন পাসওয়ার্ড সেট করবেন */
export const resetMemberPassword = setPassword;
