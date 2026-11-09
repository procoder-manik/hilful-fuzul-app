import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ActionForm, ConfirmButton, Submit } from '../../../_components/ActionForm';
import { deleteContent, saveContent } from '../../../actions/content';
import { CONTENT_ROLES, KINDS } from '@/lib/content';
import { requirePage } from '@/lib/guard';
import { bn, fd } from '@/lib/format';
import { todayBD } from '@/lib/dates';
import { Empty, PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'ওয়েবসাইটের কনটেন্ট' };

export default async function ContentPage({ params, searchParams }: { params: { kind: string }; searchParams: { edit?: string } }) {
  const K = KINDS[params.kind];
  if (!K) notFound();
  const { supabase } = await requirePage(CONTENT_ROLES);
  const { data } = await supabase.from(K.table).select('*').order(K.order, { ascending: K.asc });
  const rows = (data ?? []) as Record<string, unknown>[];
  const edit = searchParams.edit ? rows.find((r) => r.id === searchParams.edit) : null;
  const show = (r: Record<string, unknown>, k: string) => {
    const v = r[k];
    if (k === 'published_on') return fd(String(v));
    if (k === 'is_published') return v ? <span className="badge b-ok">প্রকাশিত</span> : <span className="badge b-mute">খসড়া</span>;
    if (typeof v === 'number') return bn(v);
    return String(v ?? '');
  };
  return (
    <>
      <PageHead title={K.title} sub={K.sub} />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 360px', alignItems: 'start' }}>
        <div className="card"><div className="scroll"><table className="tbl"><tbody>
          {rows.length === 0 && <Empty cols={K.list.length + 1} />}
          {rows.map((r) => (
            <tr key={String(r.id)}>
              {K.list.map((k, i) => <td key={k}>{i === 0 || (K.list[0] === 'icon' && i === 1) ? <b>{show(r, k)}</b> : show(r, k)}</td>)}
              <td><div className="acts"><Link className="btn sm" href={`/admin/content/${params.kind}?edit=${r.id}`}>সম্পাদনা</Link>
                <ConfirmButton action={deleteContent.bind(null, params.kind, String(r.id))} className="btn sm danger" label="মুছুন" confirm="মুছে ফেলবেন?" /></div></td>
            </tr>
          ))}
        </tbody></table></div></div>
        <ActionForm key={String(edit?.id ?? 'new')} action={saveContent.bind(null, params.kind, edit ? String(edit.id) : null)} className="card">
          <b>{edit ? 'সম্পাদনা' : 'নতুন যোগ করুন'}</b>
          <div style={{ marginTop: 10 }}>
            {K.fields.map((f) => {
              const v = edit?.[f.k];
              if (f.type === 'textarea') return <label key={f.k} className="f"><span>{f.l}</span><textarea name={f.k} rows={f.k === 'body' ? 10 : 3} defaultValue={String(v ?? '')} /></label>;
              if (f.type === 'checkbox') return <label key={f.k} className="chk"><input type="checkbox" name={f.k} defaultChecked={edit ? !!v : true} /> <span>{f.l}</span></label>;
              if (f.type === 'image') return <label key={f.k} className="f"><span>{f.l} {v ? '(বদলাতে চাইলে নতুন দিন)' : ''}</span>{v ? <img src={String(v)} alt="" style={{ maxHeight: 70, borderRadius: 10, marginBottom: 6 }} /> : null}<input type="file" name={f.k} accept="image/*" /></label>;
              const def = v ?? (f.type === 'date' ? todayBD() : f.type === 'number' ? 0 : '');
              return <label key={f.k} className="f"><span>{f.l}{f.req ? ' *' : ''}</span><input name={f.k} type={f.type ?? 'text'} defaultValue={String(def)} required={f.req} /></label>;
            })}
          </div>
          <div className="row" style={{ gap: 8 }}><Submit>{edit ? 'পরিবর্তন সংরক্ষণ' : 'যোগ করুন'}</Submit>{edit && <Link className="btn" href={`/admin/content/${params.kind}`}>বাতিল</Link>}</div>
        </ActionForm>
      </div>
    </>
  );
}
