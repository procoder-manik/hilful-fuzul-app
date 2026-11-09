'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/components/LangProvider';
import { Icon } from '@/components/Icon';
import type { PublicMember } from '@/lib/public';

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((x) => x.charAt(0)).join('');

function Avatar({ m, size }: { m: PublicMember; size: number }) {
  return (
    <span className={`mc-av mc-c${(m.name.length % 6) + 1}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {m.photo_url ? <img src={m.photo_url} alt="" loading="lazy" /> : initials(m.name)}
    </span>
  );
}

/** সদস্যদের কার্ডের তালিকা; কার্ডে চাপলে পপআপে বিস্তারিত */
export function MembersGrid({ list }: { list: PublicMember[] }) {
  const { t, bn, tk, fd } = useT();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<PublicMember | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const shown = useMemo(() => { const k = q.trim().toLowerCase(); return k ? list.filter((m) => m.name.toLowerCase().includes(k) || m.member_no.toLowerCase().includes(k)) : list; }, [q, list]);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; lastFocus.current?.focus(); };
  }, [open]);

  const years = (mo: number) => (mo >= 12 ? t(`${bn(Math.floor(mo / 12))} বছর ${mo % 12 ? `${bn(mo % 12)} মাস` : ''}`, `${Math.floor(mo / 12)} yr ${mo % 12 ? `${mo % 12} mo` : ''}`) : t(`${bn(mo)} মাস`, `${mo} mo`));
  const loanLine = (m: PublicMember) => (m.loan_count === 0 ? t('কোনো ঋণ নেননি', 'No loans taken')
    : t(`${bn(m.loan_count)}টি ঋণ${m.loan_total != null ? `, মোট ${tk(m.loan_total)}` : ''}`, `${m.loan_count} loan${m.loan_count > 1 ? 's' : ''}${m.loan_total != null ? `, ${tk(m.loan_total)} in total` : ''}`));

  return (
    <>
      <div className="mg-bar">
        <label className="mg-search"><Icon name="user" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('নাম বা সদস্য নম্বর দিয়ে খুঁজুন', 'Search by name or member no.')} aria-label={t('সদস্য খুঁজুন', 'Search members')} /></label>
        <span className="muted small">{t(`${bn(shown.length)} জন সদস্য`, `${shown.length} members`)}</span>
      </div>
      {shown.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: 30 }}>{t('কোনো সদস্য পাওয়া যায়নি।', 'No members found.')}</p>}
      <div className="mg-grid">
        {shown.map((m) => (
          <button key={m.id} type="button" className="mc" onClick={() => setOpen(m)} aria-haspopup="dialog">
            <Avatar m={m} size={72} />
            <b className="mc-n">{m.name}</b>
            <span className="mc-no">{m.member_no}</span>
            <span className="mc-d">{t('যোগদান', 'Joined')} {fd(m.join_date)}</span>
            <span className="mc-b">{m.verified && <i className="mc-v">✓ {t('যাচাইকৃত', 'Verified')}</i>}{m.status === 'frozen' && <i className="mc-f">{t('স্থগিত', 'Suspended')}</i>}</span>
          </button>
        ))}
      </div>

      {open && (
        <div className="mp-back" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="mp" role="dialog" aria-modal="true" aria-label={open.name}>
            <button ref={closeRef} type="button" className="mp-x" onClick={() => setOpen(null)} aria-label={t('বন্ধ করুন', 'Close')}><Icon name="x" /></button>
            <div className={`mp-top mc-c${(open.name.length % 6) + 1}`}>
              <Avatar m={open} size={96} />
              <h2>{open.name}</h2>
              <div className="mp-tags"><span>{open.member_no}</span>{open.verified && <span>✓ {t('যাচাইকৃত সদস্য', 'Verified member')}</span>}<span>{open.status === 'active' ? t('সক্রিয়', 'Active') : t('স্থগিত', 'Suspended')}</span></div>
            </div>
            <div className="mp-body">
              <div className="mp-grid">
                <div className="mp-i"><span>{t('সদস্য হয়েছেন', 'Member since')}</span><b>{fd(open.join_date)}</b></div>
                <div className="mp-i"><span>{t('এ পর্যন্ত আছেন', 'With us for')}</span><b>{years(open.months_since)}</b></div>
                <div className="mp-i"><span>{t('মাসিক চাঁদা', 'Monthly contribution')}</span><b>{open.monthly_amount != null ? tk(open.monthly_amount) : t('প্রকাশিত নয়', 'Private')}</b></div>
                <div className="mp-i"><span>{t('এ পর্যন্ত মোট জমা', 'Total contributed')}</span><b>{open.total_paid != null ? tk(open.total_paid) : t('প্রকাশিত নয়', 'Private')}</b></div>
                <div className="mp-i"><span>{t('চাঁদা দিয়েছেন', 'Months paid')}</span><b>{t(`${bn(open.paid_months)} মাস`, `${open.paid_months} months`)}</b></div>
                <div className="mp-i"><span>{t('করজে হাসানা', 'Interest-free loans')}</span><b>{loanLine(open)}</b></div>
                {open.loan_balance != null && open.loan_count > 0 && <div className="mp-i"><span>{t('ঋণের বাকি', 'Loan balance')}</span><b>{open.loan_balance > 0 ? tk(open.loan_balance) : t('সম্পূর্ণ পরিশোধিত ✓', 'Fully repaid ✓')}</b></div>}
                <div className="mp-i"><span>{t('পাঠাগার থেকে বই নিয়েছেন', 'Library books borrowed')}</span><b>{t(`${bn(open.books_borrowed)}টি`, `${open.books_borrowed}`)}</b></div>
              </div>
              {!open.money_visible && <p className="muted small" style={{ margin: '12px 0 0' }}>{t('সংগঠন টাকার অঙ্ক প্রকাশ না করার সিদ্ধান্ত নিয়েছে।', 'The organisation chooses not to show money amounts.')}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
