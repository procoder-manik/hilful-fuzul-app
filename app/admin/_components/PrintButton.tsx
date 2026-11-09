'use client';
import { useEffect } from 'react';

export function PrintBar({ back, auto }: { back: string; auto?: boolean }) {
  useEffect(() => { if (auto) setTimeout(() => window.print(), 600); }, [auto]);
  return (
    <div className="print-bar no-print">
      <a className="btn" href={back}>ফিরে যান</a>
      <button className="btn pri" onClick={() => window.print()}>প্রিন্ট করুন</button>
      <span className="muted small">প্রিন্ট ডায়ালগে চাইলে &quot;Save as PDF&quot; বেছে নিয়ে কম্পিউটারে সংরক্ষণ করুন।</span>
    </div>
  );
}
