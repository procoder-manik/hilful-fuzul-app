'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { signIn, type LoginState } from './actions';
import { useT } from '@/components/LangProvider';

function Submit() {
  const { t } = useT();
  const { pending } = useFormStatus();
  return <button className="btn pri" style={{ width: '100%', padding: 13 }} disabled={pending}>{pending ? t('যাচাই করা হচ্ছে...', 'Checking...') : t('প্রবেশ করুন', 'Log in')}</button>;
}

export function LoginForm({ next, initial }: { next: string; initial: 'member' | 'staff' }) {
  const { t } = useT();
  const [as, setAs] = useState<'member' | 'staff'>(initial);
  const [show, setShow] = useState(false);
  const [state, action] = useFormState<LoginState, FormData>(signIn, {});
  const staff = as === 'staff';
  return (
    <form action={action}>
      <div className="seg" role="tablist" style={{ width: '100%', margin: '4px 0 16px' }}>
        <button type="button" role="tab" aria-selected={!staff} className={!staff ? 'on' : ''} style={{ flex: 1 }} onClick={() => setAs('member')}>{t('সদস্য', 'Member')}</button>
        <button type="button" role="tab" aria-selected={staff} className={staff ? 'on' : ''} style={{ flex: 1 }} onClick={() => setAs('staff')}>{t('কমিটি ও অ্যাডমিন', 'Committee & admin')}</button>
      </div>
      <input type="hidden" name="audience" value={as} />
      <input type="hidden" name="next" value={next} />
      {state.error && <div className="notice" role="alert">{state.error}</div>}
      {staff && <div className="notice warn" style={{ marginTop: 0 }}>{t('এটি শুধু কমিটির সদস্য ও অ্যাডমিনের জন্য। অ্যাডমিনকে পাসওয়ার্ডের পর অথেনটিকেটর অ্যাপের ৬ সংখ্যার কোড দিতে হবে।', 'For committee members and admins only. Admins must also enter the 6-digit code from their authenticator app after the password.')}</div>}
      <label className="f"><span>{t('ইমেইল', 'Email')}</span>
        <input name="identifier" type="text" autoComplete="username" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={staff ? 'admin@email.com' : 'name@email.com'} required />
        {!staff && <small className="muted" style={{ display: 'block', marginTop: 4 }}>{t('পুরোনো সদস্য হলে মোবাইল নম্বরও চলবে।', 'Older members can still use their mobile number.')}</small>}</label>
      <label className="f"><span>{t('পাসওয়ার্ড', 'Password')}</span>
        <div className="pw"><input name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required />
          <button type="button" className="pw-t" onClick={() => setShow((v) => !v)} aria-label={show ? t('পাসওয়ার্ড লুকান', 'Hide password') : t('পাসওয়ার্ড দেখান', 'Show password')}>{show ? t('লুকান', 'Hide') : t('দেখান', 'Show')}</button></div></label>
      <Submit />
      {!staff && <p className="muted small" style={{ marginTop: 14 }}>{t('নতুন সদস্য?', 'New here?')} <Link href="/join"><b>{t('নিবন্ধন করুন', 'Register')}</b></Link></p>}
      <p className="muted small" style={{ marginTop: 4 }}><Link href="/forgot"><b>{t('পাসওয়ার্ড ভুলে গেছেন?', 'Forgot your password?')}</b></Link> {t('ইমেইলে কোড পাঠানো হবে।', 'We will email you a code.')}</p>
    </form>
  );
}
