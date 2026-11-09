'use client';
import { ActionForm, Submit } from '@/app/admin/_components/ActionForm';
import { useT } from '@/components/LangProvider';
import { updateMyProfile } from './actions';

export type ProfileData = {
  name: string; father_name: string | null; mother_name: string | null; nid: string | null; dob: string | null;
  address: string | null; occupation: string | null; nominee: string | null; email: string | null; phone: string; photo_url: string | null;
};

/** সদস্য বা আবেদনকারীর নিজের তথ্য সম্পাদনার ফর্ম */
export function ProfileEditor({ p }: { p: ProfileData }) {
  const { t } = useT();
  return (
    <ActionForm action={updateMyProfile} className="card">
      <b>{t('আমার তথ্য সম্পাদনা', 'Edit my details')}</b>
      <div className="grid g2" style={{ gap: '0 12px', marginTop: 10 }}>
        <label className="f"><span>{t('পূর্ণ নাম *', 'Full name *')}</span><input name="name" defaultValue={p.name} required /></label>
        <label className="f"><span>{t('মোবাইল নম্বর', 'Mobile number')}</span><input value={p.phone} disabled readOnly aria-describedby="ph-note" /></label>
        <label className="f"><span>{t('পিতার নাম', 'Father’s name')}</span><input name="father_name" defaultValue={p.father_name ?? ''} /></label>
        <label className="f"><span>{t('মাতার নাম', 'Mother’s name')}</span><input name="mother_name" defaultValue={p.mother_name ?? ''} /></label>
        <label className="f"><span>{t('এনআইডি / জন্মনিবন্ধন', 'NID / birth certificate no.')}</span><input name="nid" inputMode="numeric" defaultValue={p.nid ?? ''} /></label>
        <label className="f"><span>{t('জন্ম তারিখ', 'Date of birth')}</span><input name="dob" type="date" defaultValue={p.dob ?? ''} /></label>
        <label className="f"><span>{t('ইমেইল', 'Email')}</span><input name="email" type="email" autoCapitalize="none" defaultValue={p.email ?? ''} /></label>
        <label className="f"><span>{t('পেশা', 'Occupation')}</span><input name="occupation" defaultValue={p.occupation ?? ''} /></label>
      </div>
      <p id="ph-note" className="muted small" style={{ marginTop: -4 }}>{t('মোবাইল নম্বর বদলাতে কোষাধ্যক্ষের সাথে যোগাযোগ করুন।', 'To change your mobile number, contact the treasurer.')}</p>
      <label className="f"><span>{t('ঠিকানা', 'Address')}</span><input name="address" defaultValue={p.address ?? ''} /></label>
      <label className="f"><span>{t('নমিনির নাম ও সম্পর্ক', 'Nominee name and relation')}</span><input name="nominee" defaultValue={p.nominee ?? ''} /></label>
      <label className="f"><span>{t('ছবি', 'Photo')} {p.photo_url ? t('(বদলাতে চাইলে নতুন দিন)', '(choose a new one to replace)') : ''}</span>
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      <Submit pendingText={t('সংরক্ষণ হচ্ছে...', 'Saving...')}>{t('তথ্য সংরক্ষণ করুন', 'Save details')}</Submit>
    </ActionForm>
  );
}
