import type { Metadata } from 'next';
import { CollectionChart, MembersChart } from '@/components/Charts';
import { JsonLd } from '@/components/JsonLd';
import { PageTitle } from '@/components/cards';
import { getDonations, getLoans, getMonthly, getStats } from '@/lib/public';
import { getSiteSettings } from '@/lib/settings';
import { graph } from '@/lib/schema';
import { getLang, getT } from '@/lib/lang';
import { bn, fd, monthsShort, tk, ymLabel } from '@/lib/fmt';
import { Badge, LOAN_ST, LOAN_ST_EN } from '@/lib/ui';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('স্বচ্ছতা ও আয়-ব্যয়ের হিসাব', 'Transparency and accounts'), description: t('মোট তহবিল, মাসিক সংগ্রহ, বিনা সুদে ঋণ বিতরণ ও ফেরত, দাতাদের তালিকা: সব হিসাব সবার জন্য উন্মুক্ত।', 'Total fund, monthly collection, interest-free loans given and repaid, and the donor list: all accounts are open to everyone.'), alternates: { canonical: '/transparency' } };
}
export const dynamic = 'force-dynamic';

export default async function Transparency() {
  const t = getT();
  const [s, st, monthly, loans, donations] = await Promise.all([getSiteSettings(), getStats(), getMonthly(), getLoans(), getDonations()]);
  const ms = monthsShort();
  const labels = monthly.map((x) => ms[Number(x.month.slice(5, 7)) - 1]);
  const kpis: [string, number][] = [[t('মোট সংগ্রহ', 'Total raised'), st.total_fund], [t('সদস্য চাঁদা', 'Member contributions'), st.total_contributions], [t('দান', 'Donations'), st.total_donations], [t('মোট ঋণ বিতরণ', 'Total loans given'), st.total_loaned], [t('ঋণ ফেরত এসেছে', 'Loans repaid'), st.total_repaid], [t('বকেয়া ঋণ', 'Loans outstanding'), st.total_loaned - st.total_repaid], [t('বর্তমানে হাতে', 'Currently in hand'), st.total_fund - st.total_loaned + st.total_repaid], [t('এই মাসে সংগ্রহ', 'Collected this month'), st.month_collected]];
  return (
    <>
      <JsonLd data={graph(s, [], [[t('স্বচ্ছতা', 'Transparency'), '/transparency']])} />
      <PageTitle title={t('স্বচ্ছতা ও হিসাব', 'Transparency and accounts')} sub={t('প্রতিটি টাকার উৎস ও ব্যবহার সবার জন্য উন্মুক্ত। তথ্য প্রতিদিন হালনাগাদ হয়।', 'The source and use of every taka is open to all. Data is updated daily.')} />
      <section style={{ padding: '20px 0 60px' }}><div className="wrap">
        <div className="grid g4">{kpis.map(([l, v]) => <div className="kpi" key={l}><span>{l}</span><b>{tk(v)}</b></div>)}</div>
        <div className="grid g2" style={{ marginTop: 16 }}>
          <div className="card"><b>{t('১২ মাসের সংগ্রহ ও ঋণ', '12-month collection and loans')}</b><CollectionChart labels={labels} collected={monthly.map((x) => +x.collected)} loaned={monthly.map((x) => +x.loaned)} repaid={monthly.map((x) => +x.repaid)} /></div>
          <div className="card"><b>{t('সদস্য বৃদ্ধি', 'Membership growth')}</b><MembersChart labels={labels} members={monthly.map((x) => x.members)} /></div>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <b>{t('মাসভিত্তিক হিসাব', 'Month-by-month accounts')}</b>
          <div className="scroll"><table className="tbl"><thead><tr><th>{t('মাস', 'Month')}</th><th>{t('সংগ্রহ', 'Collected')}</th><th>{t('ঋণ বিতরণ', 'Loans given')}</th><th>{t('ঋণ ফেরত', 'Repaid')}</th><th>{t('মোট সদস্য', 'Members')}</th></tr></thead><tbody>
            {[...monthly].reverse().map((x) => <tr key={x.month}><td>{ymLabel(x.month)}</td><td>{tk(x.collected)}</td><td>{tk(x.loaned)}</td><td>{tk(x.repaid)}</td><td>{bn(x.members)}</td></tr>)}
          </tbody></table></div>
        </div>
        <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
          <div className="card"><b>{t('করজে হাসানা তালিকা', 'Interest-free loan list')}</b>
            <div className="scroll"><table className="tbl"><thead><tr><th>{t('নাম', 'Name')}</th><th>{t('পরিমাণ', 'Amount')}</th><th>{t('তারিখ', 'Date')}</th><th>{t('অবস্থা', 'Status')}</th></tr></thead><tbody>
              {loans.map((l) => <tr key={l.id}><td>{l.borrower}</td><td>{tk(l.amount)}</td><td>{fd(l.issued_on)}<div className="muted small">{bn(l.term_months)} {t('মাস', 'months')}</div></td><td><Badge map={getLang() === 'en' ? LOAN_ST_EN : LOAN_ST} k={l.status} /></td></tr>)}
            </tbody></table></div>
          </div>
          <div className="card"><b>{t('দাতাদের তালিকা', 'Donor list')}</b>
            <div className="scroll"><table className="tbl"><thead><tr><th>{t('দাতা', 'Donor')}</th><th>{t('পরিমাণ', 'Amount')}</th><th>{t('খাত', 'Purpose')}</th><th>{t('তারিখ', 'Date')}</th></tr></thead><tbody>
              {donations.map((d) => <tr key={d.id}><td>{d.donor}</td><td>{tk(d.amount)}</td><td>{d.purpose}</td><td>{fd(d.donated_on)}</td></tr>)}
            </tbody></table></div>
          </div>
        </div>
      </div></section>
    </>
  );
}
