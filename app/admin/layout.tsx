import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getSettings } from '@/lib/settings';

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminRoot({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <Link href="/admin" className="brand"><span className="logo"><Logo /></span><span className="brand-t"><b>{s.org_name}</b><small>ব্যবস্থাপনা</small></span></Link>
          <div className="top-act"><ThemeToggle /><Link className="btn sm" href="/" target="_blank">ওয়েবসাইট দেখুন</Link></div>
        </div>
      </header>
      {children}
    </>
  );
}
