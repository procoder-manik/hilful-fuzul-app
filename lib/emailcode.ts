import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * ইমেইলে পাঠানো ৬ সংখ্যার কোড (ডেটাবেসে কিছু জমা না রেখে, সময়ের ঘর ধরে HMAC দিয়ে)।
 * প্রতি ৩০ মিনিটে নতুন কোড; যাচাইয়ে বর্তমান ও আগের দুটি ঘর ধরা হয় (সর্বোচ্চ প্রায় ৯০ মিনিট)।
 * পাসওয়ার্ড রিসেটের কোডে ব্যবহারকারীর শেষ হালনাগাদের সময়ও মেশানো, তাই পাসওয়ার্ড বদলালে পুরোনো কোড আর চলে না।
 */
const WINDOW = 30 * 60 * 1000;
const secret = () => process.env.EMAIL_CODE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret';

function code(purpose: 'verify' | 'reset', userId: string, email: string, salt: string, bucket: number) {
  const h = createHmac('sha256', secret()).update(`${purpose}|${userId}|${email.toLowerCase()}|${salt}|${bucket}`).digest();
  return String(h.readUInt32BE(0) % 1_000_000).padStart(6, '0');
}
export const makeCode = (purpose: 'verify' | 'reset', userId: string, email: string, salt = '') => code(purpose, userId, email, salt, Math.floor(Date.now() / WINDOW));
export function checkCode(purpose: 'verify' | 'reset', userId: string, email: string, given: string, salt = ''): boolean {
  const g = Buffer.from(given.replace(/\D/g, '').padStart(6, '0'));
  const now = Math.floor(Date.now() / WINDOW);
  return [0, 1, 2].some((i) => { const c = Buffer.from(code(purpose, userId, email, salt, now - i)); return c.length === g.length && timingSafeEqual(c, g); });
}
