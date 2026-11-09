import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { PageTitle } from '@/components/cards';
import { getStats } from '@/lib/public';
import { getSiteSettings } from '@/lib/settings';
import { graph, siteUrl } from '@/lib/schema';
import { getT } from '@/lib/lang';
import { bn } from '@/lib/fmt';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(); const s = await getSiteSettings();
  return { title: t('আমাদের কথা', 'About us'), description: t(`${s.org_name} এর লক্ষ্য, উদ্দেশ্য ও নামের পেছনের গল্প।`, `The mission, goals and the story behind the name of ${s.org_name}.`), alternates: { canonical: '/about' } };
}

export default async function About() {
  const t = getT();
  const [s, st] = await Promise.all([getSiteSettings(), getStats()]);
  return (
    <>
      <JsonLd data={graph(s, [{ '@type': 'AboutPage', url: `${siteUrl()}/about`, about: { '@id': `${siteUrl()}/#org` } }], [[t('আমাদের কথা', 'About us'), '/about']])} />
      <PageTitle title={t('আমাদের কথা', 'About us')} sub={t(`${s.org_name} একটি অরাজনৈতিক, স্বেচ্ছাসেবী সামাজিক সংগঠন।`, `${s.org_name} is a non-political, voluntary social organisation.`)} />
      <section className="sec" style={{ paddingTop: 20 }}><div className="wrap grid g2">
        <div className="card prose">
          <h2>{t('আমাদের লক্ষ্য', 'Our mission')}</h2>
          <p>{t('সমাজকে আরও সুন্দর করে গড়ে তোলা, যুবসমাজকে মাদকের ছোবল থেকে রক্ষা করা এবং দ্বীনের পথে ফিরিয়ে আনা।', 'To build a better society, protect our youth from the curse of drugs and bring them back to the path of faith.')}</p>
          <h2>{t('আমাদের উদ্দেশ্য', 'Our goals')}</h2>
          <ul>
            <li>{t('সদস্যদের সঞ্চয় থেকে বিনা সুদে করজে হাসানা প্রদান', 'Giving interest-free loans (Qard al-Hasan) from members’ savings')}</li>
            <li>{t('পাঠাগারের মাধ্যমে ইসলামিক ও জীবনমুখী জ্ঞানের চর্চা', 'Promoting Islamic and practical knowledge through our library')}</li>
            <li>{t('ছোট থেকে বয়স্ক সবার জন্য বিনামূল্যে কুরআন শিক্ষা', 'Free Quran classes for everyone, young and old')}</li>
            <li>{t('ফ্রি স্বাস্থ্যসেবা, শীতবস্ত্র বিতরণ ও মেধাবীদের শিক্ষাবৃত্তি', 'Free health checks, winter clothes distribution and scholarships for bright students')}</li>
            <li>{t('খেলাধুলার মাধ্যমে তরুণদের সুস্থ বিনোদন নিশ্চিত করা', 'Healthy recreation for young people through sports')}</li>
          </ul>
        </div>
        <div className="card prose">
          <h2>{t('নামের পেছনের গল্প', 'The story behind our name')}</h2>
          <p>{t('নবুওয়াতের আগে মক্কায় অন্যায়ের বিরুদ্ধে ও মজলুমের পক্ষে দাঁড়াতে যে শান্তিসংঘ গঠিত হয়েছিল, তার নাম ছিল হিলফুল ফুজুল। সেই চেতনা থেকেই আমাদের পথচলা।', 'Before prophethood, a peace pact called Hilful Fuzul was formed in Makkah to stand against injustice and for the oppressed. Our journey began from that same spirit.')}</p>
          <div className="grid g2" style={{ gap: 10 }}>
            <div className="kpi"><span>{t('সদস্য', 'Members')}</span><b>{bn(st.members)}</b></div>
            <div className="kpi"><span>{t('উপকৃত মানুষ', 'People helped')}</span><b>{bn(st.program_beneficiaries + st.borrowers)}+</b></div>
            <div className="kpi"><span>{t('পাঠাগারে বই', 'Library books')}</span><b>{bn(st.books)}</b></div>
            <div className="kpi"><span>{t('প্রতিষ্ঠা', 'Founded')}</span><b>{s.established}</b></div>
          </div>
        </div>
      </div></section>
    </>
  );
}
