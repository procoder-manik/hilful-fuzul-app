'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ActionForm, Submit } from '../../../_components/ActionForm';
import { Fld, Info, Tick } from '../../../_components/Fld';
import { Icon } from '@/components/Icon';
import { BLOCK_MAP, BLOCKS, newBlock, type Block, type Field } from '@/lib/blocks';
import { BLOCK_DATA_LINKS, PAGE_DATA_LINKS, TOKEN_HELP } from '@/lib/builtin';
import { PATTERNS, PRESETS } from '@/lib/eventdesign';
import { cleanStyle, styleCss, type SecStyle } from '@/lib/sectionstyle';
import { uploadBlockImage } from '../../../actions/pages';
import type { ActionState } from '@/lib/guard';

type Action = (p: ActionState, f: FormData) => Promise<ActionState>;
export type PageMeta = { title: string; slug: string; published: boolean; inMenu: boolean; seoTitle: string; seoDesc: string };

const GROUPS: [string, string, string][] = [['page', 'এই পেজের নিজস্ব কন্টেন্ট', 'This page’s content'], ['content', 'নিজের লেখা ও ছবি', 'Content'], ['live', 'লাইভ তথ্য (নিজে হালনাগাদ হয়)', 'Live data'], ['cta', 'আহ্বানের ব্যানার', 'Call-to-action']];

function StyleBox({ b, set }: { b: Block; set: (p: Partial<Block>) => void }) {
  const st = cleanStyle(b as never);
  const c = styleCss(st);
  return (
    <div className="pb-style">
      <div className="ss-sw" style={c.box}>{st.pat !== 'none' && <div className={`sec-pat bnp-${st.pat}`} style={{ opacity: st.op, color: c.patColor }} aria-hidden="true" />}<b>ব্যাকগ্রাউন্ড ও প্যাটার্নের প্রিভিউ</b></div>
      <div className="ss-ctl">
        <label className="f"><span>ব্যাকগ্রাউন্ড রং<small className="en-hint">(Background)</small></span>
          <select value={st.bg} onChange={(e) => set({ bg: e.target.value })}>
            <option value="none">সাদামাটা (None)</option>
            <optgroup label="হালকা (Light)">{PRESETS.filter((p) => p.tone === 'light').map((p) => <option key={p.id} value={p.id}>{p.name} ({p.en})</option>)}</optgroup>
            <optgroup label="গাঢ় (Deep)">{PRESETS.filter((p) => p.tone === 'deep').map((p) => <option key={p.id} value={p.id}>{p.name} ({p.en})</option>)}</optgroup>
            <option value="custom">নিজের রং (Custom gradient)</option>
          </select></label>
        {st.bg === 'custom' && <>
          <label className="f"><span>রং ১<small className="en-hint">(Colour 1)</small></span><input type="color" value={st.c1} onChange={(e) => set({ bg: 'custom', c1: e.target.value, c2: st.c2, tx: st.tx })} style={{ height: 42, padding: 2 }} /></label>
          <label className="f"><span>রং ২<small className="en-hint">(Colour 2)</small></span><input type="color" value={st.c2} onChange={(e) => set({ bg: 'custom', c1: st.c1, c2: e.target.value, tx: st.tx })} style={{ height: 42, padding: 2 }} /></label>
          <label className="f"><span>লেখার রং<small className="en-hint">(Text colour)</small></span><input type="color" value={st.tx} onChange={(e) => set({ bg: 'custom', c1: st.c1, c2: st.c2, tx: e.target.value })} style={{ height: 42, padding: 2 }} /></label>
        </>}
        <label className="f"><span>প্যাটার্ন<small className="en-hint">(Pattern)</small></span><select value={st.pat} onChange={(e) => set({ pat: e.target.value as SecStyle['pat'] })}>{PATTERNS.map(([k, n, en]) => <option key={k} value={k}>{n} ({en})</option>)}</select></label>
        <label className="f"><span>স্পষ্টতা: {Math.round(st.op * 100)}%<small className="en-hint">(Strength)</small></span><input type="range" min={3} max={30} value={Math.round(st.op * 100)} disabled={st.pat === 'none'} onChange={(e) => set({ op: Number(e.target.value) / 100 })} /></label>
      </div>
      <div className="pb-sp">
        <b>ওপরে-নিচের ফাঁক<small className="en-hint">(Spacing, px)</small></b>
        <p className="muted small" style={{ margin: '2px 0 8px' }}>প্যাডিং হলো কম্পোনেন্টের ভেতরের ফাঁক (ব্যাকগ্রাউন্ডসহ), মার্জিন হলো বাইরের ফাঁক। ফাঁকা রাখলে আগের ডিফল্ট ফাঁকই থাকে, ওপরে বেশি জায়গা মনে হলে ০ বা ছোট সংখ্যা দিন।</p>
        <div className="pb-sp-g">
          {([['pt', 'ওপরে প্যাডিং', 'Padding top'], ['pb', 'নিচে প্যাডিং', 'Padding bottom'], ['mt', 'ওপরে মার্জিন', 'Margin top'], ['mb', 'নিচে মার্জিন', 'Margin bottom']] as const).map(([k, bnL, enL]) => (
            <label key={k} className="f"><span>{bnL}<small className="en-hint">({enL})</small></span>
              <input type="number" min={0} max={300} step={4} placeholder="ডিফল্ট" value={typeof b[k] === 'number' ? b[k] : ''} onChange={(e) => set({ [k]: e.target.value === '' ? undefined : Math.min(300, Math.max(0, Number(e.target.value))) } as Partial<Block>)} /></label>
          ))}
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="btn sm" onClick={() => set({ pt: 0, pb: 0 })}>ভেতরের ফাঁক ০ (No padding)</button>
          <button type="button" className="btn sm" onClick={() => set({ pt: 24, pb: 24 })}>ছোট (24)</button>
          <button type="button" className="btn sm" onClick={() => set({ pt: undefined, pb: undefined, mt: undefined, mb: undefined })}>ডিফল্টে ফিরুন (Reset)</button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ f, v, set }: { f: Field; v: string; set: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (f.kind === 'checkbox') return <Tick bn={f.bn} en={f.en} info={f.info} checked={v === '1'} onChange={(x) => set(x ? '1' : '0')} />;
  if (f.kind === 'image') {
    return (
      <Fld bn={f.bn} en={f.en} info={f.info ?? 'JPG, PNG বা WebP, ৩ MB এর কম।'}>
        <div>
          {v && <img src={v} alt="" style={{ maxHeight: 110, borderRadius: 12, marginBottom: 8, display: 'block' }} />}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setBusy(true); setErr('');
            const fd = new FormData(); fd.set('file', file);
            const r = await uploadBlockImage(fd);
            setBusy(false);
            if (r.url) set(r.url); else setErr(r.error ?? 'আপলোড হয়নি');
          }} />
          {busy && <small className="muted">আপলোড হচ্ছে...</small>}{err && <small style={{ color: 'var(--danger)' }}>{err}</small>}
          {v && <button type="button" className="btn sm" style={{ marginTop: 6 }} onClick={() => set('')}>ছবি সরান (Remove)</button>}
        </div>
      </Fld>
    );
  }
  return (
    <Fld bn={f.bn} en={f.en} info={f.info}>
      {f.kind === 'textarea' ? <textarea rows={f.rows ?? 3} value={v} onChange={(e) => set(e.target.value)} maxLength={4000} />
        : f.kind === 'select' ? <select value={v} onChange={(e) => set(e.target.value)}>{f.options!.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
        : <input value={v} onChange={(e) => set(e.target.value)} maxLength={400} />}
    </Fld>
  );
}

export function PageBuilder({ initial, meta, action, target, builtin }: { initial: Block[]; meta: PageMeta | null; action: Action; target: string; builtin?: { slug: string; use: boolean; hasBody: boolean; links: [string, string][] } }) {
  const [blocks, setBlocks] = useState<Block[]>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null);
  const [m, setM] = useState<PageMeta | null>(meta);
  const [use, setUse] = useState(builtin?.use ?? false);

  const insert = (b: Block, at: number) => setBlocks((l) => { const n = [...l]; n.splice(Math.max(0, Math.min(at, n.length)), 0, b); return n; });
  const upd = (id: string, p: Partial<Block>) => setBlocks((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const setProp = (id: string, k: string, v: string) => setBlocks((l) => l.map((x) => (x.id === id ? { ...x, props: { ...x.props, [k]: v } } : x)));
  const del = (id: string) => { if (window.confirm('কম্পোনেন্টটি সরাবেন?')) setBlocks((l) => l.filter((x) => x.id !== id)); };
  const dup = (id: string) => setBlocks((l) => { const i = l.findIndex((x) => x.id === id); if (i < 0) return l; const c = { ...l[i], id: newBlock('spacer').id, props: { ...l[i].props } }; const n = [...l]; n.splice(i + 1, 0, c); return n; });
  const move = (id: string, d: number) => setBlocks((l) => { const i = l.findIndex((x) => x.id === id); const j = i + d; if (i < 0 || j < 0 || j >= l.length) return l; const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const drop = (e: React.DragEvent, beforeId: string | null, after: boolean) => {
    e.preventDefault(); e.stopPropagation();
    const data = e.dataTransfer.getData('text/plain');
    setOver(null);
    let idx = beforeId ? blocks.findIndex((x) => x.id === beforeId) + (after ? 1 : 0) : blocks.length;
    if (data.startsWith('new:')) { const t = data.slice(4); if (BLOCK_MAP[t]) { const nb = newBlock(t); insert(nb, idx); setOpen(nb.id); } }
    else if (data.startsWith('move:')) {
      const id = data.slice(5); const from = blocks.findIndex((x) => x.id === id);
      if (from < 0) return;
      setBlocks((l) => { const n = [...l]; const [it] = n.splice(from, 1); if (from < idx) idx -= 1; n.splice(idx, 0, it); return n; });
    }
  };
  const add = (t: string) => { const nb = newBlock(t); setBlocks((l) => [...l, nb]); setOpen(nb.id); };

  return (
    <ActionForm action={action}>
      <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />
      {builtin && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Tick name="published" checked={use} onChange={setUse} bn="আমার সাজানো লেআউট ব্যবহার করুন" en="Use my layout" info="টিক দিয়ে সংরক্ষণ করলে ওয়েবসাইটের এই পেজে নিচের সাজ দেখাবে। টিক না থাকলে আগের মতো ডিফল্ট চেহারাই থাকবে।" />
          {builtin.hasBody && !blocks.some((b) => b.type === 'page_body') && <div className="notice warn" style={{ marginTop: 8 }}>সতর্কতা: "পেজের মূল কন্টেন্ট" কম্পোনেন্টটি তালিকায় নেই, তাই এই পেজের নিজস্ব অংশ (যেমন তালিকা বা ফর্ম) ওয়েবসাইটে আসবে না। বাঁয়ের তালিকা থেকে আবার যোগ করুন।</div>}
        </div>
      )}
      {m && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="h2" style={{ marginTop: 0 }}>পেজের তথ্য<small className="en-hint">(Page details)</small></h2>
          <div className="grid g2" style={{ gap: '0 12px' }}>
            <Fld bn="পেজের নাম *" en="Page title" info="ব্রাউজারের ট্যাবে ও মেনুতে এই নাম দেখায়।"><input name="title" value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} required maxLength={160} /></Fld>
            <Fld bn="ঠিকানা (slug) *" en="URL slug" info={`পেজটি খুলবে /${m.slug || '...'} ঠিকানায়। শুধু ইংরেজি ছোট অক্ষর, সংখ্যা ও হাইফেন।`}><input name="slug" value={m.slug} onChange={(e) => setM({ ...m, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} required maxLength={60} /></Fld>
            <Fld bn="গুগল সার্চের শিরোনাম" en="SEO title" info="ফাঁকা রাখলে পেজের নামই যাবে।"><input name="seo_title" value={m.seoTitle} onChange={(e) => setM({ ...m, seoTitle: e.target.value })} maxLength={120} /></Fld>
            <Fld bn="গুগল সার্চের বিবরণ" en="SEO description" info="সার্চ ফলাফলে নামের নিচে ছোট বিবরণ।"><input name="seo_desc" value={m.seoDesc} onChange={(e) => setM({ ...m, seoDesc: e.target.value })} maxLength={300} /></Fld>
          </div>
          <Tick name="published" checked={m.published} onChange={(b) => setM({ ...m, published: b })} bn="ওয়েবসাইটে প্রকাশ করুন" en="Published" info="বন্ধ থাকলে পেজটি খসড়া, শুধু আপনি দেখতে পাবেন না, ওয়েবসাইটে খুলবে না।" />
          <Tick name="in_menu" checked={m.inMenu} onChange={(b) => setM({ ...m, inMenu: b })} bn="হেডারের মেনুতে যোগ করুন" en="Add to header menu" info="টিক দিলে সংরক্ষণের সময় মেনুতে এই পেজের লিংক বসে যায়। পরে মেনু পাতা থেকে ক্রম বা ড্রপডাউন ঠিক করতে পারবেন।" />
        </div>
      )}

      <div className="pb">
        <aside className="pb-pal card">
          <b>কম্পোনেন্ট যোগ করুন<small className="en-hint">(Add component)</small></b>
          <p className="muted small" style={{ margin: '4px 0 10px' }}>ডানের তালিকায় টেনে ছাড়ুন (drag and drop), অথবা একবার চাপলে নিচে যোগ হবে।</p>
          {GROUPS.filter(([g]) => g !== 'page' || !!builtin).map(([g, bnN, enN]) => (
            <div key={g} style={{ marginBottom: 12 }}>
              <span className="lbl">{bnN}<small className="en-hint">({enN})</small></span>
              <div className="pb-items">
                {BLOCKS.filter((b) => b.group === g && (g !== 'page' || !!builtin)).map((b) => (
                  <button type="button" key={b.type} className="pb-item" draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', `new:${b.type}`); e.dataTransfer.effectAllowed = 'copy'; }} onClick={() => add(b.type)} title={b.info}>
                    <Icon name={b.icon} /><span>{b.bn}<small>{b.en}</small></span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <div className="pb-canvas" onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => drop(e, null, true)}>
          {blocks.length === 0 && <div className="pb-empty">এখানে কম্পোনেন্ট টেনে ছাড়ুন বা বাঁয়ে থেকে চাপুন।</div>}
          {blocks.map((b, i) => {
            const def = BLOCK_MAP[b.type];
            const isOpen = open === b.id;
            const st = cleanStyle(b as never);
            return (
              <div key={b.id} className={`pb-row${b.on ? '' : ' off'}${over?.id === b.id ? (over.after ? ' ov-a' : ' ov-b') : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setOver({ id: b.id, after: e.clientY > r.top + r.height / 2 }); }}
                onDragLeave={() => setOver((o) => (o?.id === b.id ? null : o))}
                onDrop={(e) => drop(e, b.id, over?.id === b.id ? over.after : true)}>
                <div className="pb-head">
                  <span className="pb-grip" draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', `move:${b.id}`); e.dataTransfer.effectAllowed = 'move'; }} title="টেনে সরান (Drag)" aria-label="টেনে সরান">⠿</span>
                  <span className="pb-ic"><Icon name={def.icon} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><b>{def.bn}<small className="en-hint">({def.en})</small></b>{(b.props.title || b.props.heading) && <div className="muted small pb-sub">{b.props.title || b.props.heading}</div>}</div>
                  {st.bg !== 'none' && <span className="pb-dot" style={styleCss(st).box} aria-hidden="true" />}
                  <label className="pb-on"><input type="checkbox" checked={b.on} onChange={(e) => upd(b.id, { on: e.target.checked })} /><span>দেখান</span></label>
                  <div className="pb-btns">
                    <button type="button" onClick={() => move(b.id, -1)} disabled={i === 0} aria-label="ওপরে">↑</button>
                    <button type="button" onClick={() => move(b.id, 1)} disabled={i === blocks.length - 1} aria-label="নিচে">↓</button>
                    <button type="button" onClick={() => dup(b.id)} aria-label="কপি" title="কপি (Duplicate)">⧉</button>
                    <button type="button" onClick={() => del(b.id)} aria-label="সরান" title="সরান (Remove)">✕</button>
                    <button type="button" className="pb-edit" onClick={() => setOpen(isOpen ? null : b.id)} aria-expanded={isOpen}>{isOpen ? 'বন্ধ' : 'সম্পাদনা'}</button>
                  </div>
                </div>
                {isOpen && (
                  <div className="pb-body">
                    <p className="muted small" style={{ marginTop: 0 }}>{def.info}</p>
                    {b.type === 'page_body' && builtin && (builtin.links.length ? builtin.links : PAGE_DATA_LINKS[builtin.slug] ?? []).map(([l, h]) => <p key={h} className="muted small" style={{ marginTop: 0 }}>এই অংশের তথ্য ডেটাবেস থেকে আসে। {l}: <a href={h} target="_blank" rel="noreferrer"><b>এখানে যান</b></a></p>)}
                    {BLOCK_DATA_LINKS[b.type] && <p className="muted small" style={{ marginTop: 0 }}>{BLOCK_DATA_LINKS[b.type][0]}: <a href={BLOCK_DATA_LINKS[b.type][1]} target="_blank" rel="noreferrer"><b>এখানে যান</b></a></p>}
                    {def.fields.some((f) => f.kind === 'textarea' || f.kind === 'text') && def.group === 'content' && <p className="muted small" style={{ marginTop: 0 }}>ছোট কোড: {TOKEN_HELP}</p>}
                    {def.fields.length > 0 && <div className="grid g2" style={{ gap: '0 12px' }}>{def.fields.map((f) => <div key={f.k} style={f.kind === 'textarea' || f.kind === 'image' ? { gridColumn: '1 / -1' } : undefined}><FieldInput f={f} v={b.props[f.k] ?? ''} set={(v) => setProp(b.id, f.k, v)} /></div>)}</div>}
                    {b.type !== 'page_header' || true ? <StyleBox b={b} set={(p) => upd(b.id, p)} /> : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="row" style={{ marginTop: 16 }}>
        <Submit pendingText="সংরক্ষণ হচ্ছে...">সংরক্ষণ করুন (Save)</Submit>
        <Link className="btn" href="/admin/pages">ফিরে যান (Back)</Link>
        <Link className="btn" href={target === 'home' ? '/' : `/${builtin?.slug ?? m?.slug ?? ''}`} target="_blank">ওয়েবসাইটে দেখুন (View)</Link>
      </div>
      <Info>"সংরক্ষণ করুন" চাপার আগে ওয়েবসাইটে কিছু বদলায় না।</Info>
    </ActionForm>
  );
}
