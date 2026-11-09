'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { useT } from './LangProvider';

type Msg = { role: 'user' | 'assistant'; content: string };
type Who = 'guest' | 'member' | 'staff';

const CHIPS: Record<'bn' | 'en', Record<Who, string[]>> = {
  bn: {
    guest: ['সদস্য হওয়ার নিয়ম কী?', 'আসন্ন অনুষ্ঠান কবে?', 'মোট কতজন সদস্য?', 'ঋণ কীভাবে পাব?', 'কীভাবে টাকা জমা দেব?'],
    member: ['আমার বকেয়া কত?', 'এই মাসের চাঁদা দিয়েছি?', 'শেষ তারিখ কবে?', 'আমার ঋণের অবস্থা কী?'],
    staff: ['এই মাসে কত টাকা উঠেছে?', 'মোট কতজন সদস্য?', 'আসন্ন অনুষ্ঠান কবে?'],
  },
  en: {
    guest: ['How do I become a member?', 'When is the next event?', 'How many members are there?', 'How can I get a loan?', 'How do I pay?'],
    member: ['How much do I owe?', 'Have I paid this month?', 'When is my due date?', 'What is my loan status?'],
    staff: ['How much was collected this month?', 'How many members are there?', 'When is the next event?'],
  },
};
const PAGES = /(\/(?:join|login|contact|transparency|library|events|committee|support|terms|news|about|services|portal|privacy))(?![\w/])/g;

/** উত্তরের লেখায় /join ধরনের পেজের ঠিকানাকে ক্লিকযোগ্য লিংক করে */
function Linked({ text }: { text: string }) {
  const parts = text.split(PAGES);
  return <>{parts.map((p, i) => (i % 2 ? <Link key={i} href={p}>{p}</Link> : <Fragment key={i}>{p}</Fragment>))}</>;
}

export function ChatWidget({ who, name, shortName, enabled }: { who: Who; name: string | null; shortName: string; enabled: boolean }) {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const sid = useRef('');

  // লগইন অবস্থা বদলালে নতুন করে শুরু
  useEffect(() => { setMsgs([]); }, [who, name, lang]);
  useEffect(() => {
    try {
      sid.current = sessionStorage.getItem('hf-chat') || Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem('hf-chat', sid.current);
    } catch { sid.current = Math.random().toString(36).slice(2, 12); }
  }, []);
  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight, behavior: 'smooth' }); }, [msgs, busy, open]);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 120);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => { clearTimeout(t); window.removeEventListener('keydown', esc); };
  }, [open]);

  if (!enabled) return null;

  async function ask(q: string) {
    q = q.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: q }];
    setMsgs(next); setText(''); setBusy(true);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next, sid: sid.current }) });
      const d = await r.json().catch(() => ({}));
      setMsgs([...next, { role: 'assistant', content: d.answer || t('দুঃখিত, এখন উত্তর দিতে পারছি না।', 'Sorry, I cannot answer right now.') }]);
    } catch {
      setMsgs([...next, { role: 'assistant', content: t('ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।', 'No internet connection. Please try again shortly.') }]);
    } finally { setBusy(false); }
  }

  const hello = t(`আসসালামু আলাইকুম${who === 'member' && name ? ' ' + name : ''}! আমি ${shortName} এর সহায়ক। যা জানতে চান লিখুন।`, `Assalamu alaikum${who === 'member' && name ? ' ' + name : ''}! I am the assistant of ${shortName}. Ask me anything.`);
  return (
    <>
      <button className="fab" onClick={() => setOpen((o) => !o)} aria-label={open ? t('চ্যাট বন্ধ করুন', 'Close chat') : t('চ্যাট সহকারী খুলুন', 'Open chat assistant')} aria-expanded={open}>
        <Icon name={open ? 'x' : 'chat'} />
      </button>
      <div className={`chat${open ? ' open' : ''}`} role="dialog" aria-label="চ্যাট সহকারী" aria-hidden={!open}>
        <div className="chat-h">
          <div className="logo"><Logo /></div>
          <div>
            <b style={{ fontFamily: 'var(--fd)' }}>{t('সহায়ক বট', 'Assistant')}</b>
            <div className="small" style={{ opacity: 0.88 }}>
              {who === 'member' ? `${t('লগইন', 'Logged in')}: ${name ?? t('সদস্য', 'Member')}` : who === 'staff' ? t('কমিটি', 'Committee') : t('অতিথি হিসেবে', 'Guest')}
            </div>
          </div>
          <button className="icon-btn" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.18)', color: '#fff' }} onClick={() => setOpen(false)} aria-label={t('বন্ধ করুন', 'Close')}><Icon name="x" /></button>
        </div>
        <div className="chat-b" ref={body} aria-live="polite">
          <div className="msg b">
            {hello}
            {who === 'guest' && <> {t('নিজের হিসাব জানতে', 'To see your own account,')} <Link href="/login">{t('লগইন করুন', 'log in')}</Link>{t(', অতিথি হিসেবেও প্রশ্ন করতে পারেন।', '. You can also ask as a guest.')}</>}
          </div>
          {msgs.length === 0 && (
            <div className="chips">{CHIPS[lang][who].map((c) => <button key={c} onClick={() => ask(c)}>{c}</button>)}</div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'u' : 'b'}`}>{m.role === 'user' ? m.content : <Linked text={m.content} />}</div>
          ))}
          {busy && <div className="msg b" aria-label={t('উত্তর লেখা হচ্ছে', 'Typing')}><span className="typing"><span /><span /><span /></span></div>}
        </div>
        <form className="chat-f" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
          <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('যেকোনো প্রশ্ন লিখুন...', 'Type your question...')} autoComplete="off" maxLength={500} aria-label={t('প্রশ্ন', 'Question')} />
          <button className="icon-btn" style={{ background: 'var(--acc)', color: '#fff', borderRadius: '50%' }} disabled={busy || !text.trim()} aria-label={t('পাঠান', 'Send')}><Icon name="send" /></button>
        </form>
      </div>
    </>
  );
}
