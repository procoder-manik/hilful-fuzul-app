import { notFound } from 'next/navigation';
import { decRow } from '@/lib/crypto';
import { PrintBar } from '../../../_components/PrintButton';
import { MemberFormDoc } from '../../MemberFormDoc';
import { requirePage, STAFF } from '@/lib/guard';
import { getSettings } from '@/lib/settings';
import { signedUrl } from '@/lib/storage';

export default async function MemberPrint({ params }: { params: { id: string } }) {
  const { supabase } = await requirePage(STAFF);
  const [s, { data: m }] = await Promise.all([getSettings(), supabase.from('members').select('*').eq('id', params.id).single()]);
  if (!m) notFound();
  const sig = await signedUrl(supabase, m.signature_url);
  return (<><PrintBar back={`/admin/members/${m.id}`} /><div className="doc"><MemberFormDoc s={s} m={decRow(m)} sig={sig} /></div></>);
}
