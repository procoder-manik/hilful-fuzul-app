/** বাংলাদেশ সময় (UTC+6) অনুযায়ী আজকের তারিখ, যাতে সার্ভার যেখানেই চলুক হিসাব ঠিক থাকে */
export function todayBD(): string {
  const d = new Date(Date.now() + 6 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}
export const monthStart = (iso: string) => iso.slice(0, 7) + '-01';
export function addMonths(isoMonth: string, n: number): string {
  let [y, m] = isoMonth.slice(0, 7).split('-').map(Number);
  m += n;
  while (m > 12) { m -= 12; y++; }
  while (m < 1) { m += 12; y--; }
  return `${y}-${String(m).padStart(2, '0')}-01`;
}
export function monthRange(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  let c = monthStart(fromIso);
  const end = monthStart(toIso);
  while (c <= end) { out.push(c); c = addMonths(c, 1); }
  return out;
}
