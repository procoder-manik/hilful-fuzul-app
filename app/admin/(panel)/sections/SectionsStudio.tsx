'use client';
import { useState } from 'react';
import { ActionForm, Submit } from '../../_components/ActionForm';
import { Bi, Info } from '../../_components/Fld';
import { PATTERNS, PRESETS } from '@/lib/eventdesign';
import { cleanStyle, DEFAULT_PAGEHEAD, NO_STYLE, SECTIONS, styleCss, type SecStyle } from '@/lib/sectionstyle';
import type { ActionState } from '@/lib/guard';

type Row = { k: string; on: boolean } & SecStyle;
type Action = (p: ActionState, f: FormData) => Promise<ActionState>;

function StyleControls({ v, set }: { v: SecStyle; set: (s: SecStyle) => void }) {
  return (
    <div className="ss-ctl">
      <label className="f"><span>রং<small className="en-hint">(Colour)</small></span>
        <select value={v.bg} onChange={(e) => set({ ...v, bg: e.target.value })}>
          <option value="none">সাদামাটা, কোনো রং নয় (None)</option>
          <optgroup label="হালকা রং (Light)">{PRESETS.filter((p) => p.tone === 'light').map((p) => <option key={p.id} value={p.id}>{p.name} ({p.en})</option>)}</optgroup>
          <optgroup label="গাঢ় রং (Deep)">{PRESETS.filter((p) => p.tone === 'deep').map((p) => <option key={p.id} value={p.id}>{p.name} ({p.en})</option>)}</optgroup>
        </select></label>
      <label className="f"><span>প্যাটার্ন<small className="en-hint">(Pattern)</small></span>
        <select value={v.pat} onChange={(e) => set({ ...v, pat: e.target.value as SecStyle['pat'] })}>{PATTERNS.map(([k, n, en]) => <option key={k} value={k}>{n} ({en})</option>)}</select></label>
      <label className="f"><span>স্পষ্টতা: {Math.round(v.op * 100)}%<small className="en-hint">(Strength)</small></span>
        <input type="range" min={3} max={30} value={Math.round(v.op * 100)} onChange={(e) => set({ ...v, op: Number(e.target.value) / 100 })} disabled={v.pat === 'none'} /></label>
    </div>
  );
}

function Swatch({ v, label }: { v: SecStyle; label: string }) {
  const c = styleCss(v);
  return (
    <div className="ss-sw" style={c.box}>
      {v.pat !== 'none' && <div className={`sec-pat bnp-${v.pat}`} style={{ opacity: v.op, color: c.patColor }} aria-hidden="true" />}
      <b>{label}</b>
    </div>
  );
}

export function SectionsStudio({ initial, pagehead, action }: { initial: Row[]; pagehead: SecStyle; action: Action }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [ph, setPh] = useState<SecStyle>(pagehead);
  const move = (i: number, d: number) => setRows((r) => { const j = i + d; if (j < 0 || j >= r.length) return r; const n = [...r]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const upd = (i: number, p: Partial<Row>) => setRows((r) => r.map((x, n) => (n === i ? { ...x, ...p } : x)));
  const cfg = JSON.stringify({ sections: rows.map((x) => ({ k: x.k, on: x.on, bg: x.bg, pat: x.pat, op: x.op })), pagehead: ph });
  return (
    <ActionForm action={action}>
      <input type="hidden" name="cfg" value={cfg} />
      <div className="card" style={{ maxWidth: 980 }}>
        <h2 className="h2" style={{ marginTop: 0 }}><Bi bn="পেজের হেডার এলাকা" en="Page header area" /></h2>
        <p className="muted small" style={{ marginTop: -4 }}>প্রতিটি ভেতরের পাতার (সংবাদ, অনুষ্ঠান, সদস্য, যোগাযোগ ইত্যাদি) ওপরের অংশ: পথ (হোম › পাতা), শিরোনাম ও বিবরণ। এখানে রং ও প্যাটার্ন বাছলে সব পাতায় একসাথে বদলাবে।</p>
        <Swatch v={ph} label="পাতার শিরোনাম (Page title)" />
        <StyleControls v={ph} set={setPh} />
        <button type="button" className="btn sm" onClick={() => setPh(DEFAULT_PAGEHEAD)}>ডিফল্টে ফিরুন (Reset)</button>
      </div>

      <div className="card" style={{ maxWidth: 980, marginTop: 16 }}>
        <h2 className="h2" style={{ marginTop: 0 }}><Bi bn="হোমপেজের সেকশন" en="Homepage sections" /></h2>
        <p className="muted small" style={{ marginTop: -4 }}>প্রতিটি সেকশনের রং ও প্যাটার্ন আলাদা বাছুন, না চাইলে "সাদামাটা" রাখুন। ↑ ↓ দিয়ে ক্রম বদলান, আর টিক তুলে দিলে সেকশনটি হোমপেজ থেকে লুকাবে। ফুটারের প্যাটার্ন "হেডার ও ফুটার" পাতায় আছে।</p>
        <div className="ss-list">
          {rows.map((r, i) => {
            const meta = SECTIONS.find((x) => x.k === r.k)!;
            return (
              <div key={r.k} className={`ss-row${r.on ? '' : ' off'}`}>
                <div className="ss-head">
                  <div className="ss-mv"><button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="ওপরে">↑</button><button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="নিচে">↓</button></div>
                  <div style={{ flex: 1, minWidth: 0 }}><b>{meta.bn}<small className="en-hint">({meta.en})</small></b><div className="muted small">{meta.info}</div></div>
                  <label className="chk" style={{ margin: 0 }}><input type="checkbox" checked={r.on} onChange={(e) => upd(i, { on: e.target.checked })} /> <span>দেখান<small className="en-hint">(Show)</small></span></label>
                </div>
                <Swatch v={r} label={meta.bn} />
                <StyleControls v={r} set={(s) => upd(i, s)} />
              </div>
            );
          })}
        </div>
        <div className="row" style={{ marginTop: 14 }}><Submit pendingText="সংরক্ষণ হচ্ছে...">সংরক্ষণ করুন (Save)</Submit><button type="button" className="btn" onClick={() => setRows((r) => r.map((x) => ({ ...x, ...NO_STYLE })))}>সব রং ও প্যাটার্ন মুছুন (Clear all)</button></div>
        <Info>"সংরক্ষণ করুন" চাপার আগে কিছু ওয়েবসাইটে বদলায় না।</Info>
      </div>
    </ActionForm>
  );
}

export const normRows = (saved: { k: string; on: boolean; bg?: string; pat?: string; op?: number }[] | undefined): Row[] => {
  const order = (saved?.length ? saved.map((x) => x.k) : []).concat(SECTIONS.map((x) => x.k)).filter((k, i, a) => a.indexOf(k) === i && SECTIONS.some((s) => s.k === k));
  return order.map((k) => { const sv = saved?.find((x) => x.k === k); return { k, on: sv ? sv.on : true, ...cleanStyle(sv as never) }; });
};
