import type { Metadata } from 'next';
import { ActionForm, Submit } from '../../_components/ActionForm';
import { runNow, testSend } from '../../actions/notify';
import { MONEY, requirePage } from '@/lib/guard';
import { fd } from '@/lib/format';
import { emailConfigured, smsConfigured } from '@/lib/notify/send';
import { PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'বিজ্ঞপ্তি' };

const KIND: Record<string, string> = { welcome: 'স্বাগত', approved: 'অনুমোদন', rejected: 'বাতিল', payment: 'জমা', overdue: 'বকেয়া', due_soon: 'শেষ তারিখ', freeze_warn_7: '৭ দিনের সতর্কতা', freeze_warn_3: '৩ দিনের সতর্কতা', frozen: 'স্থগিত', reactivated: 'সক্রিয়' };
const SKIP: Record<string, string> = { 'no-email': 'ইমেইল নেই', 'no-phone': 'নম্বর নেই', off: 'বন্ধ', 'smtp-not-configured': 'SMTP নেই', 'sms-not-configured': 'গেটওয়ে নেই' };

function St({ v }: { v: string | null }) {
  if (!v) return <span className="badge b-mute">-</span>;
  if (v === 'sent') return <span className="badge b-ok">পাঠানো হয়েছে</span>;
  if (v.startsWith('failed')) return <span className="badge b-bad" title={v}>ব্যর্থ</span>;
  return <span className="badge b-mute">{SKIP[v.replace('skipped:', '')] ?? v}</span>;
}
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' });

export default async function Notifications() {
  const { supabase } = await requirePage(MONEY);
  const [{ data: rows }, { data: s }] = await Promise.all([
    supabase.from('notifications').select('id, member_id, user_id, kind, title, email_status, sms_status, read_at, created_at').order('created_at', { ascending: false }).limit(80),
    supabase.from('settings').select('notify_last_run, notify_email, notify_sms').eq('id', 1).single(),
  ]);
  const list = rows ?? [];
  const mids = [...new Set(list.map((r) => r.member_id).filter(Boolean))] as string[];
  const uids = [...new Set(list.filter((r) => !r.member_id && r.user_id).map((r) => r.user_id))] as string[];
  const [{ data: ms }, { data: ps }] = await Promise.all([
    mids.length ? supabase.from('members').select('id, name').in('id', mids) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    uids.length ? supabase.from('profiles').select('id, full_name').in('id', uids) : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);
  const name = new Map<string, string>([...(ms ?? []).map((m) => [m.id, m.name] as [string, string]), ...(ps ?? []).map((p) => [p.id, p.full_name ?? 'আবেদনকারী'] as [string, string])]);
  const mail = emailConfigured(), sms = smsConfigured();
  return (
    <>
      <PageHead title="বিজ্ঞপ্তি" sub="চাঁদা জমা, বকেয়া, স্থগিতের আগের সতর্কতা ও স্থগিতের বিজ্ঞপ্তি সদস্যের প্রোফাইলে এবং ইমেইল বা মোবাইল থাকলে সেখানে যায়।" />
      <div className="grid g3">
        <div className="kpi"><span>শেষ দৈনিক যাচাই</span><b style={{ fontSize: '1.15rem' }}>{s?.notify_last_run ? fd(s.notify_last_run) : 'এখনো হয়নি'}</b><span>সার্ভার চালু থাকলে প্রতিদিন সকাল ৮টার পর নিজে থেকে চলে</span></div>
        <div className="kpi"><span>ইমেইল (SMTP)</span><b style={{ fontSize: '1.15rem', color: mail ? 'var(--ok)' : 'var(--danger)' }}>{mail ? '✅ চালু' : '❌ নেই'}</b><span>{s?.notify_email ? 'সেটিংসে চালু আছে' : 'সেটিংসে বন্ধ'}</span></div>
        <div className="kpi"><span>SMS গেটওয়ে</span><b style={{ fontSize: '1.15rem', color: sms ? 'var(--ok)' : 'var(--danger)' }}>{sms ? '✅ চালু' : '❌ নেই'}</b><span>{s?.notify_sms ? 'সেটিংসে চালু আছে' : 'সেটিংসে বন্ধ'}</span></div>
      </div>
      <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
        <ActionForm action={runNow} className="card">
          <b>এখনই যাচাই চালান</b>
          <p className="muted small">সব সদস্যের বকেয়া ও স্থগিতের সময় দেখে দরকারি বিজ্ঞপ্তি পাঠায়। একই বিজ্ঞপ্তি কখনো দুইবার যায় না, তাই যতবার ইচ্ছা চালানো যায়।</p>
          <Submit pendingText="যাচাই হচ্ছে...">এখনই চালান (Run now)</Submit>
        </ActionForm>
        <ActionForm action={testSend} className="card">
          <b>পরীক্ষামূলক বার্তা</b>
          <div className="grid g2" style={{ gap: '0 10px', marginTop: 8 }}>
            <label className="f"><span>ইমেইল বা মোবাইল নম্বর<small className="en-hint">(Email or mobile)</small></span><input name="to" required autoCapitalize="none" /></label>
            <label className="f"><span>বার্তা (ঐচ্ছিক)<small className="en-hint">(Message, optional)</small></span><input name="msg" /></label>
          </div>
          <Submit className="btn" pendingText="পাঠানো হচ্ছে...">টেস্ট পাঠান (Send test)</Submit>
        </ActionForm>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <b>সাম্প্রতিক বিজ্ঞপ্তি</b>
        <div className="scroll"><table className="tbl">
          <thead><tr><th>সময়<small className="en-hint">(Time)</small></th><th>প্রাপক<small className="en-hint">(Recipient)</small></th><th>ধরন<small className="en-hint">(Type)</small></th><th>শিরোনাম<small className="en-hint">(Title)</small></th><th>ইমেইল<small className="en-hint">(Email)</small></th><th>SMS</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={6} className="empty">এখনো কোনো বিজ্ঞপ্তি যায়নি</td></tr>}
            {list.map((r) => (
              <tr key={r.id}><td className="small">{fd(r.created_at)}<div className="muted">{time(r.created_at)}</div></td><td>{name.get(r.member_id ?? r.user_id) ?? '-'}</td><td><span className="badge b-info">{KIND[r.kind] ?? r.kind}</span></td><td>{r.title}</td><td><St v={r.email_status} /></td><td><St v={r.sms_status} /></td></tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
