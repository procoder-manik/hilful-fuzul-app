'use server';
import { encRow } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';
import { errMsg, logActivity, requireAction } from '@/lib/guard';
import { IMPORTERS, toRecords, type Report } from '@/lib/importers';
import { parseCSV, parseXLSX } from '@/lib/sheets';

export type ImportState = { error?: string; report?: Report; mode?: 'check' | 'import'; unknown?: string[] };
const MAX_ROWS = 5000;

/** "যাচাই" চাপলে শুধু রিপোর্ট; "ইমপোর্ট" চাপলে ঠিক সারিগুলো যোগ হয় (আগে থেকে থাকা সারি বাদ) */
export async function runImport(_: ImportState, f: FormData): Promise<ImportState> {
  try {
    const kind = String(f.get('kind') ?? '');
    const imp = IMPORTERS[kind];
    if (!imp) return { error: 'কী ইমপোর্ট করবেন বাছুন' };
    const { supabase, user } = await requireAction(imp.roles);
    const file = f.get('file');
    if (!(file instanceof File) || !file.size) return { error: 'একটি CSV বা Excel (.xlsx) ফাইল বাছুন' };
    if (file.size > 5 * 1024 * 1024) return { error: 'ফাইল ৫ MB এর বেশি বড়' };
    const name = file.name.toLowerCase();
    let table: unknown[][];
    if (name.endsWith('.csv')) table = parseCSV(await file.text());
    else if (name.endsWith('.xlsx')) table = await parseXLSX(await file.arrayBuffer());
    else return { error: 'শুধু .csv বা .xlsx ফাইল চলে (পুরোনো .xls হলে Excel এ খুলে .xlsx হিসেবে সেভ করুন)' };
    if (table.length < 2) return { error: 'ফাইলে শিরোনাম সারির পরে কোনো তথ্য নেই' };
    if (table.length - 1 > MAX_ROWS) return { error: `একবারে সর্বোচ্চ ${MAX_ROWS}টি সারি; ফাইল ভাগ করে দিন` };

    const { recs, unknown } = toRecords(kind, table);
    const prep = await imp.prepare(supabase, recs);
    const report: Report = { total: recs.length, valid: prep.rows.length, dup: prep.dup, errors: prep.errors.slice(0, 60), sample: prep.sample };
    const mode = f.get('mode') === 'import' ? 'import' : 'check';
    if (mode === 'check' || !prep.rows.length) return { report, mode, unknown };

    let inserted = 0;
    for (let i = 0; i < prep.rows.length; i += 200) {
      const chunk = prep.rows.slice(i, i + 200);
      const { error } = await supabase.from(imp.table).insert(imp.table === 'members' ? chunk.map((r: Record<string, unknown>) => encRow(r)) : chunk);
      if (error) { report.errors.unshift(`সারি ${i + 1} থেকে ${i + chunk.length} যোগ করা যায়নি: ${error.message}`); continue; }
      inserted += chunk.length;
    }
    report.inserted = inserted;
    await logActivity(supabase, user.id, `${imp.title} ইমপোর্ট: ${inserted}টি যোগ, ${prep.dup}টি আগে থেকেই ছিল, ${prep.errors.length}টি ভুল`);
    revalidatePath('/admin', 'layout');
    return { report, mode, unknown };
  } catch (e) {
    return { error: errMsg(e) };
  }
}
