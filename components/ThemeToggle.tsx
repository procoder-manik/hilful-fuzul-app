'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { useT } from './LangProvider';

/** পেজ লোডের আগেই থিম বসানোর স্ক্রিপ্ট (ফ্ল্যাশ এড়াতে) */
export const THEME_SCRIPT = `try{var t=localStorage.getItem('hf_theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeToggle() {
  const { t } = useT();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const d = document.documentElement.dataset.theme;
    setDark(d ? d === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);
  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('hf_theme', next); } catch {}
    setDark(!dark);
  };
  return <button className="icon-btn" onClick={toggle} aria-label={dark ? t('লাইট মোড', 'Light mode') : t('ডার্ক মোড', 'Dark mode')}><Icon name={dark ? 'sun' : 'moon'} /></button>;
}
