import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OtpForm } from './OtpForm';
import { Logo } from '@/components/Logo';
import { getT } from '@/lib/lang';
import { adminAal, mfaRequired, otpPath } from '@/lib/mfa';
import { getSessionProfile } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> { return { title: getT()('OTP যাচাই', 'OTP check'), robots: { index: false } }; }
export const dynamic = 'force-dynamic';

export default async function OtpPage({ searchParams }: { searchParams: { next?: string } }) {
  const t = getT();
  const { supabase, user, profile } = await getSessionProfile();
  if (!user) redirect('/login?as=staff');
  if (profile?.role !== 'admin' || !mfaRequired()) redirect('/admin');
  const a = await adminAal(supabase);
  if (a === 'ok') redirect('/admin');
  if (a === 'setup') redirect(otpPath(a));
  return (
    <section className="wrap" style={{ maxWidth: 440, padding: '48px 18px 80px' }}>
      <div className="card" style={{ borderRadius: 32, padding: 28 }}>
        <div className="logo" style={{ width: 56, height: 56, borderRadius: 18, marginBottom: 14 }}><Logo size={30} /></div>
        <h1 style={{ fontSize: '1.6rem' }}>{t('দ্বিতীয় ধাপ: OTP কোড', 'Step 2: OTP code')}</h1>
        <p className="muted">{t('আপনার ফোনের অথেনটিকেটর অ্যাপ (Google Authenticator বা Microsoft Authenticator) খুলে এই সংগঠনের ৬ সংখ্যার কোডটি দিন। কোড প্রতি ৩০ সেকেন্ডে বদলায়।', 'Open the authenticator app on your phone (Google Authenticator or Microsoft Authenticator) and enter the 6-digit code for this organisation. It changes every 30 seconds.')}</p>
        <OtpForm next={searchParams.next ?? ''} />
        <form action="/auth/signout" method="post" style={{ marginTop: 14 }}><button className="btn ghost" style={{ width: '100%' }}>{t('অন্য অ্যাকাউন্টে লগইন করুন', 'Use a different account')}</button></form>
        <p className="muted small" style={{ marginTop: 10 }}>{t('ফোন হারিয়ে গেলে অন্য অ্যাডমিন আপনার দুই-ধাপ রিসেট করে দিতে পারেন। একমাত্র অ্যাডমিন হলে README এর "reset-mfa" অংশ দেখুন।', 'If you lose your phone, another admin can reset your two-step setup. If you are the only admin, see “reset-mfa” in the README.')}</p>
      </div>
    </section>
  );
}
