/**
 * অ্যাডমিন প্যানেলের ফর্মের ঘর: বাংলা নামের পাশে ছোট ইংরেজি ইঙ্গিত (বন্ধনীতে) এবং নিচে এক লাইনের "এটি দিয়ে কী হবে" ব্যাখ্যা।
 * সার্ভার ও ক্লায়েন্ট দুই জায়গাতেই চলে।
 */
import type { ReactNode } from 'react';

/** "বাংলা (English)" */
export function Bi({ bn, en }: { bn: ReactNode; en?: string }) {
  return <>{bn}{en && <small className="en-hint">({en})</small>}</>;
}

/** ঘরের নিচের ছোট ব্যাখ্যা */
export function Info({ children }: { children: ReactNode }) {
  return <small className="f-info"><i aria-hidden="true">i</i><span>{children}</span></small>;
}

/** একটি ইনপুট: নাম, ইংরেজি, ব্যাখ্যা ও ঘর */
export function Fld({ bn, en, info, children, className, style }: { bn: ReactNode; en?: string; info?: ReactNode; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <label className={`f${className ? ` ${className}` : ''}`} style={style}>
      <span><Bi bn={bn} en={en} /></span>
      {children}
      {info && <Info>{info}</Info>}
    </label>
  );
}

/** টিক-বাক্স: নাম, ইংরেজি ও ব্যাখ্যাসহ */
export function Tick({ name, bn, en, info, defaultChecked, checked, onChange }: { name?: string; bn: ReactNode; en?: string; info?: ReactNode; defaultChecked?: boolean; checked?: boolean; onChange?: (b: boolean) => void }) {
  const ctl = checked === undefined
    ? <input type="checkbox" name={name} defaultChecked={defaultChecked} />
    : <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange?.(e.target.checked)} />;
  return (
    <label className="chk">{ctl}<span className="chk-t"><Bi bn={bn} en={en} />{info && <Info>{info}</Info>}</span></label>
  );
}

/** ফর্মের ভাগের শিরোনাম: বাংলা, ইংরেজি ও এক লাইনের পরিচয় */
export function Sec({ bn, en, info, first }: { bn: ReactNode; en?: string; info?: ReactNode; first?: boolean }) {
  return (
    <div className="sec-h" style={first ? { marginTop: 0 } : undefined}>
      <h2 className="h2" style={{ margin: 0 }}><Bi bn={bn} en={en} /></h2>
      {info && <p className="muted small" style={{ margin: '4px 0 0' }}>{info}</p>}
    </div>
  );
}
