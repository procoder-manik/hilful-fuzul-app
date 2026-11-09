'use client';
import { useState } from 'react';
import { ActionForm, Submit } from '../../_components/ActionForm';
import { Bi, Info } from '../../_components/Fld';
import { PATTERNS, PRESETS } from '@/lib/eventdesign';
import { DEFAULT_PAGEHEAD, styleCss, type SecStyle } from '@/lib/sectionstyle';
import type { ActionState } from '@/lib/guard';

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

export function SectionsStudio({ pagehead, action }: { pagehead: SecStyle; action: Action }) {
  const [ph, setPh] = useState<SecStyle>(pagehead);
  const cfg = JSON.stringify({ pagehead: ph });
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
        <div className="row"><Submit pendingText="সংরক্ষণ হচ্ছে...">সংরক্ষণ করুন (Save)</Submit></div>
        <Info>হোমপেজের সেকশনগুলোর ক্রম, রং ও প্যাটার্ন এখন <a href="/admin/pages/home">পেজ বিল্ডার</a> থেকে বদলান। ফুটারের প্যাটার্ন "হেডার ও ফুটার" পাতায় আছে।</Info>
      </div>
    </ActionForm>
  );
}

