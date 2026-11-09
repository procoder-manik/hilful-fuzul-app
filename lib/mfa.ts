import type { SupabaseClient } from '@supabase/supabase-js';

/** জরুরি অবস্থায় (ফোন হারিয়ে একমাত্র অ্যাডমিন ঢুকতে পারছেন না) .env.local এ ADMIN_MFA=off দিলে সব অবস্থায় বন্ধ */
export const mfaEmergencyOff = () => process.env.ADMIN_MFA?.trim().toLowerCase() === 'off';

/**
 * অ্যাডমিনের দুই-ধাপ (OTP) লাগবে কিনা: অ্যাডমিন > সেটিংস > নিরাপত্তা থেকে চালু/বন্ধ করা যায় (ডিফল্ট চালু)।
 * ডেটাবেস থেকে পড়া না গেলে নিরাপদ দিকে থাকে (চালু)।
 */
export async function mfaRequired(supabase: SupabaseClient): Promise<boolean> {
  if (mfaEmergencyOff()) return false;
  try {
    const { data, error } = await supabase.from('settings').select('admin_mfa').eq('id', 1).single();
    if (error) return true;
    return (data as { admin_mfa?: boolean | null } | null)?.admin_mfa !== false;
  } catch {
    return true;
  }
}

export type Aal = 'ok' | 'verify' | 'setup';
/** এই সেশনে OTP যাচাই হয়েছে (ok), OTP দেওয়া বাকি (verify), নাকি অ্যাপ এখনো যুক্তই করা হয়নি (setup) */
export async function adminAal(supabase: SupabaseClient): Promise<Aal> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel === 'aal2') return 'ok';
  return data?.nextLevel === 'aal2' ? 'verify' : 'setup';
}
export const otpPath = (a: Aal) => (a === 'verify' ? '/login/otp' : '/login/setup-otp');
