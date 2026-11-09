import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOut } from '@/components/SignOut';
import { Icon } from '@/components/Icon';
import { PayMethods } from '@/components/PayMethods';
import { ProfileEditor } from './ProfileEditor';
import { ClaimForm } from './ClaimForm';
import { PasswordForm } from './PasswordForm';
import { markNotificationsRead } from './actions';
import { getSessionProfile, getSiteSettings } from '@/lib/settings';
import { computeDues } from '@/lib/dues';
import { getT } from '@/lib/lang';
import { bn, fd, initials, monthsShort, tk, ymLabel } from '@/lib/fmt';
import type { Application, Loan, Member, Payment, Settings } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  return { title: getT()('আমার অ্যাকাউন্ট', 'My account'), robots: { index: false } };
}
export const dynamic = 'force-dynamic';

type Note = { id: string; kind: string; title: string; body: string; read_at: string | null; created_at: string };

function Notifications({ list }: { list: Note[] }) {
  const t = getT();
  const unread = list.filter((n) => !n.read_at).length;
  return (
    <div className="card" id="notices">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>{t('বিজ্ঞপ্তি', 'Notifications')} {unread > 0 && <span className="badge b-bad">{bn(unread)} {t('নতুন', 'new')}</span>}</b>
        {unread > 0 && <form action={markNotificationsRead}><button className="btn sm">{t('সব পড়া হয়েছে', 'Mark all read')}</button></form>}
      </div>
      {list.length === 0 && <p className="muted" style={{ marginBottom: 0 }}>{t('এখনো কোনো বিজ্ঞপ্তি নেই। চাঁদা জমা, বকেয়া ও সতর্কতার খবর এখানে আসবে।', 'No notifications yet. Payment confirmations, dues and warnings will appear here.')}</p>}
      {list.map((n) => (
        <div key={n.id} className={`note${n.read_at ? '' : ' unread'}`}>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap', gap: 8 }}><b>{n.title}</b><span className="muted small" style={{ flex: 'none' }}>{fd(n.created_at)}</span></div>
          <p className="muted small" style={{ margin: '4px 0 0', whiteSpace: 'pre-line' }}>{n.body}</p>
        </div>
      ))}
    </div>
  );
}

function Step({ ok, title, sub }: { ok: boolean | 'wait'; title: string; sub?: string }) {
  return (
    <div className="check" style={{ alignItems: 'flex-start' }}>
      <span className={`dot ${ok === true ? 'ok' : ok === 'wait' ? 'wait' : ''}`} aria-hidden="true">{ok === true ? '✓' : ok === 'wait' ? '…' : ''}</span>
      <div><b>{title}</b>{sub && <div className="muted small">{sub}</div>}</div>
    </div>
  );
}

export default async function Portal({ searchParams }: { searchParams: { welcome?: string } }) {
  const t = getT();
  const { supabase, user, profile } = await getSessionProfile();
  if (!user) redirect('/login?next=/portal');
  if (profile && profile.role !== 'member' && !profile.member_id) redirect('/admin');
  const s = await getSiteSettings();
  const { data: nd } = await supabase.from('notifications').select('id, kind, title, body, read_at, created_at').order('created_at', { ascending: false }).limit(12);
  const notes = (nd ?? []) as Note[];

  /* ---------- যাচাইয়ের অপেক্ষায় থাকা আবেদনকারী ---------- */
  if (!profile?.member_id) {
    const { data } = await supabase.from('applications').select('*').eq('user_id', user.id).maybeSingle();
    const a = data as Application | null;
    if (!a) return <section className="wrap" style={{ padding: 40 }}><div className="notice">{t('এই অ্যাকাউন্টের সাথে কোনো সদস্য বা আবেদন যুক্ত নেই। কোষাধ্যক্ষের সাথে যোগাযোগ করুন।', 'No member or application is linked to this account. Please contact the treasurer.')}</div><SignOut /></section>;
    return (
      <section className="wrap" style={{ padding: '30px 18px 60px' }}>
        {searchParams.welcome && (
          <div className="notice ok" role="status" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <span>{t('নিবন্ধন সফল হয়েছে। আপনার প্রোফাইল তৈরি হয়েছে। চাইলে এখনই পূরণ করা ফর্মটি প্রিন্ট বা PDF করে রাখুন।', 'Registration successful. Your profile has been created. You can print or save your filled form as a PDF right now.')}</span>
            <Link className="btn pri" href="/portal/form"><Icon name="print" /> {t('আমার ফর্ম প্রিন্ট করুন', 'Print my form')}</Link>
          </div>
        )}
        <Header name={a.name} photo={a.photo_url} line={`${t('আবেদন নং', 'Application no.')} ${bn(a.app_no)}`}
          badge={a.status === 'rejected' ? <span className="badge b-bad">{t('আবেদন বাতিল', 'Application rejected')}</span> : <span className="badge b-warn">{t('যাচাই অপেক্ষমাণ', 'Verification pending')}</span>}
          extra={<Link className="btn" href="/portal/form"><Icon name="print" /> {t('ফর্ম প্রিন্ট', 'Print form')}</Link>} />
        {a.status === 'rejected'
          ? <div className="notice" style={{ marginTop: 16 }}>{t('দুঃখিত, আপনার আবেদনটি গ্রহণ করা হয়নি। বিস্তারিত জানতে কমিটির সাথে যোগাযোগ করুন।', 'Sorry, your application was not accepted. Please contact the committee for details.')}</div>
          : (
            <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
              <div className="card">
                <b>{t('সদস্য হওয়ার ধাপ', 'Steps to become a member')}</b>
                <Step ok title={t('১. নিবন্ধন সম্পন্ন', '1. Registered')} sub={fd(a.created_at)} />
                <Step ok={a.pay_claimed_at ? 'wait' : false} title={t(`২. ভর্তি ফি ${tk(s.reg_fee)} জমা দিন`, `2. Pay the ${tk(s.reg_fee)} joining fee`)} sub={a.pay_claimed_at ? t(`আপনি জানিয়েছেন: ${a.pay_method}${a.pay_trx ? `, ট্রানজ্যাকশন ${a.pay_trx}` : ''}`, `You reported: ${a.pay_method}${a.pay_trx ? `, transaction ${a.pay_trx}` : ''}`) : t('নিচের যেকোনো মাধ্যমে পাঠান', 'Send via any method below')} />
                <Step ok={false} title={t('৩. কমিটির যাচাই', '3. Committee verification')} sub={t('টাকা পেয়ে যাচাই করলে আপনি যাচাইকৃত সদস্য হবেন এবং বিজ্ঞপ্তি পাবেন', 'Once they receive and verify the payment you become a verified member and get notified')} />
              </div>
              <div className="card">
                <b>{t('ভর্তি ফি জমা দেওয়ার মাধ্যম', 'How to pay the joining fee')}</b>
                <div className="kpi" style={{ margin: '10px 0', background: 'var(--surface2)', boxShadow: 'none' }}><span>{t('জমা দিতে হবে', 'Amount to pay')}</span><b>{tk(s.reg_fee)}</b></div>
                <PayMethods list={s.pay_methods} fallback={s.pay_info} />
                <ClaimForm done={a.pay_claimed_at ? { method: a.pay_method ?? '', trx: a.pay_trx } : null} />
              </div>
            </div>
          )}
        <div style={{ marginTop: 16 }}><Notifications list={notes} /></div>
        <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
          <ProfileEditor p={{ name: a.name, father_name: a.father_name, mother_name: a.mother_name, nid: a.nid, dob: a.dob, address: a.address, occupation: a.occupation, nominee: a.nominee, email: a.email, phone: a.phone, photo_url: a.photo_url }} />
          <PasswordForm />
        </div>
      </section>
    );
  }

  /* ---------- সদস্য ---------- */
  const [m, p, l, b] = await Promise.all([
    supabase.from('members').select('*').eq('id', profile.member_id).single(),
    supabase.from('payments').select('*').eq('member_id', profile.member_id).order('paid_on', { ascending: false }),
    supabase.from('loans').select('*, loan_repayments(amount, paid_on)').eq('member_id', profile.member_id).order('issued_on', { ascending: false }),
    supabase.from('book_lendings').select('id, out_on, expected_on, returned_on, books(title)').eq('member_id', profile.member_id).order('out_on', { ascending: false }).limit(10),
  ]);
  const member = m.data as Member | null;
  if (!member) return <section className="wrap" style={{ padding: 40 }}><div className="notice">{t('সদস্যের তথ্য পাওয়া যায়নি। কোষাধ্যক্ষের সাথে যোগাযোগ করুন।', 'Member record not found. Please contact the treasurer.')}</div><SignOut /></section>;
  const books = (b.data ?? []) as unknown as { id: string; out_on: string; expected_on: string | null; returned_on: string | null; books: { title: string } | null }[];
  const payments = (p.data ?? []) as Payment[];
  const loans = (l.data ?? []) as Loan[];
  const total = payments.reduce((x, y) => x + Number(y.amount), 0);
  const reg = payments.find((x) => x.type === 'registration');
  const d = computeDues({ joinDate: member.join_date, resetFrom: member.reset_from, monthlyAmount: Number(member.monthly_amount), paidMonths: payments.filter((x) => x.type === 'monthly' && x.for_month).map((x) => x.for_month!), dueDay: s.due_day });
  const ms = monthsShort();
  const typeLabel = (x: Payment) => (x.type === 'monthly' ? t(`${ymLabel(x.for_month!)} এর চাঁদা`, `${ymLabel(x.for_month!)} contribution`) : x.type === 'registration' ? t('ভর্তি ফি', 'Joining fee') : t('পুনঃসক্রিয়করণ ফি', 'Reactivation fee'));
  const needsPay = !reg || d.dueAmount > 0 || !d.paidThisMonth || member.status === 'frozen';
  const verified = !!member.verified_at;

  return (
    <section className="wrap" style={{ padding: '30px 18px 60px' }}>
      <Header name={member.name} photo={member.photo_url} line={`${member.member_no}, ${t('সদস্য', 'member since')} ${fd(member.join_date)}${t(' থেকে', '')}`}
        badge={<>
          {verified ? <span className="badge b-ok">✓ {t('যাচাইকৃত সদস্য', 'Verified member')}</span> : <span className="badge b-warn">{t('যাচাই হয়নি', 'Not verified')}</span>}{' '}
          <span className={`badge ${member.status === 'active' ? 'b-ok' : 'b-bad'}`}>{member.status === 'active' ? t('সক্রিয়', 'Active') : t('স্থগিত', 'Suspended')}</span>
        </>} extra={<Link className="btn" href="/portal/form">{t('ফর্ম প্রিন্ট', 'Print form')}</Link>} />

      {member.status === 'frozen' && (
        <div className="notice" style={{ marginTop: 16 }}>{t(`টানা ${bn(s.freeze_months)} মাস চাঁদা বকেয়া থাকায় সদস্যপদ স্থগিত আছে। ${tk(s.reg_fee)} দিয়ে পুনরায় সক্রিয় করুন। ভুলবশত হয়ে থাকলে কোষাধ্যক্ষকে জানান।`, `Your membership is suspended because contributions were overdue for ${bn(s.freeze_months)} consecutive months. Pay ${tk(s.reg_fee)} to reactivate. If this is a mistake, tell the treasurer.`)}</div>
      )}

      <div className="pf-steps">
        <div className={`pf-st ${verified ? 'ok' : 'warn'}`}><span className="pf-ic">{verified ? '✓' : '!'}</span><div><small>{t('যাচাই', 'Verification')}</small><b>{verified ? t('যাচাইকৃত সদস্য', 'Verified member') : t('যাচাই হয়নি', 'Not verified')}</b>{verified && <em>{fd(member.verified_at)}</em>}</div></div>
        <div className={`pf-st ${reg ? 'ok' : 'bad'}`}><span className="pf-ic">{reg ? '✓' : '৳'}</span><div><small>{t('ভর্তি ফি', 'Joining fee')}</small><b>{reg ? t('পরিশোধিত', 'Paid') : t('বকেয়া', 'Unpaid')}</b><em>{reg ? `${tk(reg.amount)}, ${fd(reg.paid_on)}` : tk(s.reg_fee)}</em></div></div>
        <div className={`pf-st ${d.paidThisMonth ? 'ok' : 'warn'}`}><span className="pf-ic">{d.paidThisMonth ? '✓' : '…'}</span><div><small>{t('এই মাসের চাঁদা', 'This month’s contribution')}</small><b>{d.paidThisMonth ? t('পরিশোধিত', 'Paid') : t('বাকি', 'Due')}</b><em>{d.paidThisMonth ? t(`পরবর্তী শেষ তারিখ ${fd(d.nextDueDate)}`, `Next due ${fd(d.nextDueDate)}`) : t(`শেষ তারিখ ${fd(d.nextDueDate)}`, `Due by ${fd(d.nextDueDate)}`)}</em></div></div>
      </div>

      <div className="pf-kpis">
        <div className="pf-k k1"><span>{t('মোট জমা', 'Total paid')}</span><b>{tk(total)}</b></div>
        <div className="pf-k k2"><span>{t('মাসিক চাঁদা', 'Monthly contribution')}</span><b>{tk(member.monthly_amount)}</b></div>
        <div className={`pf-k ${d.dueAmount ? 'k3' : 'k4'}`}><span>{t('বকেয়া', 'Overdue')}</span><b>{tk(d.dueAmount)}</b><em>{bn(d.overdue.length)} {t('মাস', d.overdue.length === 1 ? 'month' : 'months')}</em></div>
        <div className="pf-k k5"><span>{t('পরবর্তী জমার শেষ তারিখ', 'Next due date')}</span><b>{fd(d.nextDueDate)}</b><em>{d.paidThisMonth ? t('এই মাসের চাঁদা পরিশোধিত', 'This month is paid') : t('এই মাসের চাঁদা বাকি', 'This month is due')}</em></div>
      </div>

      {needsPay && (
        <div className="card" style={{ marginTop: 16 }}>
          <b>{t('টাকা জমা দেওয়ার মাধ্যম', 'How to pay')}</b>
          <p className="muted small" style={{ margin: '4px 0 10px' }}>
            {member.status === 'frozen' ? t(`পুনঃসক্রিয়করণ ফি ${tk(s.reg_fee)}`, `Reactivation fee ${tk(s.reg_fee)}`)
              : !reg ? t(`ভর্তি ফি ${tk(s.reg_fee)}`, `Joining fee ${tk(s.reg_fee)}`)
              : d.dueAmount > 0 ? t(`বকেয়া ${tk(d.dueAmount)}`, `Overdue ${tk(d.dueAmount)}`)
              : t(`এই মাসের চাঁদা ${tk(member.monthly_amount)}`, `This month’s contribution ${tk(member.monthly_amount)}`)}
            {t('। টাকা পাঠিয়ে কোষাধ্যক্ষকে রেফারেন্স হিসেবে আপনার সদস্য নম্বর জানান, কমিটি হিসাবে যোগ করলে আপনি বিজ্ঞপ্তি পাবেন।', '. After paying, give the treasurer your member number as the reference; you will be notified once the committee records it.')}
          </p>
          <PayMethods list={s.pay_methods} fallback={s.pay_info} />
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <b>{t('মাসভিত্তিক চাঁদার অবস্থা', 'Month-by-month contributions')}</b>
        <div className="months" style={{ marginTop: 12 }}>
          {d.months.map((mo) => {
            const paid = d.paid.has(mo), over = d.overdue.includes(mo);
            return (
              <div key={mo} className={`mo ${paid ? 'paid' : over ? 'over' : 'cur'}`}>
                {ms[Number(mo.slice(5, 7)) - 1]} {bn(mo.slice(2, 4))}<br />{paid ? '✓' : over ? t('বকেয়া', 'Overdue') : t('বাকি', 'Due')}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 16 }}><Notifications list={notes} /></div>

      <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <b>{t('জমার ইতিহাস', 'Payment history')}</b>
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>{t('তারিখ', 'Date')}</th><th>{t('বিবরণ', 'Details')}</th><th>{t('রসিদ', 'Receipt')}</th><th>{t('পরিমাণ', 'Amount')}</th></tr></thead>
              <tbody>{payments.map((x) => <tr key={x.id}><td>{fd(x.paid_on)}</td><td>{typeLabel(x)}</td><td className="small">{x.receipt_no}</td><td>{tk(x.amount)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <b>{t('আমার করজে হাসানা', 'My interest-free loans')}</b>
          {loans.length === 0 && <p className="muted">{t('কোনো ঋণ নেই।', 'No loans.')}</p>}
          {loans.map((x) => {
            const rep = (x.loan_repayments ?? []).reduce((a, r) => a + Number(r.amount), 0);
            const bal = Number(x.amount) - rep;
            return (
              <div key={x.id} className="check" style={{ justifyContent: 'space-between' }}>
                <div><b>{tk(x.amount)}</b> <span className={`badge ${bal <= 0 ? 'b-ok' : 'b-info'}`}>{bal <= 0 ? t('পরিশোধিত', 'Repaid') : t('চলমান', 'Running')}</span>
                  <div className="muted small">{t('রসিদ', 'Slip')} {x.slip_no}, {t('শেষ তারিখ', 'due')} {fd(x.due_on)}</div></div>
                <b>{t('বাকি', 'Left')} {tk(bal)}</b>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <b>{t('পাঠাগারের বই', 'Library books')}</b>
          {books.length === 0 && <p className="muted">{t('পাঠাগার থেকে কোনো বই নেননি।', 'You have not borrowed any books.')}</p>}
          {books.map((x) => (
            <div key={x.id} className="check" style={{ justifyContent: 'space-between' }}>
              <span><b>{x.books?.title}</b><span className="muted small" style={{ display: 'block' }}>{t('নিয়েছেন', 'Borrowed')} {fd(x.out_on)}</span></span>
              {x.returned_on ? <span className="badge b-ok">{t('ফেরত দিয়েছেন', 'Returned')}</span> : <span className="badge b-warn">{t('ফেরতের তারিখ', 'Return by')} {fd(x.expected_on)}</span>}
            </div>
          ))}
        </div>
        <PasswordForm />
      </div>

      <div style={{ marginTop: 16 }}>
        <ProfileEditor p={{ name: member.name, father_name: member.father_name, mother_name: member.mother_name, nid: member.nid, dob: member.dob, address: member.address, occupation: member.occupation, nominee: member.nominee, email: member.email, phone: member.phone, photo_url: member.photo_url }} />
      </div>
    </section>
  );
}

function Header({ name, photo, line, badge, extra }: { name: string; photo: string | null; line: string; badge: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="pf-hero">
      <div className="pf-av">{photo ? <img src={photo} alt="" /> : initials(name)}</div>
      <div className="pf-id">
        <h1>{name}</h1>
        <span className="pf-line">{line}</span>
        <div className="pf-badges">{badge}</div>
      </div>
      <div className="pf-acts">{extra}<SignOut /></div>
    </div>
  );
}
