import Link from 'next/link';
export function LibraryTabs({ on }: { on: 'books' | 'lend' }) {
  return (
    <div className="seg" style={{ marginBottom: 12 }}>
      <Link className={on === 'books' ? 'on' : ''} href="/admin/library">বইয়ের তালিকা</Link>
      <Link className={on === 'lend' ? 'on' : ''} href="/admin/library/lendings">বই আদান-প্রদান</Link>
    </div>
  );
}
