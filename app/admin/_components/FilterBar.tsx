import Link from 'next/link';
import { PRESETS, rangeQS, type Range } from '@/lib/range';

/**
 * সব তালিকার একই ফিল্টার-বার: সময়সীমা, নিজের তারিখ, নতুন/পুরোনো ক্রম, খোঁজা, আর CSV/Excel এক্সপোর্ট।
 * extra: পাতার নিজস্ব ফিল্টার (যেমন অবস্থা) যা লিংকে রেখে দিতে হবে।
 */
export function FilterBar({ base, range, extra = {}, exportKind, search = 'নাম বা মোবাইল দিয়ে খুঁজুন' }: { base: string; range: Range; extra?: Record<string, string | undefined>; exportKind?: string; search?: string | false }) {
  const link = (over: Partial<Range>) => `${base}?${rangeQS({ ...range, ...over } as Range, extra)}`;
  const exp = (fmt: string) => `/admin/export/${exportKind}?${rangeQS(range, { ...extra, format: fmt })}`;
  return (
    <div className="fbar card">
      <div className="seg wrapable">
        {PRESETS.map(([k, n]) => <Link key={k} href={link({ r: k })} className={range.r === k ? 'on' : ''}>{n}</Link>)}
      </div>
      <form className="row fbar-f" action={base}>
        {Object.entries(extra).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
        <input type="hidden" name="r" value="custom" />
        <label className="fbar-d"><span>থেকে</span><input type="date" name="from" defaultValue={range.from ?? ''} required /></label>
        <label className="fbar-d"><span>পর্যন্ত</span><input type="date" name="to" defaultValue={range.to} required /></label>
        {range.sort === 'old' && <input type="hidden" name="sort" value="old" />}
        {range.q && <input type="hidden" name="q" value={range.q} />}
        <button className="btn sm">তারিখ বসান</button>
      </form>
      <div className="row fbar-f">
        {search !== false && (
          <form className="row" action={base} style={{ gap: 6 }}>
            {Object.entries(extra).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
            <input type="hidden" name="r" value={range.r} />
            {range.r === 'custom' && <><input type="hidden" name="from" value={range.from ?? ''} /><input type="hidden" name="to" value={range.to} /></>}
            {range.sort === 'old' && <input type="hidden" name="sort" value="old" />}
            <input name="q" defaultValue={range.q} placeholder={search} aria-label="খুঁজুন" style={{ width: 220 }} />
            <button className="btn sm">খুঁজুন</button>
            {range.q && <Link className="btn sm" href={link({ q: '' })}>মুছুন</Link>}
          </form>
        )}
        <div className="seg">
          <Link href={link({ sort: 'new' })} className={range.sort === 'new' ? 'on' : ''}>নতুন আগে</Link>
          <Link href={link({ sort: 'old' })} className={range.sort === 'old' ? 'on' : ''}>পুরোনো আগে</Link>
        </div>
        {exportKind && <div className="row" style={{ gap: 6, marginLeft: 'auto' }}>
          <a className="btn sm" href={exp('xlsx')} download>⬇ Excel</a>
          <a className="btn sm" href={exp('csv')} download>⬇ CSV</a>
        </div>}
      </div>
      <div className="muted small">দেখাচ্ছে: {range.label}</div>
    </div>
  );
}

/** ছোট সারসংক্ষেপ কার্ড (মোট সংখ্যা, টাকা, কতজন) */
export function Summary({ items }: { items: [string, string, string?][] }) {
  return <div className="grid g4" style={{ marginBottom: 14 }}>{items.map(([l, v, sub]) => <div className="kpi" key={l}><span>{l}</span><b>{v}</b>{sub && <span>{sub}</span>}</div>)}</div>;
}
