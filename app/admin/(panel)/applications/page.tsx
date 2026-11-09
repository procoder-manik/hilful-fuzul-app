import type { Metadata } from 'next';
import { decRow } from '@/lib/crypto';
import { ActionForm, ConfirmButton, Submit } from '../../_components/ActionForm';
import { approveApplication, rejectApplication } from '../../actions/members';
import { MONEY, requirePage } from '@/lib/guard';
import { bn, fd, tk } from '@/lib/format';
import { PageHead } from '@/lib/ui';
import type { Application } from '@/lib/types';

export const metadata: Metadata = { title: 'সদস্যপদের আবেদন' };

const METHODS = ['বিকাশ', 'নগদ', 'রকেট', 'ব্যাংক', 'নগদ (হাতে)', 'হাতে নগদ (কোষাধ্যক্ষকে)'];

export default async function Applications({ searchParams }: { searchParams: { all?: string } }) {
  const { supabase } = await requirePage(MONEY);
  let q = supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(100);
  if (!searchParams.all) q = q.eq('status', 'pending');
  const [{ data }, { data: s }] = await Promise.all([q, supabase.from('settings').select('reg_fee').eq('id', 1).single()]);
  const list = decRow((data ?? []) as Application[]);
  return (
    <>
      <PageHead title="সদস্যপদের আবেদন" sub="ওয়েবসাইটে নিবন্ধন করা ব্যক্তিরা এখানে আসেন। ভর্তি ফি পেয়েছেন কিনা মিলিয়ে দেখে যাচাই করে অনুমোদন দিলে তিনি যাচাইকৃত সদস্য হবেন ও বিজ্ঞপ্তি পাবেন।">
        <a className="btn" href={searchParams.all ? '/admin/applications' : '/admin/applications?all=1'}>{searchParams.all ? 'শুধু অপেক্ষমাণ (Pending only)' : 'সব আবেদন (All applications)'}</a>
      </PageHead>
      {list.length === 0 && <div className="card muted">কোনো অপেক্ষমাণ আবেদন নেই।</div>}
      <div className="grid" style={{ gap: 12 }}>
        {list.map((a) => (
          <div key={a.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="row" style={{ gap: 12, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                <div className="av" style={{ width: 52, height: 52 }}>{a.photo_url ? <img src={a.photo_url} alt="" /> : a.name.charAt(0)}</div>
                <div>
                  <b style={{ fontSize: '1.1rem' }}>{a.name}</b> <span className="muted small">আবেদন নং {bn(a.app_no)}, {fd(a.created_at)}</span>
                  <div className="muted small">{bn(a.phone)}{a.email ? ` | ${a.email}` : ''} | মাসিক {tk(a.monthly_amount)}</div>
                  <div className="muted small">পিতা: {a.father_name || '-'} | মাতা: {a.mother_name || '-'} | এনআইডি: {a.nid || '-'}</div>
                  <div className="muted small">{a.address || '-'}</div>
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                <a className="btn sm" href={`/admin/print/application/${a.id}`} target="_blank" rel="noreferrer">ফর্ম প্রিন্ট (Print form)</a>
                <span className={`badge ${a.status === 'pending' ? 'b-warn' : a.status === 'approved' ? 'b-ok' : 'b-mute'}`}>{a.status === 'pending' ? 'অপেক্ষমাণ (Pending)' : a.status === 'approved' ? 'অনুমোদিত (Approved)' : 'বাতিল (Rejected)'}</span>
              </div>
            </div>

            {a.status === 'pending' && (
              <>
                <div className={`notice ${a.pay_claimed_at ? 'ok' : 'warn'}`} style={{ marginTop: 12, marginBottom: 0 }}>
                  {a.pay_claimed_at
                    ? <>আবেদনকারী জানিয়েছেন ({fd(a.pay_claimed_at)}): <b>{a.pay_method}</b>{a.pay_trx ? <>, ট্রানজ্যাকশন আইডি <b>{a.pay_trx}</b></> : null}। আপনার বিকাশ/নগদ/ব্যাংক হিসাবে মিলিয়ে দেখুন (check it in your bKash, Nagad or bank account)।</>
                    : 'আবেদনকারী এখনো ভর্তি ফি পাঠানোর কথা জানাননি।'}
                </div>
                <div className="row" style={{ marginTop: 12, alignItems: 'flex-end' }}>
                  <ActionForm action={approveApplication.bind(null, a.id)} className="row" style={{ alignItems: 'flex-end' }}>
                    <label className="f" style={{ margin: 0 }}><span>ভর্তি ফি পেয়েছেন (৳) <small className="en-hint">(Fee received)</small></span><input name="fee" type="number" defaultValue={s?.reg_fee ?? 200} style={{ width: 120 }} /></label>
                    <label className="f" style={{ margin: 0 }}><span>মাধ্যম <small className="en-hint">(Method)</small></span><select name="method" defaultValue={METHODS.includes(a.pay_method ?? '') ? a.pay_method! : 'নগদ (হাতে)'} style={{ width: 140 }}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></label>
                    <label className="f" style={{ margin: 0 }}><span>ট্রানজ্যাকশন আইডি <small className="en-hint">(TrxID)</small></span><input name="trx" defaultValue={a.pay_trx ?? ''} style={{ width: 160 }} /></label>
                    {!a.user_id && <label className="f" style={{ margin: 0 }}><span>লগইন পাসওয়ার্ড (পুরোনো আবেদন)<small className="en-hint">(Login password, old application)</small></span><input name="password" minLength={6} autoComplete="off" style={{ width: 180 }} /></label>}
                    <Submit>যাচাই করে অনুমোদন (Verify & approve)</Submit>
                  </ActionForm>
                  <ConfirmButton action={rejectApplication.bind(null, a.id)} className="btn danger" label="বাতিল (Reject)" confirm="আবেদনটি বাতিল করবেন? আবেদনকারী বিজ্ঞপ্তি পাবেন।" />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
