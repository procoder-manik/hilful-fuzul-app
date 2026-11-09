import { redirect } from 'next/navigation';
import { PrintBar } from '@/app/admin/_components/PrintButton';
import { MemberFormDoc } from '@/app/admin/print/MemberFormDoc';
import { getSessionProfile, getSettings } from '@/lib/settings';
import { createAdminClient } from '@/lib/supabase/admin';
import { signedUrl } from '@/lib/storage';
import type { Application } from '@/lib/types';

export const metadata = { title: 'আমার সদস্য ফর্ম', robots: { index: false } };
export const dynamic = 'force-dynamic';

/** নিজের পূরণ করা ফর্ম প্রিন্ট বা PDF: সদস্য হলে সদস্য ফর্ম, যাচাইয়ের অপেক্ষায় থাকলে আবেদনের ফর্ম */
export default async function MyForm() {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user) redirect('/login?next=/portal/form');
  const s = await getSettings();

  if (profile?.member_id) {
    const { data: m } = await supabase.from('members').select('*').eq('id', profile.member_id).single();
    if (!m) redirect('/portal');
    const sig = await signedUrl(createAdminClient(), m.signature_url);       // সারি আগেই নিজের অধিকারে (RLS) পড়া হয়েছে, তাই স্বাক্ষরের লিংক নিরাপদ
    return <div className="print-wrap"><PrintBar back="/portal" /><div className="doc"><MemberFormDoc s={s} m={m} sig={sig} /></div></div>;
  }

  const { data } = await supabase.from('applications').select('*').eq('user_id', user.id).maybeSingle();
  const a = data as Application | null;
  if (!a) redirect('/portal');
  const sig = await signedUrl(createAdminClient(), a.signature_url);
  return (
    <div className="print-wrap">
      <PrintBar back="/portal" />
      <div className="doc"><MemberFormDoc s={s} m={{ ...a, join_date: a.created_at.slice(0, 10) }} sig={sig} appNo={a.app_no} pending pay={a.pay_claimed_at ? { method: a.pay_method, trx: a.pay_trx } : null} /></div>
    </div>
  );
}
