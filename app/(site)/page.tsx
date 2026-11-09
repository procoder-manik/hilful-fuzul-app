import { EventBanner } from '@/components/EventBanner';
import { EventPopup } from '@/components/EventPopup';
import { JsonLd } from '@/components/JsonLd';
import { Blocks } from '@/components/blocks/Blocks';
import { getEvents, upcoming } from '@/lib/public';
import { getSiteSettings } from '@/lib/settings';
import { graph } from '@/lib/schema';
import { cleanBlocks, defaultHomeBlocks } from '@/lib/blocks';

export const dynamic = 'force-dynamic';

/** হোমপেজ: অ্যাডমিনের পেজ বিল্ডারে সাজানো কম্পোনেন্টের তালিকা (না সাজানো থাকলে আগের ডিফল্ট ক্রম) */
export default async function Home() {
  const [s, events] = await Promise.all([getSiteSettings(), getEvents()]);
  const popup = upcoming(events).find((e) => e.show_popup);
  const saved = cleanBlocks(s.home_sections);
  const blocks = saved.length ? saved : defaultHomeBlocks();
  return (
    <>
      <JsonLd data={graph(s)} />
      <Blocks blocks={blocks} />
      {popup && <EventPopup id={popup.id} outcome={popup.outcome}><EventBanner e={popup} /></EventPopup>}
    </>
  );
}
