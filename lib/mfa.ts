import type { SupabaseClient } from '@supabase/supabase-js';

/** অ্যাডমিনের দুই-ধাপ (OTP) বাধ্যতামূলক। জরুরি অবস্থায় .env.local এ ADMIN_MFA=off দিলে সাময়িক বন্ধ হয় */
export const mfaRequired = () => process.env.ADMIN_MFA?.trim().toLowerCase() !== 'off';

export type Aal = 'ok' | 'verify' | 'setup';
/** এই সেশনে OTP যাচাই হয়েছে (ok), OTP দেওয়া বাকি (verify), নাকি অ্যাপ এখনো যুক্তই করা হয়নি (setup) */
export async function adminAal(supabase: SupabaseClient): Promise<Aal> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel === 'aal2') return 'ok';
  return data?.nextLevel === 'aal2' ? 'verify' : 'setup';
}
export const otpPath = (a: Aal) => (a === 'verify' ? '/login/otp' : '/login/setup-otp');
