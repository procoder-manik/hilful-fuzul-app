'use client';
import { ActionForm, Submit } from '@/app/admin/_components/ActionForm';
import { useT } from '@/components/LangProvider';
import { resendEmailCode, verifyEmail } from './actions';

/** ইমেইল এখনো যাচাই না হলে প্রোফাইলের ওপরে এই কার্ড দেখায় */
export function EmailVerify({ email }: { email: string }) {
  const { t } = useT();
  return (
    <div className="card" style={{ marginTop: 16, borderLeft: '5px solid var(--warn)' }}>
      <b>{t('আপনার ইমেইল যাচাই করুন', 'Verify your email')}</b>
      <p className="muted small" style={{ margin: '4px 0 10px' }}>{t(`${email} এ একটি ৬ সংখ্যার কোড পাঠানো হয়েছে (স্প্যাম ফোল্ডারও দেখুন)। কোডটি এখানে লিখুন, যাতে আপনার বিজ্ঞপ্তি ও পাসওয়ার্ড রিসেটের কোড ঠিক ঠিকানায় যায়।`, `A 6-digit code was sent to ${email} (check spam too). Enter it here so your notices and password-reset codes reach the right address.`)}</p>
      <ActionForm action={verifyEmail} className="row" style={{ alignItems: 'flex-end' }}>
        <label className="f" style={{ margin: 0 }}><span>{t('কোড', 'Code')}</span><input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required style={{ width: 150 }} /></label>
        <Submit pendingText={t('যাচাই হচ্ছে...', 'Checking...')}>{t('যাচাই করুন', 'Verify')}</Submit>
      </ActionForm>
      <ActionForm action={resendEmailCode} style={{ marginTop: 8 }}><Submit className="btn sm" pendingText={t('পাঠানো হচ্ছে...', 'Sending...')}>{t('আবার কোড পাঠান', 'Send a new code')}</Submit></ActionForm>
    </div>
  );
}
