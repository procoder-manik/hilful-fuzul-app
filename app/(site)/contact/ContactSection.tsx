import { ActionForm, Submit } from '@/app/admin/_components/ActionForm';
import { Icon } from '@/components/Icon';
import { sendMessage } from './actions';
import { getT } from '@/lib/lang';
import { bn } from '@/lib/fmt';
import type { Settings } from '@/lib/types';

// ফর্মের মান (value) বাংলাতেই থাকে, যাতে কমিটি অ্যাডমিন প্যানেলে একই বিষয় দেখে
const SUBJECTS: [string, string][] = [['সাধারণ প্রশ্ন', 'General question'], ['দান করতে চাই', 'I want to donate'], ['সদস্যপদ', 'Membership'], ['করজে হাসানা', 'Interest-free loan'], ['স্বেচ্ছাসেবক হতে চাই', 'I want to volunteer'], ['অভিযোগ বা পরামর্শ', 'Complaint or suggestion']];

/** যোগাযোগ পাতার ফর্ম ও তথ্যের কার্ড (পেজ বিল্ডারের "যোগাযোগ" কম্পোনেন্ট) */
export function ContactSection({ s, formTitle, showForm = true, showCards = true }: { s: Settings; formTitle?: string; showForm?: boolean; showCards?: boolean }) {
  const t = getT();
  const cards = [
    ['phone', t('ফোন', 'Phone'), s.phone && bn(s.phone), s.phone && `tel:${s.phone}`],
    ['phone', t('দ্বিতীয় ফোন', 'Second phone'), s.phone2 && bn(s.phone2), s.phone2 && `tel:${s.phone2}`],
    ['mail', t('ইমেইল', 'Email'), s.email, s.email && `mailto:${s.email}`],
    ['chat', t('হোয়াটসঅ্যাপ', 'WhatsApp'), s.whatsapp && bn(s.whatsapp), s.whatsapp && `https://wa.me/88${s.whatsapp.replace(/\D/g, '').replace(/^88/, '')}`],
    ['pin', t('ঠিকানা', 'Address'), s.address, s.map_url ?? null],
    ['clock', t('অফিসের সময়', 'Office hours'), s.office_hours, null],
    ['globe', 'Facebook', s.facebook && s.facebook.replace(/^https?:\/\/(www\.)?/, ''), s.facebook],
    ['globe', 'YouTube', s.youtube && s.youtube.replace(/^https?:\/\/(www\.)?/, ''), s.youtube],
  ].filter(([, , v]) => v) as [string, string, string, string | null][];
  return (
    <section style={{ padding: '20px 0 60px' }}><div className={`wrap${showForm && showCards ? ' grid g2' : ''}`} style={{ alignItems: 'start', ...(showForm && showCards ? {} : { maxWidth: 820 }) }}>
      {showForm && (
        <ActionForm action={sendMessage} className="card" resetOnSuccess>
          <h2 className="h2" style={{ marginTop: 0 }}>{formTitle || t('বার্তা পাঠান', 'Send a message')}</h2>
          <label className="f"><span>{t('নাম *', 'Name *')}</span><input name="name" required autoComplete="name" /></label>
          <label className="f"><span>{t('মোবাইল', 'Mobile')}</span><input name="phone" inputMode="tel" autoComplete="tel" /></label>
          <label className="f"><span>{t('বিষয়', 'Subject')}</span><select name="subject">{SUBJECTS.map(([v, e]) => <option key={v} value={v}>{t(v, e)}</option>)}</select></label>
          <label className="f"><span>{t('বার্তা *', 'Message *')}</span><textarea name="message" required maxLength={3000} /></label>
          <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
          <Submit pendingText={t('পাঠানো হচ্ছে...', 'Sending...')}>{t('বার্তা পাঠান', 'Send message')}</Submit>
        </ActionForm>
      )}
      {showCards && (
        <div className="grid" style={{ gap: 12 }}>
          {cards.map(([i, l, v, h]) => {
            const inner = <><span className="logo soft-logo"><Icon name={i} /></span><span><span className="muted small">{l}</span><b style={{ display: 'block' }}>{v}</b></span></>;
            return h ? <a key={l} className="card row" style={{ flexWrap: 'nowrap', textDecoration: 'none' }} href={h} target={h.startsWith('http') ? '_blank' : undefined} rel={h.startsWith('http') ? 'noopener noreferrer' : undefined}>{inner}</a> : <div key={l} className="card row" style={{ flexWrap: 'nowrap' }}>{inner}</div>;
          })}
        </div>
      )}
    </div></section>
  );
}
