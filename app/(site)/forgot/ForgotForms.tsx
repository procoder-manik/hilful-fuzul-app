'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { requestReset, resetPassword, type ForgotState } from './actions';
import { useT } from '@/components/LangProvider';

function Btn({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return <button className="btn pri" style={{ width: '100%', padding: 13 }} disabled={pending}>{pending ? busy : label}</button>;
}

export function RequestForm() {
  const { t } = useT();
  const [state, action] = useFormState<ForgotState, FormData>(requestReset, {});
  return (
    <form action={action}>
      {state.error && <div className="notice" role="alert">{state.error}</div>}
      <label className="f"><span>{t('আপনার ইমেইল', 'Your email')}</span><input name="email" type="email" required autoComplete="email" autoCapitalize="none" /></label>
      <Btn label={t('কোড পাঠান', 'Send code')} busy={t('পাঠানো হচ্ছে...', 'Sending...')} />
      <p className="muted small" style={{ marginTop: 14 }}><Link href="/login">{t('লগইনে ফিরুন', 'Back to log in')}</Link></p>
    </form>
  );
}

export function ResetForm({ email }: { email: string }) {
  const { t } = useT();
  const [show, setShow] = useState(false);
  const [state, action] = useFormState<ForgotState, FormData>(resetPassword, {});
  return (
    <form action={action}>
      <div className="notice ok" style={{ marginTop: 0 }}>{t('ঐ ইমেইলে অ্যাকাউন্ট থাকলে একটি ৬ সংখ্যার কোড পাঠানো হয়েছে। (স্প্যাম ফোল্ডারও দেখুন)', 'If an account exists for that email, a 6-digit code was sent. (Check your spam folder too)')}</div>
      {state.error && <div className="notice" role="alert">{state.error}</div>}
      <label className="f"><span>{t('ইমেইল', 'Email')}</span><input name="email" type="email" required defaultValue={email} autoCapitalize="none" /></label>
      <label className="f"><span>{t('ইমেইলের ৬ সংখ্যার কোড', '6-digit code from the email')}</span><input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required /></label>
      <label className="f"><span>{t('নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)', 'New password (at least 6 characters)')}</span>
        <div className="pw"><input name="password" type={show ? 'text' : 'password'} minLength={6} required autoComplete="new-password" /><button type="button" className="pw-t" onClick={() => setShow((v) => !v)}>{show ? t('লুকান', 'Hide') : t('দেখান', 'Show')}</button></div></label>
      <label className="f"><span>{t('পাসওয়ার্ড আবার লিখুন', 'Repeat password')}</span><input name="password2" type={show ? 'text' : 'password'} minLength={6} required autoComplete="new-password" /></label>
      <Btn label={t('পাসওয়ার্ড বদলান', 'Change password')} busy={t('বদলানো হচ্ছে...', 'Changing...')} />
      <p className="muted small" style={{ marginTop: 14 }}><Link href="/forgot">{t('নতুন কোড চান', 'Request a new code')}</Link> · <Link href="/login">{t('লগইনে ফিরুন', 'Back to log in')}</Link></p>
    </form>
  );
}
