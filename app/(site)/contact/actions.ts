'use server';
import { publicClient } from '@/lib/supabase/public';
import { tooMany } from '@/lib/ratelimit';
import { errMsg, str, type ActionState } from '@/lib/guard';

export async function sendMessage(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    if (str(f, 'website')) return { ok: 'বার্তা পাঠানো হয়েছে।' };
    if (tooMany('contact', 5)) return { error: 'অল্প সময়ে অনেকগুলো বার্তা পাঠানো হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।' };
    const name = str(f, 'name'), message = str(f, 'message');
    if (!name || !message) return { error: 'নাম ও বার্তা লিখুন' };
    if (message.length > 3000) return { error: 'বার্তা ৩০০০ অক্ষরের মধ্যে রাখুন' };
    const { error } = await publicClient().from('contact_messages').insert({ name, phone: str(f, 'phone'), subject: str(f, 'subject'), message });
    if (error) throw error;
    return { ok: 'বার্তা পাঠানো হয়েছে। কমিটি শীঘ্রই আপনার সাথে যোগাযোগ করবে।', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
