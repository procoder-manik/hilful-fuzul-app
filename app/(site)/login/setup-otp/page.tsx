import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SetupOtp } from './SetupOtp';
import { Logo } from '@/components/Logo';
import { getT } from '@/lib/lang';
import { adminAal, mfaRequired } from '@/lib/mfa';
import { getSessionProfile } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> { return { title: getT()('দুই-ধাপ চালু করুন', 'Set up two-step login'), robots: { index: false } }; }
export const dynamic = 'force-dynamic';

export default async function SetupOtpPage() {
  const t = getT();
  const { supabase, user, profile } = await getSessionProfile();
  if (!user) redirect('/login?as=staff');
  if (profile?.role !== 'admin' || !(await mfaRequired(supabase))) redirect('/admin');
  const a = await adminAal(supabase);
  if (a === 'ok') redirect('/admin');
  if (a === 'verify') redirect('/login/otp');
  return (
    <section className="wrap" style={{ maxWidth: 480, padding: '48px 18px 80px' }}>
      <div className="card" style={{ borderRadius: 32, padding: 28 }}>
        <div className="logo" style={{ width: 56, height: 56, borderRadius: 18, marginBottom: 14 }}><Logo size={30} /></div>
        <h1 style={{ fontSize: '1.6rem' }}>{t('অ্যাডমিন অ্যাকাউন্ট সুরক্ষিত করুন', 'Secure your admin account')}</h1>
        <p className="muted">{t('অ্যাডমিনের লগইনে পাসওয়ার্ডের সাথে ফোনের অথেনটিকেটর অ্যাপের কোডও লাগে, যাতে পাসওয়ার্ড ফাঁস হলেও কেউ ঢুকতে না পারে। একবার যুক্ত করলেই হবে, এতে ইন্টারনেট বা SMS খরচ লাগে না।', 'Admin login needs a code from an authenticator app on your phone in addition to the password, so no one can get in even if the password leaks. Set it up once; it needs no SMS and costs nothing.')}</p>
        <SetupOtp />
        <form action="/auth/signout" method="post" style={{ marginTop: 14 }}><button className="btn ghost" style={{ width: '100%' }}>{t('বের হোন', 'Log out')}</button></form>
      </div>
    </section>
  );
}
