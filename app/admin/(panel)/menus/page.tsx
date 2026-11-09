import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm, ConfirmButton, Submit } from '../../_components/ActionForm';
import { deleteMenuItem, moveMenuItem, saveMenuItem } from '../../actions/menus';
import { CONTENT_ROLES } from '@/lib/content';
import { requirePage } from '@/lib/guard';
import { LOCATIONS, normalizeBlocks, PAGES, type MenuRow } from '@/lib/menu';
import { PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'মেনু' };

export default async function Menus({ searchParams }: { searchParams: { loc?: string; edit?: string; new?: string; parent?: string } }) {
  const { supabase } = await requirePage(CONTENT_ROLES);
  const loc = LOCATIONS.some(([k]) => k === searchParams.loc) ? searchParams.loc! : 'header';
  const { data, error } = await supabase.from('menu_items').select('*').eq('location', loc).order('sort');
  if (error) return <><PageHead title="মেনু" /><div className="notice">মেনুর টেবিল পাওয়া যায়নি। Supabase এর SQL Editor এ <b>005_menus_layout.sql</b> চালান, তারপর পাতাটি আবার খুলুন। ({error.message})</div></>;
  const rows = (data ?? []) as MenuRow[];
  const top = rows.filter((r) => !r.parent_id);
  const kids = (id: string) => rows.filter((r) => r.parent_id === id);
  const editing = searchParams.edit ? rows.find((r) => r.id === searchParams.edit) : undefined;
  const adding = !!searchParams.new && !editing;
  const parentDefault = editing?.parent_id ?? (adding ? searchParams.parent ?? '' : '');
  const blocks = normalizeBlocks(editing?.mega);
  const isTop = !parentDefault;
  const item = (r: MenuRow, child = false) => (
    <div key={r.id} className={`mrow${child ? ' mchild' : ''}${r.visible ? '' : ' mhide'}`}>
      <div className="mrow-t">
        <b>{child ? '↳ ' : ''}{r.icon ? `${r.icon} ` : ''}{r.label}</b> <span className="muted small">{r.url}</span>{' '}
        {r.is_mega && <span className="badge b-info">মেগা মেনু</span>} {!child && kids(r.id).length > 0 && !r.is_mega && <span className="badge b-ok">ড্রপডাউন</span>} {!r.visible && <span className="badge b-mute">লুকানো</span>}
      </div>
      <div className="acts">
        <ConfirmButton action={moveMenuItem.bind(null, r.id, 'up')} className="btn sm" label="↑" title="ওপরে সরান" />
        <ConfirmButton action={moveMenuItem.bind(null, r.id, 'down')} className="btn sm" label="↓" title="নিচে সরান" />
        {!child && <Link className="btn sm" href={`/admin/menus?loc=${loc}&new=1&parent=${r.id}`} title="এর ভেতরে আইটেম যোগ করুন">+ ভেতরে</Link>}
        <Link className="btn sm" href={`/admin/menus?loc=${loc}&edit=${r.id}`}>সম্পাদনা</Link>
        <ConfirmButton action={deleteMenuItem.bind(null, r.id)} className="btn sm danger" label="মুছুন" confirm={kids(r.id).length ? `"${r.label}" ও এর ভেতরের ${kids(r.id).length}টি আইটেম মুছে যাবে। নিশ্চিত?` : `"${r.label}" মুছবেন?`} />
      </div>
    </div>
  );
  return (
    <>
      <PageHead title="মেনু" sub="ওয়েবসাইটের মেনু নিজের মতো সাজান: নতুন আইটেম, ড্রপডাউন ও মেগা মেনু (যেখানে নতুন বই, অনুষ্ঠান বা নিজের কার্ড দেখানো যায়)।">
        <Link className="btn" href="/admin/design">হেডার ও ফুটার ডিজাইন</Link>
      </PageHead>
      <div className="seg wrapable" style={{ marginBottom: 16 }}>{LOCATIONS.map(([k, n]) => <Link key={k} href={`/admin/menus?loc=${k}`} className={loc === k ? 'on' : ''}>{n}</Link>)}</div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 360px', alignItems: 'start' }}>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}><b>{LOCATIONS.find(([k]) => k === loc)![1]}</b><Link className="btn pri sm" href={`/admin/menus?loc=${loc}&new=1`}>+ নতুন আইটেম (New item)</Link></div>
          {top.length === 0 && <p className="muted">এই মেনুতে এখনো কোনো আইটেম নেই। ডানের ফর্ম থেকে যোগ করুন।</p>}
          {top.map((r) => <div key={r.id}>{item(r)}{kids(r.id).map((c) => item(c, true))}</div>)}
          <p className="muted small" style={{ marginBottom: 0 }}>ওপর-নিচ বোতামে ক্রম বদলান। কোনো আইটেমের ভেতরে "+ ভেতরে" দিয়ে আইটেম যোগ করলে সেটি ড্রপডাউন হয়ে যায়; "মেগা মেনু" চালু করলে বড় প্যানেল হয়।</p>
        </div>
        {(editing || adding) ? (
          <ActionForm action={saveMenuItem.bind(null, editing?.id ?? null, loc)} className="card" key={editing?.id ?? 'new'}>
            <div className="row" style={{ justifyContent: 'space-between' }}><b>{editing ? 'আইটেম সম্পাদনা' : 'নতুন আইটেম'}</b><Link className="btn sm" href={`/admin/menus?loc=${loc}`}>বন্ধ</Link></div>
            <label className="f" style={{ marginTop: 10 }}><span>নাম (বাংলা) *<small className="en-hint">(Name in Bangla)</small></span><input name="label" defaultValue={editing?.label ?? ''} required maxLength={60} /></label>
            <label className="f"><span>নাম (English, ঐচ্ছিক)</span><input name="label_en" defaultValue={editing?.label_en ?? ''} maxLength={60} /></label>
            <label className="f"><span>লিংক (পেজের ঠিকানা বা https://...)<small className="en-hint">(Link)</small></span><input name="url" list="pages" defaultValue={editing?.url ?? ''} placeholder="/about" /></label>
            <datalist id="pages">{PAGES.map(([u, n]) => <option key={u} value={u}>{n}</option>)}</datalist>
            <label className="f"><span>কোনটির ভেতরে থাকবে (ড্রপডাউনের জন্য)<small className="en-hint">(Parent item, for dropdown)</small></span>
              <select name="parent_id" defaultValue={parentDefault}><option value="">কোনোটির ভেতরে নয় (মূল আইটেম)</option>{top.filter((r) => r.id !== editing?.id).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
            <div className="grid g2" style={{ gap: '0 10px' }}>
              <label className="f"><span>আইকন (ইমোজি)<small className="en-hint">(Icon)</small></span><input name="icon" defaultValue={editing?.icon ?? ''} maxLength={4} placeholder="📚" /></label>
              <div />
            </div>
            <label className="f"><span>ছোট বিবরণ (ড্রপডাউন/মেগা মেনুর ভেতরে দেখায়)<small className="en-hint">(Short description)</small></span><input name="descr" defaultValue={editing?.descr ?? ''} maxLength={120} /></label>
            <label className="f"><span>ছোট বিবরণ (English)</span><input name="descr_en" defaultValue={editing?.descr_en ?? ''} maxLength={120} /></label>
            <label className="chk"><input type="checkbox" name="visible" defaultChecked={editing?.visible ?? true} /> <span>মেনুতে দেখান</span></label>
            <label className="chk"><input type="checkbox" name="new_tab" defaultChecked={editing?.new_tab ?? false} /> <span>নতুন ট্যাবে খুলুন</span></label>
            {isTop && (
              <details open={editing?.is_mega} style={{ marginTop: 10 }}>
                <summary>মেগা মেনু (বড় প্যানেল)</summary>
                <label className="chk"><input type="checkbox" name="is_mega" defaultChecked={editing?.is_mega ?? false} /> <span>এই আইটেমকে মেগা মেনু করুন (ভেতরের আইটেমগুলো বাঁয়ে, ডানে নিচের ব্লক)</span></label>
                {[1, 2].map((i) => { const b = blocks[i - 1]; return (
                  <fieldset key={i} className="mfs"><legend>ব্লক {i}</legend>
                    <label className="f"><span>কী দেখাবে<small className="en-hint">(What to show)</small></span><select name={`b${i}_type`} defaultValue={b?.type ?? ''}><option value="">কিছু না</option><option value="books">নতুন বই</option><option value="events">আসন্ন অনুষ্ঠান</option><option value="news">সাম্প্রতিক সংবাদ</option><option value="card">নিজের কার্ড (নতুন ফিচার, ঘোষণা)</option></select></label>
                    <div className="grid g2" style={{ gap: '0 8px' }}>
                      <label className="f"><span>শিরোনাম<small className="en-hint">(Title)</small></span><input name={`b${i}_title`} defaultValue={b?.title ?? ''} /></label>
                      <label className="f"><span>Title (English)</span><input name={`b${i}_title_en`} defaultValue={b?.title_en ?? ''} /></label>
                      <label className="f"><span>কয়টি দেখাবে (১-৬)<small className="en-hint">(How many to show)</small></span><input name={`b${i}_count`} type="number" min={1} max={6} defaultValue={b?.count ?? 3} /></label>
                      <div />
                    </div>
                    <p className="muted small" style={{ margin: '0 0 6px' }}>নিচের ঘরগুলো শুধু "নিজের কার্ড" এর জন্য:</p>
                    <label className="f"><span>লেখা<small className="en-hint">(Text)</small></span><textarea name={`b${i}_text`} rows={2} defaultValue={b?.text ?? ''} /></label>
                    <label className="f"><span>Text (English)</span><textarea name={`b${i}_text_en`} rows={2} defaultValue={b?.text_en ?? ''} /></label>
                    <div className="grid g2" style={{ gap: '0 8px' }}>
                      <label className="f"><span>বাটনের লেখা<small className="en-hint">(Button text)</small></span><input name={`b${i}_cta`} defaultValue={b?.cta ?? ''} /></label>
                      <label className="f"><span>Button (English)</span><input name={`b${i}_cta_en`} defaultValue={b?.cta_en ?? ''} /></label>
                    </div>
                    <label className="f"><span>বাটনের লিংক<small className="en-hint">(Button link)</small></span><input name={`b${i}_href`} list="pages" defaultValue={b?.href ?? ''} /></label>
                    <label className="f"><span>ব্যাকগ্রাউন্ড ছবি {b?.image ? '(বদলাতে চাইলে নতুন দিন)' : ''}</span><input name={`b${i}_image`} type="file" accept="image/jpeg,image/png,image/webp" /><input type="hidden" name={`b${i}_image_old`} value={b?.image ?? ''} /></label>
                  </fieldset>); })}
              </details>
            )}
            <Submit pendingText="সংরক্ষণ হচ্ছে...">{editing ? 'সংরক্ষণ করুন' : 'আইটেম যোগ করুন'}</Submit>
          </ActionForm>
        ) : (
          <div className="card muted">বাঁয়ে কোনো আইটেমের "সম্পাদনা" চাপুন অথবা "+ নতুন আইটেম" দিয়ে যোগ করুন।</div>
        )}
      </div>
    </>
  );
}
