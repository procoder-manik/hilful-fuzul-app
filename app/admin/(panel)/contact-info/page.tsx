import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm, Submit } from '../../_components/ActionForm';
import { Fld } from '../../_components/Fld';
import { saveContactInfo } from '../../actions/contactinfo';
import { requirePage } from '@/lib/guard';
import { PageHead } from '@/lib/ui';
import type { Settings } from '@/lib/types';

export const metadata: Metadata = { title: 'যোগাযোগের তথ্য' };

export default async function ContactInfo() {
  const { supabase } = await requirePage(['admin', 'editor']);
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
  const s = (data ?? {}) as Settings;
  return (
    <>
      <PageHead title="যোগাযোগের তথ্য" sub="এখানে যা লিখবেন তা হেডারের টপবার, ফুটার, যোগাযোগ পাতা ও চ্যাটবট সবখানে একসাথে বদলে যাবে।">
        <Link className="btn" href="/contact" target="_blank">যোগাযোগ পাতা দেখুন (View contact page)</Link>
      </PageHead>
      <ActionForm action={saveContactInfo} className="card" style={{ maxWidth: 860 }}>
        <div className="grid g2" style={{ gap: '0 14px' }}>
          <Fld bn="প্রধান মোবাইল নম্বর" en="Main phone" info="হেডারের টপবার, ফুটার, যোগাযোগ পাতা, রসিদ ও চ্যাটবটে প্রধান নম্বর হিসেবে দেখায়। নম্বরে চাপলে মোবাইলে কল হয়।"><input name="phone" defaultValue={s.phone ?? ''} inputMode="tel" placeholder="01XXXXXXXXX" /></Fld>
          <Fld bn="দ্বিতীয় মোবাইল নম্বর (ঐচ্ছিক)" en="Second phone" info="প্রধান নম্বর বন্ধ থাকলে যোগাযোগের বিকল্প। ফুটার ও যোগাযোগ পাতায় প্রধান নম্বরের পাশে দেখায়।"><input name="phone2" defaultValue={s.phone2 ?? ''} inputMode="tel" /></Fld>
          <Fld bn="ইমেইল" en="Email" info="যোগাযোগ পাতা, ফুটার ও টপবারে দেখায়। চাপলে ইমেইল অ্যাপ খুলবে।"><input name="email" type="email" defaultValue={s.email ?? ''} autoCapitalize="none" /></Fld>
          <Fld bn="হোয়াটসঅ্যাপ নম্বর" en="WhatsApp number" info="ফুটারে হোয়াটসঅ্যাপ বাটন তৈরি করে এবং স্থগিত/বকেয়া সদস্যদের হোয়াটসঅ্যাপে বার্তা পাঠানোর বাটনে কাজে লাগে।"><input name="whatsapp" defaultValue={s.whatsapp ?? ''} inputMode="tel" placeholder="01XXXXXXXXX" /></Fld>
          <Fld bn="ফেসবুক পেজের লিংক" en="Facebook page link" info="ফুটারের সোশ্যাল বাটনে ফেসবুক আইকন হিসেবে দেখায়।"><input name="facebook" defaultValue={s.facebook ?? ''} placeholder="facebook.com/আপনার-পেজ" /></Fld>
          <Fld bn="ইউটিউব চ্যানেলের লিংক" en="YouTube channel link" info="ফুটারের সোশ্যাল বাটনে ইউটিউব আইকন হিসেবে দেখায়। ফাঁকা রাখলে বাটন আসবে না।"><input name="youtube" defaultValue={s.youtube ?? ''} placeholder="youtube.com/@আপনার-চ্যানেল" /></Fld>
        </div>
        <Fld bn="ঠিকানা" en="Address" info="ফুটার, যোগাযোগ পাতা এবং প্রিন্ট করা রসিদ ও ফর্মের মাথায় ছাপা হয়।"><textarea name="address" rows={2} defaultValue={s.address ?? ''} /></Fld>
        <div className="grid g2" style={{ gap: '0 14px' }}>
          <Fld bn={'গুগল ম্যাপের লিংক'} en="Google Maps link" info={'ম্যাপে লোকেশন খুলে "Share" থেকে লিংক কপি করুন। ঠিকানায় চাপলে গুগল ম্যাপ খুলবে।'}><input name="map_url" defaultValue={s.map_url ?? ''} placeholder="https://maps.app.goo.gl/..." /></Fld>
          <Fld bn="অফিসের সময়" en="Office hours" info="যোগাযোগ পাতা, ফুটার ও চ্যাটবটে দেখায়, যাতে কেউ বন্ধের সময় এসে ফিরে না যান।"><input name="office_hours" defaultValue={s.office_hours ?? ''} placeholder="প্রতিদিন বাদ আসর থেকে এশা পর্যন্ত, শুক্রবার বন্ধ" /></Fld>
        </div>
        <p className="muted small">ইংরেজি সংস্করণে এগুলো নিজে থেকে অনুবাদ হয়ে যাবে (এআই চাবি থাকলে)। নম্বর ও লিংক অনুবাদ হয় না।</p>
        <Submit>সংরক্ষণ করুন (Save)</Submit>
      </ActionForm>
    </>
  );
}
