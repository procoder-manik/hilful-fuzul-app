import type { Metadata } from 'next';
import { PrintBar } from '@/app/admin/_components/PrintButton';
import { MemberFormDoc } from '@/app/admin/print/MemberFormDoc';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'সদস্য ফর্ম (প্রিন্টের জন্য)', description: 'হাতে পূরণ করে জমা দেওয়ার জন্য সদস্যপদের আবেদন ফর্ম, শর্তাবলীসহ।', alternates: { canonical: '/form' } };

export default async function PrintableForm() {
  const s = await getSettings();
  return <div className="print-wrap"><PrintBar back="/join" /><div className="doc"><MemberFormDoc s={s} /></div></div>;
}
