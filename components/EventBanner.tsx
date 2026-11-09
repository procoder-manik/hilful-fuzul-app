import { fd } from '@/lib/fmt';
import { getT } from '@/lib/lang';
import type { EventRow } from '@/lib/public';

export const DEFAULT_DESIGN = { template: 'gradient', c1: '#0e5a43', c2: '#1b8a68', angle: 135, text: '#ffffff', accent: '#e8b44a', tagText: '#2a1d00', font: 'Baloo Da 2', size: 30, icon: '🕌', tag: 'আসন্ন অনুষ্ঠান', image: '' };

/** অ্যাডমিনের ব্যানার ডিজাইনারে বানানো ডিজাইন অনুযায়ী অনুষ্ঠানের ব্যানার */
export function EventBanner({ e }: { e: EventRow }) {
  const t = getT();
  const d = { ...DEFAULT_DESIGN, ...(e.design ?? {}) } as typeof DEFAULT_DESIGN;
  const bg = d.template === 'image' && d.image ? `linear-gradient(${d.angle}deg, ${d.c1}e6, ${d.c2}99), url('${d.image}') center/cover` : `linear-gradient(${d.angle}deg, ${d.c1}, ${d.c2})`;
  const guests = [[t('প্রধান অতিথি', 'Chief guest'), e.chief_guest], [t('বিশেষ অতিথি', 'Special guest'), e.special_guest], [t('সভাপতিত্ব করবেন', 'Presided by'), e.presided_by]].filter(([, v]) => v);
  const tag = d.tag === DEFAULT_DESIGN.tag ? t(d.tag, 'Upcoming event') : d.tag;
  return (
    <article className="banner" style={{ background: bg, color: d.text, fontFamily: `'${d.font}', var(--fb)` }}>
      {d.template === 'split' && d.image && <div className="bn-img" style={{ backgroundImage: `url('${d.image}')` }} />}
      <div className="bn-body">
        <span className="bn-tag" style={{ background: d.accent, color: d.tagText }}>{tag}</span>
        {d.icon && <div className="bn-icon" aria-hidden="true">{d.icon}</div>}
        <h3 style={{ fontSize: Number(d.size) }}>{e.title}</h3>
        {e.topic && <p className="bn-topic">{e.topic}</p>}
        <div className="bn-meta"><span>📅 {fd(e.event_date)}</span>{e.event_time && <span>⏰ {e.event_time}</span>}{e.venue && <span>📍 {e.venue}</span>}</div>
        {guests.length > 0 && <div className="bn-guests">{guests.map(([l, v]) => <div key={l}><small>{l}</small><b>{v}</b></div>)}</div>}
      </div>
    </article>
  );
}
