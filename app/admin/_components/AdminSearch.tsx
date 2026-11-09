'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { searchItems } from '@/lib/adminsearch';
import type { Role } from '@/lib/types';

/** অ্যাডমিনের সার্চ: পাতা ও সেটিং খুঁজে সরাসরি সেখানে যাওয়া (Ctrl + K বা / চাপলেও খোলে) */
export function AdminSearch({ role }: { role: Role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = searchItems(q, role);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); }
      else if (e.key === '/' && !typing) { e.preventDefault(); setOpen(true); }
      else if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => input.current?.focus(), 30); document.body.style.overflow = 'hidden'; } else document.body.style.overflow = ''; return () => { document.body.style.overflow = ''; }; }, [open]);

  const go = (href: string) => { setOpen(false); router.push(href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(x + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
    else if (e.key === 'Enter' && list[i]) { e.preventDefault(); go(list[i].href); }
  };

  return (
    <>
      <button type="button" className="as-btn" onClick={() => setOpen(true)} aria-label="খুঁজুন (Search)">
        <Icon name="search" /><span>খুঁজুন<small className="en-hint">(Search)</small></span><kbd>Ctrl K</kbd>
      </button>
      {open && (
        <div className="as-back" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="as-box" role="dialog" aria-modal="true" aria-label="অ্যাডমিন সার্চ">
            <div className="as-in"><Icon name="search" /><input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setI(0); }} onKeyDown={onKey} placeholder="পাতা বা সেটিং খুঁজুন: পপআপ, ভর্তি ফি, বিকাশ, ব্যানার... (Search pages & settings)" aria-label="খুঁজুন" /></div>
            <div className="as-list" role="listbox">
              {list.length === 0 && <p className="muted" style={{ padding: 16, margin: 0 }}>কিছু পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন। (Nothing found)</p>}
              {list.map((x, n) => (
                <button type="button" key={x.href + x.t} role="option" aria-selected={n === i} className={`as-item${n === i ? ' on' : ''}`} onMouseEnter={() => setI(n)} onClick={() => go(x.href)}>
                  <span className="as-g">{x.group === 'সেটিং' ? 'সেটিং' : 'পাতা'}</span><span><b>{x.t}</b><small className="en-hint">({x.en})</small></span>
                </button>
              ))}
            </div>
            <div className="as-foot muted small">↑ ↓ বেছে নিন, Enter চাপলে যাবেন, Esc বন্ধ করে। (/ চাপলেও সার্চ খোলে)</div>
          </div>
        </div>
      )}
    </>
  );
}
