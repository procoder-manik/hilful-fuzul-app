'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { runImport, type ImportState } from '../../actions/import';

function Btn({ mode, children, pri }: { mode: string; children: React.ReactNode; pri?: boolean }) {
  const { pending } = useFormStatus();
  return <button className={`btn ${pri ? 'pri' : ''}`} name="mode" value={mode} disabled={pending}>{pending ? 'কাজ চলছে...' : children}</button>;
}

export function ImportForm({ kinds }: { kinds: [string, string][] }) {
  const [s, action] = useFormState<ImportState, FormData>(runImport, {});
  const r = s.report;
  return (
    <form action={action} className="card">
      <b>ফাইল থেকে যোগ করুন</b>
      <div className="grid g2" style={{ gap: '0 12px', marginTop: 10 }}>
        <label className="f"><span>কী ইমপোর্ট করবেন<small className="en-hint">(What to import)</small></span><select name="kind" required>{kinds.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label className="f"><span>ফাইল (.xlsx বা .csv, সর্বোচ্চ ৫ MB)<small className="en-hint">(File)</small></span><input name="file" type="file" accept=".csv,.xlsx" required /></label>
      </div>
      <div className="row"><Btn mode="check">১. আগে যাচাই করুন</Btn><Btn mode="import" pri>২. ইমপোর্ট করুন</Btn></div>
      {s.error && <div className="notice" role="alert" style={{ marginTop: 12 }}>{s.error}</div>}
      {r && (
        <div className={`notice ${r.errors.length ? 'warn' : 'ok'}`} style={{ marginTop: 12 }} role="status">
          <b>{s.mode === 'import' ? `ইমপোর্ট সম্পন্ন: ${r.inserted ?? 0}টি যোগ হয়েছে।` : 'যাচাইয়ের ফল (এখনো কিছু যোগ হয়নি):'}</b>
          <div>মোট সারি {r.total}টি · যোগ করার মতো {r.valid}টি · আগে থেকেই আছে {r.dup}টি (বাদ যাবে) · ভুল {r.errors.length}টি</div>
          {s.unknown && s.unknown.length > 0 && <div className="small">চেনা যায়নি এমন কলাম (বাদ যাবে): {s.unknown.join(', ')}</div>}
          {r.sample.length > 0 && <div className="small" style={{ marginTop: 6 }}>নমুনা: {r.sample.join(' | ')}</div>}
          {r.errors.length > 0 && <details style={{ marginTop: 6 }}><summary>ভুলগুলো দেখুন</summary><ul className="small" style={{ margin: '6px 0 0' }}>{r.errors.map((e, i) => <li key={i}>{e}</li>)}</ul></details>}
          {s.mode === 'check' && r.valid > 0 && <div className="small" style={{ marginTop: 6 }}>সব ঠিক মনে হলে একই ফাইল রেখে "ইমপোর্ট করুন" চাপুন।</div>}
        </div>
      )}
    </form>
  );
}
