import { Logo } from '@/components/Logo';
import type { Settings } from '@/lib/types';

export function DocHead({ s, title, no }: { s: Settings; title: string; no?: string }) {
  return (
    <div className="dh">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="dlogo">{s.logo_url ? <img src={s.logo_url} alt="" /> : <Logo size={28} />}</div>
        <div><h2>{s.org_name}</h2><div>{[s.address, s.phone].filter(Boolean).join(' | ')}</div></div>
      </div>
      <div style={{ textAlign: 'right' }}><b style={{ fontSize: 15 }}>{title}</b>{no && <div>নং: {no}</div>}</div>
    </div>
  );
}

export function Sigs({ items }: { items: { label: string; img?: string | null }[] }) {
  return (
    <div className="sigs" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((x) => <div key={x.label}>{x.img && <img src={x.img} alt="" />}{x.label}</div>)}
    </div>
  );
}
