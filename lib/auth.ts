/** বাংলা সংখ্যাকে ইংরেজিতে রূপান্তর: ০১৭১১ → 01711 */
export function toEnDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
}

/** যেকোনো ফরম্যাটের নম্বরকে 01XXXXXXXXX বানায়; ভুল হলে null */
export function normalizePhone(input: string): string | null {
  const digits = toEnDigits(input).replace(/\D/g, '');
  const local = digits.startsWith('880') ? '0' + digits.slice(3) : digits;
  return /^01[3-9]\d{8}$/.test(local) ? local : null;
}

/**
 * সবাই মোবাইল নম্বর বা ইমেইল + পাসওয়ার্ড দিয়ে লগইন করেন।
 * ইমেইল না দিলে SMS খরচ এড়াতে ভেতরে নম্বরটিকে একটি ইমেইল ঠিকানা হিসেবে Supabase Auth এ রাখা হয়।
 */
export function phoneToEmail(phone: string): string | null {
  const p = normalizePhone(phone);
  if (!p) return null;
  const domain = process.env.MEMBER_EMAIL_DOMAIN || 'members.hilfulfuzul.org';
  return `${p}@${domain}`;
}

export const PIN_LENGTH = 6;
export const isValidPin = (pin: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(toEnDigits(pin));

export const MIN_PASSWORD = 6;
export const isValidPassword = (p: string) => p.length >= MIN_PASSWORD && p.length <= 72;
export const PASSWORD_HINT = `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD} অক্ষরের হতে হবে`;

/** ইমেইল ছোট হাতের করে ফেরত দেয়; ভুল হলে null, ফাঁকা হলে null */
export function normalizeEmail(input: string): string | null {
  const e = input.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : null;
}
