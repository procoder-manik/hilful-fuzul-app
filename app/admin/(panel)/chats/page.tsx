import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm, ConfirmButton, Submit } from '../../_components/ActionForm';
import { deleteChat, teachBot } from '../../actions/chat';
import { ADMIN, requirePage } from '@/lib/guard';
import { bn, fd } from '@/lib/format';
import { PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'চ্যাট লগ' };

const time = (iso: string) => bn(new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' }));

export default async function Chats({ searchParams }: { searchParams: { f?: string } }) {
  const { supabase } = await requirePage([...ADMIN, 'editor']);
  const onlyUnknown = searchParams.f === 'unknown';
  let q = supabase.from('chat_logs').select('*').order('created_at', { ascending: false }).limit(200);
  if (onlyUnknown) q = q.eq('unanswered', true);
  const [{ data }, { count }] = await Promise.all([q, supabase.from('chat_logs').select('id', { count: 'exact', head: true }).eq('unanswered', true)]);
  const rows = (data ?? []) as { id: string; who: string | null; question: string; answer: string | null; unanswered: boolean; created_at: string }[];
  return (
    <>
      <PageHead title="চ্যাট লগ" sub="অতিথি ও সদস্যরা চ্যাট সহকারীকে যা জিজ্ঞেস করেছেন। উত্তর না পাওয়া প্রশ্নের সঠিক উত্তর শিখিয়ে দিলে বট ভবিষ্যতে সবাইকে সেটাই বলবে।">
        <Link className={`btn sm ${onlyUnknown ? '' : 'pri'}`} href="/admin/chats">সব প্রশ্ন</Link>
        <Link className={`btn sm ${onlyUnknown ? 'pri' : ''}`} href="/admin/chats?f=unknown">উত্তর পায়নি ({bn(count ?? 0)})</Link>
      </PageHead>
      {rows.length === 0 && <div className="card muted">{onlyUnknown ? 'উত্তর না পাওয়া কোনো প্রশ্ন নেই।' : 'এখনো কেউ চ্যাট করেনি।'}</div>}
      <div className="grid" style={{ gap: 12 }}>
        {rows.map((c) => (
          <div key={c.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b>{c.who ?? 'অতিথি'}</b> {c.unanswered && <span className="badge b-bad">উত্তর পায়নি</span>}</div>
              <span className="muted small">{fd(c.created_at)}, {time(c.created_at)}</span>
            </div>
            <p style={{ margin: '8px 0 4px' }}><b>{c.question}</b></p>
            <p className="muted small" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.answer}</p>
            {c.unanswered && (
              <ActionForm action={teachBot} resetOnSuccess style={{ marginTop: 10 }}>
                <input type="hidden" name="id" value={c.id} /><input type="hidden" name="q" value={c.question} />
                <label className="f"><span>সঠিক উত্তর (বটকে শেখান)</span><textarea name="a" rows={2} placeholder="যেমন: কুরআন শিক্ষা সপ্তাহে ৩ দিন, বিকাল ৪টায়" /></label>
                <Submit pendingText="শেখানো হচ্ছে...">বটকে শেখান</Submit>
              </ActionForm>
            )}
            <div className="acts" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
              <ConfirmButton action={deleteChat.bind(null, c.id)} className="btn sm danger" label="মুছুন" confirm="এই চ্যাটটি মুছবেন?" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
