import type { Metadata } from 'next';
import { ActionForm, ConfirmButton, Submit } from '../../_components/ActionForm';
import { Fld } from '../../_components/Fld';
import { ROLE_EN } from '@/lib/adminlabels';
import { addStaff, changeRole, removeStaff, resetMfa } from '../../actions/users';
import { ADMIN, requirePage, ROLE_BN } from '@/lib/guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { fd } from '@/lib/format';
import { PageHead } from '@/lib/ui';
import type { Role } from '@/lib/types';

export const metadata: Metadata = { title: 'কমিটির অ্যাক্সেস' };
const ROLES: Role[] = ['admin', 'treasurer', 'librarian', 'editor'];
const ROLE_HELP: Record<string, string> = {
  admin: 'সব কাজ, সেটিংস ও অ্যাক্সেস দেওয়া। লগইনে অথেনটিকেটর অ্যাপের OTP বাধ্যতামূলক',
  treasurer: 'সদস্য, চাঁদা, ঋণ, দান ও আবেদন',
  librarian: 'বই ও বই আদান-প্রদান',
  editor: 'ওয়েবসাইটের কনটেন্ট: সংবাদ, সেবা, কমিটি, মেনু, হেডার ও ফুটার',
};
const roleName = (r: Role) => `${ROLE_BN[r]} (${ROLE_EN[r]})`;

export default async function Users() {
  const { supabase, user } = await requirePage(ADMIN);
  const [{ data: profiles }, list] = await Promise.all([
    supabase.from('profiles').select('id, role, full_name, phone, created_at').neq('role', 'member').order('created_at'),
    createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const emails = new Map((list.data?.users ?? []).map((u) => [u.id, { email: u.email, last: u.last_sign_in_at, mfa: !!u.factors?.some((f) => f.status === 'verified') }]));
  return (
    <>
      <PageHead title="কমিটির অ্যাক্সেস" sub="কে কোন অংশে কাজ করতে পারবেন তা এখান থেকে ঠিক করুন। ভূমিকা (Role) বদলালে সাথে সাথে তার সাইডবারের মেনু বদলে যায়।" />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 340px', alignItems: 'start' }}>
        <div className="card"><div className="scroll"><table className="tbl">
          <thead><tr><th>নাম / ইমেইল <small className="en-hint">(Name / email)</small></th><th>ভূমিকা <small className="en-hint">(Role)</small></th><th>সর্বশেষ লগইন <small className="en-hint">(Last login)</small></th><th>OTP <small className="en-hint">(2-step code)</small></th><th></th></tr></thead>
          <tbody>
            {(profiles ?? []).map((p) => {
              const e = emails.get(p.id);
              return (
                <tr key={p.id}>
                  <td><b>{p.full_name || '-'}</b><div className="muted small">{e?.email}{p.phone ? ` | ${p.phone}` : ''}</div></td>
                  <td>
                    <ActionForm action={changeRole.bind(null, p.id)} className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      <select name="role" defaultValue={p.role} style={{ width: 160 }} aria-label="ভূমিকা">{ROLES.map((r) => <option key={r} value={r}>{roleName(r)}</option>)}</select>
                      <Submit className="btn sm">বদলান (Change)</Submit>
                    </ActionForm>
                  </td>
                  <td className="small">{e?.last ? fd(e.last) : 'কখনো না'}</td>
                  <td className="small">{p.role === 'admin' ? (e?.mfa ? <span className="badge b-ok">চালু</span> : <span className="badge b-warn">যুক্ত হয়নি</span>) : <span className="muted">লাগে না</span>}</td>
                  <td><div className="acts">{p.role === 'admin' && e?.mfa && <ConfirmButton action={resetMfa.bind(null, p.id)} className="btn sm" label="OTP রিসেট (Reset)" confirm="এই অ্যাডমিনের অথেনটিকেটর অ্যাপ সরানো হবে। পরের লগইনে তাকে নতুন করে যুক্ত করতে হবে। নিশ্চিত?" />}{p.id !== user.id && <ConfirmButton action={removeStaff.bind(null, p.id)} className="btn sm danger" label="অ্যাক্সেস সরান (Remove)" confirm="এই ব্যক্তির লগইন স্থায়ীভাবে মুছে যাবে। নিশ্চিত?" />}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
          <div style={{ marginTop: 14 }}>{ROLES.map((r) => <div key={r} className="check small"><b style={{ minWidth: 170 }}>{roleName(r)}</b><span className="muted">{ROLE_HELP[r]}</span></div>)}</div>
        </div>
        <ActionForm action={addStaff} className="card" resetOnSuccess>
          <b>নতুন কমিটি সদস্যকে অ্যাক্সেস দিন<small className="en-hint">(Give staff access)</small></b>
          <Fld bn="নাম" en="Name" info="তালিকা ও কার্যক্রমের লগে এই নামে দেখাবে।" style={{ marginTop: 10 }}><input name="full_name" /></Fld>
          <Fld bn="ইমেইল *" en="Email" info="এই ইমেইল দিয়ে লগইন করবেন। বিজ্ঞপ্তিও এখানে যাবে।"><input name="email" type="email" required /></Fld>
          <Fld bn="মোবাইল নম্বর (ঐচ্ছিক)" en="Mobile" info="দিলে ইমেইলের বদলে এই নম্বর দিয়েও লগইন করা যাবে।"><input name="phone" inputMode="tel" placeholder="01XXXXXXXXX" /></Fld>
          <Fld bn="পাসওয়ার্ড * (কমপক্ষে ৮ অক্ষর)" en="Password" info="শুরুর পাসওয়ার্ড। তাকে জানিয়ে দিন, লগইনের পর বদলে নিতে বলুন।"><input name="password" type="text" minLength={8} required autoComplete="new-password" /></Fld>
          <Fld bn="ভূমিকা" en="Role" info="কোন অংশে কাজ করতে পারবেন তা ভূমিকা ঠিক করে। নিচের তালিকায় প্রতিটির কাজ লেখা আছে।"><select name="role" defaultValue="treasurer">{ROLES.map((r) => <option key={r} value={r}>{roleName(r)}</option>)}</select></Fld>
          <Submit>অ্যাক্সেস দিন (Give access)</Submit>
          <p className="muted small" style={{ marginTop: 10 }}>পাসওয়ার্ডটি তাকে জানিয়ে দিন। প্রথমবার লগইনের পর বদলে নিতে বলুন।</p>
        </ActionForm>
      </div>
    </>
  );
}
