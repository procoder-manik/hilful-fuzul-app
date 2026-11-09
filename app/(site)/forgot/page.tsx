import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { RequestForm } from './ForgotForms';
import { getSessionProfile } from '@/lib/settings';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  return { title: getT()('পাসওয়ার্ড ভুলে গেছেন', 'Forgot password'), robots: { index: false } };
}

export default async function ForgotPage() {
  const t = getT();
  const { user } = await getSessionProfile();
  if (user) redirect('/portal');
  return (
    <section className="wrap" style={{ maxWidth: 440, padding: '48px 18px 80px' }}>
      <div className="card" style={{ borderRadius: 32, padding: 28 }}>
        <div className="logo" style={{ width: 56, height: 56, borderRadius: 18, marginBottom: 14 }}><Logo size={30} /></div>
        <h1 style={{ fontSize: '1.6rem' }}>{t('পাসওয়ার্ড ভুলে গেছেন?', 'Forgot your password?')}</h1>
        <p className="muted">{t('আপনার ইমেইল দিন, আমরা একটি ৬ সংখ্যার কোড পাঠাব।', 'Enter your email and we will send a 6-digit code.')}</p>
        <RequestForm />
      </div>
    </section>
  );
}
