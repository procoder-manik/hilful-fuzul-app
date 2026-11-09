import type { Metadata } from 'next';
import { SectionsStudio, normRows } from './SectionsStudio';
import { saveSections } from '../../actions/sections';
import { CONTENT_ROLES } from '@/lib/content';
import { requirePage } from '@/lib/guard';
import { PageHead } from '@/lib/ui';
import { cleanStyle, DEFAULT_PAGEHEAD } from '@/lib/sectionstyle';
import type { Settings } from '@/lib/types';

export const metadata: Metadata = { title: 'সেকশন ও পেজ সাজ' };

export default async function SectionsPage() {
  const { supabase } = await requirePage(CONTENT_ROLES);
  const { data } = await supabase.from('settings').select('home_sections, theme').eq('id', 1).single();
  const s = (data ?? {}) as Pick<Settings, 'home_sections' | 'theme'>;
  return (
    <>
      <PageHead title="সেকশন ও পেজ সাজ" sub="হোমপেজের প্রতিটি সেকশনে আলাদা রং ও প্যাটার্ন দিন (না চাইলে সাদামাটা), ক্রম বদলান, এবং সব পাতার হেডার এলাকার সাজ ঠিক করুন।" />
      <SectionsStudio initial={normRows(Array.isArray(s.home_sections) ? s.home_sections : [])} pagehead={cleanStyle(s.theme?.pagehead as never, DEFAULT_PAGEHEAD)} action={saveSections} />
    </>
  );
}
