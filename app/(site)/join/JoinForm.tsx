'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { SignaturePad } from '@/app/admin/_components/SignaturePad';
import { registerAccount, type RegisterState } from './actions';
import { useT } from '@/components/LangProvider';
import { PayMethods } from '@/components/PayMethods';
import type { PayMethod } from '@/lib/types';

function Send() {
  const { t } = useT();
  const { pending } = useFormStatus();
  return <button className="btn pri lg" disabled={pending}>{pending ? t('নিবন্ধন হচ্ছে...', 'Registering...') : t('নিবন্ধন করুন', 'Register')}</button>;
}

export function JoinForm({ fee, payList, payInfo }: { fee: number; payList: PayMethod[]; payInfo: string | null }) {
  const { t, bn } = useT();
  const [show, setShow] = useState(false);
  const [method, setMethod] = useState('');
  const cash = method.startsWith('হাতে নগদ');
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
        <label className="f"><span>{t('ইমেইল *', 'Email *')}</span><input name="email" type="email" required inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="name@email.com" /></label>
        <label className="f"><span>{t('পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)', 'Password * (at least 6 characters)')}</span><div className="pw"><input name="password" type={show ? 'text' : 'password'} minLength={6} required autoComplete="new-password" /><button type="button" className="pw-t" onClick={() => setShow((v) => !v)}>{show ? t('লুকান', 'Hide') : t('দেখান', 'Show')}</button></div></label>
        <label className="f"><span>{t('পাসওয়ার্ড আবার লিখুন *', 'Repeat password *')}</span><input name="password2" type={show ? 'text' : 'password'} minLength={6} required autoComplete="new-password" /></label>
      </div>
      <p className="muted small" style={{ marginTop: -4 }}>{t('আপনার ইমেইল ও পাসওয়ার্ড দিয়েই লগইন করবেন। সব বিজ্ঞপ্তি, যাচাইয়ের কোড ও পাসওয়ার্ড রিসেট এই ইমেইলে আসবে। মোবাইল নম্বর শুধু যোগাযোগের জন্য।', 'You will log in with your email and password. All notices, verification codes and password resets come to this email. Your mobile number is only for contact.')}</p>

      <h3 className="h2">{t('সদস্যপদ', 'Membership')}</h3>
      <div className="grid g2" style={{ gap: '0 12px' }}>
        <label className="f"><span>{t('মাসিক চাঁদা *', 'Monthly contribution *')}</span><select name="monthly_amount" defaultValue="100">{[50, 100, 200, 500, 1000].map((v) => <option key={v} value={v}>৳{bn(v)}</option>)}</select></label>
        <label className="f"><span>{t('নমিনির নাম ও সম্পর্ক', 'Nominee name and relation')}</span><input name="nominee" /></label>
      </div>
      <h3 className="h2">{t('ভর্তি ফি জমা (ঐচ্ছিক, এখনই বা পরে প্রোফাইল থেকেও জানানো যায়)', 'Joining fee payment (optional, you can also do it later from your profile)')}</h3>
      <div className="pay-box">
        <div className="pay-amt"><span>{t('ভর্তি ফি', 'Joining fee')}</span><b>৳{bn(fee)}</b></div>
        <p className="muted small" style={{ margin: '8px 0 10px' }}>{t('নিচের যেকোনো একটি নম্বরে টাকা পাঠান, তারপর কোন মাধ্যমে পাঠালেন এবং ট্রানজ্যাকশন আইডি (TrxID) নিচের ঘরে লিখুন। কমিটি মিলিয়ে দেখে আপনাকে যাচাইকৃত সদস্য করবে।', 'Send the amount to any number below, then choose the method you used and type the transaction ID (TrxID) in the boxes below. The committee will match it and verify you as a member.')}</p>
        <PayMethods list={payList} fallback={payInfo} />
        <div className="grid g2" style={{ gap: '0 12px', marginTop: 12 }}>
          <label className="f"><span>{t('কোন মাধ্যমে পাঠালেন', 'Payment method used')}</span>
            <select name="pay_method" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">{t('এখনো পাঠাইনি, পরে জানাব', 'Not paid yet, I will tell later')}</option>
              <option value="বিকাশ">{t('বিকাশ', 'bKash')}</option><option value="নগদ">{t('নগদ', 'Nagad')}</option><option value="রকেট">{t('রকেট', 'Rocket')}</option>
              <option value="ব্যাংক">{t('ব্যাংক', 'Bank')}</option><option value="হাতে নগদ (কোষাধ্যক্ষকে)">{t('হাতে নগদ (কোষাধ্যক্ষকে)', 'Cash to the treasurer')}</option>
            </select></label>
          <label className="f"><span>{t('ট্রানজ্যাকশন আইডি (TrxID)', 'Transaction ID (TrxID)')}{method && !cash ? ' *' : ''}</span>
            <input name="pay_trx" disabled={!method || cash} required={!!method && !cash} autoCapitalize="characters" autoComplete="off" maxLength={40} placeholder={!method ? t('আগে মাধ্যম বেছে নিন', 'Choose a method first') : cash ? t('হাতে নগদে লাগবে না', 'Not needed for cash') : t('যেমন: 9K4L2M8P1Q', 'e.g. 9K4L2M8P1Q')} /></label>
        </div>
      </div>
      <label className="f"><span>{t('ছবি (ঐচ্ছিক, ৩ MB এর কম)', 'Photo (optional, under 3 MB)')}</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      <SignaturePad label={t('স্বাক্ষর (আঙুল বা মাউস দিয়ে)', 'Signature (with finger or mouse)')} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      <label className="chk"><input type="checkbox" name="agree" required /> <span>{t('আমি সংগঠনের', 'I have read the organisation’s')} <Link href="/terms">{t('শর্তাবলী', 'terms')}</Link> {t('পড়েছি এবং মেনে চলতে অঙ্গীকার করছি।', 'and promise to follow them.')}</span></label>
      <div className="row" style={{ marginTop: 10 }}><Send /><Link className="btn ghost" href="/form">{t('খালি ফর্ম প্রিন্ট', 'Print blank form')}</Link></div>
      <p className="muted small" style={{ marginTop: 8 }}>{t('নিবন্ধনের পর আপনার পূরণ করা ফর্মটি প্রোফাইল থেকে এক ক্লিকে প্রিন্ট বা PDF করতে পারবেন।', 'After registering you can print or save your filled form as a PDF from your profile in one click.')}</p>
      <p className="muted small" style={{ marginTop: 12 }}>{t('আগে নিবন্ধন করেছেন?', 'Already registered?')} <Link href="/login"><b>{t('লগইন করুন', 'Log in')}</b></Link></p>
    </form>
  );
}
