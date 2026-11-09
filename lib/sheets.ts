import 'server-only';

export type Col = { k: string; h: string; w?: number };
export type Sheet = { name: string; cols: Col[]; rows: Record<string, unknown>[] };

const cell = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 'হ্যাঁ' : 'না') : v);

/** = + - @ দিয়ে শুরু হওয়া লেখা Excel এ সূত্র হিসেবে চলে যেতে পারে; তাই সামনে ' বসিয়ে নিরাপদ করি */
const safeText = (s: string) => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);

/** CSV: শুরুতে BOM থাকায় Excel বাংলা লেখা ঠিকমতো দেখায় */
export function toCSV(s: Sheet): string {
  const esc = (v: unknown) => {
    const c = cell(v);
    const str = typeof c === 'number' ? String(c) : safeText(String(c));
    return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return '\uFEFF' + [s.cols.map((c) => esc(c.h)).join(','), ...s.rows.map((r) => s.cols.map((c) => esc(r[c.k])).join(','))].join('\r\n');
}

/** Excel (.xlsx): একাধিক শিট, মোটা শিরোনাম, প্রথম সারি আটকানো */
export async function toXLSX(sheets: Sheet[]): Promise<Buffer> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Hilful Fuzul';
  wb.created = new Date();
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name.slice(0, 31), { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = s.cols.map((c) => ({ header: c.h, key: c.k, width: c.w ?? Math.min(40, Math.max(12, c.h.length + 4)) }));
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E5A43' } };
    for (const r of s.rows) ws.addRow(Object.fromEntries(s.cols.map((c) => [c.k, cell(r[c.k])])));
    if (s.rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: s.cols.length } };
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/* ---------- ইমপোর্ট: CSV ও Excel পড়া ---------- */

/** RFC 4180 মেনে CSV পড়া (উদ্ধৃতির ভেতরে কমা ও নতুন লাইন চলে) */
export function parseCSV(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, '');
  const rows: string[][] = []; let row: string[] = []; let f = ''; let q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += ch;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Excel এর প্রথম শিট পড়া; তারিখ ঘর তারিখ হিসেবেই আসে */
export async function parseXLSX(buf: ArrayBuffer): Promise<unknown[][]> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const out: unknown[][] = [];
  ws.eachRow({ includeEmpty: false }, (r) => {
    const vals = (r.values as unknown[]).slice(1).map((v) => {
      if (v && typeof v === 'object' && !(v instanceof Date)) {
        const o = v as { text?: string; result?: unknown; richText?: { text: string }[] };
        return o.richText ? o.richText.map((x) => x.text).join('') : o.text ?? o.result ?? '';
      }
      return v ?? '';
    });
    out.push(vals);
  });
  return out;
}
