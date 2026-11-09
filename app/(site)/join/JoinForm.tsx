'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { SignaturePad } from '@/app/admin/_components/SignaturePad';
import { registerAccount, type RegisterState } from './actions';
import { useT } from '@/components/LangProvider';

function Send() {
  const { t } = useT();
  const { pending } = useFormStatus();
  return <button className="btn pri lg" disabled={pending}>{pending ? t('নিবন্ধন হচ্ছে...', 'Registering...') : t('নিবন্ধন করুন', 'Register')}</button>;
}

export function JoinForm() {
  const { t, bn } = useT();
  const [show, setShow] = useState(false);
  const [state, action] = useFormState<RegisterState, FormData>(registerAccount, {});
  return (
    <form action={action} className="card">
      <h2 className="h2" style={{ marginTop: 0 }}>{t('নিবন্ধন ফর্ম', 'Registration form')}</h2>
      <p className="muted small" style={{ marginTop: 0 }}>{t('নিবন্ধন করলেই আপনার প্রোফাইল তৈরি হবে এবং সাথে সাথে লগইন হয়ে যাবে। ভর্তি ফি জমা দিয়ে কমিটির যাচাইয়ের পর আপনি যাচাইকৃত সদস্য হবেন।', 'Registering creates your profile and logs you in right away. After you pay the joining fee and the committee verifies it, you become a verified member.')}</p>
      {state.error && <div className="notice" role="alert">{state.error} {state.loginHint && <Link href="/login"><b>{t('লগইন', 'Log in')}</b></Link>}</div>}

      <h3 className="h2">{t('ব্যক্তিগত তথ্য', 'Personal details')}</h3>
      <div className="grid g2" style={{ gap: '0 12px' }}>
        <label className="f"><span>{t('পূর্ণ নাম *', 'Full name *')}</span><input name="name" required autoComplete="name" /></label>
        <label className="f"><span>{t('পিতার নাম *', 'Father’s name *')}</span><input name="father_name" required /></label>
        <label className="f"><span>{t('মাতার নাম', 'Mother’s name')}</span><input name="mother_name" /></label>
        <label className="f"><span>{t('এনআইডি / জন্মনিবন্ধন', 'NID / birth certificate no.')}</span><input name="nid" inputMode="numeric" /></label>
        <label className="f"><span>{t('জন্ম তারিখ', 'Date of birth')}</span><input name="dob" type="date" /></label>
        <label className="f"><span>{t('পেশা', 'Occupation')}</span><input name="occupation" /></label>
      </div>
      <label className="f"><span>{t('ঠিকানা *', 'Address *')}</span><input name="address" required autoComplete="street-address" /></label>

      <h3 className="h2">{t('লগইনের তথ্য', 'Login details')}</h3>
      <div className="grid g2" style={{ gap: '0 12px' }}>
        <label className="f"><span>{t('মোবাইল নম্বর *', 'Mobile number *')}</span><input name="phone" required inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" /></label>
        <label className="f"><span>{t('ইমেইল (ঐচ্ছিক)', 'Email (optional)')}</span><input name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="name@email.com" /></label>
        <label className="f"><span>{t('পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)', 'Password * (at least 6 characters)')}</span><div className="pw"><input name="password" type={show ? 'text' : 'password'} minLength={6} required autoComplete="new-password" /><button type="button" className="pw-t" onClick={() => setShow((v) => !v)}>{show ? t('লুকান', 'Hide') : t('দেখান', 'Show')}</button></div></label>
        <label className="f"><span>{t('পাসওয়ার্ড আবার লিখুন *', 'Repeat password *')}</span><input name="password2" type={show ? 'text' : 'password'} minLength={6} required autoComplete="new-password" /></label>
      </div>
      <p className="muted small" style={{ marginTop: -4 }}>{t('লগইনে মোবাইল নম্বর বা ইমেইল, যেকোনো একটি দিলেই চলবে। ইমেইল দিলে বিজ্ঞপ্তি ইমেইলেও পাবেন, মোবাইল নম্বরে SMS পাবেন।', 'You can log in with either your mobile number or email. If you give an email you also get notices by email, and by SMS on your mobile number.')}</p>

      <h3 className="h2">{t('সদস্যপদ', 'Membership')}</h3>
      <div className="grid g2" style={{ gap: '0 12px' }}>
        <label className="f"><span>{t('মাসিক চাঁদা *', 'Monthly contribution *')}</span><select name="monthly_amount" defaultValue="100">{[50, 100, 200, 500, 1000].map((v) => <option key={v} value={v}>৳{bn(v)}</option>)}</select></label>
        <label className="f"><span>{t('নমিনির নাম ও সম্পর্ক', 'Nominee name and relation')}</span><input name="nominee" /></label>
      </div>
      <label className="f"><span>{t('ছবি (ঐচ্ছিক, ৩ MB এর কম)', 'Photo (optional, under 3 MB)')}</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      <SignaturePad label={t('স্বাক্ষর (আঙুল বা মাউস দিয়ে)', 'Signature (with finger or mouse)')} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      <label className="chk"><input type="checkbox" name="agree" required /> <span>{t('আমি সংগঠনের', 'I have read the organisation’s')} <Link href="/terms">{t('শর্তাবলী', 'terms')}</Link> {t('পড়েছি এবং মেনে চলতে অঙ্গীকার করছি।', 'and promise to follow them.')}</span></label>
      <div className="row" style={{ marginTop: 10 }}><Send /><Link className="btn ghost" href="/form">{t('খালি ফর্ম প্রিন্ট', 'Print blank form')}</Link></div>
      <p className="muted small" style={{ marginTop: 12 }}>{t('আগে নিবন্ধন করেছেন?', 'Already registered?')} <Link href="/login"><b>{t('লগইন করুন', 'Log in')}</b></Link></p>
    </form>
  );
}
