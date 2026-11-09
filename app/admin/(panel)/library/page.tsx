import Link from 'next/link';
import type { Metadata } from 'next';
import { ActionForm, ConfirmButton, Submit } from '../../_components/ActionForm';
import { deleteBook, saveBook } from '../../actions/library';
import { LibraryTabs } from './LibraryTabs';
import { LIBRARY, requirePage } from '@/lib/guard';
import { bn, fd } from '@/lib/format';
import { todayBD } from '@/lib/dates';
import { cleanQ, Empty, PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'পাঠাগার' };

export default async function Library({ searchParams }: { searchParams: { q?: string; edit?: string } }) {
  const { supabase } = await requirePage(LIBRARY);
  const q = cleanQ(searchParams.q);
  let query = supabase.from('books').select('*').order('added_on', { ascending: false });
  if (q) query = query.or(`title.ilike.*${q}*,author.ilike.*${q}*,category.ilike.*${q}*`);
  const [{ data: books }, { data: out }] = await Promise.all([query, supabase.from('book_lendings').select('book_id').is('returned_on', null)]);
  const outCount = new Map<string, number>();
  (out ?? []).forEach((o) => outCount.set(o.book_id, (outCount.get(o.book_id) ?? 0) + 1));
  const edit = searchParams.edit ? (books ?? []).find((b) => b.id === searchParams.edit) : null;
  const cats = Array.from(new Set((books ?? []).map((b) => b.category).filter(Boolean)));
  const isNew = (d: string) => d >= new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
  const copies = (books ?? []).reduce((a, b) => a + b.copies, 0);
  return (
    <>
      <PageHead title="পাঠাগার" sub={`${bn((books ?? []).length)} শিরোনাম, ${bn(copies)} কপি, ${bn((out ?? []).length)}টি পাঠকের কাছে`} />
      <LibraryTabs on="books" />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 340px', alignItems: 'start' }}>
        <div className="card">
          <form className="row" style={{ marginBottom: 10, gap: 8 }}><input name="q" defaultValue={q} placeholder="বই, লেখক বা বিষয়" style={{ width: 240 }} aria-label="খুঁজুন" /><button className="btn">খুঁজুন (Search)</button></form>
          <div className="scroll"><table className="tbl">
            <thead><tr><th>বই<small className="en-hint">(Book)</small></th><th>বিষয়<small className="en-hint">(Subject)</small></th><th>পাঠাগারে / মোট<small className="en-hint">(In library / total)</small></th><th>তাক<small className="en-hint">(Shelf)</small></th><th>সংযোজন<small className="en-hint">(Added)</small></th><th></th></tr></thead>
            <tbody>
              {(books ?? []).length === 0 && <Empty cols={6} />}
              {(books ?? []).map((b) => (
                <tr key={b.id}>
                  <td><b>{b.title}</b> {isNew(b.added_on) && <span className="badge b-info">নতুন</span>}<div className="muted small">{b.author}</div></td>
                  <td>{b.category}</td><td>{bn(b.copies - (outCount.get(b.id) ?? 0))} / {bn(b.copies)}</td><td>{b.shelf}</td><td>{fd(b.added_on)}</td>
                  <td><div className="acts"><Link className="btn sm" href={`/admin/library?edit=${b.id}`}>সম্পাদনা</Link>
                    <ConfirmButton action={deleteBook.bind(null, b.id)} className="btn sm danger" label="মুছুন" confirm={`"${b.title}" মুছে ফেলবেন?`} /></div></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
        <ActionForm key={edit?.id ?? 'new'} action={saveBook.bind(null, edit?.id ?? null)} className="card">
          <b>{edit ? 'বই সম্পাদনা' : 'নতুন বই'}</b>
          <label className="f" style={{ marginTop: 10 }}><span>বইয়ের নাম *<small className="en-hint">(Book title)</small></span><input name="title" defaultValue={edit?.title} required /></label>
          <label className="f"><span>লেখক<small className="en-hint">(Author)</small></span><input name="author" defaultValue={edit?.author ?? ''} /></label>
          <label className="f"><span>বিষয়<small className="en-hint">(Subject)</small></span><input name="category" defaultValue={edit?.category ?? ''} list="cats" /></label>
          <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
          <div className="grid g2" style={{ gap: '0 10px' }}>
            <label className="f"><span>কপি<small className="en-hint">(Copies)</small></span><input name="copies" type="number" min={1} defaultValue={edit?.copies ?? 1} /></label>
            <label className="f"><span>তাক<small className="en-hint">(Shelf)</small></span><input name="shelf" defaultValue={edit?.shelf ?? ''} /></label>
          </div>
          <label className="f"><span>সংযোজনের তারিখ<small className="en-hint">(Date added)</small></span><input name="added_on" type="date" defaultValue={edit?.added_on ?? todayBD()} /></label>
          <label className="f"><span>প্রচ্ছদের ছবি<small className="en-hint">(Cover image)</small></span><input name="cover" type="file" accept="image/*" /></label>
          <div className="row" style={{ gap: 8 }}><Submit>{edit ? 'পরিবর্তন সংরক্ষণ' : 'বই যোগ করুন'}</Submit>{edit && <Link className="btn" href="/admin/library">বাতিল</Link>}</div>
        </ActionForm>
      </div>
    </>
  );
}
