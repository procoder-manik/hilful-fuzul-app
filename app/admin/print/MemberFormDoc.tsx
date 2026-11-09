import { DocHead, Sigs } from './DocHead';
import { bn, fd, tk } from '@/lib/format';
import type { Member, Settings } from '@/lib/types';

/** ফর্মে বসানো ব্যক্তির তথ্য: সদস্য (Member) বা আবেদনকারী (Application) দুটোই চলে */
export type FormPerson = {
  member_no?: string | null; name: string; father_name: string | null; mother_name: string | null; phone: string; email: string | null;
  nid: string | null; dob: string | null; address: string | null; occupation: string | null; nominee: string | null;
  monthly_amount: number | null; join_date?: string | null; photo_url: string | null;
};

/** আবেদনকারী ফি পাঠানোর যে তথ্য জানিয়েছেন */
export type FormPay = { method: string | null; trx: string | null; at?: string | null };

/** সদস্য ফর্ম: খালি (হাতে পূরণের জন্য), পূরণ করা সদস্য, অথবা পূরণ করা আবেদন (যাচাইয়ের অপেক্ষায়) */
export function MemberFormDoc({ s, m, sig, appNo, pay, pending }: { s: Settings; m?: Member | FormPerson | null; sig?: string | null; appNo?: number | null; pay?: FormPay | null; pending?: boolean }) {
  const row = (label: string, value?: string | null) => <tr><td width="34%">{label}</td><td style={{ height: 28 }}>{value ?? ''}</td></tr>;
  const isMember = !!m && !pending;
  const payNote = s.pay_methods.filter((x) => x.kind !== 'cash' && x.number).map((x) => `${x.label}: ${x.number}`).join('  |  ');
  const feeCell = isMember
    ? `${tk(s.reg_fee)} (পরিশোধিত)`
    : pay?.method
      ? `${tk(s.reg_fee)}, ${pay.method} এ পাঠিয়েছেন বলে জানিয়েছেন (যাচাই বাকি)`
      : `${tk(s.reg_fee)} ☐ পরিশোধিত`;
  return (
    <>
      <div className="copy">
        <DocHead s={s} title="সদস্যপদের আবেদন ফর্ম" no={m?.member_no ?? (appNo ? `আবেদন ${bn(appNo)}` : undefined)} />
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ flex: 1 }}><table><tbody>
            {row('পূর্ণ নাম', m?.name)}{row('পিতার নাম', m?.father_name)}{row('মাতার নাম', m?.mother_name)}{row('মোবাইল নম্বর', m ? bn(m.phone) : '')}{row('ইমেইল', m?.email)}
            {row('এনআইডি / জন্মনিবন্ধন', m?.nid)}{row('জন্ম তারিখ', m?.dob ? fd(m.dob) : '')}{row('পেশা', m?.occupation)}
            {row('ঠিকানা', m?.address)}{row('নমিনির নাম ও সম্পর্ক', m?.nominee)}
            {row('মাসিক চাঁদা', m?.monthly_amount ? tk(m.monthly_amount) : '☐ ৫০  ☐ ১০০  ☐ ২০০  ☐ ৫০০  ☐ ১০০০  ☐ অন্যান্য ______')}
            {row('ভর্তি ফি', feeCell)}
            {m
              ? row('ফি পাঠানোর মাধ্যম ও ট্রানজ্যাকশন আইডি', pay?.method ? `${pay.method}${pay.trx ? `, ট্রানজ্যাকশন আইডি: ${pay.trx}` : ''}` : '')
              : row('ফি পাঠানোর মাধ্যম ও ট্রানজ্যাকশন আইডি', `☐ বিকাশ  ☐ নগদ  ☐ রকেট  ☐ ব্যাংক  ☐ হাতে নগদ    TrxID: ______________`)}
            {row('যোগদানের তারিখ', m?.join_date ? fd(m.join_date) : '')}
          </tbody></table>
            {payNote && <div style={{ fontSize: 11, marginTop: 4 }}><b>ফি পাঠানোর নম্বর:</b> {payNote}</div>}
          </div>
          <div className="ph">{m?.photo_url ? <img src={m.photo_url} alt="" /> : 'পাসপোর্ট সাইজ ছবি'}</div>
        </div>
        <b>সদস্যপদের শর্তাবলী:</b>
        <ol>{s.member_terms.map((t) => <li key={t}>{t}</li>)}</ol>
        <p><b>অঙ্গীকারনামা:</b> আমি উপরের সকল শর্ত পড়ে, বুঝে ও স্বেচ্ছায় {s.org_name} এর সদস্য হওয়ার জন্য আবেদন করছি এবং সংগঠনের নিয়ম মেনে চলতে অঙ্গীকার করছি।</p>
        <Sigs items={[{ label: 'আবেদনকারীর স্বাক্ষর ও তারিখ', img: sig }, { label: 'সুপারিশকারী সদস্য' }, { label: 'কোষাধ্যক্ষ' }, { label: 'সভাপতি / সাধারণ সম্পাদক' }]} />
      </div>
      <div className="cut">✂ অফিস ব্যবহারের জন্য</div>
      <div className="copy" style={{ padding: '10px 14px' }}>
        <b>সদস্য নম্বর:</b> {isMember ? m?.member_no : '__________'} &nbsp;&nbsp; <b>অনুমোদনের তারিখ:</b> __________ &nbsp;&nbsp; <b>ফি গ্রহণকারী:</b> __________
      </div>
    </>
  );
}
