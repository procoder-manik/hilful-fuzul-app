import Link from 'next/link';
import type { Metadata } from 'next';
import { ActionForm, ConfirmButton, Submit } from '../../_components/ActionForm';
import { EventStudio, type EventForm } from './EventStudio';
import { addSamplePast, deleteEvent, saveEvent } from '../../actions/events';
import { CONTENT_ROLES } from '@/lib/content';
import { requirePage } from '@/lib/guard';
import { todayBD } from '@/lib/dates';
import { fd } from '@/lib/format';
import { PageHead } from '@/lib/ui';
import { DEFAULT_DESIGN, presetById } from '@/lib/eventdesign';

export const metadata: Metadata = { title: 'অনুষ্ঠান ও কর্মসূচি' };
type Row = { id: string; title: string; topic: string | null; event_date: string; event_time: string | null; venue: string | null; chief_guest: string | null; special_guest: string | null; presided_by: string | null; outcome: string | null; show_popup: boolean; show_in_hero: boolean; design: Record<string, unknown> };

export default async function EventsAdmin({ searchParams }: { searchParams: { edit?: string } }) {
  const { supabase } = await requirePage(CONTENT_ROLES);
  const today = todayBD();
  const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
  const rows = (data ?? []) as Row[];
  const upcoming = rows.filter((e) => e.event_date >= today);
  const done = rows.filter((e) => e.event_date < today).reverse();
  const edit = searchParams.edit ? rows.find((r) => r.id === searchParams.edit) : null;
  const start: EventForm = edit
    ? { id: edit.id, title: edit.title, topic: edit.topic ?? '', event_date: edit.event_date, event_time: edit.event_time ?? '', venue: edit.venue ?? '', chief_guest: edit.chief_guest ?? '', special_guest: edit.special_guest ?? '', presided_by: edit.presided_by ?? '', outcome: edit.outcome ?? '', show_popup: edit.show_popup, show_in_hero: edit.show_in_hero, design: edit.design as never }
    : { id: null, title: '', topic: '', event_date: today, event_time: '', venue: '', chief_guest: '', special_guest: '', presided_by: '', outcome: '', show_popup: false, show_in_hero: false, design: { ...DEFAULT_DESIGN, ...presetById('mango') } };
  const list = (items: Row[], empty: string) => (
    <div className="ev-list">
      {items.length === 0 && <p className="muted" style={{ margin: 0 }}>{empty}</p>}
      {items.map((e) => {
        const d = e.design as { c1?: string; c2?: string; icon?: string };
        return (
          <div key={e.id} className="ev-row">
            <span className="ev-dot" style={{ background: `linear-gradient(135deg,${d.c1 ?? '#0e5a43'},${d.c2 ?? '#1b8a68'})` }} aria-hidden="true">{d.icon ?? '📅'}</span>
            <div style={{ minWidth: 0 }}>
              <b>{e.title}</b>
              <div className="muted small">{fd(e.event_date)}{e.event_time ? `, ${e.event_time}` : ''}{e.venue ? ` | ${e.venue}` : ''}</div>
              <div className="ev-flags">{e.show_popup && <span className="badge b-warn">পপআপ (Popup)</span>}{e.show_in_hero && <span className="badge b-info">হিরো (Hero)</span>}</div>
            </div>
            <div className="acts"><Link className="btn sm" href={`/admin/events?edit=${e.id}#studio`} scroll>সম্পাদনা (Edit)</Link><ConfirmButton action={deleteEvent.bind(null, e.id)} className="btn sm danger" label="মুছুন" confirm="অনুষ্ঠানটি মুছে ফেলবেন?" /></div>
          </div>
        );
      })}
    </div>
  );
  return (
    <>
      <PageHead title="অনুষ্ঠান ও কর্মসূচি" sub="আসন্ন অনুষ্ঠান বানান, পপআপ ও হোমপেজে দেখানোর সুইচ ঠিক করুন, আর বিগত কর্মসূচির তালিকা রাখুন। তারিখ পেরিয়ে গেলে অনুষ্ঠান নিজে থেকে “সম্পন্ন” তালিকায় চলে যায়।">
        <Link className="btn" href="/events" target="_blank">ওয়েবসাইটে দেখুন (View site)</Link>
      </PageHead>
      <div id="popup" />
      <div id="studio" style={{ scrollMarginTop: 80 }}>
        {searchParams.edit && !edit && <div className="notice">এই অনুষ্ঠানটি আর পাওয়া যায়নি, হয়তো মুছে ফেলা হয়েছে।</div>}
        {edit && <div className="notice ok">সম্পাদনা করছেন: <b>{edit.title}</b>। তারিখ, সময়, স্থান ও ডিজাইনসহ সবকিছু বদলে নিচের সংরক্ষণ বোতাম চাপুন।</div>}
        <EventStudio key={edit?.id ?? 'new'} initial={start} today={today} action={saveEvent.bind(null, edit?.id ?? null)} />
      </div>
      <div className="grid g2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card"><b>আসন্ন অনুষ্ঠান ({upcoming.length})<small className="en-hint">(Upcoming)</small></b>{list(upcoming, 'কোনো আসন্ন অনুষ্ঠান নেই। ওপরে নতুন বানান।')}</div>
        <div className="card">
          <b>বিগত কর্মসূচি ({done.length})<small className="en-hint">(Completed programmes)</small></b>
          {list(done, 'এখনো কোনো বিগত কর্মসূচি নেই। নিচের বোতামে শীতবস্ত্র, ঈদের সেমাই-চিনি, ঈদের পোশাক, আর্থিক সহায়তা ইত্যাদির নমুনা যোগ করুন।')}
          <ActionForm action={addSamplePast} style={{ marginTop: 12 }}>
            <Submit className="btn" pendingText="যোগ হচ্ছে...">বিগত কর্মসূচির নমুনা যোগ করুন (Add sample past programmes)</Submit>
            <p className="muted small" style={{ margin: '6px 0 0' }}>নমুনা হিসেবে গত বছরের তারিখে কিছু কর্মসূচি বসবে। আসল তারিখ ও বিবরণ “সম্পাদনা” দিয়ে বদলে নিন, বা মুছে নিজেরটা যোগ করুন।</p>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
