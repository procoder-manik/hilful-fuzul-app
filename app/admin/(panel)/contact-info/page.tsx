import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm, Submit } from '../../_components/ActionForm';
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
        <Link className="btn" href="/contact" target="_blank">যোগাযোগ পাতা দেখুন</Link>
      </PageHead>
      <ActionForm action={saveContactInfo} className="card" style={{ maxWidth: 860 }}>
        <div className="grid g2" style={{ gap: '0 14px' }}>
          <label className="f"><span>প্রধান মোবাইল নম্বর</span><input name="phone" defaultValue={s.phone ?? ''} inputMode="tel" placeholder="01XXXXXXXXX" /></label>
          <label className="f"><span>দ্বিতীয় মোবাইল নম্বর (ঐচ্ছিক)</span><input name="phone2" defaultValue={s.phone2 ?? ''} inputMode="tel" /></label>
          <label className="f"><span>ইমেইল</span><input name="email" type="email" defaultValue={s.email ?? ''} autoCapitalize="none" /></label>
          <label className="f"><span>হোয়াটসঅ্যাপ নম্বর</span><input name="whatsapp" defaultValue={s.whatsapp ?? ''} inputMode="tel" placeholder="01XXXXXXXXX" /></label>
          <label className="f"><span>ফেসবুক পেজের লিংক</span><input name="facebook" defaultValue={s.facebook ?? ''} placeholder="facebook.com/আপনার-পেজ" /></label>
          <label className="f"><span>ইউটিউব চ্যানেলের লিংক</span><input name="youtube" defaultValue={s.youtube ?? ''} placeholder="youtube.com/@আপনার-চ্যানেল" /></label>
        </div>
        <label className="f"><span>ঠিকানা</span><textarea name="address" rows={2} defaultValue={s.address ?? ''} /></label>
        <div className="grid g2" style={{ gap: '0 14px' }}>
          <label className="f"><span>গুগল ম্যাপের লিংক (ম্যাপে লোকেশন খুলে "Share" থেকে কপি করুন)</span><input name="map_url" defaultValue={s.map_url ?? ''} placeholder="https://maps.app.goo.gl/..." /></label>
          <label className="f"><span>অফিসের সময়</span><input name="office_hours" defaultValue={s.office_hours ?? ''} placeholder="প্রতিদিন বাদ আসর থেকে এশা পর্যন্ত, শুক্রবার বন্ধ" /></label>
        </div>
        <p className="muted small">ইংরেজি সংস্করণে এগুলো নিজে থেকে অনুবাদ হয়ে যাবে (এআই চাবি থাকলে)। নম্বর ও লিংক অনুবাদ হয় না।</p>
        <Submit>সংরক্ষণ করুন</Submit>
      </ActionForm>
    </>
  );
}
