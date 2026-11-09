'use client';
export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="wrap" style={{ padding: 40 }}>
      <div className="notice" role="alert"><b>কাজটি সম্পন্ন হয়নি:</b> {error.message || 'অজানা সমস্যা'}</div>
      <button className="btn pri" onClick={reset}>আবার চেষ্টা করুন</button>
    </section>
  );
}
