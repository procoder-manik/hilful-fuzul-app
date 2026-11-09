import type { Metadata } from 'next';
import Link from 'next/link';
import { FooterStudio, HeaderStudio } from './DesignStudio';
import { saveFooterDesign, saveHeaderDesign } from '../../actions/design';
import { CONTENT_ROLES } from '@/lib/content';
import { requirePage } from '@/lib/guard';
import { footerCfg, headerCfg } from '@/lib/layoutcfg';
import { getMegaData, getMenu } from '@/lib/menu';
import { PageHead } from '@/lib/ui';
import type { Settings } from '@/lib/types';

export const metadata: Metadata = { title: 'হেডার ও ফুটার' };

export default async function Design({ searchParams }: { searchParams: { tab?: string } }) {
  const { supabase } = await requirePage(CONTENT_ROLES);
  const tab = searchParams.tab === 'footer' ? 'footer' : 'header';
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
  const s = data as Settings;
  const [menu, c1, c2, c3, bottom] = await Promise.all([getMenu('header', 'bn'), getMenu('footer-1', 'bn'), getMenu('footer-2', 'bn'), getMenu('footer-3', 'bn'), getMenu('footer-bottom', 'bn')]);
  const org = { name: s.org_name, short: s.short_name, tagline: s.tagline, logo: s.logo_url, established: s.established };
  const contact = { phone: s.phone, phone2: s.phone2 ?? null, email: s.email, address: s.address, facebook: s.facebook, whatsapp: s.whatsapp, youtube: s.youtube ?? null, mapUrl: s.map_url ?? null, officeHours: s.office_hours ?? null };
  return (
    <>
      <PageHead title="হেডার ও ফুটার ডিজাইন" sub="রং, লেআউট, মেনুর ধরন, ঘোষণা-বার ও ফুটারের কলাম নিজের মতো সাজান। বদলানোর সাথে সাথে নিচে প্রিভিউ দেখা যাবে।">
        <Link className="btn" href="/admin/menus">মেনু সম্পাদনা</Link>
      </PageHead>
      <div className="seg" style={{ marginBottom: 16 }}>
        <Link href="/admin/design" className={tab === 'header' ? 'on' : ''}>হেডার</Link>
        <Link href="/admin/design?tab=footer" className={tab === 'footer' ? 'on' : ''}>ফুটার</Link>
      </div>
      {tab === 'header'
        ? <HeaderStudio initial={headerCfg(s.header_cfg)} org={org} menu={menu} mega={await getMegaData(menu)} contact={contact} action={saveHeaderDesign} />
        : <FooterStudio initial={footerCfg(s.footer_cfg)} org={org} menus={{ c1, c2, c3, bottom }} contact={contact} action={saveFooterDesign} />}
    </>
  );
}
