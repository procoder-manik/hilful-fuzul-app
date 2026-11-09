import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runDailyNotifications } from '@/lib/notify/run';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** বাইরের ক্রন সেবা (বা Windows Task Scheduler) থেকে দৈনিক ডাকার জন্য। .env.local এ CRON_SECRET না থাকলে বন্ধ থাকে। */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: 'disabled' }, { status: 404 });
  const url = new URL(req.url);
  const given = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '') || url.searchParams.get('secret') || '';
  if (!same(given, secret)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await runDailyNotifications());
}
export const GET = handle;
export const POST = handle;
