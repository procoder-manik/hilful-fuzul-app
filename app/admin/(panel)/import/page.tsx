import type { Metadata } from 'next';
import { ImportForm } from './ImportForm';
import { requirePage } from '@/lib/guard';
import { IMPORTERS } from '@/lib/importers';
import { DATASETS } from '@/lib/datasets';
import { PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'ইমপোর্ট ও ব্যাকআপ' };

export default async function ImportPage() {
  const { profile } = await requirePage(['admin', 'treasurer', 'librarian']);
  const kinds = Object.entries(IMPORTERS).filter(([, v]) => v.roles.includes(profile.role)).map(([k, v]) => [k, v.title] as [string, string]);
  const exportable = Object.entries(DATASETS).filter(([, v]) => v.roles.includes(profile.role));
  return (
    <>
      <PageHead title="ইমপোর্ট ও ব্যাকআপ" sub="পুরোনো খাতার তথ্য Excel বা CSV থেকে একবারে যোগ করুন, আর নিয়মিত পুরো ডেটার ব্যাকআপ নামিয়ে রাখুন।" />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div>
          {profile.role === 'admin' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <b>পুরো ব্যাকআপ</b>
              <p className="muted small">সদস্য, চাঁদা, ঋণ, ঋণ ফেরত, দান, বই, বই ধার, সেবা, অনুষ্ঠান, কমিটি, সংবাদ ও আবেদন, সব আলাদা শিটে একটি Excel ফাইলে। মাসে অন্তত একবার নামিয়ে কম্পিউটার ও পেনড্রাইভ বা গুগল ড্রাইভে রাখুন।</p>
              <a className="btn pri" href="/admin/export/backup?format=xlsx" download>⬇ পুরো ব্যাকআপ নামান (Excel)</a>
            </div>
          )}
          <div className="card">
            <b>আলাদা তালিকা নামান</b>
            <p className="muted small">সব সময়ের তথ্য। নির্দিষ্ট সময়ের জন্য সংশ্লিষ্ট পাতার ফিল্টার থেকে নামান।</p>
            {exportable.map(([k, v]) => (
              <div key={k} className="check" style={{ justifyContent: 'space-between' }}><b>{v.title}</b>
                <span className="row" style={{ gap: 6 }}><a className="btn sm" href={`/admin/export/${k}?r=all&format=xlsx`} download>Excel</a><a className="btn sm" href={`/admin/export/${k}?r=all&format=csv`} download>CSV</a></span></div>
            ))}
          </div>
        </div>
        <div>
          <ImportForm kinds={kinds} />
          <div className="card" style={{ marginTop: 16 }}>
            <b>ফাইল কীভাবে সাজাবেন</b>
            <ol className="terms small" style={{ marginTop: 8 }}>
              <li>নিচের খালি নমুনা ফাইল নামিয়ে Excel এ খুলুন। প্রথম সারির শিরোনাম বদলাবেন না, নিচে তথ্য লিখুন। এই ব্যবস্থা থেকে নামানো এক্সপোর্ট ফাইলও সরাসরি ইমপোর্ট করা যায়।</li>
              <li>তারিখ লিখুন 2026-10-25 অথবা 25/10/2026 (দিন/মাস/বছর)। মাসিক চাঁদার "কোন মাসের" ঘরে 2026-10।</li>
              <li>বাংলা বা ইংরেজি অঙ্ক দুটোই চলে। টাকার ঘরে ৳ বা কমা থাকলেও চলবে।</li>
              <li>একই সদস্য (মোবাইল), একই রসিদ, একই মাসের চাঁদা বা একই বই আগে থেকে থাকলে সেই সারি বাদ যাবে, তাই একই ফাইল দুইবার দিলেও দ্বিগুণ হবে না।</li>
              <li>আগে "যাচাই করুন" দিয়ে ফল দেখে নিন, তারপর "ইমপোর্ট করুন"।</li>
            </ol>
            <div className="row" style={{ gap: 6 }}>{kinds.map(([k, n]) => <a key={k} className="btn sm" href={`/admin/export/${k}?template=1&format=csv`} download>নমুনা: {n}</a>)}</div>
          </div>
        </div>
      </div>
    </>
  );
}
