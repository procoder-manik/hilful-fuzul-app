import 'server-only';
import { makeCode } from './emailcode';
import { getT } from './lang';
import { emailConfigured, sendEmail } from './notify/send';

/** ইমেইল যাচাইয়ের ৬ সংখ্যার কোড পাঠায় (নিবন্ধনের সময় এবং "আবার পাঠান" বোতামে) */
export async function sendVerifyCode(userId: string, email: string): Promise<boolean> {
  if (!emailConfigured()) return false;
  const t = getT();
  const code = makeCode('verify', userId, email);
  const r = await sendEmail(email, t('ইমেইল যাচাইয়ের কোড', 'Your email verification code'), t(`আপনার ইমেইল যাচাইয়ের কোড: ${code}\n\nকোডটি ৩০ থেকে ৯০ মিনিট চলবে।`, `Your email verification code: ${code}\n\nThis code works for 30 to 90 minutes.`));
  return r === 'sent';
}
