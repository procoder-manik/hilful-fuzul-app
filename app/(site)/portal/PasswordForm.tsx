'use client';
import { ActionForm, Submit } from '@/app/admin/_components/ActionForm';
import { useT } from '@/components/LangProvider';
import { changePassword } from './actions';

export function PasswordForm() {
  const { t } = useT();
  return (
    <ActionForm action={changePassword} className="card" resetOnSuccess>
      <b>{t('পাসওয়ার্ড বদলান', 'Change password')}</b>
      <div className="grid g2" style={{ gap: '0 10px', marginTop: 10 }}>
        <label className="f"><span>{t('নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)', 'New password (at least 6 characters)')}</span><input name="password" type="password" minLength={6} required autoComplete="new-password" /></label>
        <label className="f"><span>{t('আবার লিখুন', 'Repeat')}</span><input name="password2" type="password" minLength={6} required autoComplete="new-password" /></label>
      </div>
      <Submit pendingText={t('বদলানো হচ্ছে...', 'Changing...')}>{t('পাসওয়ার্ড বদলান', 'Change password')}</Submit>
    </ActionForm>
  );
}
