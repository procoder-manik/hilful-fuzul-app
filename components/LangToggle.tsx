'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setLang } from '@/app/lang-actions';
import { useLang } from './LangProvider';

/** বাংলা | EN টগল। হেডার ও ফুটারে বসে */
export function LangToggle({ className = '' }: { className?: string }) {
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const pick = (l: 'bn' | 'en') => {
    if (l === lang) return;
    start(async () => { await setLang(l); router.refresh(); });
  };
  return (
    <div className={`lang ${className}`} role="group" aria-label="ভাষা / Language" aria-busy={pending}>
      <button type="button" className={lang === 'bn' ? 'on' : ''} onClick={() => pick('bn')} aria-pressed={lang === 'bn'} lang="bn">বাংলা</button>
      <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => pick('en')} aria-pressed={lang === 'en'} lang="en">EN</button>
    </div>
  );
}
