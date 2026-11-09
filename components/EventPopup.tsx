'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useT } from './LangProvider';

/** হোমপেজে একবার (প্রতি সেশনে) আসন্ন অনুষ্ঠানের পপআপ */
export function EventPopup({ id, outcome, children }: { id: string; outcome?: string | null; children: React.ReactNode }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const key = 'hf_pop_' + id;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch {}
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [id]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={t('আসন্ন অনুষ্ঠান', 'Upcoming event')}>
      <div className="mback" onClick={() => setOpen(false)} />
      <div className="msheet">
        <div className="mhead"><b>{t('আসন্ন অনুষ্ঠান', 'Upcoming event')}</b><button className="icon-btn" onClick={() => setOpen(false)} aria-label={t('বন্ধ', 'Close')}>✕</button></div>
        <div className="mbody">
          {children}
          {outcome && <div className="card flat" style={{ marginTop: 12 }}><b>{t('এই সভা থেকে আমাদের পরবর্তী উদ্যোগ', 'Our next steps from this meeting')}</b><p className="muted small" style={{ margin: '4px 0 0' }}>{outcome}</p></div>}
          <div className="row" style={{ marginTop: 14 }}><Link className="btn pri" href="/events" onClick={() => setOpen(false)}>{t('বিস্তারিত দেখুন', 'View details')}</Link><button className="btn" onClick={() => setOpen(false)}>{t('পরে দেখব', 'Maybe later')}</button></div>
        </div>
      </div>
    </div>
  );
}
