'use client';
import { useMemo, useState } from 'react';
import { ActionForm, Submit } from './ActionForm';
import type { ActionState } from '@/lib/guard';

export type PayMember = { id: string; label: string; monthly: number; overdue: number; overdueLabels: string; frozen: boolean };

export function PaymentForm({ members, initial, today, action }: { members: PayMember[]; initial?: string; today: string; action: (p: ActionState, f: FormData) => Promise<ActionState> }) {
  const [id, setId] = useState(initial ?? members[0]?.id ?? '');
  const m = useMemo(() => members.find((x) => x.id === id), [id, members]);
  const [count, setCount] = useState(Math.max(1, m?.overdue ?? 1));
  const [amount, setAmount] = useState(m?.monthly ?? 0);
  const pick = (v: string) => {
    setId(v);
    const n = members.find((x) => x.id === v);
    if (n) { setCount(Math.max(1, n.overdue)); setAmount(n.monthly); }
  };
  const bn = (x: number) => String(x).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);
  return (
    <ActionForm action={action} className="card">
      <label className="f"><span className="lbl">সদস্য *</span>
        <select name="member_id" value={id} onChange={(e) => pick(e.target.value)} required>
          {members.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
        </select>
      </label>
      {m && (
        <p className={m.overdue ? 'notice warn' : 'notice ok'}>
          মাসিক চাঁদা ৳{bn(m.monthly)}। বকেয়া {bn(m.overdue)} মাস{m.overdueLabels ? ` (${m.overdueLabels})` : ''}।{m.frozen ? ' সদস্যপদ স্থগিত আছে।' : ''}
        </p>
      )}
      <div className="grid g2" style={{ gap: '0 12px' }}>
        <label className="f"><span className="lbl">কয় মাসের চাঁদা</span><input name="count" type="number" min={1} max={24} value={count} onChange={(e) => setCount(+e.target.value)} /></label>
        <label className="f"><span className="lbl">প্রতি মাসের পরিমাণ (৳)</span><input name="amount" type="number" min={1} value={amount} onChange={(e) => setAmount(+e.target.value)} required /></label>
        <label className="f"><span className="lbl">জমার তারিখ</span><input name="paid_on" type="date" defaultValue={today} max={today} required /></label>
        <label className="f"><span className="lbl">মাধ্যম</span>
          <select name="method"><option>নগদ (হাতে)</option><option>বিকাশ</option><option>নগদ</option><option>রকেট</option><option>ব্যাংক</option></select>
        </label>
      </div>
      <label className="f"><span className="lbl">নোট (ঐচ্ছিক, যেমন বিকাশ ট্রানজেকশন আইডি)</span><input name="note" /></label>
      {m?.frozen && <label className="chk"><input type="checkbox" name="unfreeze" /> <span>জমার সাথে আনফ্রিজ করুন (ভুলবশত বকেয়া দেখানো হলে)</span></label>}
      <p className="muted small">মোট: <b>৳{bn(count * amount)}</b>। সবচেয়ে পুরোনো বকেয়া মাস থেকে ক্রমানুসারে জমা হবে।</p>
      <Submit>জমা নিন ও রসিদ প্রিন্ট (Collect & print receipt)</Submit>
    </ActionForm>
  );
}
