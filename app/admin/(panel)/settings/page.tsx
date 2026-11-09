import type { Metadata } from 'next';
import { ActionForm, Submit } from '../../_components/ActionForm';
import { runTranslations, saveSettings } from '../../actions/settings';
import { ADMIN, requirePage } from '@/lib/guard';
import { PageHead } from '@/lib/ui';
import type { Settings } from '@/lib/types';
import { DEFAULT_MODEL, keyStatus } from '@/lib/chat/llm';
import { emailConfigured, smsConfigured } from '@/lib/notify/send';

export const metadata: Metadata = { title: 'সেটিংস' };
const SKINS = [['mango', 'আমপাতা', '#0e5a43', '#e8b44a'], ['river', 'নদী', '#0b5cad', '#5ac8fa'], ['dusk', 'সন্ধ্যা', '#4b3fb5', '#f0a6ca'], ['harvest', 'হেমন্ত', '#9a4a0b', '#f2c14e']];

export default async function SettingsPage() {
  const { supabase } = await requirePage(ADMIN);
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
  const s = data as Settings;
  const keys = keyStatus();
  const t = (k: keyof Settings, label: string, type = 'text') => (
    <label className="f"><span>{label}</span><input name={k} type={type} defaultValue={(s[k] as string | number | null) ?? ''} /></label>
  );
  return (
    <>
      <PageHead title="সেটিংস" sub="এখানের পরিবর্তন সাথে সাথে পুরো সিস্টেম ও ওয়েবসাইটে প্রযোজ্য হবে" />
      <ActionForm action={saveSettings} className="card" style={{ maxWidth: 900 }}>
        <h2 className="h2">সংগঠনের তথ্য</h2>
        <div className="grid g2" style={{ gap: '0 12px' }}>
          {t('org_name', 'সংগঠনের নাম *')}{t('short_name', 'সংক্ষিপ্ত নাম')}{t('tagline', 'ট্যাগলাইন')}{t('established', 'প্রতিষ্ঠার সাল')}
          {t('address', 'ঠিকানা')}{t('phone', 'ফোন')}{t('email', 'ইমেইল', 'email')}{t('whatsapp', 'হোয়াটসঅ্যাপ')}{t('facebook', 'ফেসবুক পেজ')}
          <label className="f"><span>লোগো {s.logo_url ? '(বদলাতে চাইলে নতুন দিন)' : ''}</span><input name="logo" type="file" accept="image/*" /></label>
        </div>
        <h2 className="h2">সদস্যপদ ও চাঁদা</h2>
        <div className="grid g2" style={{ gap: '0 12px' }}>
          {t('reg_fee', 'ভর্তি ও পুনঃসক্রিয়করণ ফি (৳)', 'number')}{t('due_day', 'প্রতি মাসে চাঁদার শেষ তারিখ (১-২৮)', 'number')}
          {t('freeze_months', 'টানা কত মাস বকেয়ায় স্থগিত হবে', 'number')}
        </div>
        <h3 className="h2">টাকা জমা দেওয়ার মাধ্যম (সদস্য প্রোফাইল, নিবন্ধন পেজ ও চ্যাটবটে দেখাবে)</h3>
        <p className="muted small" style={{ marginTop: 0 }}>বিকাশ, নগদ, রকেট, ব্যাংক হিসাব বা সরাসরি কোষাধ্যক্ষের কাছে। যতটি দরকার ততটি পূরণ করুন, ফাঁকা সারি বাদ যাবে।</p>
        {Array.from({ length: 6 }, (_, i) => {
          const m = s.pay_methods?.[i];
          return (
            <div key={i} className="pmrow">
              <select name={`pm_kind_${i}`} defaultValue={m?.kind ?? 'bkash'} aria-label="মাধ্যম">
                <option value="bkash">বিকাশ</option><option value="nagad">নগদ (মোবাইল ব্যাংকিং)</option><option value="rocket">রকেট</option>
                <option value="bank">ব্যাংক হিসাব</option><option value="cash">সরাসরি কোষাধ্যক্ষকে</option><option value="other">অন্যান্য</option>
              </select>
              <input name={`pm_label_${i}`} defaultValue={m?.label ?? ''} placeholder="নাম, যেমন: বিকাশ (পার্সোনাল)" aria-label="নাম" />
              <input name={`pm_number_${i}`} defaultValue={m?.number ?? ''} placeholder="নম্বর বা হিসাব নং / কোষাধ্যক্ষের নাম" aria-label="নম্বর" />
              <input name={`pm_note_${i}`} defaultValue={m?.note ?? ''} placeholder="নির্দেশনা, যেমন: রেফারেন্সে সদস্য নম্বর লিখুন" aria-label="নির্দেশনা" />
            </div>
          );
        })}
        <label className="f"><span>অন্যান্য পেমেন্টের নির্দেশনা (উপরের তালিকা ফাঁকা থাকলে এই লেখা দেখাবে)</span><textarea name="pay_info" defaultValue={s.pay_info ?? ''} /></label>
        <h3 className="h2">বিজ্ঞপ্তি (চাঁদা জমা, বকেয়া, স্থগিতের সতর্কতা)</h3>
        <label className="chk"><input type="checkbox" name="notify_email" defaultChecked={s.notify_email ?? true} /> <span>ইমেইল ঠিকানা থাকলে ইমেইলে পাঠান</span></label>
        <label className="chk"><input type="checkbox" name="notify_sms" defaultChecked={s.notify_sms ?? true} /> <span>মোবাইল নম্বরে SMS পাঠান</span></label>
        <div className="small muted" style={{ margin: '4px 0 10px' }}>
          ইমেইল পাঠানোর ব্যবস্থা (SMTP): {emailConfigured() ? '✅ চালু' : '❌ নেই'}। SMS গেটওয়ে: {smsConfigured() ? '✅ চালু' : '❌ নেই'}।
          দুটোই `.env.local` ফাইলে বসাতে হয় (README দেখুন)। না থাকলেও অ্যাপের ভেতরে (সদস্যের প্রোফাইলে) বিজ্ঞপ্তি ঠিকই যাবে।
        </div>
        <label className="f"><span>সদস্যপদের শর্তাবলী (প্রতি লাইনে একটি; ফর্ম প্রিন্টে যাবে)</span><textarea name="member_terms" rows={6} defaultValue={s.member_terms.join('\n')} /></label>
        <label className="f"><span>ঋণের শর্তাবলী (প্রতি লাইনে একটি; ঋণের রসিদে যাবে)</span><textarea name="loan_terms" rows={6} defaultValue={s.loan_terms.join('\n')} /></label>
        <h2 className="h2">ওয়েবসাইট</h2>
        <div className="grid g2" style={{ gap: '0 12px' }}>
          <label className="f"><span>হিরো শিরোনাম (১ম লাইন)</span><input name="hero_title" defaultValue={s.hero?.title ?? 'মাদকমুক্ত যুবসমাজ'} /></label>
          <label className="f"><span>হিরো শিরোনাম (২য় লাইন, রঙিন)</span><input name="hero_title2" defaultValue={s.hero?.title2 ?? 'দ্বীনের পথে সুন্দর সমাজ'} /></label>
        </div>
        <label className="f"><span>হিরো বিবরণ</span><textarea name="hero_sub" defaultValue={s.hero?.sub ?? ''} placeholder="ফাঁকা রাখলে ডিফল্ট লেখা দেখাবে" /></label>
        <label className="f"><span>ব্রেকিং নিউজ (প্রতি লাইনে একটি)</span><textarea name="ticker" defaultValue={s.ticker.join('\n')} /></label>
        <label className="f"><span>কুরআন শিক্ষার তথ্য</span><textarea name="quran_info" defaultValue={s.quran_info ?? ''} /></label>
        <h2 className="h2">চ্যাট সহকারী</h2>
        <label className="chk"><input type="checkbox" name="chat_enabled" defaultChecked={s.chat_enabled ?? true} /> <span>ওয়েবসাইটে চ্যাট সহকারী চালু রাখুন</span></label>
        <div className="grid g2" style={{ gap: '0 12px', marginTop: 10 }}>
          <label className="f"><span>এআই সার্ভিস</span>
            <select name="chat_provider" defaultValue={s.chat_provider ?? 'gemini'}>
              <option value="gemini">Google Gemini</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </label>
          <label className="f"><span>মডেলের নাম (ফাঁকা রাখলে ডিফল্ট)</span><input name="chat_model" defaultValue={s.chat_model ?? ''} placeholder={`${DEFAULT_MODEL.gemini} / ${DEFAULT_MODEL.openrouter}`} /></label>
        </div>
        <div className="small muted" style={{ margin: '0 0 10px' }}>
          API কী (.env.local ফাইলে): Gemini {keys.gemini ? '✅ আছে' : '❌ নেই'}, OpenRouter {keys.openrouter ? '✅ আছে' : '❌ নেই'}।
          একটি সার্ভিস ব্যর্থ হলে অন্যটির কী থাকলে সেটি চেষ্টা হবে, কোনোটিই না চললে বট নিজস্ব নিয়মে সাধারণ প্রশ্নের উত্তর দেবে।
        </div>
        <label className="f"><span>বটের অতিরিক্ত তথ্য (এখানে লেখা তথ্য বট সবাইকে বলবে; এটি ওয়েবসাইটের ডেটাবেসে সবার জন্য উন্মুক্ত থাকে, তাই কোনো গোপন তথ্য লিখবেন না)</span><textarea name="chat_notes" rows={6} defaultValue={s.chat_notes ?? ''} placeholder="যেমন: কুরআন শিক্ষা সপ্তাহে শনি, রবি, সোম ও মঙ্গলবার বিকাল ৪টায়।" /></label>
        <span className="lbl">থিম</span>
        <div className="row" style={{ margin: '8px 0 14px' }}>
          {SKINS.map(([k, n, a, b]) => (
            <label key={k} style={{ textAlign: 'center', cursor: 'pointer' }}>
              <input type="radio" name="skin" value={k} defaultChecked={(s.theme?.skin ?? 'mango') === k} />
              <span style={{ display: 'block', width: 64, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${a} 60%, ${b} 60%)` }} />
              <span className="small">{n}</span>
            </label>
          ))}
        </div>
        <label className="chk"><input type="checkbox" name="show_borrower_names" defaultChecked={s.show_borrower_names} /> <span>ওয়েবসাইটে ঋণগ্রহীতার পূর্ণ নাম দেখান (বন্ধ করলে নামের শেষ অংশ লুকানো থাকবে)</span></label>
        <Submit>সেটিংস সংরক্ষণ করুন</Submit>
      </ActionForm>
      <ActionForm action={runTranslations} className="card" style={{ maxWidth: 900, marginTop: 16 }}>
        <h2 className="h2" style={{ marginTop: 0 }}>ইংরেজি সংস্করণ</h2>
        <p className="muted small">ওয়েবসাইটের ইংরেজি সংস্করণে সংবাদ, অনুষ্ঠান, সেবা, কমিটি ও সেটিংসের লেখা এআই দিয়ে অনুবাদ হয় এবং একবার অনুবাদ হলে সংরক্ষিত থাকে। কিছু সম্পাদনা করলে নিজে থেকেই অনুবাদ হয়ে যায়। চাইলে এখনই সব অনুবাদ করে রাখুন।</p>
        <Submit className="btn" pendingText="অনুবাদ হচ্ছে... (একটু সময় লাগবে)">এখনই ইংরেজিতে অনুবাদ করুন</Submit>
      </ActionForm>
    </>
  );
}
