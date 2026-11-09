'use server';
import { revalidatePath } from 'next/cache';
import { normalizeEmail, normalizePhone } from '@/lib/auth';
import { errMsg, logActivity, MONEY, requireAction, str, type ActionState } from '@/lib/guard';
import { runDailyNotifications } from '@/lib/notify/run';
import { sendEmail, sendSms } from '@/lib/notify/send';

const NAME: Record<string, string> = { overdue: 'বকেয়া', due_soon: 'শেষ তারিখের আগে', freeze_warn_7: '৭ দিনের সতর্কতা', freeze_warn_3: '৩ দিনের সতর্কতা', frozen: 'স্থগিত' };

/** দৈনিক বকেয়া/সতর্কতার যাচাই এখনই চালানো */
export async function runNow(_: ActionState, _f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(MONEY);
    const r = await runDailyNotifications();
    const sent = Object.entries(r.sent).map(([k, n]) => `${NAME[k] ?? k}: ${n}টি`).join(', ');
    await logActivity(supabase, user.id, 'বিজ্ঞপ্তির দৈনিক যাচাই হাতে চালানো হয়েছে');
    revalidatePath('/admin/notifications');
    return { ok: `${r.checked} জন সদস্য যাচাই হয়েছে। ${sent ? `নতুন বিজ্ঞপ্তি: ${sent}।` : 'নতুন কোনো বিজ্ঞপ্তির দরকার হয়নি।'}`, ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

/** ইমেইল ও SMS ব্যবস্থা ঠিক আছে কিনা পরীক্ষা করতে একটি টেস্ট বার্তা */
export async function testSend(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    await requireAction(MONEY);
    const to = str(f, 'to');
    const msg = str(f, 'msg') || 'এটি একটি পরীক্ষামূলক বার্তা। Test message.';
    const email = to.includes('@') ? normalizeEmail(to) : null;
    const phone = email ? null : normalizePhone(to);
    if (!email && !phone) return { error: 'সঠিক ইমেইল বা ১১ সংখ্যার মোবাইল নম্বর দিন' };
    const r = email ? await sendEmail(email, 'পরীক্ষামূলক বার্তা / Test', msg) : await sendSms(phone!, msg);
    return r === 'sent' ? { ok: `${email ?? phone} এ পাঠানো হয়েছে। কিছুক্ষণের মধ্যে পৌঁছাবে।`, ts: Date.now() } : { error: `পাঠানো যায়নি: ${r.replace(/^(failed|skipped):/, '')}` };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
