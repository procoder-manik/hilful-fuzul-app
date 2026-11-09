import { DEFAULT_DESIGN, type Design } from '@/lib/eventdesign';

export type BannerData = {
  title: string; topic?: string | null; date: string; time?: string | null; venue?: string | null;
  guests?: [string, string | null | undefined][]; tag?: string; design?: Partial<Design> | null; note?: [string, string] | null; done?: boolean;
};

/** ব্যানারের চেহারা: সার্ভার (ওয়েবসাইট) ও ক্লায়েন্ট (অ্যাডমিনের লাইভ প্রিভিউ) দুই জায়গাতেই একই */
export function EventBannerView({ b }: { b: BannerData }) {
  const d = { ...DEFAULT_DESIGN, ...(b.design ?? {}) } as Design;
  const bg = d.template === 'image' && d.image ? `linear-gradient(${d.angle}deg, ${d.c1}e6, ${d.c2}99), url('${d.image}') center/cover` : `linear-gradient(${d.angle}deg, ${d.c1}, ${d.c2})`;
  const guests = (b.guests ?? []).filter(([, v]) => v);
  return (
    <article className={`banner${b.done ? ' bn-done' : ''}`} style={{ background: bg, color: d.text, fontFamily: `'${d.font}', var(--fb)` }}>
      {d.pattern !== 'none' && <div className={`bn-pat bnp-${d.pattern}`} style={{ opacity: d.patternOpacity }} aria-hidden="true" />}
      {d.template === 'split' && d.image && <div className="bn-img" style={{ backgroundImage: `url('${d.image}')` }} />}
      <div className="bn-body">
        <span className="bn-tag" style={{ background: d.accent, color: d.tagText }}>{b.tag ?? d.tag}</span>
        {d.icon && <div className="bn-icon" aria-hidden="true">{d.icon}</div>}
        <h3 style={{ fontSize: Number(d.size) }}>{b.title}</h3>
        {b.topic && <p className="bn-topic">{b.topic}</p>}
        <div className="bn-meta"><span>📅 {b.date}</span>{b.time && <span>⏰ {b.time}</span>}{b.venue && <span>📍 {b.venue}</span>}</div>
        {guests.length > 0 && <div className="bn-guests">{guests.map(([l, v]) => <div key={l}><small>{l}</small><b>{v}</b></div>)}</div>}
        {b.note && <div className="bn-note"><small>{b.note[0]}</small><span>{b.note[1]}</span></div>}
      </div>
    </article>
  );
}
