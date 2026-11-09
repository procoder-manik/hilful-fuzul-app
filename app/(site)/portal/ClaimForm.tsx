'use client';
import { ActionForm, Submit } from '@/app/admin/_components/ActionForm';
import { useT } from '@/components/LangProvider';
import { claimPayment } from './actions';

/** আবেদনকারী ফি পাঠানোর পর কোন মাধ্যমে ও ট্রানজ্যাকশন আইডি জানান */
export function ClaimForm({ done }: { done: { method: string; trx: string | null } | null }) {
  const { t } = useT();
  return (
    <ActionForm action={claimPayment} style={{ marginTop: 14 }}>
      <b>{done ? t('পাঠানোর তথ্য আপডেট করুন', 'Update payment details') : t('টাকা পাঠিয়ে থাকলে এখানে জানান', 'Already paid? Tell us here')}</b>
      <div className="grid g2" style={{ gap: '0 12px', marginTop: 8 }}>
        <label className="f"><span>{t('কোন মাধ্যমে', 'Payment method')}</span>
          <select name="method" defaultValue={done?.method ?? 'বিকাশ'}>
            <option value="বিকাশ">{t('বিকাশ', 'bKash')}</option><option value="নগদ">{t('নগদ', 'Nagad')}</option><option value="রকেট">{t('রকেট', 'Rocket')}</option>
            <option value="ব্যাংক">{t('ব্যাংক', 'Bank')}</option><option value="হাতে নগদ (কোষাধ্যক্ষকে)">{t('হাতে নগদ (কোষাধ্যক্ষকে)', 'Cash to the treasurer')}</option>
          </select></label>
        <label className="f"><span>{t('ট্রানজ্যাকশন আইডি', 'Transaction ID')}</span><input name="trx" defaultValue={done?.trx ?? ''} autoCapitalize="characters" /></label>
      </div>
      <Submit pendingText={t('জানানো হচ্ছে...', 'Sending...')}>{t('টাকা পাঠিয়েছি, জানাচ্ছি', 'I have paid, let the committee know')}</Submit>
    </ActionForm>
  );
}
