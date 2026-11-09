import 'server-only';
import { todayBD } from '@/lib/dates';
import { createAdminClient } from '@/lib/supabase/admin';
import { runDailyNotifications } from './run';

const g = globalThis as unknown as { __hfScheduler?: NodeJS.Timeout };

/** বাংলাদেশ সময়ে সকাল ৮টার পর দিনে একবার বিজ্ঞপ্তির কাজ চালায় (সার্ভার চালু থাকলে নিজে থেকে) */
async function tick() {
  try {
    const bdHour = new Date(Date.now() + 6 * 3600 * 1000).getUTCHours();
    if (bdHour < 8) return;
    const { data } = await createAdminClient().from('settings').select('notify_last_run').eq('id', 1).single();
    if (data?.notify_last_run === todayBD()) return;
    const r = await runDailyNotifications();
    console.log('[notify] দৈনিক কাজ সম্পন্ন', JSON.stringify(r));
  } catch (e) {
    console.error('[notify] দৈনিক কাজ ব্যর্থ', e instanceof Error ? e.message : e);
  }
}

export function startScheduler() {
  if (g.__hfScheduler || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  setTimeout(tick, 20_000);
  g.__hfScheduler = setInterval(tick, 30 * 60 * 1000);
}
