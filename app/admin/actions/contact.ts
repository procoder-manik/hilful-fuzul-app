'use server';
import { errMsg, logActivity, MONEY, requireAction, str, type ActionState } from '@/lib/guard';
import { notify } from '@/lib/notify/send';

/** বাছাই করা সদস্যদের একসাথে বার্তা: প্রোফাইলে, ইমেইল থাকলে ইমেইলে, মোবাইলে SMS (সেটিংস অনুযায়ী) */
export async function sendBulk(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(MONEY);
    const ids = f.getAll('ids').map(String).filter((x) => /^[0-9a-f-]{36}$/.test(x)).slice(0, 300);
    const title = str(f, 'title'), body = str(f, 'body');
    if (!ids.length) return { error: 'অন্তত একজন সদস্য বাছুন' };
    if (title.length < 3 || body.length < 5) return { error: 'শিরোনাম ও বার্তা লিখুন' };
    if (body.length > 600) return { error: 'বার্তা ৬০০ অক্ষরের মধ্যে রাখুন' };
    const { data: s } = await supabase.from('settings').select('org_name, short_name').eq('id', 1).single();
    const org = s?.short_name || s?.org_name || '';
    let done = 0;
    for (const id of ids) {
      const r = await notify({ memberId: id, kind: 'manual', title, body: `${body}\n\n${org}`, sms: `${org}: ${body}`.slice(0, 300) });
      if (r.created) done++;
    }
    await logActivity(supabase, user.id, `${done} জন সদস্যকে বার্তা পাঠানো হয়েছে: "${title}"`);
    return { ok: `${done} জনকে পাঠানো হয়েছে। কার কাছে ইমেইল/SMS পৌঁছাল তা "বিজ্ঞপ্তি" পাতায় দেখুন।`, ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
