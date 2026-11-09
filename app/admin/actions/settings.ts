'use server';
import { revalidatePath } from 'next/cache';
import { ADMIN, errMsg, logActivity, num, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { uploadMedia } from '@/lib/storage';
import { warmTranslations } from '@/lib/translate';
import type { PayMethod } from '@/lib/types';

const KINDS: PayMethod['kind'][] = ['bkash', 'nagad', 'rocket', 'bank', 'cash', 'other'];
/** সেটিংস ফর্মের ৬টি স্লট থেকে পেমেন্টের মাধ্যমের তালিকা */
function payMethods(f: FormData): PayMethod[] {
  const out: PayMethod[] = [];
  for (let i = 0; i < 6; i++) {
    const label = str(f, `pm_label_${i}`);
    if (!label) continue;
    const kind = str(f, `pm_kind_${i}`) as PayMethod['kind'];
    out.push({ kind: KINDS.includes(kind) ? kind : 'other', label: label.slice(0, 80), number: str(f, `pm_number_${i}`).slice(0, 120), note: str(f, `pm_note_${i}`).slice(0, 200) });
  }
  return out;
}
const lines = (f: FormData, k: string) => str(f, k).split('\n').map((x) => x.trim()).filter(Boolean);

export async function saveSettings(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(ADMIN);
    const org = str(f, 'org_name');
    if (!org) return { error: 'সংগঠনের নাম দিন' };
    const due = num(f, 'due_day');
    const freeze = num(f, 'freeze_months');
    if (due < 1 || due > 28) return { error: 'শেষ তারিখ ১ থেকে ২৮ এর মধ্যে দিন' };
    if (freeze < 1 || freeze > 12) return { error: 'ফ্রিজের মাস ১ থেকে ১২ এর মধ্যে দিন' };
    if (str(f, 'chat_notes').length > 8000) return { error: 'চ্যাটবটের অতিরিক্ত তথ্য ৮০০০ অক্ষরের মধ্যে রাখুন' };
    const logo_url = await uploadMedia(supabase, f.get('logo'), 'branding');
    const { error } = await supabase.from('settings').update({
      org_name: org, short_name: opt(f, 'short_name'), tagline: opt(f, 'tagline'), established: opt(f, 'established'),
      address: opt(f, 'address'), phone: opt(f, 'phone'), email: opt(f, 'email'), whatsapp: opt(f, 'whatsapp'), facebook: opt(f, 'facebook'),
      reg_fee: num(f, 'reg_fee'), due_day: due, freeze_months: freeze, show_borrower_names: !!f.get('show_borrower_names'),
      theme: { skin: str(f, 'skin') || 'mango' }, hero: { title: str(f, 'hero_title'), title2: str(f, 'hero_title2'), sub: str(f, 'hero_sub') }, ticker: lines(f, 'ticker'), member_terms: lines(f, 'member_terms'), loan_terms: lines(f, 'loan_terms'),
      chat_enabled: !!f.get('chat_enabled'), chat_provider: str(f, 'chat_provider') === 'openrouter' ? 'openrouter' : 'gemini', chat_model: opt(f, 'chat_model'), chat_notes: opt(f, 'chat_notes'),
      pay_methods: payMethods(f), notify_email: !!f.get('notify_email'), notify_sms: !!f.get('notify_sms'),
      pay_info: opt(f, 'pay_info'), quran_info: opt(f, 'quran_info'), updated_at: new Date().toISOString(),
      ...(logo_url ? { logo_url } : {}),
    }).eq('id', 1);
    if (error) throw error;
    await logActivity(supabase, user.id, 'সংগঠনের সেটিংস হালনাগাদ করা হয়েছে');
    revalidatePath('/', 'layout');
    void warmTranslations();          // ইংরেজি সংস্করণের অনুবাদ আগেভাগে তৈরি (ব্যর্থ হলেও কোনো ক্ষতি নেই)
    return { ok: 'সেটিংস সংরক্ষিত হয়েছে', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

/** সব ওয়েবসাইট-লেখা এখনই ইংরেজিতে অনুবাদ করে ক্যাশে রাখে */
export async function runTranslations(_: ActionState, _f: FormData): Promise<ActionState> {
  try {
    await requireAction(['admin', 'editor']);
    const n = await warmTranslations();
    return { ok: n > 0 ? `${n}টি নতুন লেখা অনুবাদ হয়েছে` : 'নতুন কোনো লেখা অনুবাদের বাকি নেই (অথবা এআই কী যোগ করা হয়নি)', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

/** ওয়েবসাইটের "আমাদের সদস্য" পাতার দুটি সুইচ (SQL 008 লাগে) */
export async function saveMembersPage(_: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(ADMIN);
    const { error } = await supabase.from('settings').update({ members_page_on: !!f.get('members_page_on'), members_show_money: !!f.get('members_show_money') }).eq('id', 1);
    if (error) throw new Error(/column|schema cache/i.test(error.message) ? 'আগে Supabase এ supabase/migrations/008_public_members.sql চালান' : error.message);
    await logActivity(supabase, user.id, 'ওয়েবসাইটের সদস্য পাতার সেটিংস হালনাগাদ করা হয়েছে');
    revalidatePath('/members');
    return { ok: 'সংরক্ষিত হয়েছে', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
