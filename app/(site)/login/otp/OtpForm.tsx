'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { verifyOtp, type OtpState } from '../otp-actions';
import { useT } from '@/components/LangProvider';

function Go() {
  const { t } = useT();
  const { pending } = useFormStatus();
  return <button className="btn pri" style={{ width: '100%', padding: 13 }} disabled={pending}>{pending ? t('যাচাই হচ্ছে...', 'Checking...') : t('যাচাই করুন', 'Verify')}</button>;
}

export function OtpForm({ next }: { next: string }) {
  const { t } = useT();
  const [state, action] = useFormState<OtpState, FormData>(verifyOtp, {});
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      {state.error && <div className="notice" role="alert">{state.error}</div>}
      <label className="f"><span>{t('অথেনটিকেটর অ্যাপের ৬ সংখ্যার কোড', '6-digit code from your authenticator app')}</span>
        <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9০-৯]{6}" maxLength={6} autoFocus required className="otp" placeholder="••••••" /></label>
      <Go />
    </form>
  );
}
