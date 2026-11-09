import Link from 'next/link';
import type { Metadata } from 'next';
import { ActionForm, Submit } from '../../../_components/ActionForm';
import { sendBulk } from '../../../actions/contact';
import { MONEY, requirePage } from '@/lib/guard';
import { DATASETS } from '@/lib/datasets';
import { parseRange } from '@/lib/range';
import { bn, fd, tk } from '@/lib/format';
import { Empty, PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'সদস্যদের সাথে যোগাযোগ' };
type Row = { id: string; member_no: string; name: string; phone: string; email: string | null; status: string; frozen_at: string | null; overdue_months: number; monthly_amount: number };

const TEMPLATES: Record<string, [string, string]> = {
  frozen: ['আপনার সদস্যপদ স্থগিত আছে', 'আসসালামু আলাইকুম। টানা চাঁদা বকেয়া থাকায় আপনার সদস্যপদ স্থগিত আছে। পুনরায় সক্রিয় হতে কোষাধ্যক্ষের সাথে যোগাযোগ করুন। ভুলবশত হয়ে থাকলে রসিদসহ জানান।'],
  risk: ['সতর্কতা: সদস্যপদ স্থগিত হতে চলেছে', 'আসসালামু আলাইকুম। আপনার কয়েক মাসের চাঁদা বকেয়া আছে। এখনই জমা না দিলে কিছু দিনের মধ্যে সদস্যপদ স্বয়ংক্রিয়ভাবে স্থগিত হয়ে যাবে।'],
  due: ['চাঁদা বকেয়া আছে', 'আসসালামু আলাইকুম। আপনার মাসিক চাঁদা বকেয়া আছে। সুবিধামতো দ্রুত জমা দেওয়ার অনুরোধ রইল।'],
};

export default async function Contact({ searchParams }: { searchParams: { group?: string } }) {
  const { supabase } = await requirePage(MONEY);
  const group = ['frozen', 'risk', 'due'].includes(searchParams.group ?? '') ? searchParams.group! : 'frozen';
  const [all, { data: s }] = await Promise.all([
    DATASETS.members.load(supabase, parseRange({ r: 'all' }), {}) as Promise<Row[]>,
    supabase.from('settings').select('freeze_months').eq('id', 1).single(),
  ]);
  const fm = s?.freeze_months ?? 3;
  const groups: Record<string, Row[]> = {
    frozen: all.filter((m) => m.status === 'frozen'),
    risk: all.filter((m) => m.status === 'active' && m.overdue_months >= Math.max(1, fm - 1)),
    due: all.filter((m) => m.status === 'active' && m.overdue_months > 0),
  };
  const rows = groups[group];
  const [title, body] = TEMPLATES[group];
  const wa = (p: string) => `https://wa.me/88${p.replace(/\D/g, '').replace(/^88/, '')}`;
  return (
    <>
      <PageHead title="স্থগিত ও বকেয়া সদস্যদের সাথে যোগাযোগ" sub="এক চাপে কল, SMS বা হোয়াটসঅ্যাপ, অথবা বাছাই করা সবাইকে একসাথে বার্তা (প্রোফাইলে, ইমেইলে ও SMS এ)।">
        <Link className="btn" href="/admin/members">সদস্য তালিকা</Link>
      </PageHead>
      <div className="seg wrapable" style={{ marginBottom: 12 }}>
        <Link href="/admin/members/contact?group=frozen" className={group === 'frozen' ? 'on' : ''}>স্থগিত ({bn(groups.frozen.length)})</Link>
        <Link href="/admin/members/contact?group=risk" className={group === 'risk' ? 'on' : ''}>স্থগিত হতে চলেছে ({bn(groups.risk.length)})</Link>
        <Link href="/admin/members/contact?group=due" className={group === 'due' ? 'on' : ''}>বকেয়া আছে ({bn(groups.due.length)})</Link>
      </div>
      <ActionForm action={sendBulk} key={group}>
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 360px', alignItems: 'start' }}>
          <div className="card"><div className="scroll"><table className="tbl">
            <thead><tr><th><input type="checkbox" aria-label="সবাই" className="pick-all" defaultChecked /></th><th>সদস্য</th><th>{group === 'frozen' ? 'স্থগিত হয়েছেন' : 'বকেয়া'}</th><th>যোগাযোগ</th></tr></thead>
            <tbody>
              {rows.length === 0 && <Empty cols={4} text="এই তালিকায় কেউ নেই, আলহামদুলিল্লাহ" />}
              {rows.map((m) => (
                <tr key={m.id}>
                  <td><input type="checkbox" name="ids" value={m.id} defaultChecked aria-label={m.name} /></td>
                  <td><Link href={`/admin/members/${m.id}`}><b>{m.name}</b></Link><div className="muted small">{m.member_no}, {bn(m.phone)}{m.email ? `, ${m.email}` : ''}</div></td>
                  <td>{group === 'frozen' ? fd(m.frozen_at) : <><span className="badge b-bad">{bn(m.overdue_months)} মাস</span><div className="muted small">{tk(m.overdue_months * Number(m.monthly_amount))}</div></>}</td>
                  <td><div className="acts" style={{ justifyContent: 'flex-start' }}>
                    <a className="btn sm" href={`tel:${m.phone}`}>📞 কল</a>
                    <a className="btn sm" href={`sms:${m.phone}?body=${encodeURIComponent(body)}`}>💬 SMS</a>
                    <a className="btn sm" href={`${wa(m.phone)}?text=${encodeURIComponent(body)}`} target="_blank" rel="noopener noreferrer">হোয়াটসঅ্যাপ</a>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <p className="muted small" style={{ marginBottom: 0 }}>"কল" চাপলে ফোন থেকে সরাসরি কল যাবে (মোবাইলে বা কল-সুবিধাসহ কম্পিউটারে)। "SMS" ও "হোয়াটসঅ্যাপ" লেখা বার্তাসহ খোলে।</p></div>
          <div className="card">
            <b>বাছাই করা সবাইকে বার্তা</b>
            <label className="f" style={{ marginTop: 10 }}><span>শিরোনাম</span><input name="title" defaultValue={title} maxLength={80} required /></label>
            <label className="f"><span>বার্তা</span><textarea name="body" rows={6} defaultValue={body} maxLength={600} required /></label>
            <p className="muted small">সদস্যের প্রোফাইলে বিজ্ঞপ্তি যাবে; ইমেইল থাকলে ইমেইলে এবং সেটিংসে SMS চালু ও গেটওয়ে বসানো থাকলে SMS এও যাবে।</p>
            <Submit pendingText="পাঠানো হচ্ছে...">পাঠান</Submit>
          </div>
        </div>
      </ActionForm>
      <script dangerouslySetInnerHTML={{ __html: "document.addEventListener('change',function(e){var t=e.target;if(t&&t.classList&&t.classList.contains('pick-all')){document.querySelectorAll('input[name=ids]').forEach(function(c){c.checked=t.checked})}})" }} />
    </>
  );
}
