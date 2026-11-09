'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { ThemeToggle } from './ThemeToggle';
import { useT } from './LangProvider';
import type { MenuNode } from '@/lib/menu';

const active = (path: string, href: string) => { const b = href.split('?')[0]; return b === '/' ? path === '/' : b !== '#' && path.startsWith(b); };

/** মোবাইলের নিচের ট্যাব বার। শেষ ট্যাবে "মেনু" চাপলে ড্যাশবোর্ডে বানানো পুরো মেনু (ড্রপডাউনসহ) আসে */
export function TabBar({ account, accountLabel, menu }: { account: string; accountLabel: [string, string]; menu: MenuNode[] }) {
  const path = usePathname();
  const { t } = useT();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [path]);
  useEffect(() => {
    if (!more) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMore(false);
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [more]);
  const tabs: [string, string, string, string][] = [['/', 'home', 'হোম', 'Home'], ['/services', 'heart', 'সেবা', 'Services'], ['/transparency', 'chart', 'স্বচ্ছতা', 'Accounts'], ['/library', 'book', 'পাঠাগার', 'Library'], [account, 'user', accountLabel[0], accountLabel[1]]];
  return (
    <>
      <nav className="tabbar" aria-label={t('মোবাইল মেনু', 'Mobile menu')}>
        {tabs.map(([h, i, bn, en]) => <Link key={h + i} href={h} className={active(path, h) ? 'on' : ''}><Icon name={i} /><span>{t(bn, en)}</span></Link>)}
        <button type="button" className={more ? 'on' : ''} onClick={() => setMore((m) => !m)} aria-expanded={more} aria-label={t('আরও মেনু', 'More')}><Icon name="menu" /><span>{t('মেনু', 'Menu')}</span></button>
      </nav>
      {more && (
        <div className="modal" role="dialog" aria-modal="true" aria-label={t('সব পেজ', 'All pages')}>
          <div className="mback" onClick={() => setMore(false)} />
          <div className="msheet">
            <div className="mhead"><b>{t('সব পেজ', 'All pages')}</b><button className="icon-btn" onClick={() => setMore(false)} aria-label={t('বন্ধ', 'Close')}><Icon name="x" /></button></div>
            <div className="mbody">
              <div className="moregrid">
                {menu.map((n) => (
                  <div key={n.id} className={n.children.length ? 'mg-group' : undefined}>
                    <Link href={n.url} className={active(path, n.url) ? 'on' : ''}>{n.icon && <span aria-hidden="true">{n.icon} </span>}{n.label}</Link>
                    {n.children.map((c) => <Link key={c.id} href={c.url} className="mg-sub">{c.icon && <span aria-hidden="true">{c.icon} </span>}{c.label}</Link>)}
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}><ThemeToggle /></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
