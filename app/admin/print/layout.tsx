import { requirePage, STAFF } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requirePage(STAFF);
  return <div className="print-wrap">{children}</div>;
}
