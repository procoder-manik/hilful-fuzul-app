import type { Metadata } from 'next';
import { BuiltinPage } from '@/components/blocks/BuiltinPage';
import { getSiteSettings } from '@/lib/settings';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('শর্তাবলী', 'Terms and conditions'), description: t('সদস্যপদ ও করজে হাসানার শর্তাবলী।', 'Terms for membership and interest-free loans.'), alternates: { canonical: '/terms' } };
}

export default async function Terms() {
  const t = getT();
  const s = await getSiteSettings();
  return (
    <>
      <BuiltinPage slug="terms" title={t('শর্তাবলী', 'Terms and conditions')}>
      <section style={{ padding: '20px 0 60px' }}><div className="wrap grid g2" style={{ alignItems: 'start' }}>
        <div className="card"><h2 className="h2" style={{ marginTop: 0 }}>{t('সদস্যপদের শর্তাবলী', 'Membership terms')}</h2><ol className="terms">{s.member_terms.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
        <div className="card"><h2 className="h2" style={{ marginTop: 0 }}>{t('করজে হাসানার শর্তাবলী', 'Interest-free loan terms')}</h2><ol className="terms">{s.loan_terms.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
      </div></section>
      </BuiltinPage>
    </>
  );
}
