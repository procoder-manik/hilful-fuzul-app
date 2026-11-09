import { notFound } from 'next/navigation';
import { PrintBar } from '../../../_components/PrintButton';
import { MemberFormDoc } from '../../MemberFormDoc';
import { MONEY, requirePage } from '@/lib/guard';
import { getSettings } from '@/lib/settings';
import { signedUrl } from '@/lib/storage';
import type { Application } from '@/lib/types';

/** ওয়েবসাইটে পূরণ করা আবেদন ফর্ম প্রিন্ট (অ্যাডমিন ও কোষাধ্যক্ষ): স্বাক্ষর, ছবি ও ফি পাঠানোর তথ্যসহ */
export default async function ApplicationPrint({ params }: { params: { id: string } }) {
  const { supabase } = await requirePage(MONEY);
  const [s, { data }] = await Promise.all([getSettings(), supabase.from('applications').select('*').eq('id', params.id).single()]);
  const a = data as Application | null;
  if (!a) notFound();
  const sig = await signedUrl(supabase, a.signature_url);
  return (
    <>
      <PrintBar back="/admin/applications" />
      <div className="doc"><MemberFormDoc s={s} m={{ ...a, join_date: a.created_at.slice(0, 10) }} sig={sig} appNo={a.app_no} pending pay={a.pay_claimed_at ? { method: a.pay_method, trx: a.pay_trx } : null} /></div>
    </>
  );
}
