import type { Metadata } from 'next';
import { ActionForm, Submit } from '../../_components/ActionForm';
import { Bi, Fld, Info, Sec, Tick } from '../../_components/Fld';
import { runTranslations, saveMembersPage, saveSettings } from '../../actions/settings';
import { ADMIN, requirePage } from '@/lib/guard';
import { PageHead } from '@/lib/ui';
import type { Settings } from '@/lib/types';
import { DEFAULT_MODEL, keyStatus } from '@/lib/chat/llm';
import { emailConfigured, smsConfigured } from '@/lib/notify/send';

export const metadata: Metadata = { title: 'সেটিংস' };
const SKINS = [['mango', 'আমপাতা', 'Mango green', '#0e5a43', '#e8b44a'], ['river', 'নদী', 'River blue', '#0b5cad', '#5ac8fa'], ['dusk', 'সন্ধ্যা', 'Dusk purple', '#4b3fb5', '#f0a6ca'], ['harvest', 'হেমন্ত', 'Harvest brown', '#9a4a0b', '#f2c14e']];

export default async function SettingsPage() {
  const { supabase } = await requirePage(ADMIN);
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
  const s = data as Settings;
  const keys = keyStatus();
  const t = (k: keyof Settings, bn: string, en: string, info: string, type = 'text') => (
    <Fld bn={bn} en={en} info={info}><input name={k} type={type} defaultValue={(s[k] as string | number | null) ?? ''} /></Fld>
  );
  return (
    <>
      <PageHead title="সেটিংস" sub="এখানের পরিবর্তন সাথে সাথে পুরো সিস্টেম ও ওয়েবসাইটে প্রযোজ্য হবে। প্রতিটি ঘরের নিচে লেখা আছে সেটি দিয়ে কী হবে।" />
      <ActionForm action={saveSettings} className="card" style={{ maxWidth: 960 }}>
        <Sec first id="set-org" bn="সংগঠনের তথ্য" en="Organization info" info="ওয়েবসাইট, রসিদ, ফর্ম, ইমেইল ও SMS এ সংগঠনের পরিচয় হিসেবে এই তথ্য ব্যবহার হয়।" />
        <div className="grid g2" style={{ gap: '0 12px', marginTop: 12 }}>
          {t('org_name', 'সংগঠনের নাম *', 'Organization name', 'হেডার, ফুটার, প্রিন্ট করা রসিদ ও ফর্ম, ইমেইল এবং গুগল সার্চে পুরো নাম হিসেবে দেখায়। ফাঁকা রাখা যাবে না।')}
          {t('short_name', 'সংক্ষিপ্ত নাম', 'Short name', 'মোবাইলের ছোট হেডার, SMS ও বিজ্ঞপ্তিতে পুরো নামের বদলে এটি দেখায়।')}
          {t('tagline', 'ট্যাগলাইন', 'Tagline', 'লোগোর নিচে এক লাইনের পরিচয় হিসেবে দেখায়, যেমন: পাঠাগার, করজে হাসানা ও সমাজসেবা।')}
          {t('established', 'প্রতিষ্ঠার সাল', 'Established year', 'হোমপেজের "২০১৫ সাল থেকে এলাকার সেবায়" ব্যাজে এবং "আমাদের কথা" পাতায় দেখায়।')}
          {t('address', 'ঠিকানা', 'Address', 'ফুটার, যোগাযোগ পাতা এবং প্রিন্ট করা রসিদ ও ফর্মের মাথায় ছাপা হয়। (যোগাযোগের তথ্য পাতা থেকেও বদলানো যায়।)')}
          {t('phone', 'ফোন', 'Phone', 'ফুটার, যোগাযোগ পাতা, রসিদ ও চ্যাটবটে দেখায়।')}
          {t('email', 'ইমেইল', 'Email', 'ফুটার ও যোগাযোগ পাতায় দেখায়; পাঠানো ইমেইলের উত্তর দেওয়ার ঠিকানা হিসেবেও কাজে লাগে।', 'email')}
          {t('whatsapp', 'হোয়াটসঅ্যাপ', 'WhatsApp', 'ফুটারে "হোয়াটসঅ্যাপে লিখুন" বাটন এবং স্থগিত/বকেয়া সদস্যদের বার্তা পাঠানোর বাটনে ব্যবহার হয়।')}
          {t('facebook', 'ফেসবুক পেজ', 'Facebook page', 'ফুটারের সোশ্যাল লিংকে দেখায়। পুরো লিংক দিন, যেমন facebook.com/আপনার-পেজ।')}
          <Fld bn={<>লোগো {s.logo_url ? '(বদলাতে চাইলে নতুন দিন)' : ''}</>} en="Logo" info="হেডার, ফুটার, প্রিন্ট করা রসিদ ও ফর্মে লোগো হিসেবে বসে। JPG, PNG বা WebP, ৩ MB এর কম। SVG চলবে না।"><input name="logo" type="file" accept="image/*" /></Fld>
        </div>

        <Sec id="set-membership" bn="সদস্যপদ ও চাঁদা" en="Membership & dues" info="সদস্য কত টাকা দিয়ে ভর্তি হবেন, কবে পর্যন্ত চাঁদা দিতে হবে এবং বকেয়া থাকলে কী হবে, এখান থেকে ঠিক হয়।" />
        <div className="grid g2" style={{ gap: '0 12px', marginTop: 12 }}>
          {t('reg_fee', 'ভর্তি ও পুনঃসক্রিয়করণ ফি (৳)', 'Joining & reactivation fee', 'নতুন সদস্য ভর্তি হতে এবং স্থগিত সদস্য আবার সক্রিয় হতে এই টাকা দিতে হয়। নিবন্ধন পেজ, সদস্যের প্রোফাইল, প্রিন্ট ফর্ম ও চ্যাটবটে এই অঙ্ক দেখায়।', 'number')}
          {t('due_day', 'প্রতি মাসে চাঁদার শেষ তারিখ (১-২৮)', 'Monthly due day', 'এই তারিখের মধ্যে চাঁদা না দিলে ওই মাস "বকেয়া" ধরা হয়। শেষ তারিখের ৩ দিন আগে স্মরণ-বার্তাও এই তারিখ ধরে যায়।', 'number')}
          {t('freeze_months', 'টানা কত মাস বকেয়ায় স্থগিত হবে', 'Auto-freeze after overdue months', 'টানা এতগুলো মাস চাঁদা বকেয়া থাকলে সদস্যপদ প্রতিদিন নিজে থেকে "স্থগিত" হয়ে যায়। সদস্য ভর্তি ফি দিলে আবার সক্রিয় হন।', 'number')}
        </div>

        <Sec id="set-pay" bn="টাকা জমা দেওয়ার মাধ্যম" en="Payment methods" info="বিকাশ, নগদ, রকেট, ব্যাংক হিসাব বা সরাসরি কোষাধ্যক্ষের কাছে। এগুলো নিবন্ধন ফর্ম, সদস্যের প্রোফাইল ও চ্যাটবটে দেখায় এবং সদস্য নম্বরে চাপলেই কপি করতে পারেন। যতটি দরকার ততটি পূরণ করুন, ফাঁকা সারি বাদ যাবে।" />
        <div className="pmhead" style={{ marginTop: 12 }}>
          <span>মাধ্যম (Method)</span><span>নাম (Label)</span><span>নম্বর (Number)</span><span>নির্দেশনা (Note)</span>
        </div>
        {Array.from({ length: 6 }, (_, i) => {
          const m = s.pay_methods?.[i];
          return (
            <div key={i} className="pmrow">
              <select name={`pm_kind_${i}`} defaultValue={m?.kind ?? 'bkash'} aria-label="মাধ্যম (Method)">
                <option value="bkash">বিকাশ (bKash)</option><option value="nagad">নগদ (Nagad)</option><option value="rocket">রকেট (Rocket)</option>
                <option value="bank">ব্যাংক হিসাব (Bank)</option><option value="cash">সরাসরি কোষাধ্যক্ষকে (Cash)</option><option value="other">অন্যান্য (Other)</option>
              </select>
              <input name={`pm_label_${i}`} defaultValue={m?.label ?? ''} placeholder="নাম, যেমন: বিকাশ পার্সোনাল (Name)" aria-label="নাম (Label)" />
              <input name={`pm_number_${i}`} defaultValue={m?.number ?? ''} placeholder="নম্বর বা হিসাব নং (Number)" aria-label="নম্বর (Number)" />
              <input name={`pm_note_${i}`} defaultValue={m?.note ?? ''} placeholder="যেমন: রেফারেন্সে নাম লিখুন (Note)" aria-label="নির্দেশনা (Note)" />
            </div>
          );
        })}
        <Fld bn="অন্যান্য পেমেন্টের নির্দেশনা" en="Other payment instructions" info="উপরের তালিকা পুরো ফাঁকা থাকলে শুধু তখনই এই লেখা নিবন্ধন পেজ ও প্রোফাইলে দেখাবে।" style={{ marginTop: 10 }}><textarea name="pay_info" defaultValue={s.pay_info ?? ''} /></Fld>

        <Sec id="set-notify" bn="বিজ্ঞপ্তি" en="Notifications" info="চাঁদা জমা, বকেয়া ও স্থগিতের সতর্কতা সদস্যের কাছে কোন পথে যাবে তা ঠিক করুন। অ্যাপের ভেতরে (প্রোফাইলের বিজ্ঞপ্তি অংশে) সবসময়ই যায়।" />
        <Tick name="notify_email" defaultChecked={s.notify_email ?? true} bn="ইমেইল ঠিকানা থাকলে ইমেইলে পাঠান" en="Send by email" info="সদস্য নিবন্ধনে ইমেইল দিলে তার ইমেইলেও বার্তা যাবে। চালু থাকলেও নিচের SMTP ব্যবস্থা না থাকলে ইমেইল যাবে না।" />
        <Tick name="notify_sms" defaultChecked={s.notify_sms ?? true} bn="মোবাইল নম্বরে SMS পাঠান" en="Send by SMS" info="প্রতিটি সদস্যের মোবাইল নম্বরে SMS যাবে। এর জন্য একটি পেইড SMS সেবা লাগে এবং প্রতিটি SMS এ টাকা খরচ হয়।" />
        <div className="small muted" style={{ margin: '4px 0 10px' }}>
          ইমেইল পাঠানোর ব্যবস্থা (SMTP): {emailConfigured() ? '✅ চালু (Ready)' : '❌ নেই (Not set)'}। SMS গেটওয়ে (SMS gateway): {smsConfigured() ? '✅ চালু (Ready)' : '❌ নেই (Not set)'}।
          দুটোই `.env.local` ফাইলে বসাতে হয় (README দেখুন)। না থাকলেও অ্যাপের ভেতরে বিজ্ঞপ্তি ঠিকই যাবে।
        </div>
        <Fld bn="সদস্যপদের শর্তাবলী (প্রতি লাইনে একটি)" en="Membership terms" info="নিবন্ধন পেজের ডানে, /terms পাতায় এবং প্রিন্ট করা সদস্য ফর্মে শর্ত হিসেবে ছাপা হয়।"><textarea name="member_terms" rows={6} defaultValue={s.member_terms.join('\n')} /></Fld>
        <Fld bn="ঋণের শর্তাবলী (প্রতি লাইনে একটি)" en="Loan terms" info="করজে হাসানা ঋণের প্রিন্ট করা রসিদে শর্ত হিসেবে ছাপা হয়।"><textarea name="loan_terms" rows={6} defaultValue={s.loan_terms.join('\n')} /></Fld>

        <Sec id="set-website" bn="ওয়েবসাইট" en="Website" info="হোমপেজের একদম ওপরের অংশ (হিরো), চলমান সংবাদ-পট্টি ও কুরআন শিক্ষার তথ্য এখান থেকে বদলায়।" />
        <div className="grid g2" style={{ gap: '0 12px', marginTop: 12 }}>
          <Fld bn="হিরো শিরোনাম (১ম লাইন)" en="Hero title, line 1" info="হোমপেজের সবচেয়ে বড় লেখার প্রথম লাইন।"><input name="hero_title" defaultValue={s.hero?.title ?? 'মাদকমুক্ত যুবসমাজ'} /></Fld>
          <Fld bn="হিরো শিরোনাম (২য় লাইন, রঙিন)" en="Hero title, line 2" info="ঠিক নিচের লাইন, থিমের রঙে আলাদা করে দেখায়।"><input name="hero_title2" defaultValue={s.hero?.title2 ?? 'দ্বীনের পথে সুন্দর সমাজ'} /></Fld>
        </div>
        <Fld bn="হিরো বিবরণ" en="Hero description" info="শিরোনামের নিচে ছোট করে সংগঠনের পরিচয়। ফাঁকা রাখলে ডিফল্ট লেখা দেখাবে।"><textarea name="hero_sub" defaultValue={s.hero?.sub ?? ''} placeholder="ফাঁকা রাখলে ডিফল্ট লেখা দেখাবে" /></Fld>
        <Fld bn="ব্রেকিং নিউজ (প্রতি লাইনে একটি)" en="News ticker" info="ওয়েবসাইটের ওপরে ডান থেকে বামে চলতে থাকা খবরের পট্টি। জরুরি ঘোষণা বা অনুষ্ঠানের তারিখ দিতে পারেন।"><textarea name="ticker" defaultValue={s.ticker.join('\n')} /></Fld>
        <Fld bn="কুরআন শিক্ষার তথ্য" en="Quran class info" info="হোমপেজের পাঠাগার অংশের নিচে এবং চ্যাটবটে দেখায়, যেমন ক্লাসের সময় ও দিন।"><textarea name="quran_info" defaultValue={s.quran_info ?? ''} /></Fld>

        <Sec id="set-chat" bn="চ্যাট সহকারী" en="Chat assistant" info="ওয়েবসাইটের নিচের ডানদিকের সবুজ চ্যাট বাটন। দর্শক ও সদস্যদের সাধারণ প্রশ্নের উত্তর নিজে থেকে দেয়।" />
        <Tick name="chat_enabled" defaultChecked={s.chat_enabled ?? true} bn="ওয়েবসাইটে চ্যাট সহকারী চালু রাখুন" en="Enable chat assistant" info="বন্ধ করলে ওয়েবসাইট থেকে চ্যাট বাটনটি সরে যাবে।" />
        <div className="grid g2" style={{ gap: '0 12px', marginTop: 10 }}>
          <Fld bn="এআই সার্ভিস" en="AI provider" info="কোন কোম্পানির এআই দিয়ে বট উত্তর দেবে। একটি ব্যর্থ হলে অন্যটির কী থাকলে সেটি চেষ্টা হবে।">
            <select name="chat_provider" defaultValue={s.chat_provider ?? 'gemini'}>
              <option value="gemini">Google Gemini</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </Fld>
          <Fld bn="মডেলের নাম (ফাঁকা রাখলে ডিফল্ট)" en="Model name" info="কোন এআই মডেল ব্যবহার হবে। ভালো না জানলে ফাঁকা রাখুন।"><input name="chat_model" defaultValue={s.chat_model ?? ''} placeholder={`${DEFAULT_MODEL.gemini} / ${DEFAULT_MODEL.openrouter}`} /></Fld>
        </div>
        <div className="small muted" style={{ margin: '0 0 10px' }}>
          API কী (API key, .env.local ফাইলে): Gemini {keys.gemini ? '✅ আছে' : '❌ নেই'}, OpenRouter {keys.openrouter ? '✅ আছে' : '❌ নেই'}।
          কোনোটিই না চললে বট নিজস্ব নিয়মে সাধারণ প্রশ্নের উত্তর দেবে।
        </div>
        <Fld bn="বটের অতিরিক্ত তথ্য" en="Extra info for the bot" info="এখানে লেখা তথ্য বট সবাইকে বলবে। এটি ডেটাবেসে সবার জন্য উন্মুক্ত থাকে, তাই কোনো গোপন তথ্য লিখবেন না।"><textarea name="chat_notes" rows={6} defaultValue={s.chat_notes ?? ''} placeholder="যেমন: কুরআন শিক্ষা সপ্তাহে শনি, রবি, সোম ও মঙ্গলবার বিকাল ৪টায়।" /></Fld>

        <Sec id="set-look" bn="চেহারা ও গোপনীয়তা" en="Look & privacy" info="পুরো ওয়েবসাইটের মূল রং এবং ঋণগ্রহীতাদের নাম প্রকাশের নিয়ম।" />
        <span className="lbl" style={{ marginTop: 12 }}><Bi bn="থিম" en="Theme colour" /></span>
        <div className="row" style={{ margin: '8px 0 4px' }}>
          {SKINS.map(([k, n, e, a, b]) => (
            <label key={k} style={{ textAlign: 'center', cursor: 'pointer' }}>
              <input type="radio" name="skin" value={k} defaultChecked={(s.theme?.skin ?? 'mango') === k} />
              <span style={{ display: 'block', width: 64, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${a} 60%, ${b} 60%)` }} />
              <span className="small">{n}</span><span className="en-hint" style={{ display: 'block', textAlign: 'center' }}>({e})</span>
            </label>
          ))}
        </div>
        <Info>বোতাম, লিংক, চার্ট ও হেডারে এই রং ব্যবহার হয়। বেছে নিয়ে সংরক্ষণ করলে পুরো ওয়েবসাইটের রং বদলে যাবে।</Info>
        <Tick name="show_borrower_names" defaultChecked={s.show_borrower_names} bn="ওয়েবসাইটে ঋণগ্রহীতার পূর্ণ নাম দেখান" en="Show borrower full names" info="বন্ধ করলে ওয়েবসাইটের স্বচ্ছতার খাতায় নামের শেষ অংশ লুকানো থাকবে, গোপনীয়তা বাড়বে।" />
        <Submit>সেটিংস সংরক্ষণ করুন</Submit>
      </ActionForm>

      <ActionForm action={saveMembersPage} className="card" style={{ maxWidth: 960, marginTop: 16 }}>
        <Sec first id="set-members" bn="ওয়েবসাইটের সদস্য পাতা" en="Public members page" info="ওয়েবসাইটের /members পাতায় সদস্যদের কার্ড দেখায়; কার্ডে চাপলে পপআপে বিস্তারিত আসে। ফোন, এনআইডি, ঠিকানা ও ইমেইল কখনোই প্রকাশ হয় না। (আগে SQL 008 চালাতে হবে।)" />
        <Tick name="members_page_on" defaultChecked={(s.members_page_on ?? true) as boolean} bn="সদস্য পাতা চালু রাখুন" en="Show members page" info="বন্ধ করলে /members পাতা আর খুলবে না এবং কার্ডগুলো লুকিয়ে যাবে।" />
        <Tick name="members_show_money" defaultChecked={(s.members_show_money ?? true) as boolean} bn="পপআপে টাকার অঙ্ক দেখান" en="Show money amounts" info="বন্ধ করলে মাসিক চাঁদা, মোট জমা ও ঋণের অঙ্ক পপআপে “প্রকাশিত নয়” লেখা আসবে। সদস্যদের গোপনীয়তার জন্য বন্ধ রাখা নিরাপদ। কোনো একজনকে লুকাতে তার প্রোফাইল থেকে “ওয়েবসাইটে লুকান” চাপুন।" />
        <Submit>সংরক্ষণ করুন (Save)</Submit>
      </ActionForm>
      <ActionForm action={runTranslations} className="card" style={{ maxWidth: 960, marginTop: 16 }}>
        <h2 className="h2" style={{ marginTop: 0 }}><Bi bn="ইংরেজি সংস্করণ" en="English version" /></h2>
        <p className="muted small">ওয়েবসাইটের ইংরেজি সংস্করণে সংবাদ, অনুষ্ঠান, সেবা, কমিটি ও সেটিংসের লেখা এআই দিয়ে অনুবাদ হয় এবং একবার অনুবাদ হলে সংরক্ষিত থাকে। কিছু সম্পাদনা করলে নিজে থেকেই অনুবাদ হয়ে যায়। চাইলে এখনই সব অনুবাদ করে রাখুন। (এআই কী লাগবে।)</p>
        <Submit className="btn" pendingText="অনুবাদ হচ্ছে... (একটু সময় লাগবে)">এখনই ইংরেজিতে অনুবাদ করুন (Translate now)</Submit>
      </ActionForm>
    </>
  );
}
