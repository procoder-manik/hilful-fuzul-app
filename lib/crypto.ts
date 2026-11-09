import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * সংবেদনশীল ঘরের এনক্রিপশন (AES-256-GCM, অ্যাপ স্তরে)।
 * কী (DATA_ENCRYPTION_KEY) থাকে সার্ভারের পরিবেশে, ডেটাবেসে নয়: তাই ডেটাবেস বা ব্যাকআপ চুরি হলেও এই ঘরগুলো পড়া যায় না।
 * সংরক্ষিত রূপ: enc1:<base64(iv + tag + ciphertext)>। পুরোনো (এনক্রিপ্ট না করা) লেখা এমনি পড়া যায়, তাই ধাপে ধাপে চালু করা নিরাপদ।
 */
export const ENC_FIELDS = ['nid', 'father_name', 'mother_name', 'address', 'nominee'] as const;
const PREFIX = 'enc1:';

function keyFrom(v: string | undefined): Buffer | null {
  const s = v?.trim();
  if (!s) return null;
  // base64 (৩২ বাইট) হলে সরাসরি, নইলে যেকোনো লেখা থেকে SHA-256 দিয়ে ৩২ বাইটের কী
  try { const b = Buffer.from(s, 'base64'); if (b.length === 32) return b; } catch { /* নিচে হ্যাশ */ }
  return createHash('sha256').update(s).digest();
}
const current = () => keyFrom(process.env.DATA_ENCRYPTION_KEY);
const old = () => keyFrom(process.env.DATA_ENCRYPTION_KEY_OLD);

export const cryptoReady = () => !!current();
export const isEncrypted = (v: unknown): boolean => typeof v === 'string' && v.startsWith(PREFIX);

export function encField(v: string | null | undefined): string | null | undefined {
  if (v == null || v === '' || isEncrypted(v)) return v;
  const k = current();
  if (!k) return v;                                   // কী না থাকলে আগের মতোই (সাইট ভাঙে না), সাইট হেলথে সতর্কতা দেখায়
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', k, iv);
  const ct = Buffer.concat([c.update(v, 'utf8'), c.final()]);
  return PREFIX + Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64');
}

export function decField(v: string | null | undefined): string | null | undefined {
  if (v == null || !isEncrypted(v)) return v;
  const raw = Buffer.from(v.slice(PREFIX.length), 'base64');
  for (const k of [current(), old()]) {
    if (!k) continue;
    try {
      const d = createDecipheriv('aes-256-gcm', k, raw.subarray(0, 12));
      d.setAuthTag(raw.subarray(12, 28));
      return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
    } catch { /* অন্য কী চেষ্টা */ }
  }
  return '(এনক্রিপ্টেড: কী মেলেনি)';
}

/** ডেটাবেসে লেখার আগে সংবেদনশীল ঘরগুলো এনক্রিপ্ট */
export function encRow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const f of ENC_FIELDS) if (f in out) out[f] = encField(out[f] as string | null | undefined);
  return out as T;
}
/** ডেটাবেস থেকে পড়ার পর সংবেদনশীল ঘরগুলো ডিক্রিপ্ট (নেস্টেড members সহ) */
export function decRow<T>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  if (Array.isArray(row)) return row.map((x) => decRow(x)) as unknown as T;
  const out: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  for (const f of ENC_FIELDS) if (f in out) out[f] = decField(out[f] as string | null | undefined);
  if (out.members && typeof out.members === 'object') out.members = decRow(out.members);
  return out as T;
}
