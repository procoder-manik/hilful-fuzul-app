import Link from 'next/link';
import { bn } from './format';

export const STATUS: Record<string, [string, string]> = { active: ['সক্রিয়', 'b-ok'], frozen: ['স্থগিত', 'b-bad'], cancelled: ['বাতিল', 'b-mute'] };
export const LOAN_ST: Record<string, [string, string]> = { paid: ['পরিশোধিত', 'b-ok'], running: ['চলমান', 'b-info'], overdue: ['মেয়াদোত্তীর্ণ', 'b-bad'] };

export const LOAN_ST_EN: Record<string, [string, string]> = { paid: ['Repaid', 'b-ok'], running: ['Running', 'b-info'], overdue: ['Overdue', 'b-bad'] };

export function Badge({ map, k }: { map: Record<string, [string, string]>; k: string }) {
  const [t, c] = map[k] ?? [k, 'b-mute'];
  return <span className={`badge ${c}`}>{t}</span>;
}

export function PageHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="phead">
      <div><h1>{title}</h1>{sub && <div className="muted small">{sub}</div>}</div>
      {children && <div className="row" style={{ gap: 8 }}>{children}</div>}
    </div>
  );
}

export function Empty({ cols, text = 'এখনো কিছু নেই' }: { cols: number; text?: string }) {
  return <tr><td colSpan={cols} className="empty">{text}</td></tr>;
}

export function Pager({ base, page, total, size }: { base: string; page: number; total: number; size: number }) {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;
  const sep = base.includes('?') ? '&' : '?';
  return (
    <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
      {page > 1 && <Link className="btn sm" href={`${base}${sep}page=${page - 1}`}>আগের</Link>}
      <span className="muted small">পৃষ্ঠা {bn(page)} / {bn(pages)}</span>
      {page < pages && <Link className="btn sm" href={`${base}${sep}page=${page + 1}`}>পরের</Link>}
    </div>
  );
}

export function loanStatus(amount: number, repaid: number, dueOn: string, today: string) {
  if (repaid >= amount) return 'paid';
  return today > dueOn ? 'overdue' : 'running';
}

/** সার্চের লেখা থেকে PostgREST এর বিশেষ অক্ষর বাদ */
export const cleanQ = (q?: string) => (q ?? '').replace(/[,()%*\\]/g, ' ').trim();
