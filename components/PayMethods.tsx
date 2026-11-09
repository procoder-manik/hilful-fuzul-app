'use client';
import { useState } from 'react';
import { useT } from './LangProvider';
import type { PayMethod } from '@/lib/types';

const ICON: Record<PayMethod['kind'], string> = { bkash: '📱', nagad: '📱', rocket: '📱', bank: '🏦', cash: '🤝', other: '💳' };

/** ভর্তি ফি বা চাঁদা জমা দেওয়ার মাধ্যমগুলো (নম্বরে চাপলেই কপি) */
export function PayMethods({ list, fallback }: { list: PayMethod[]; fallback?: string | null }) {
  const { t } = useT();
  const [copied, setCopied] = useState('');
  const copy = async (n: string) => {
    try { await navigator.clipboard.writeText(n); setCopied(n); setTimeout(() => setCopied(''), 1500); } catch { /* পুরোনো ব্রাউজারে নীরবে বাদ */ }
  };
  if (!list.length) return fallback ? <p className="muted" style={{ margin: 0 }}>{fallback}</p> : null;
  return (
    <div className="paym">
      {list.map((m, i) => (
        <div className="pm" key={i}>
          <span className="pm-i" aria-hidden="true">{ICON[m.kind] ?? '💳'}</span>
          <div className="pm-b">
            <b>{m.label}</b>
            {m.number && (m.kind === 'cash'
              ? <span className="muted small">{m.number}</span>
              : <button type="button" className="pm-n" onClick={() => copy(m.number)} aria-label={t('নম্বর কপি করুন', 'Copy number')}>{m.number} <small>{copied === m.number ? t('কপি হয়েছে ✓', 'Copied ✓') : t('কপি', 'Copy')}</small></button>)}
            {m.note && <span className="muted small">{m.note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
