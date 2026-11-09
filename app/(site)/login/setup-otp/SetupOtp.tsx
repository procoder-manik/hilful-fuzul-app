'use client';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { confirmEnroll, startEnroll, type OtpState } from '../otp-actions';
import { useT } from '@/components/LangProvider';

function Confirm() {
  const { t } = useT();
  const { pending } = useFormStatus();
  return <button className="btn pri" style={{ width: '100%', padding: 13 }} disabled={pending}>{pending ? t('যাচাই হচ্ছে...', 'Checking...') : t('নিশ্চিত করে চালু করুন', 'Confirm and turn on')}</button>;
}

function Step2({ info, restart }: { info: OtpState; restart: () => void }) {
  const { t } = useT();
  const [state, action] = useFormState<OtpState, FormData>(confirmEnroll.bind(null, info.factorId!), {});
  return (
    <div>
      <ol className="terms" style={{ marginBottom: 14 }}>
        <li>{t('ফোনে Google Authenticator (বা Microsoft Authenticator, Authy) অ্যাপ ইনস্টল করুন।', 'Install Google Authenticator (or Microsoft Authenticator, Authy) on your phone.')}</li>
        <li>{t('অ্যাপে "+" চেপে "QR কোড স্ক্যান" বেছে নিচের ছবিটি স্ক্যান করুন।', 'In the app tap “+”, choose “Scan QR code” and scan the picture below.')}</li>
        <li>{t('অ্যাপে যে ৬ সংখ্যার কোড দেখাবে সেটি নিচে লিখুন।', 'Type the 6-digit code the app shows below.')}</li>
      </ol>
      <div style={{ textAlign: 'center', background: '#fff', borderRadius: 18, padding: 12, maxWidth: 240, margin: '0 auto 12px' }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={info.qr} alt={t('অথেনটিকেটর অ্যাপের QR কোড', 'Authenticator app QR code')} width={216} height={216} style={{ maxWidth: '100%', height: 'auto' }} /></div>
      <details style={{ marginBottom: 12 }}><summary>{t('স্ক্যান করতে না পারলে গোপন কী লিখে নিন', 'Cannot scan? Use the secret key')}</summary><p style={{ margin: '8px 0 0', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '1rem' }}>{info.secret}</p><p className="muted small">{t('এটি কোথাও নিরাপদে লিখে রাখুন। অ্যাপে "কী দিয়ে যুক্ত করুন" বেছে এটি দিলেও চলবে।', 'Keep this somewhere safe. You can also choose “Enter a setup key” in the app and type it.')}</p></details>
      <form action={action}>
        {state.error && <div className="notice" role="alert">{state.error}</div>}
        <label className="f"><span>{t('অ্যাপের ৬ সংখ্যার কোড', '6-digit code from the app')}</span><input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9০-৯]{6}" required className="otp" placeholder="••••••" /></label>
        <Confirm />
      </form>
      <button type="button" className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={restart}>{t('আবার শুরু করুন (নতুন QR)', 'Start again (new QR)')}</button>
    </div>
  );
}

export function SetupOtp() {
  const { t } = useT();
  const [info, setInfo] = useState<OtpState | null>(null);
  const [busy, setBusy] = useState(false);
  const start = async () => { setBusy(true); setInfo(await startEnroll()); setBusy(false); };
  if (info?.qr) return <Step2 info={info} restart={start} />;
  return (
    <div>
      {info?.error && <div className="notice" role="alert">{info.error}</div>}
      <button className="btn pri" style={{ width: '100%', padding: 13 }} disabled={busy} onClick={start}>{busy ? t('প্রস্তুত হচ্ছে...', 'Preparing...') : t('অথেনটিকেটর অ্যাপ যুক্ত করুন', 'Set up authenticator app')}</button>
    </div>
  );
}
