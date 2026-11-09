import { DocHead, Sigs } from './DocHead';
import { bn, fd, tk } from '@/lib/format';
import type { Member, Settings } from '@/lib/types';

/** সদস্য ফর্ম: খালি (হাতে পূরণের জন্য) অথবা পূরণ করা */
export function MemberFormDoc({ s, m, sig }: { s: Settings; m?: Member | null; sig?: string | null }) {
  const row = (label: string, value?: string | null) => <tr><td width="34%">{label}</td><td style={{ height: 28 }}>{value ?? ''}</td></tr>;
  return (
    <>
      <div className="copy">
        <DocHead s={s} title="সদস্যপদের আবেদন ফর্ম" no={m?.member_no} />
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ flex: 1 }}><table><tbody>
            {row('পূর্ণ নাম', m?.name)}{row('পিতার নাম', m?.father_name)}{row('মাতার নাম', m?.mother_name)}{row('মোবাইল নম্বর', m ? bn(m.phone) : '')}{row('ইমেইল', m?.email)}
            {row('এনআইডি / জন্মনিবন্ধন', m?.nid)}{row('জন্ম তারিখ', m?.dob ? fd(m.dob) : '')}{row('পেশা', m?.occupation)}
            {row('ঠিকানা', m?.address)}{row('নমিনির নাম ও সম্পর্ক', m?.nominee)}
            {row('মাসিক চাঁদা', m ? tk(m.monthly_amount) : '☐ ৫০  ☐ ১০০  ☐ ২০০  ☐ ৫০০  ☐ ১০০০  ☐ অন্যান্য ______')}
            {row('ভর্তি ফি', `${tk(s.reg_fee)} ${m ? '(পরিশোধিত)' : '☐ পরিশোধিত'}`)}
            {row('যোগদানের তারিখ', m ? fd(m.join_date) : '')}
          </tbody></table></div>
          <div className="ph">{m?.photo_url ? <img src={m.photo_url} alt="" /> : 'পাসপোর্ট সাইজ ছবি'}</div>
        </div>
        <b>সদস্যপদের শর্তাবলী:</b>
        <ol>{s.member_terms.map((t) => <li key={t}>{t}</li>)}</ol>
        <p><b>অঙ্গীকারনামা:</b> আমি উপরের সকল শর্ত পড়ে, বুঝে ও স্বেচ্ছায় {s.org_name} এর সদস্য হওয়ার জন্য আবেদন করছি এবং সংগঠনের নিয়ম মেনে চলতে অঙ্গীকার করছি।</p>
        <Sigs items={[{ label: 'আবেদনকারীর স্বাক্ষর ও তারিখ', img: sig }, { label: 'সুপারিশকারী সদস্য' }, { label: 'কোষাধ্যক্ষ' }, { label: 'সভাপতি / সাধারণ সম্পাদক' }]} />
      </div>
      <div className="cut">✂ অফিস ব্যবহারের জন্য</div>
      <div className="copy" style={{ padding: '10px 14px' }}>
        <b>সদস্য নম্বর:</b> {m?.member_no ?? '__________'} &nbsp;&nbsp; <b>অনুমোদনের তারিখ:</b> __________ &nbsp;&nbsp; <b>ফি গ্রহণকারী:</b> __________
      </div>
    </>
  );
}
