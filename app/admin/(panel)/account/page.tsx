import type { Metadata } from 'next';
import { PasswordForm } from '@/app/(site)/portal/PasswordForm';
import { requirePage, ROLE_BN, STAFF } from '@/lib/guard';
import { PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'আমার অ্যাকাউন্ট' };

export default async function Account() {
  const { user, profile } = await requirePage(STAFF);
  return (
    <>
      <PageHead title="আমার অ্যাকাউন্ট" sub="নিজের লগইনের তথ্য ও পাসওয়ার্ড" />
      <div className="card" style={{ maxWidth: 560, marginBottom: 16 }}>
        <div className="check"><b style={{ minWidth: 110 }}>নাম</b><span>{profile.full_name || '-'}</span></div>
        <div className="check"><b style={{ minWidth: 110 }}>ইমেইল</b><span>{profile.email || user.email}</span></div>
        <div className="check"><b style={{ minWidth: 110 }}>মোবাইল</b><span>{profile.phone || '-'}</span></div>
        <div className="check"><b style={{ minWidth: 110 }}>ভূমিকা</b><span>{ROLE_BN[profile.role]}</span></div>
      </div>
      <div style={{ maxWidth: 560 }}><PasswordForm /></div>
    </>
  );
}
