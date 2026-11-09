import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { PayMethods } from '@/components/PayMethods';
import { BuiltinPage } from '@/components/blocks/BuiltinPage';
import { JoinForm } from './JoinForm';
import { getSessionProfile, getSiteSettings } from '@/lib/settings';
import { graph } from '@/lib/schema';
import { getT } from '@/lib/lang';
import { tk } from '@/lib/fmt';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('সদস্য হোন', 'Join us'), description: t('অনলাইনে নিবন্ধন করুন। এককালীন ২০০ টাকা ভর্তি ফি, তারপর সামর্থ্য অনুযায়ী মাসিক চাঁদা এবং প্রয়োজনে বিনা সুদে ঋণের সুযোগ।', 'Register online. A one-time joining fee, then a monthly contribution of your choice, and interest-free loans when you need them.'), alternates: { canonical: '/join' } };
}

export default async function Join() {
  const t = getT();
  const [s, { user }] = await Promise.all([getSiteSettings(), getSessionProfile()]);
  if (user) redirect('/portal');
  return (
    <>
      <JsonLd data={graph(s, [], [[t('সদস্য হোন', 'Join us'), '/join']])} />
      <BuiltinPage slug="join" title={t('সদস্য হোন', 'Join us')} sub={t(`এককালীন ${tk(s.reg_fee)} ভর্তি ফি এবং প্রতি মাসে আপনার সামর্থ্য অনুযায়ী চাঁদা।`, `A one-time ${tk(s.reg_fee)} joining fee and a monthly contribution that suits you.`)}>
      <section style={{ padding: '20px 0 60px' }}><div className="wrap grid join-grid">
        <JoinForm fee={s.reg_fee} payList={s.pay_methods} payInfo={s.pay_info} />
        <div>
          <div className="card"><h2 className="h2" style={{ marginTop: 0 }}>{t('সদস্যপদের নিয়ম', 'Membership rules')}</h2><ol className="terms">{s.member_terms.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2 className="h2" style={{ marginTop: 0 }}>{t('ভর্তি ফি যেভাবে দেবেন', 'How to pay the joining fee')}</h2>
            <p className="muted small" style={{ marginTop: 0 }}>{t(`নিবন্ধনের পর প্রোফাইল থেকেও এই তথ্য দেখতে পাবেন। ${tk(s.reg_fee)} পাঠিয়ে ট্রানজ্যাকশন আইডি প্রোফাইলে জানালে কমিটি দ্রুত যাচাই করতে পারবে।`, `You can also see this in your profile after registering. After sending ${tk(s.reg_fee)}, enter the transaction ID in your profile so the committee can verify faster.`)}</p>
            <PayMethods list={s.pay_methods} fallback={s.pay_info} />
          </div>
        </div>
      </div></section>
      </BuiltinPage>
    </>
  );
}
