import { fd } from '@/lib/fmt';
import { getT } from '@/lib/lang';
import { todayBD } from '@/lib/dates';
import { DEFAULT_TAG } from '@/lib/eventdesign';
import { EventBannerView } from './EventBannerView';
import type { EventRow } from '@/lib/public';

export { DEFAULT_DESIGN } from '@/lib/eventdesign';

/** অ্যাডমিনের অনুষ্ঠান পাতায় বানানো ডিজাইন অনুযায়ী ব্যানার। আসন্ন হলে "আসন্ন", পেরিয়ে গেলে "সম্পন্ন" ট্যাগ ও ফলাফল */
export function EventBanner({ e }: { e: EventRow }) {
  const t = getT();
  const d = (e.design ?? {}) as { tag?: string };
  const done = e.event_date < todayBD();
  const custom = d.tag && d.tag !== DEFAULT_TAG ? d.tag : null;
  const tag = done ? t('সম্পন্ন', 'Completed') : custom ?? t(DEFAULT_TAG, 'Upcoming event');
  return (
    <EventBannerView b={{
      title: e.title, topic: e.topic, date: fd(e.event_date), time: e.event_time, venue: e.venue, tag, done, design: e.design as never,
      guests: [[t('প্রধান অতিথি', 'Chief guest'), e.chief_guest], [t('বিশেষ অতিথি', 'Special guest'), e.special_guest], [t('সভাপতিত্ব করবেন', 'Presided by'), e.presided_by]],
      note: done && e.outcome ? [t('যা করা হয়েছে', 'What was done'), e.outcome] : null,
    }} />
  );
}
