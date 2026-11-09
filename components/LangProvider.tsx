'use client';
import { createContext, useContext } from 'react';
import { bn as fbn, fd as ffd, tk as ftk, ymLabel as fym, type Lang } from '@/lib/format';

const Ctx = createContext<Lang>('bn');
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);

/** ক্লায়েন্ট কম্পোনেন্টের জন্য: t('বাংলা', 'English') ও সংখ্যা/তারিখের ফরম্যাটার */
export function useT() {
  const lang = useLang();
  const t = (bn: string, en: string) => (lang === 'en' ? en : bn);
  return { t, lang, bn: (x: string | number) => fbn(x, lang), tk: (n: number) => ftk(n, lang), fd: (d?: string | null) => ffd(d, lang), ym: (d: string) => fym(d, lang) };
}
