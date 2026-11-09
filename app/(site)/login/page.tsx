import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { LoginForm } from './LoginForm';
import { getSessionProfile } from '@/lib/settings';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  return { title: getT()('লগইন', 'Log in'), robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; as?: string; reset?: string } }) {
  const t = getT();
  const { user, profile } = await getSessionProfile();
  if (user) redirect(profile && profile.role !== 'member' ? '/admin' : '/portal');
  return (
    <section className="wrap" style={{ maxWidth: 440, padding: '48px 18px 80px' }}>
      <div className="card" style={{ borderRadius: 32, padding: 28 }}>
        <div className="logo" style={{ width: 56, height: 56, borderRadius: 18, marginBottom: 14 }}><Logo size={30} /></div>
        <h1 style={{ fontSize: '1.7rem' }}>{t('অ্যাকাউন্টে প্রবেশ', 'Log in to your account')}</h1>
        {searchParams.reset && <div className="notice ok" role="status">{t('পাসওয়ার্ড বদলে গেছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।', 'Your password was changed. Log in with the new password.')}</div>}
        <LoginForm next={searchParams.next ?? ''} initial={searchParams.as === 'staff' || (searchParams.next ?? '').startsWith('/admin') ? 'staff' : 'member'} />
      </div>
    </section>
  );
}
