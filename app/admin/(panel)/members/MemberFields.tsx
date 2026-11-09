import { SignaturePad } from '../../_components/SignaturePad';
import type { Member } from '@/lib/types';
import { todayBD } from '@/lib/dates';

/** নতুন ও সম্পাদনা দুই ফর্মেই একই ঘর */
export function MemberFields({ m, isNew }: { m?: Partial<Member>; isNew?: boolean }) {
  const v = (k: keyof Member) => (m?.[k] as string | number | null | undefined) ?? '';
  return (
    <>
      <div className="grid g2" style={{ gap: '0 12px' }}>
        <label className="f"><span>পূর্ণ নাম *</span><input name="name" defaultValue={v('name')} required /></label>
        <label className="f"><span>পিতার নাম</span><input name="father_name" defaultValue={v('father_name')} /></label>
        <label className="f"><span>মোবাইল নম্বর *</span><input name="phone" defaultValue={v('phone')} inputMode="tel" required placeholder="01XXXXXXXXX" /></label>
        <label className="f"><span>মাতার নাম</span><input name="mother_name" defaultValue={v('mother_name')} /></label>
        <label className="f"><span>ইমেইল (বিজ্ঞপ্তি ও লগইনের জন্য)</span><input name="email" type="email" autoCapitalize="none" defaultValue={v('email')} /></label>
        <label className="f"><span>এনআইডি / জন্মনিবন্ধন</span><input name="nid" defaultValue={v('nid')} /></label>
        <label className="f"><span>জন্ম তারিখ</span><input name="dob" type="date" defaultValue={v('dob')} /></label>
        <label className="f"><span>পেশা</span><input name="occupation" defaultValue={v('occupation')} /></label>
        <label className="f"><span>মাসিক চাঁদা (৳) *</span><input name="monthly_amount" type="number" min={10} defaultValue={v('monthly_amount') || 100} required list="fees" /></label>
        <label className="f"><span>যোগদানের তারিখ</span><input name="join_date" type="date" defaultValue={v('join_date') || todayBD()} /></label>
        <label className="f"><span>নমিনির নাম ও সম্পর্ক</span><input name="nominee" defaultValue={v('nominee')} /></label>
        <label className="f"><span>ছবি {m?.photo_url ? '(বদলাতে চাইলে নতুন দিন)' : ''}</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      </div>
      <datalist id="fees"><option value="50" /><option value="100" /><option value="200" /><option value="500" /><option value="1000" /></datalist>
      <label className="f"><span>ঠিকানা</span><input name="address" defaultValue={v('address')} /></label>
      <label className="f"><span>নোট (শুধু কমিটি দেখবে)</span><textarea name="notes" defaultValue={(m as { notes?: string } | undefined)?.notes ?? ''} /></label>
      {isNew && (
        <>
          <div className="grid g2" style={{ gap: '0 12px' }}>
            <label className="f"><span>লগইনের পাসওয়ার্ড (ঐচ্ছিক, কমপক্ষে ৬ অক্ষর)</span><input name="password" type="text" minLength={6} autoComplete="off" placeholder="পরে প্রোফাইল থেকেও দেওয়া যাবে" /></label>
            <div />
          </div>
          <SignaturePad label="সদস্যের স্বাক্ষর (ঐচ্ছিক)" />
          <label className="chk"><input type="checkbox" name="fee_paid" defaultChecked /> <span>ভর্তি ফি জমা হয়েছে (জমার হিসাবে যোগ হবে)</span></label>
        </>
      )}
    </>
  );
}
