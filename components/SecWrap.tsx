import { cleanStyle, styleCss, type SecStyle } from '@/lib/sectionstyle';

/** হোমপেজের একটি সেকশনের চারপাশে অ্যাডমিনের বাছা রং ও প্যাটার্ন (কিছু না বাছলে সাধারণ চেহারাই থাকে) */
export function SecWrap({ st, children }: { st?: Partial<SecStyle> | null; children: React.ReactNode }) {
  const s = cleanStyle(st);
  const c = styleCss(s);
  if (!c.has) return <>{children}</>;
  return (
    <div className={`secbg${c.tinted ? ' secbg-c' : ''}${c.deep ? ' secbg-deep' : ''}`} style={c.box}>
      {s.pat !== 'none' && <div className={`sec-pat bnp-${s.pat}`} style={{ opacity: s.op, color: c.patColor }} aria-hidden="true" />}
      {children}
    </div>
  );
}
