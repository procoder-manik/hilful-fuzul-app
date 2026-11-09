import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ActionForm, ConfirmButton, Submit } from '../../../_components/ActionForm';
import { deleteMember, quickPay, setMemberLogin, setMemberPublic, setMemberStatus } from '../../../actions/members';
import { requirePage, STAFF } from '@/lib/guard';
import { computeDues } from '@/lib/dues';
import { todayBD } from '@/lib/dates';
import { bn, fd, initials, MONTHS_SHORT, tk, ymLabel } from '@/lib/format';
import { Badge, Empty, LOAN_ST, loanStatus, PageHead, STATUS } from '@/lib/ui';

export const metadata: Metadata = { title: 'সদস্যের প্রোফাইল' };
const TYPE = { registration: 'ভর্তি ফি', reactivation: 'পুনঃসক্রিয়করণ ফি' } as Record<string, string>;

export default async function MemberProfile({ params, searchParams }: { params: { id: string }; searchParams: { warn?: string } }) {
  const { supabase, profile } = await requirePage(STAFF);
  const id = params.id;
  const [{ data: m }, { data: pays }, { data: loans }, { data: login }, { data: s }] = await Promise.all([
    supabase.from('members').select('*').eq('id', id).single(),
    supabase.from('payments').select('*').eq('member_id', id).order('paid_on', { ascending: false }),
    supabase.from('loans').select('*, loan_repayments(amount)').eq('member_id', id).order('issued_on', { ascending: false }),
    supabase.from('profiles').select('id').eq('member_id', id).maybeSingle(),
    supabase.from('settings').select('due_day, reg_fee, freeze_months').eq('id', 1).single(),
  ]);
  if (!m) notFound();
  const money = ['admin', 'treasurer'].includes(profile.role);
  const payments = pays ?? [];
  const d = computeDues({ joinDate: m.join_date, resetFrom: m.reset_from, monthlyAmount: Number(m.monthly_amount), paidMonths: payments.filter((p) => p.type === 'monthly').map((p) => p.for_month), dueDay: s?.due_day ?? 10 });
  const total = payments.reduce((a, p) => a + Number(p.amount), 0);
  const today = todayBD();

  return (
    <>
      {searchParams.warn && <div className="notice warn">{searchParams.warn}</div>}
      <div className="card row" style={{ gap: 16, borderRadius: 28 }}>
        <span className="av" style={{ width: 72, height: 72, fontSize: '1.6rem' }}>{m.photo_url ? <img src={m.photo_url} alt="" /> : initials(m.name)}</span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>{m.name}</h1>
          <span className="muted">{m.member_no}, {bn(m.phone)}, যোগদান {fd(m.join_date)}</span> <Badge map={STATUS} k={m.status} />
          {m.frozen_at && <div className="muted small">স্থগিত হয়েছে {fd(m.frozen_at)}</div>}
        </div>
        <div className="row" style={{ gap: 6 }}>
          {money && <Link className="btn pri" href={`/admin/payments/new?member=${m.id}`}>চাঁদা জমা</Link>}
          {money && <Link className="btn" href={`/admin/members/${m.id}/edit`}>সম্পাদনা</Link>}
          <Link className="btn" href={`/admin/print/member/${m.id}`}>ফর্ম প্রিন্ট (Print form)</Link>
        </div>
      </div>

      <div className="grid g4" style={{ marginTop: 16 }}>
        <div className="kpi"><span>মোট জমা</span><b>{tk(total)}</b></div>
        <div className="kpi"><span>মাসিক চাঁদা</span><b>{tk(m.monthly_amount)}</b></div>
        <div className="kpi"><span>বকেয়া</span><b style={{ color: d.dueAmount ? 'var(--danger)' : 'var(--ok)' }}>{tk(d.dueAmount)}</b><span>{bn(d.overdue.length)} মাস</span></div>
        <div className="kpi"><span>টানা বকেয়া (ফ্রিজের হিসাব)</span><b>{bn(d.streak)} / {bn(s?.freeze_months ?? 3)} মাস</b></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <b>মাসভিত্তিক চাঁদা</b>
          {money && <span className="muted small">টাকা দিয়েছিলেন কিন্তু এন্ট্রি হয়নি? লাল বা হলুদ মাসে চাপ দিয়ে পরিশোধিত করুন।</span>}
        </div>
        <div className="months" style={{ marginTop: 12 }}>
          {d.months.map((mo) => {
            const paid = d.paid.has(mo), over = d.overdue.includes(mo);
            const label = <>{MONTHS_SHORT[Number(mo.slice(5, 7)) - 1]} {bn(mo.slice(2, 4))}<br />{paid ? '✓' : over ? 'বকেয়া' : 'বাকি'}</>;
            return paid || !money
              ? <div key={mo} className={`mo ${paid ? 'paid' : over ? 'over' : 'cur'}`}>{label}</div>
              : <ConfirmButton key={mo} action={quickPay.bind(null, m.id, mo)} className={`mo click ${over ? 'over' : 'cur'}`} label={label} confirm={`${ymLabel(mo)} মাসের ${m.monthly_amount} টাকা পরিশোধিত হিসেবে যোগ করবেন?`} title={`${ymLabel(mo)} পরিশোধিত করুন`} />;
          })}
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <b>জমার ইতিহাস</b>
          <div className="scroll"><table className="tbl"><thead><tr><th>তারিখ<small className="en-hint">(Date)</small></th><th>বিবরণ<small className="en-hint">(Details)</small></th><th>পরিমাণ<small className="en-hint">(Amount)</small></th><th></th></tr></thead><tbody>
            {payments.length === 0 && <Empty cols={4} />}
            {payments.map((p) => (
              <tr key={p.id}><td>{fd(p.paid_on)}<div className="muted small">{p.method}</div></td><td>{p.type === 'monthly' ? `${ymLabel(p.for_month)} এর চাঁদা` : TYPE[p.type]}</td><td>{tk(p.amount)}</td>
                <td><Link className="btn sm" href={`/admin/print/receipt?ids=${p.id}`}>রসিদ</Link></td></tr>
            ))}
          </tbody></table></div>
        </div>
        <div className="grid" style={{ gap: 16 }}>
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}><b>করজে হাসানা</b>{money && m.status === 'active' && <Link className="btn sm" href={`/admin/loans/new?member=${m.id}`}>নতুন ঋণ (New loan)</Link>}</div>
            {(loans ?? []).length === 0 && <p className="muted">কোনো ঋণ নেই।</p>}
            {(loans ?? []).map((l) => {
              const rep = (l.loan_repayments as { amount: number }[]).reduce((a, r) => a + Number(r.amount), 0);
              return (
                <Link key={l.id} href={`/admin/loans/${l.id}`} className="check" style={{ textDecoration: 'none', justifyContent: 'space-between' }}>
                  <span><b>{tk(l.amount)}</b> <Badge map={LOAN_ST} k={loanStatus(Number(l.amount), rep, l.due_on, today)} /><span className="muted small" style={{ display: 'block' }}>{l.slip_no}, শেষ তারিখ {fd(l.due_on)}</span></span>
                  <b>বাকি {tk(Number(l.amount) - rep)}</b>
                </Link>
              );
            })}
          </div>
          {money && (
            <div className="card">
              <b>সদস্যপদ</b>
              <div className="row" style={{ marginTop: 10, gap: 8 }}>
                {m.status === 'active'
                  ? <ConfirmButton action={setMemberStatus.bind(null, m.id, 'freeze')} className="btn danger" label="স্থগিত করুন" confirm="সদস্যপদ স্থগিত করবেন?" />
                  : <>
                      <ConfirmButton action={setMemberStatus.bind(null, m.id, 'unfreeze')} className="btn" label="আনফ্রিজ (ভুল সংশোধন, ফি ছাড়া)" confirm="ফি ছাড়া আনফ্রিজ করবেন? শুধু ভুল হলে এটা করুন।" />
                      <ConfirmButton action={setMemberStatus.bind(null, m.id, 'reactivate')} className="btn pri" label={`${tk(s?.reg_fee ?? 200)} নিয়ে পুনঃসক্রিয়`} confirm={`${s?.reg_fee ?? 200} টাকা জমা নিয়ে পুনঃসক্রিয় করবেন?`} />
                    </>}
              </div>
              <b style={{ display: 'block', marginTop: 18 }}>লগইন</b>
              <p className="muted small" style={{ margin: '4px 0 8px' }}>{login ? `লগইন আছে। মোবাইল ${bn(m.phone)}${m.email ? ` বা ইমেইল ${m.email}` : ''} দিয়ে ঢোকেন। পাসওয়ার্ড ভুলে গেলে নতুন পাসওয়ার্ড দিন।` : 'এখনো লগইন নেই। একটি পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) দিয়ে তৈরি করুন, তারপর সদস্যকে জানান।'}</p>
              <ActionForm action={setMemberLogin.bind(null, m.id)} className="row" resetOnSuccess>
                <input name="password" type="text" minLength={6} autoComplete="off" placeholder="নতুন পাসওয়ার্ড" required style={{ width: 190 }} aria-label="পাসওয়ার্ড" />
                <Submit className="btn">{login ? 'পাসওয়ার্ড রিসেট' : 'লগইন তৈরি'}</Submit>
              </ActionForm>
              <div style={{ marginTop: 18 }}>
                <b style={{ display: 'block' }}>ওয়েবসাইটের সদস্য পাতা<small className="en-hint">(Public members page)</small></b>
                <p className="muted small" style={{ margin: '4px 0 8px' }}>{(m as { public_hidden?: boolean }).public_hidden ? 'এই সদস্য এখন ওয়েবসাইটের সদস্য পাতায় লুকানো আছে।' : 'এই সদস্য ওয়েবসাইটের সদস্য পাতায় কার্ড হিসেবে দেখা যাচ্ছে (ফোন, ঠিকানা ও এনআইডি ছাড়া)।'}</p>
                <ConfirmButton action={setMemberPublic.bind(null, m.id, !(m as { public_hidden?: boolean }).public_hidden)} className="btn sm" label={(m as { public_hidden?: boolean }).public_hidden ? 'ওয়েবসাইটে দেখান (Show)' : 'ওয়েবসাইটে লুকান (Hide)'} />
              </div>
              {profile.role === 'admin' && (
                <div style={{ marginTop: 18 }}>
                  <ConfirmButton action={deleteMember.bind(null, m.id)} className="btn sm danger" label="সদস্য মুছে ফেলুন" confirm="এই সদস্য ও তার সব চাঁদার হিসাব স্থায়ীভাবে মুছে যাবে। নিশ্চিত?" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
