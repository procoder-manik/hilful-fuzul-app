'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isValidPassword, normalizeEmail, normalizePhone, PASSWORD_HINT } from '@/lib/auth';
import { createMemberLogin, resetMemberPassword } from '@/lib/members';
import { createAdminClient } from '@/lib/supabase/admin';
import { notify } from '@/lib/notify/send';
import { T } from '@/lib/notify/templates';
import type { Application } from '@/lib/types';
import { errMsg, logActivity, MONEY, num, opt, requireAction, str, type ActionState } from '@/lib/guard';
import { uploadMedia, uploadSignature } from '@/lib/storage';
import { todayBD, monthStart } from '@/lib/dates';
import { fd as fdate, ymLabel } from '@/lib/format';

function memberFields(f: FormData) {
  const phone = normalizePhone(str(f, 'phone'));
  if (!phone) throw new Error('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন');
  const monthly = num(f, 'monthly_amount');
  if (monthly < 10) throw new Error('মাসিক চাঁদা কমপক্ষে ১০ টাকা হতে হবে');
  const emailRaw = str(f, 'email');
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (emailRaw && !email) throw new Error('সঠিক ইমেইল ঠিকানা দিন');
  return {
    name: str(f, 'name'), father_name: opt(f, 'father_name'), mother_name: opt(f, 'mother_name'), email, phone, nid: opt(f, 'nid'), dob: opt(f, 'dob'),
    address: opt(f, 'address'), occupation: opt(f, 'occupation'), nominee: opt(f, 'nominee'),
    monthly_amount: monthly, join_date: str(f, 'join_date') || todayBD(), notes: opt(f, 'notes'),
  };
}

export async function createMember(_: ActionState, f: FormData): Promise<ActionState> {
  let id = '';
  try {
    const { supabase, user } = await requireAction(MONEY);
    const fields = memberFields(f);
    if (!fields.name) return { error: 'নাম দিন' };
    const photo_url = await uploadMedia(supabase, f.get('photo'), 'members');
    const signature_url = await uploadSignature(supabase, str(f, 'signature'), 'members');
    const { data, error } = await supabase.from('members').insert({ ...fields, photo_url, signature_url, verified_at: new Date().toISOString() }).select('id, member_no').single();
    if (error) throw error;
    id = data.id;
    if (f.get('fee_paid')) {
      const { data: s } = await supabase.from('settings').select('reg_fee').eq('id', 1).single();
      await supabase.from('payments').insert({ member_id: id, type: 'registration', amount: s?.reg_fee ?? 200, paid_on: fields.join_date, method: 'নগদ (হাতে)', created_by: user.id });
    }
    const password = str(f, 'password');
    if (password) {
      if (!isValidPassword(password)) throw new Error(`সদস্য তৈরি হয়েছে, কিন্তু লগইন তৈরি হয়নি। ${PASSWORD_HINT}। প্রোফাইল থেকে আবার দিন।`);
      await createMemberLogin(id, fields.phone, password, fields.name, fields.email);
    }
    await logActivity(supabase, user.id, `${fields.name} নতুন সদস্য হিসেবে যুক্ত (${data.member_no})`);
  } catch (e) {
    if (id) redirect(`/admin/members/${id}?warn=${encodeURIComponent(errMsg(e))}`);
    return { error: errMsg(e) };
  }
  revalidatePath('/admin', 'layout');
  redirect(`/admin/members/${id}`);
}

export async function updateMember(id: string, _: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(MONEY);
    const fields = memberFields(f);
    const photo_url = await uploadMedia(supabase, f.get('photo'), 'members');
    const { error } = await supabase.from('members').update({ ...fields, ...(photo_url ? { photo_url } : {}) }).eq('id', id);
    if (error) throw error;
    // লগইনের পরিচয় (ফোন/ইমেইল) মিলিয়ে রাখি
    const { error: pe } = await createAdminClient().from('profiles').update({ phone: fields.phone, email: fields.email, full_name: fields.name }).eq('member_id', id);
    if (pe) throw new Error(/duplicate|unique/i.test(pe.message) ? 'এই ফোন বা ইমেইলে অন্য একটি অ্যাকাউন্ট আছে' : pe.message);
    await logActivity(supabase, user.id, `${fields.name} এর তথ্য হালনাগাদ`);
  } catch (e) {
    return { error: errMsg(e) };
  }
  revalidatePath('/admin', 'layout');
  redirect(`/admin/members/${id}`);
}

async function notifyStatus(memberId: string, kind: 'frozen' | 'reactivated') {
  const admin = createAdminClient();
  const [{ data: m }, { data: s }] = await Promise.all([
    admin.from('members').select('name').eq('id', memberId).single(),
    admin.from('settings').select('org_name, short_name, freeze_months, reg_fee').eq('id', 1).single(),
  ]);
  if (!m || !s) return;
  const org = s.short_name || s.org_name;
  if (kind === 'frozen') await notify({ memberId, kind, key: todayBD(), ...T.frozen({ name: m.name, org, freezeMonths: s.freeze_months, fee: Number(s.reg_fee) }) });
  else await notify({ memberId, kind, ...T.reactivated({ name: m.name, org }) });
}

export async function setMemberStatus(id: string, kind: 'freeze' | 'unfreeze' | 'reactivate', _f: FormData) {
  const { supabase, user } = await requireAction(MONEY);
  const { data: m } = await supabase.from('members').select('name').eq('id', id).single();
  if (kind === 'freeze') {
    await supabase.from('members').update({ status: 'frozen', frozen_at: todayBD() }).eq('id', id);
    await logActivity(supabase, user.id, `${m?.name} এর সদস্যপদ স্থগিত করা হয়েছে`);
    await notifyStatus(id, 'frozen');
  } else {
    const { error } = await supabase.rpc(kind === 'unfreeze' ? 'unfreeze_member' : 'reactivate_member', { p_member: id });
    if (error) throw new Error(error.message);
    await logActivity(supabase, user.id, `${m?.name} ${kind === 'unfreeze' ? 'আনফ্রিজ করা হয়েছে' : 'ফি দিয়ে পুনঃসক্রিয় হয়েছেন'}`);
    await notifyStatus(id, 'reactivated');
  }
  revalidatePath('/admin', 'layout');
}

/** বকেয়া মাসে চাপ দিয়ে দ্রুত সংশোধন: মাসটি পরিশোধিত হিসেবে যোগ হয় */
export async function quickPay(id: string, month: string, _f: FormData) {
  const { supabase, user } = await requireAction(MONEY);
  const { data: m } = await supabase.from('members').select('name, monthly_amount').eq('id', id).single();
  const { error } = await supabase.from('payments').insert({ member_id: id, type: 'monthly', for_month: monthStart(month), amount: m?.monthly_amount, paid_on: todayBD(), method: 'সংশোধন', note: 'পরে এন্ট্রি', created_by: user.id });
  if (error) throw new Error(errMsg(error));
  await logActivity(supabase, user.id, `${m?.name} এর ${ymLabel(month)} মাসের চাঁদা সংশোধন করে যোগ (${fdate(todayBD())})`);
  revalidatePath('/admin', 'layout');
}

/** লগইন তৈরি বা পাসওয়ার্ড রিসেট */
export async function setMemberLogin(id: string, _: ActionState, f: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAction(MONEY);
    const password = str(f, 'password');
    if (!isValidPassword(password)) return { error: PASSWORD_HINT };
    const { data: m } = await supabase.from('members').select('name, phone, email').eq('id', id).single();
    const { data: p } = await supabase.from('profiles').select('id').eq('member_id', id).maybeSingle();
    if (p) await resetMemberPassword(p.id, password);
    else await createMemberLogin(id, m!.phone, password, m!.name, m!.email);
    await logActivity(supabase, user.id, `${m?.name} এর ${p ? 'পাসওয়ার্ড রিসেট' : 'লগইন তৈরি'} করা হয়েছে`);
    revalidatePath(`/admin/members/${id}`);
    return { ok: p ? 'নতুন পাসওয়ার্ড সেট হয়েছে। সদস্যকে জানিয়ে দিন।' : 'লগইন তৈরি হয়েছে। সদস্য এখন মোবাইল নম্বর বা ইমেইল এবং এই পাসওয়ার্ড দিয়ে ঢুকতে পারবেন।', ts: Date.now() };
  } catch (e) {
    return { error: errMsg(e) };
  }
}

export async function deleteMember(id: string, _f: FormData) {
  const { supabase, user } = await requireAction(['admin']);
  const { data: m } = await supabase.from('members').select('name').eq('id', id).single();
  const { count } = await supabase.from('loans').select('id', { count: 'exact', head: true }).eq('member_id', id);
  if (count) throw new Error('এই সদস্যের ঋণের হিসাব আছে, তাই মুছে ফেলা যাবে না। চাইলে স্থগিত করুন।');
  await supabase.from('payments').delete().eq('member_id', id);
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) throw new Error(errMsg(error));
  await logActivity(supabase, user.id, `${m?.name} কে সদস্য তালিকা থেকে মুছে ফেলা হয়েছে`);
  revalidatePath('/admin', 'layout');
  redirect('/admin/members');
}

/* ---------- আবেদন ---------- */
export async function approveApplication(appId: string, _: ActionState, f: FormData): Promise<ActionState> {
  let memberId = '';
  try {
    const { supabase, user } = await requireAction(MONEY);
    const { data } = await supabase.from('applications').select('*').eq('id', appId).single();
    const a = data as Application | null;
    if (!a || a.status !== 'pending') return { error: 'আবেদনটি আর অপেক্ষমাণ নেই' };
    const password = str(f, 'password');
    if (password && !isValidPassword(password)) return { error: PASSWORD_HINT };
    const { data: s } = await supabase.from('settings').select('reg_fee, due_day, org_name, short_name').eq('id', 1).single();
    const fee = num(f, 'fee') || Number(s?.reg_fee ?? 200);
    const trx = opt(f, 'trx');

    const { data: m, error } = await supabase.from('members').insert({
      name: a.name, father_name: a.father_name, mother_name: a.mother_name, email: a.email, phone: a.phone, nid: a.nid, dob: a.dob, address: a.address,
      occupation: a.occupation, nominee: a.nominee, monthly_amount: a.monthly_amount || 50, photo_url: a.photo_url, signature_url: a.signature_url,
      verified_at: new Date().toISOString(),
    }).select('id, member_no').single();
    if (error) throw error;
    memberId = m.id;
    await supabase.from('payments').insert({ member_id: m.id, type: 'registration', amount: fee, paid_on: todayBD(), method: str(f, 'method') || 'নগদ (হাতে)', note: trx ? `ট্রানজ্যাকশন: ${trx}` : null, created_by: user.id });
    await supabase.from('applications').update({ status: 'approved', member_id: m.id }).eq('id', appId);

    const admin = createAdminClient();
    if (a.user_id) {
      // আবেদনকারী নিজের পাসওয়ার্ডেই ঢুকবেন; শুধু অ্যাকাউন্টটিকে সদস্যের সাথে জুড়ে দিই
      await admin.from('profiles').update({ member_id: m.id, phone: a.phone, email: a.email, full_name: a.name }).eq('id', a.user_id);
      await admin.auth.admin.updateUserById(a.user_id, { app_metadata: { role: 'member', member_id: m.id } });
    } else if (password) {
      await createMemberLogin(m.id, a.phone, password, a.name, a.email);
    }
    await logActivity(supabase, user.id, `${a.name} এর আবেদন যাচাই করে অনুমোদিত, সদস্য নম্বর ${m.member_no}`);
    await notify({ memberId: m.id, kind: 'approved', key: m.id, ...T.approved({ name: a.name, org: s?.short_name || s?.org_name || 'সংগঠন', memberNo: m.member_no, monthly: Number(a.monthly_amount || 50), dueDay: s?.due_day ?? 10, fee }) });
  } catch (e) {
    if (memberId) redirect(`/admin/members/${memberId}?warn=${encodeURIComponent(errMsg(e))}`);
    return { error: errMsg(e) };
  }
  revalidatePath('/admin', 'layout');
  redirect(`/admin/members/${memberId}`);
}

export async function rejectApplication(appId: string, _f: FormData) {
  const { supabase, user } = await requireAction(MONEY);
  const { data } = await supabase.from('applications').select('name, user_id, phone, email, status').eq('id', appId).single();
  await supabase.from('applications').update({ status: 'rejected' }).eq('id', appId);
  await logActivity(supabase, user.id, 'একটি সদস্য আবেদন বাতিল করা হয়েছে');
  if (data && data.status === 'pending') {
    const { data: s } = await supabase.from('settings').select('org_name, short_name').eq('id', 1).single();
    await notify({ userId: data.user_id, kind: 'rejected', key: appId, email: data.email, phone: data.phone, ...T.rejected({ name: data.name, org: s?.short_name || s?.org_name || 'সংগঠন' }) });
  }
  revalidatePath('/admin', 'layout');
}

/** এই সদস্যকে ওয়েবসাইটের "আমাদের সদস্য" পাতায় লুকান বা আবার দেখান (SQL 008 লাগে) */
export async function setMemberPublic(id: string, hide: boolean, _f: FormData) {
  const { supabase, user } = await requireAction(MONEY);
  const { data: m } = await supabase.from('members').select('name').eq('id', id).single();
  const { error } = await supabase.from('members').update({ public_hidden: hide }).eq('id', id);
  if (error) throw new Error(/column|schema cache/i.test(error.message) ? 'আগে Supabase এ supabase/migrations/008_public_members.sql চালান' : errMsg(error));
  await logActivity(supabase, user.id, `${m?.name} কে ওয়েবসাইটের সদস্য পাতায় ${hide ? 'লুকানো হয়েছে' : 'দেখানো হচ্ছে'}`);
  revalidatePath('/members');
  revalidatePath(`/admin/members/${id}`);
}
