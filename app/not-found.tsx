import Link from 'next/link';
import { getT } from '@/lib/lang';

export default function NotFound() {
  const t = getT();
  return (
    <section style={{ padding: '80px 18px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem' }} aria-hidden="true">🧭</div>
      <h1>{t('পাতাটি পাওয়া যায়নি', 'Page not found')}</h1>
      <p className="muted">{t('লিংকটি ভুল হতে পারে অথবা পাতাটি সরিয়ে ফেলা হয়েছে।', 'The link may be wrong or the page has been moved.')}</p>
      <Link className="btn pri" href="/">{t('হোমে ফিরুন', 'Back to home')}</Link>
    </section>
  );
}
