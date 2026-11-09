'use server';
import { revalidatePath } from 'next/cache';
import { ADMIN, errMsg, logActivity, requireAction, type ActionState } from '@/lib/guard';
import { cryptoReady, encRow, ENC_FIELDS, isEncrypted } from '@/lib/crypto';

/** অ্যাডমিনের দুই-ধাপ (OTP) চালু বা বন্ধ। শুধু অ্যাডমিন পারে; বন্ধ করলে পরের লগইন থেকে শুধু ইমেইল ও পাসওয়ার্ড লাগে (SQL 009 লাগে) */
export async function saveSecurity(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(ADMIN);
    const on = !!f.get('admin_mfa');
    const { error } = await supabase.from('settings').update({ admin_mfa: on, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) throw new Error(/column|schema cache/i.test(error.message) ? 'আগে Supabase এ supabase/migrations/009_security_email.sql চালান' : error.message);
    await logActivity(supabase, user.id, `অ্যাডমিনের দুই-ধাপ (OTP) ${on ? 'চালু' : 'বন্ধ'} করা হয়েছে`);
    revalidatePath('/', 'layout');
    return { ok: on ? 'অ্যাডমিন লগইনে দুই-ধাপ (OTP) চালু হয়েছে।' : 'দুই-ধাপ (OTP) বন্ধ হয়েছে। এখন থেকে অ্যাডমিন শুধু ইমেইল ও পাসওয়ার্ড দিয়ে ঢুকবেন।', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

/** আগে থেকে জমা সদস্য ও আবেদনের সংবেদনশীল ঘরগুলো এনক্রিপ্ট করে (যেগুলো আগেই এনক্রিপ্টেড সেগুলো ছোঁয় না) */
export async function encryptExisting(_: ActionState, _f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(ADMIN);
    if (!cryptoReady()) return { error: 'আগে DATA_ENCRYPTION_KEY বসান (npm run gen-key দিয়ে বানানো যায়) এবং সার্ভার আবার চালু করুন' };
    let changed = 0, scanned = 0;
    for (const table of ['members', 'applications'] as const) {
      for (let from = 0; ; from += 500) {
        const { data, error } = await supabase.from(table).select(`id, ${ENC_FIELDS.join(', ')}`).order('id').range(from, from + 499);
        if (error) throw error;
        const rows = (data ?? []) as unknown as Record<string, unknown>[];
        if (!rows.length) break;
        for (const r of rows) {
          scanned++;
          if (!ENC_FIELDS.some((k) => typeof r[k] === 'string' && r[k] && !isEncrypted(r[k]))) continue;
          const enc = encRow(r);
          const patch: Record<string, unknown> = {};
          for (const k of ENC_FIELDS) if (enc[k] !== r[k]) patch[k] = enc[k];
          const { error: ue } = await supabase.from(table).update(patch).eq('id', r.id as string);
          if (ue) throw ue;
          changed++;
        }
        if (rows.length < 500) break;
      }
    }
    await logActivity(supabase, user.id, `সংবেদনশীল তথ্য এনক্রিপ্ট: ${scanned}টি সারি দেখা, ${changed}টি এনক্রিপ্ট হয়েছে`);
    return { ok: `${scanned}টি সারি দেখা হয়েছে, ${changed}টি এখন এনক্রিপ্টেড। বাকিগুলো আগেই এনক্রিপ্টেড ছিল।`, ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
