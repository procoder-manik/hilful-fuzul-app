import Link from 'next/link';
import type { Metadata } from 'next';
import { ActionForm, ConfirmButton, Submit } from '../../_components/ActionForm';
import { Fld } from '../../_components/Fld';
import { createPage, deletePage } from '../../actions/pages';
import { CONTENT_ROLES } from '@/lib/content';
import { requirePage } from '@/lib/guard';
import { fd } from '@/lib/format';
import { PageHead } from '@/lib/ui';
import { BUILTIN } from '@/lib/builtin';

export const metadata: Metadata = { title: 'পেজ বিল্ডার' };
type Row = { id: string; title: string; slug: string; in_menu: boolean; updated_at: string | null; seo: { draft?: boolean } | null };

export default async function PagesAdmin() {
  const { supabase } = await requirePage(CONTENT_ROLES);
  const { data } = await supabase.from('pages').select('id, title, slug, in_menu, updated_at, seo').order('updated_at', { ascending: false });
  const all = (data ?? []) as Row[];
  const used = new Set(all.filter((r) => !r.seo?.draft).map((r) => r.slug));
  const rows = all.filter((r) => !BUILTIN.some((b) => b.slug === r.slug));
  return (
    <>
      <PageHead title="পেজ বিল্ডার" sub="হোমপেজ ও নতুন পেজ কম্পোনেন্ট দিয়ে সাজান: টেনে ছেড়ে ক্রম ঠিক করুন, প্রতিটির রং ও প্যাটার্ন বদলান, মেনুতে যোগ করুন।" />
      <div className="card" style={{ maxWidth: 980 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><b>হোমপেজ<small className="en-hint">(Home page)</small></b><div className="muted small">হিরো, পরিসংখ্যান, স্বচ্ছতার খাতা, সেবা, কমিটি, সংবাদ, আহ্বানের ব্যানার ইত্যাদি কম্পোনেন্ট।</div></div>
          <Link className="btn pri" href="/admin/pages/home">হোমপেজ সাজান (Edit home)</Link>
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 16, alignItems: 'start', maxWidth: 1100 }}>
        <div className="card">
          <b>আপনার বানানো পেজ ({rows.length})<small className="en-hint">(Your pages)</small></b>
          <div className="ev-list">
            {rows.length === 0 && <p className="muted" style={{ margin: 0 }}>এখনো কোনো নতুন পেজ নেই। ডানে নাম ও ঠিকানা দিয়ে বানান।</p>}
            {rows.map((r) => (
              <div key={r.id} className="ev-row">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b>{r.title}</b> {r.seo?.draft ? <span className="badge b-mute">খসড়া (Draft)</span> : <span className="badge b-ok">প্রকাশিত</span>} {r.in_menu && <span className="badge b-info">মেনুতে</span>}
                  <div className="muted small">/{r.slug}{r.updated_at ? ` | ${fd(r.updated_at)}` : ''}</div>
                </div>
                <div className="acts">
                  <Link className="btn sm" href={`/admin/pages/${r.id}`}>সম্পাদনা (Edit)</Link>
                  {!r.seo?.draft && <a className="btn sm" href={`/${r.slug}`} target="_blank" rel="noreferrer">দেখুন</a>}
                  <ConfirmButton action={deletePage.bind(null, r.id)} className="btn sm danger" label="মুছুন" confirm="পেজটি মুছে ফেলবেন? মেনু থেকেও সরে যাবে।" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <ActionForm action={createPage} className="card">
          <b>নতুন পেজ বানান<small className="en-hint">(Create a page)</small></b>
          <Fld bn="পেজের নাম *" en="Page title" info="যেমন: আমাদের কাজ।" ><input name="title" required maxLength={160} /></Fld>
          <Fld bn="ঠিকানা (slug) *" en="URL slug" info="শুধু ইংরেজি ছোট অক্ষর, সংখ্যা ও হাইফেন, যেমন our-work। পেজ খুলবে /our-work ঠিকানায়।"><input name="slug" required maxLength={60} pattern="[a-z0-9][a-z0-9-]{1,60}" placeholder="our-work" /></Fld>
          <Submit pendingText="তৈরি হচ্ছে...">তৈরি করে সাজাতে যান (Create)</Submit>
          <p className="muted small" style={{ margin: '8px 0 0' }}>নতুন পেজ প্রথমে খসড়া থাকে। সাজানো শেষে "ওয়েবসাইটে প্রকাশ করুন" টিক দিন।</p>
        </ActionForm>
      </div>
      <div className="card" style={{ maxWidth: 1100, marginTop: 16 }}>
        <b>আগে থেকে তৈরি পেজ<small className="en-hint">(Built-in pages)</small></b>
        <p className="muted small" style={{ margin: '4px 0 10px' }}>আমাদের কথা, সেবা, স্বচ্ছতা, অনুষ্ঠান ইত্যাদি পেজও এখন কম্পোনেন্ট দিয়ে সাজানো যায়। সাজালে সেটি ওয়েবসাইটে দেখাবে, না সাজালে আগের চেহারাই থাকবে।</p>
        <div className="ev-list">
          {BUILTIN.map((b) => (
            <div key={b.slug} className="ev-row">
              <div style={{ minWidth: 0, flex: 1 }}><b>{b.bn}</b> <small className="en-hint">({b.en})</small> {used.has(b.slug) && <span className="badge b-ok">আপনার সাজ চালু</span>}<div className="muted small">/{b.slug}</div></div>
              <div className="acts"><Link className="btn sm" href={`/admin/pages/builtin-${b.slug}`}>সাজান (Edit)</Link><a className="btn sm" href={`/${b.slug}`} target="_blank" rel="noreferrer">দেখুন</a></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
