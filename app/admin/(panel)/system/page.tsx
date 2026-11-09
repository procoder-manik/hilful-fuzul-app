import type { Metadata } from 'next';
import Link from 'next/link';
import { ADMIN, requirePage, ROLE_BN } from '@/lib/guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { keyStatus } from '@/lib/chat/llm';
import { emailConfigured, smsConfigured } from '@/lib/notify/send';
import { mfaRequired } from '@/lib/mfa';
import { todayBD } from '@/lib/dates';
import { bn, fd } from '@/lib/format';
import { PageHead } from '@/lib/ui';
import type { Role } from '@/lib/types';

export const metadata: Metadata = { title: 'সাইট হেলথ ও লগ' };
type Check = { ok: 'ok' | 'warn' | 'bad'; t: string; d: string; fix?: string };
const time = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' });

export default async function System({ searchParams }: { searchParams: { log?: string } }) {
  await requirePage(ADMIN);
  const db = createAdminClient();
  const probe = async (table: string, col = 'id') => { const { error } = await db.from(table).select(col).limit(1); return !error; };
  const [sOk, m002, m003, m004, m005, m006, settings] = await Promise.all([
    probe('settings'), probe('v_book_availability', 'book_id'), probe('chat_logs', 'unanswered'), probe('notifications'), probe('menu_items'), probe('service_records'),
    db.from('settings').select('notify_last_run, chat_enabled').eq('id', 1).maybeSingle(),
  ]);
  const [{ data: users }, { data: profiles }, { count: failedNotes }, { count: pendingApps }, { count: unread }, bucket] = await Promise.all([
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from('profiles').select('id, role, full_name'),
    m004 ? db.from('notifications').select('id', { count: 'exact', head: true }).or('email_status.like.failed%,sms_status.like.failed%').gte('created_at', new Date(Date.now() - 7 * 864e5).toISOString()) : Promise.resolve({ count: 0 }),
    db.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    db.storage.getBucket('media'),
  ]);
  const roleCount = (r: Role) => (profiles ?? []).filter((p) => p.role === r).length;
  const admins = (profiles ?? []).filter((p) => p.role === 'admin');
  const noMfa = admins.filter((a) => !users?.users.find((u) => u.id === a.id)?.factors?.some((f) => f.status === 'verified'));
  const last = settings.data?.notify_last_run ?? null;
  const daysSince = last ? Math.round((Date.parse(todayBD()) - Date.parse(last)) / 864e5) : null;
  const keys = keyStatus();
  const checks: Check[] = [
    { ok: sOk ? 'ok' : 'bad', t: 'ডেটাবেস সংযোগ', d: sOk ? 'Supabase এর সাথে সংযোগ ঠিক আছে' : 'ডেটাবেস পড়া যাচ্ছে না', fix: '.env.local এর Supabase চাবি ও 001_init.sql দেখুন' },
    ...([['002_public_site.sql', m002], ['003_chatbot.sql', m003], ['004_accounts_notifications.sql', m004], ['005_menus_layout.sql', m005], ['006_records_admin.sql', m006]] as [string, boolean][])
      .map(([f, ok]) => ({ ok: ok ? 'ok' : 'bad', t: `SQL: ${f}`, d: ok ? 'চালানো হয়েছে' : 'এখনো চালানো হয়নি', fix: ok ? undefined : 'Supabase > SQL Editor এ ফাইলটি চালান' }) as Check),
    { ok: bucket.error ? 'bad' : 'ok', t: 'ছবি রাখার জায়গা (Storage)', d: bucket.error ? '"media" বাকেট পাওয়া যায়নি' : 'ঠিক আছে', fix: bucket.error ? '001_init.sql এর শেষের Storage অংশ চালান' : undefined },
    { ok: !mfaRequired() ? 'bad' : noMfa.length ? 'warn' : 'ok', t: 'অ্যাডমিনের OTP', d: !mfaRequired() ? 'ADMIN_MFA=off: OTP বন্ধ আছে!' : noMfa.length ? `${noMfa.length} জন অ্যাডমিন এখনো অথেনটিকেটর অ্যাপ যুক্ত করেননি` : 'সব অ্যাডমিনের OTP চালু', fix: !mfaRequired() ? '.env.local থেকে ADMIN_MFA=off লাইন মুছে সার্ভার আবার চালু করুন' : undefined },
    { ok: daysSince === null ? 'warn' : daysSince > 2 ? 'warn' : 'ok', t: 'দৈনিক বিজ্ঞপ্তি', d: last ? `শেষ চলেছে ${fd(last)}` : 'এখনো একবারও চলেনি', fix: daysSince === null || daysSince > 2 ? 'সার্ভার চালু রাখুন অথবা "বিজ্ঞপ্তি" পাতায় "এখনই চালান" চাপুন' : undefined },
    { ok: (failedNotes ?? 0) > 0 ? 'warn' : 'ok', t: 'বিজ্ঞপ্তি পৌঁছানো (৭ দিন)', d: (failedNotes ?? 0) > 0 ? `${failedNotes}টি ইমেইল/SMS ব্যর্থ হয়েছে` : 'কোনো ব্যর্থতা নেই', fix: (failedNotes ?? 0) > 0 ? '"বিজ্ঞপ্তি" পাতায় কারণ দেখুন, SMTP/SMS এর তথ্য যাচাই করুন' : undefined },
    { ok: emailConfigured() ? 'ok' : 'warn', t: 'ইমেইল (SMTP)', d: emailConfigured() ? 'বসানো আছে' : 'বসানো নেই: ইমেইলে বিজ্ঞপ্তি যাবে না', fix: emailConfigured() ? undefined : '.env.local এ SMTP_ এর ঘরগুলো দিন' },
    { ok: smsConfigured() ? 'ok' : 'warn', t: 'SMS গেটওয়ে', d: smsConfigured() ? 'বসানো আছে' : 'বসানো নেই: SMS যাবে না', fix: smsConfigured() ? undefined : '.env.local এ SMS_URL দিন' },
    { ok: keys.gemini || keys.openrouter ? 'ok' : 'warn', t: 'এআই চাবি (চ্যাটবট ও ইংরেজি অনুবাদ)', d: keys.gemini || keys.openrouter ? `${keys.gemini ? 'Gemini ' : ''}${keys.openrouter ? 'OpenRouter' : ''}` : 'নেই: চ্যাটবট সাধারণ নিয়মে চলবে, অনুবাদ হবে না' },
    { ok: process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://') ? 'ok' : 'warn', t: 'ওয়েবসাইটের ঠিকানা', d: process.env.NEXT_PUBLIC_SITE_URL ?? 'দেওয়া নেই', fix: process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://') ? undefined : 'অনলাইনে চালু করলে NEXT_PUBLIC_SITE_URL এ https:// ঠিকানা দিন (গুগলে খোঁজার জন্য জরুরি)' },
  ];
  const tab = searchParams.log === 'login' ? 'login' : 'activity';
  const [{ data: acts }, logins] = await Promise.all([
    db.from('activity_log').select('id, actor, action, created_at').order('created_at', { ascending: false }).limit(80),
    m006 ? db.from('login_events').select('*').order('created_at', { ascending: false }).limit(80) : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.full_name || users?.users.find((u) => u.id === p.id)?.email || 'অজানা']));
  const failed24 = (logins.data ?? []).filter((l) => !l.ok && Date.parse(String(l.created_at)) > Date.now() - 864e5).length;
  const icon = { ok: '✅', warn: '⚠️', bad: '❌' };
  return (
    <>
      <PageHead title="সাইট হেলথ ও লগ" sub="সব ঠিকমতো চলছে কিনা, কে কখন লগইন করলেন আর কে কী কাজ করলেন।" />
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="kpi"><span>অ্যাডমিন</span><b>{bn(roleCount('admin'))}</b></div>
        <div className="kpi"><span>কোষাধ্যক্ষ</span><b>{bn(roleCount('treasurer'))}</b></div>
        <div className="kpi"><span>পাঠাগার ও কনটেন্ট সম্পাদক</span><b>{bn(roleCount('librarian') + roleCount('editor'))}</b><span>পাঠাগার {bn(roleCount('librarian'))}, কনটেন্ট {bn(roleCount('editor'))}</span></div>
        <div className="kpi"><span>সদস্যদের লগইন অ্যাকাউন্ট</span><b>{bn(roleCount('member'))}</b><span>মোট অ্যাকাউন্ট {bn(users?.users.length ?? 0)}</span></div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', alignItems: 'start' }}>
        <div className="card">
          <b>স্বাস্থ্য পরীক্ষা</b>
          {checks.map((c) => <div key={c.t} className="check" style={{ alignItems: 'flex-start' }}><span aria-hidden="true">{icon[c.ok]}</span><div><b>{c.t}</b><div className="muted small">{c.d}</div>{c.fix && <div className="small" style={{ color: c.ok === 'bad' ? 'var(--danger)' : 'var(--warn)' }}>করণীয়: {c.fix}</div>}</div></div>)}
        </div>
        <div className="card">
          <b>এখন মনোযোগ দরকার</b>
          <div className="check"><span>📝</span><Link href="/admin/applications">অপেক্ষমাণ আবেদন: {bn(pendingApps ?? 0)}টি</Link></div>
          <div className="check"><span>✉️</span><Link href="/admin/messages">না-পড়া বার্তা: {bn(unread ?? 0)}টি</Link></div>
          <div className="check"><span>🔐</span><span>গত ২৪ ঘণ্টায় ব্যর্থ লগইন চেষ্টা: {bn(failed24)}টি {failed24 >= 10 && <b style={{ color: 'var(--danger)' }}>(অস্বাভাবিক বেশি!)</b>}</span></div>
          <div className="check"><span>💾</span><Link href="/admin/import">পুরো ব্যাকআপ নামান (Download full backup)</Link></div>
          {noMfa.length > 0 && <div className="check"><span>⚠️</span><span>OTP যুক্ত করেননি: {noMfa.map((a) => a.full_name || 'অ্যাডমিন').join(', ')}</span></div>}
        </div>
      </div>
      <div className="seg" style={{ margin: '18px 0 12px' }}>
        <Link href="/admin/system" className={tab === 'activity' ? 'on' : ''}>কাজের লগ (Activity log)</Link>
        <Link href="/admin/system?log=login" className={tab === 'login' ? 'on' : ''}>লগইনের ইতিহাস (Login history)</Link>
      </div>
      <div className="card"><div className="scroll"><table className="tbl">
        {tab === 'activity' ? (
          <><thead><tr><th>সময়<small className="en-hint">(Time)</small></th><th>কে<small className="en-hint">(Who)</small></th><th>কী করলেন<small className="en-hint">(Action)</small></th></tr></thead><tbody>
            {(acts ?? []).map((a) => <tr key={a.id}><td className="small">{time(a.created_at)}</td><td>{nameOf.get(a.actor) ?? '-'}</td><td>{a.action}</td></tr>)}
          </tbody></>
        ) : (
          <><thead><tr><th>সময়<small className="en-hint">(Time)</small></th><th>পরিচয়<small className="en-hint">(Identity)</small></th><th>রোল<small className="en-hint">(Role)</small></th><th>ফল<small className="en-hint">(Result)</small></th><th>আইপি / ডিভাইস<small className="en-hint">(IP / device)</small></th></tr></thead><tbody>
            {!m006 && <tr><td colSpan={5} className="empty">লগইনের ইতিহাস রাখতে 006_records_admin.sql চালান</td></tr>}
            {(logins.data ?? []).map((l) => (
              <tr key={String(l.id)}><td className="small">{time(String(l.created_at))}</td><td>{String(l.identifier ?? '-')}<div className="muted small">{l.audience === 'staff' ? 'কমিটির ট্যাব' : 'সদস্যের ট্যাব'}</div></td>
                <td>{l.role ? ROLE_BN[l.role as Role] ?? String(l.role) : '-'}</td>
                <td>{l.ok ? <span className="badge b-ok">সফল</span> : <span className="badge b-bad">ব্যর্থ</span>}{l.reason ? <div className="muted small">{String(l.reason)}</div> : null}</td>
                <td className="small">{String(l.ip ?? '-')}<div className="muted">{String(l.user_agent ?? '').slice(0, 50)}</div></td></tr>
            ))}
          </tbody></>
        )}
      </table></div></div>
    </>
  );
}
