import { NextResponse } from 'next/server';
import { backupSheets, DATASETS } from '@/lib/datasets';
import { todayBD } from '@/lib/dates';
import { adminAal, mfaRequired } from '@/lib/mfa';
import { parseRange } from '@/lib/range';
import { getSessionProfile } from '@/lib/settings';
import { toCSV, toXLSX, type Sheet } from '@/lib/sheets';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** CSV বা Excel ডাউনলোড; একই ফিল্টার যা তালিকার পাতায় বাছা ছিল */
export async function GET(req: Request, { params }: { params: { kind: string } }) {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile || profile.role === 'member') return new NextResponse('লগইন করুন', { status: 401 });
  if (profile.role === 'admin' && mfaRequired() && (await adminAal(supabase)) !== 'ok') return new NextResponse('OTP যাচাই করুন', { status: 401 });

  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const fmt = sp.format === 'csv' ? 'csv' : 'xlsx';
  let sheets: Sheet[];
  if (params.kind === 'backup') {
    if (profile.role !== 'admin') return new NextResponse('শুধু অ্যাডমিন পুরো ব্যাকআপ নিতে পারেন', { status: 403 });
    sheets = await backupSheets(supabase);
  } else {
    const ds = DATASETS[params.kind];
    if (!ds) return new NextResponse('অজানা তালিকা', { status: 404 });
    if (!ds.roles.includes(profile.role)) return new NextResponse('অনুমতি নেই', { status: 403 });
    const rows = sp.template ? [] : await ds.load(supabase, parseRange(sp, 'all'), sp);
    sheets = [{ name: ds.title, cols: ds.cols, rows }];
  }
  await supabase.from('activity_log').insert({ actor: user.id, action: `${params.kind === 'backup' ? 'পুরো ব্যাকআপ' : DATASETS[params.kind].title} ${fmt.toUpperCase()} এক্সপোর্ট` });
  const name = `hilful-fuzul-${params.kind}${sp.template ? '-template' : ''}-${todayBD()}.${fmt === 'csv' && params.kind !== 'backup' ? 'csv' : 'xlsx'}`;
  if (fmt === 'csv' && params.kind !== 'backup') {
    return new NextResponse(toCSV(sheets[0]), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' } });
  }
  const buf = await toXLSX(sheets);
  return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' } });
}
