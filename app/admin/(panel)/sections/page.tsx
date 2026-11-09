import type { Metadata } from 'next';
import { SectionsStudio } from './SectionsStudio';
import { saveSections } from '../../actions/sections';
import { CONTENT_ROLES } from '@/lib/content';
import { requirePage } from '@/lib/guard';
import { PageHead } from '@/lib/ui';
import { cleanStyle, DEFAULT_PAGEHEAD } from '@/lib/sectionstyle';
import type { Settings } from '@/lib/types';

export const metadata: Metadata = { title: 'সেকশন ও পেজ সাজ' };

export default async function SectionsPage() {
  const { supabase } = await requirePage(CONTENT_ROLES);
  const { data } = await supabase.from('settings').select('theme').eq('id', 1).single();
  const s = (data ?? {}) as Pick<Settings, 'theme'>;
  return (
    <>
      <PageHead title="সেকশন ও পেজ সাজ" sub="সব ভেতরের পাতার (আমাদের কথা, সেবা, সংবাদ, সদস্য ইত্যাদি) ওপরের হেডার এলাকার রং ও প্যাটার্ন এখান থেকে একসাথে বদলান।" />
      <SectionsStudio pagehead={cleanStyle(s.theme?.pagehead as never, DEFAULT_PAGEHEAD)} action={saveSections} />
    </>
  );
}
