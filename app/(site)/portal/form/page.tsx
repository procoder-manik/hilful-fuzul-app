import { redirect } from 'next/navigation';
import { PrintBar } from '@/app/admin/_components/PrintButton';
import { MemberFormDoc } from '@/app/admin/print/MemberFormDoc';
import { getSessionProfile, getSettings } from '@/lib/settings';

export const metadata = { title: 'আমার সদস্য ফর্ম', robots: { index: false } };

export default async function MyForm() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile?.member_id) redirect('/portal');
  const [s, { data: m }] = await Promise.all([getSettings(), supabase.from('members').select('*').eq('id', profile.member_id).single()]);
  return <div className="print-wrap"><PrintBar back="/portal" /><div className="doc"><MemberFormDoc s={s} m={m} /></div></div>;
}
