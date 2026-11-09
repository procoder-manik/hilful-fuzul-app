import type { Metadata } from 'next';
import { ActionForm, ConfirmButton, Submit } from '../../../_components/ActionForm';
import { deleteLending, lendBook, returnBook } from '../../../actions/library';
import { LibraryTabs } from '../LibraryTabs';
import { LIBRARY, requirePage } from '@/lib/guard';
import { bn, fd } from '@/lib/format';
import { todayBD } from '@/lib/dates';
import { Empty, PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'বই আদান-প্রদান' };

export default async function Lendings({ searchParams }: { searchParams: { all?: string } }) {
  const { supabase } = await requirePage(LIBRARY);
  const today = todayBD();
  let q = supabase.from('book_lendings').select('*, books(title)').order('out_on', { ascending: false }).limit(200);
  if (!searchParams.all) q = q.is('returned_on', null);
  const [{ data }, { data: books }, { data: members }, { data: out }] = await Promise.all([
    q,
    supabase.from('books').select('id, title, copies').order('title'),
    supabase.from('members').select('id, name, member_no').eq('status', 'active').order('name'),
    supabase.from('book_lendings').select('book_id').is('returned_on', null),
  ]);
  const outCount = new Map<string, number>();
  (out ?? []).forEach((o) => outCount.set(o.book_id, (outCount.get(o.book_id) ?? 0) + 1));
  const available = (books ?? []).filter((b) => b.copies > (outCount.get(b.id) ?? 0));
  const in14 = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  return (
    <>
      <PageHead title="বই আদান-প্রদান" sub={`${bn((out ?? []).length)}টি বই এখন পাঠকের কাছে`}>
        <a className="btn" href={searchParams.all ? '/admin/library/lendings' : '/admin/library/lendings?all=1'}>{searchParams.all ? 'শুধু বাইরে থাকা' : 'পুরো ইতিহাস'}</a>
      </PageHead>
      <LibraryTabs on="lend" />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 340px', alignItems: 'start' }}>
        <div className="card"><div className="scroll"><table className="tbl">
          <thead><tr><th>বই</th><th>পাঠক</th><th>নিয়েছেন</th><th>ফেরতের কথা</th><th>অবস্থা</th><th></th></tr></thead>
          <tbody>
            {(data ?? []).length === 0 && <Empty cols={6} text="কোনো বই এখন বাইরে নেই" />}
            {(data ?? []).map((x) => {
              const late = !x.returned_on && x.expected_on && x.expected_on < today;
              return (
                <tr key={x.id}>
                  <td><b>{(x.books as { title: string } | null)?.title ?? 'মুছে ফেলা বই'}</b></td>
                  <td>{x.borrower_name}<div className="muted small">{bn(x.borrower_phone ?? '')}</div></td>
                  <td>{fd(x.out_on)}</td><td>{fd(x.expected_on)}</td>
                  <td>{x.returned_on ? <span className="badge b-ok">ফেরত {fd(x.returned_on)}</span> : late ? <span className="badge b-bad">দেরি হচ্ছে</span> : <span className="badge b-warn">পাঠকের কাছে</span>}</td>
                  <td><div className="acts">
                    {!x.returned_on && <ConfirmButton action={returnBook.bind(null, x.id)} className="btn sm pri" label="ফেরত নিন" />}
                    <ConfirmButton action={deleteLending.bind(null, x.id)} className="btn sm danger" label="মুছুন" confirm="এই এন্ট্রি মুছবেন?" />
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table></div></div>
        <ActionForm action={lendBook} className="card" resetOnSuccess>
          <b>বই দিন</b>
          <label className="f" style={{ marginTop: 10 }}><span>বই *</span><select name="book_id" required>{available.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</select></label>
          <label className="f"><span>সদস্য হলে বেছে নিন</span><select name="member_id"><option value="">সদস্য নন</option>{(members ?? []).map((m) => <option key={m.id} value={m.id}>{m.name} ({m.member_no})</option>)}</select></label>
          <label className="f"><span>পাঠকের নাম (সদস্য না হলে)</span><input name="borrower_name" /></label>
          <label className="f"><span>মোবাইল</span><input name="borrower_phone" inputMode="tel" /></label>
          <div className="grid g2" style={{ gap: '0 10px' }}>
            <label className="f"><span>নেওয়ার তারিখ</span><input name="out_on" type="date" defaultValue={today} /></label>
            <label className="f"><span>ফেরতের তারিখ</span><input name="expected_on" type="date" defaultValue={in14} /></label>
          </div>
          <Submit>সংরক্ষণ</Submit>
        </ActionForm>
      </div>
    </>
  );
}
