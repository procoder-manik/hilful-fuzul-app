import { cache } from 'react';
import { createClient } from './supabase/server';
import { translateSettings } from './translate';
import type { Role, Settings } from './types';

const FALLBACK: Settings = {
  id: 1, org_name: 'হিলফুল ফুজুল পাঠাগার ও যুব সংঘ', short_name: 'হিলফুল ফুজুল', tagline: 'পাঠাগার, করজে হাসানা ও সমাজসেবা',
  established: null, address: 'রামচন্দ্রপুর (বাগান), কাহারোল, দিনাজপুর', phone: null, email: null, whatsapp: null, facebook: null, logo_url: null,
  reg_fee: 200, due_day: 10, freeze_months: 3, show_borrower_names: true,
  theme: { skin: 'mango' }, home_sections: [], hero: {}, ticker: [], member_terms: [], loan_terms: [], pay_info: null, quran_info: null,
  header_cfg: {}, footer_cfg: {},
  pay_methods: [], notify_email: true, notify_sms: true, notify_last_run: null,
  chat_enabled: true, chat_provider: 'gemini', chat_model: null, chat_notes: null,
};

/** ডেটাবেসে কোনো ঘর ফাঁকা (null) থাকলে বা সংযোগ না থাকলে পেজ যেন ভেঙে না পড়ে */
function normalize(d: Partial<Settings> | null): Settings {
  if (!d) return FALLBACK;
  return {
    ...FALLBACK, ...d,
    theme: d.theme ?? FALLBACK.theme,
    hero: d.hero ?? FALLBACK.hero,
    home_sections: Array.isArray(d.home_sections) ? d.home_sections : [],
    ticker: Array.isArray(d.ticker) ? d.ticker : [],
    member_terms: Array.isArray(d.member_terms) ? d.member_terms : [],
    loan_terms: Array.isArray(d.loan_terms) ? d.loan_terms : [],
    pay_methods: Array.isArray(d.pay_methods) ? d.pay_methods : [],
    header_cfg: d.header_cfg && typeof d.header_cfg === 'object' ? d.header_cfg : {},
    footer_cfg: d.footer_cfg && typeof d.footer_cfg === 'object' ? d.footer_cfg : {},
  };
}

/** প্রতি রিকোয়েস্টে একবারই ডেটাবেস থেকে সেটিংস পড়ে */
export const getSettings = cache(async (): Promise<Settings> => {
  try {
    const { data } = await createClient().from('settings').select('*').eq('id', 1).single();
    return normalize(data as Partial<Settings> | null);
  } catch {
    return FALLBACK;
  }
});

/** পাবলিক ওয়েবসাইটের জন্য: ভিজিটরের ভাষা অনুযায়ী (ইংরেজি হলে অনূদিত) সেটিংস */
export const getSiteSettings = cache(async (): Promise<Settings> => translateSettings(await getSettings()));

export type SessionProfile = { role: Role; member_id: string | null; full_name: string | null; phone: string | null; email: string | null };

export async function getSessionProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  let { data } = await supabase.from('profiles').select('role, member_id, full_name, phone, email').eq('id', user.id).single();
  if (!data) {
    // ধাপ ৫ এর SQL (004) এখনো না চালানো থাকলে phone/email ঘর নেই; তখনও লগইন ও অ্যাডমিন প্যানেল যেন চলে
    const r = await supabase.from('profiles').select('role, member_id, full_name').eq('id', user.id).single();
    if (r.data) data = { ...r.data, phone: null, email: null };
  }
  return { supabase, user, profile: (data as SessionProfile | null) };
}
