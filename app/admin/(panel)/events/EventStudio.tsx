'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ActionForm, Submit } from '../../_components/ActionForm';
import { Fld, Info, Tick } from '../../_components/Fld';
import { EventBannerView } from '@/components/EventBannerView';
import { cleanDesign, DEFAULT_DESIGN, designFromPreset, ICONS, PATTERNS, PRESETS, presetById, TEMPLATES, type Design, type Template } from '@/lib/eventdesign';
import type { ActionState } from '@/lib/guard';

export type EventForm = { id: string | null; title: string; topic: string; event_date: string; event_time: string; venue: string; chief_guest: string; special_guest: string; presided_by: string; outcome: string; show_popup: boolean; show_in_hero: boolean; design: Partial<Design> };
type Action = (p: ActionState, f: FormData) => Promise<ActionState>;

const bnDate = (iso: string) => { try { return new Date(iso + 'T00:00:00').toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; } };

export function EventStudio({ initial, today, action }: { initial: EventForm; today: string; action: Action }) {
  const [f, setF] = useState(initial);
  const [d, setD] = useState<Design>(() => cleanDesign({ ...DEFAULT_DESIGN, ...initial.design }));
  const [file, setFile] = useState<string>('');
  useEffect(() => () => { if (file) URL.revokeObjectURL(file); }, [file]);
  const up = <K extends keyof EventForm>(k: K) => (v: EventForm[K]) => setF((p) => ({ ...p, [k]: v }));
  const ud = <K extends keyof Design>(k: K, v: Design[K]) => setD((p) => ({ ...p, [k]: v }));
  const past = !!f.event_date && f.event_date < today;
  const applyTemplate = (t: Template) => {
    setF((p) => ({ ...p, title: t.title, topic: t.topic, venue: t.venue, event_time: t.time, outcome: t.outcome }));
    setD((p) => designFromPreset(presetById(t.preset), { icon: t.icon, tag: t.tag, pattern: t.pattern, template: p.template, image: p.image, size: p.size, angle: p.angle }));
  };
  const shownImage = file || d.image;
  const view = { ...d, image: shownImage };
  return (
    <ActionForm action={action} className="card ev-studio" key={initial.id ?? 'new'}>
      <input type="hidden" name="design" value={JSON.stringify(d)} />
      <div className="row" style={{ justifyContent: 'space-between' }}><b style={{ fontSize: '1.1rem' }}>{initial.id ? 'অনুষ্ঠান সম্পাদনা' : 'নতুন অনুষ্ঠান বা কর্মসূচি'}<small className="en-hint">({initial.id ? 'Edit event' : 'New event or programme'})</small></b>{initial.id && <Link className="btn sm" href="/admin/events#studio">নতুন বানান (New)</Link>}</div>

      <h3 className="h2">১. রেডিমেড টেমপ্লেট বেছে নিন<small className="en-hint">(Pick a ready-made template)</small></h3>
      <p className="muted small" style={{ marginTop: -4 }}>একটিতে চাপলে লেখা, আইকন, রং ও প্যাটার্ন একসাথে বসে যাবে। এরপর নিজের মতো বদলান।</p>
      <div className="ev-tpls">
        {TEMPLATES.map((t) => <button type="button" key={t.id} className="ev-tpl" onClick={() => applyTemplate(t)}><span aria-hidden="true">{t.icon}</span><b>{t.name}</b><small>{t.en}</small></button>)}
      </div>

      <div className="ev-pv"><div className="muted small" style={{ marginBottom: 6 }}>লাইভ প্রিভিউ<small className="en-hint">(Live preview)</small>: ওয়েবসাইটে ও পপআপে ঠিক এভাবেই দেখাবে।</div>
        <EventBannerView b={{ title: f.title || 'অনুষ্ঠানের শিরোনাম', topic: f.topic, date: f.event_date ? bnDate(f.event_date) : 'তারিখ', time: f.event_time, venue: f.venue, done: past, tag: past ? 'সম্পন্ন' : d.tag, design: view,
          guests: [['প্রধান অতিথি', f.chief_guest], ['বিশেষ অতিথি', f.special_guest], ['সভাপতিত্ব করবেন', f.presided_by]], note: past && f.outcome ? ['যা করা হয়েছে', f.outcome] : null }} /></div>

      <h3 className="h2">২. অনুষ্ঠানের তথ্য<small className="en-hint">(Event details)</small></h3>
      <div className="grid g2" style={{ gap: '0 12px' }}>
        <Fld bn="শিরোনাম *" en="Title" info="ব্যানারের বড় লেখা।"><input name="title" value={f.title} onChange={(e) => up('title')(e.target.value)} required maxLength={160} /></Fld>
        <Fld bn="বিষয় বা ছোট বিবরণ" en="Topic" info="শিরোনামের নিচে ছোট করে দেখায়।"><input name="topic" value={f.topic} onChange={(e) => up('topic')(e.target.value)} maxLength={300} /></Fld>
        <Fld bn="তারিখ *" en="Date" info="আজ বা ভবিষ্যতের তারিখ হলে “আসন্ন”, পেরিয়ে গেলে নিজে থেকে “সম্পন্ন” তালিকায় চলে যায়।"><input name="event_date" type="date" value={f.event_date} onChange={(e) => up('event_date')(e.target.value)} required /></Fld>
        <Fld bn="সময়" en="Time" info="যেমন: বিকাল ৫:০০ বা বাদ আসর।"><input name="event_time" value={f.event_time} onChange={(e) => up('event_time')(e.target.value)} maxLength={60} /></Fld>
        <Fld bn="স্থান" en="Venue" info="কোথায় হবে।"><input name="venue" value={f.venue} onChange={(e) => up('venue')(e.target.value)} maxLength={200} /></Fld>
        <Fld bn="প্রধান অতিথি" en="Chief guest" info="ফাঁকা রাখলে ব্যানারে আসবে না।"><input name="chief_guest" value={f.chief_guest} onChange={(e) => up('chief_guest')(e.target.value)} maxLength={120} /></Fld>
        <Fld bn="বিশেষ অতিথি" en="Special guest" info="ফাঁকা রাখলে ব্যানারে আসবে না।"><input name="special_guest" value={f.special_guest} onChange={(e) => up('special_guest')(e.target.value)} maxLength={120} /></Fld>
        <Fld bn="সভাপতিত্ব করবেন" en="Presided by" info="ফাঁকা রাখলে ব্যানারে আসবে না।"><input name="presided_by" value={f.presided_by} onChange={(e) => up('presided_by')(e.target.value)} maxLength={120} /></Fld>
      </div>
      <Fld bn={past ? 'যা করা হয়েছে (ফলাফল)' : 'পরবর্তী উদ্যোগ বা ফলাফল'} en="Outcome / next steps" info="আসন্ন অনুষ্ঠানে পপআপে “পরবর্তী উদ্যোগ” হিসেবে এবং সম্পন্ন অনুষ্ঠানে “যা করা হয়েছে” হিসেবে দেখায়।"><textarea name="outcome" rows={3} value={f.outcome} onChange={(e) => up('outcome')(e.target.value)} maxLength={600} /></Fld>

      <h3 className="h2">৩. কোথায় দেখাবে<small className="en-hint">(Where to show)</small></h3>
      <Tick name="show_popup" checked={f.show_popup} onChange={up('show_popup')} bn="হোমপেজে পপআপ হিসেবে দেখান" en="Show as popup" info="দর্শক হোমপেজে ঢুকলে (প্রতি সেশনে একবার) এই অনুষ্ঠান পপআপে আসবে। একাধিক চালু থাকলে সবচেয়ে কাছের তারিখেরটি আসে। শুধু আসন্ন অনুষ্ঠানে কাজ করে।" />
      <Tick name="show_in_hero" checked={f.show_in_hero} onChange={up('show_in_hero')} bn="হোমপেজের ওপরের কার্ডে দেখান" en="Show in hero card" info="হোমপেজের একদম ওপরে মোট তহবিলের কার্ডের নিচে এই অনুষ্ঠানের ছোট লিংক দেখায়। না বাছলে সবচেয়ে কাছের আসন্ন অনুষ্ঠানটি আসে।" />
      <Info>সব আসন্ন অনুষ্ঠান নিজে থেকেই হোমপেজের "আসন্ন অনুষ্ঠান" অংশে ও /events পাতায় দেখায়।</Info>

      <h3 className="h2">৪. ব্যানারের ডিজাইন<small className="en-hint">(Banner design)</small></h3>
      {(['deep', 'light'] as const).map((tone) => (
        <div key={tone} style={{ marginBottom: 10 }}>
          <span className="lbl">{tone === 'deep' ? 'গাঢ় রং' : 'হালকা রং'}<small className="en-hint">({tone === 'deep' ? 'Deep colours' : 'Light colours'})</small></span>
          <div className="ev-sw">{PRESETS.filter((p) => p.tone === tone).map((p) => (
            <button type="button" key={p.id} className={`ev-swb${d.preset === p.id ? ' on' : ''}`} onClick={() => setD((x) => designFromPreset(p, { template: x.template, image: x.image, icon: x.icon, tag: x.tag, pattern: x.pattern, patternOpacity: x.patternOpacity, size: x.size, angle: x.angle }))} aria-pressed={d.preset === p.id} title={`${p.name} (${p.en})`}>
              <span style={{ background: `linear-gradient(135deg,${p.c1},${p.c2})`, color: p.text }}>Aa</span><small>{p.name}</small>
            </button>))}</div>
        </div>
      ))}
      <div className="grid g3" style={{ gap: '0 12px' }}>
        <Fld bn="প্যাটার্ন" en="Pattern" info="ব্যানারের পেছনে হালকা নকশা, হিরো সেকশনের মতো।"><select value={d.pattern} onChange={(e) => ud('pattern', e.target.value as Design['pattern'])}>{PATTERNS.map(([k, n, en]) => <option key={k} value={k}>{n} ({en})</option>)}</select></Fld>
        <Fld bn={`প্যাটার্ন কতটা স্পষ্ট: ${Math.round(d.patternOpacity * 100)}%`} en="Pattern strength" info="বেশি হলে নকশা গাঢ় দেখাবে।"><input type="range" min={4} max={30} value={Math.round(d.patternOpacity * 100)} onChange={(e) => ud('patternOpacity', Number(e.target.value) / 100)} /></Fld>
        <Fld bn={`শিরোনামের মাপ: ${d.size}px`} en="Title size" info="শিরোনামের লেখার আকার।"><input type="range" min={20} max={48} value={d.size} onChange={(e) => ud('size', Number(e.target.value))} /></Fld>
        <Fld bn={`রঙের ঢাল: ${d.angle}°`} en="Gradient angle" info="দুই রঙ কোন দিকে মিশবে।"><input type="range" min={0} max={360} value={d.angle} onChange={(e) => ud('angle', Number(e.target.value))} /></Fld>
        <Fld bn="ট্যাগের লেখা" en="Tag text" info="ব্যানারের ওপরের ছোট ব্যাজ, যেমন “আসন্ন সভা”। অনুষ্ঠান পেরিয়ে গেলে নিজে থেকে “সম্পন্ন” হয়ে যায়।"><input value={d.tag} onChange={(e) => ud('tag', e.target.value)} maxLength={40} /></Fld>
        <Fld bn="ব্যানারের ধরন" en="Layout" info="ছবি দিলে “পাশে ছবি” বা “পুরো ছবি” বেছে নিন।"><select value={d.template} onChange={(e) => ud('template', e.target.value as Design['template'])}><option value="gradient">শুধু রং (Colour only)</option><option value="split">পাশে ছবি (Image on side)</option><option value="image">পুরো ছবি (Full image)</option></select></Fld>
      </div>
      <span className="lbl">আইকন<small className="en-hint">(Icon)</small></span>
      <div className="ev-icons">{ICONS.map((i) => <button type="button" key={i} className={d.icon === i ? 'on' : ''} onClick={() => ud('icon', i)} aria-label={i}>{i}</button>)}<input value={d.icon} onChange={(e) => ud('icon', e.target.value.slice(0, 8))} aria-label="নিজের ইমোজি" placeholder="নিজের" /></div>
      {d.template !== 'gradient' && (
        <Fld bn={`ছবি ${d.image ? '(বদলাতে চাইলে নতুন দিন)' : ''}`} en="Image" info="JPG, PNG বা WebP, ৩ MB এর কম।"><input name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const fl = e.target.files?.[0]; setFile(fl ? URL.createObjectURL(fl) : ''); }} /></Fld>
      )}
      <div className="row" style={{ marginTop: 14 }}><Submit pendingText="সংরক্ষণ হচ্ছে...">{initial.id ? 'পরিবর্তন সংরক্ষণ (Save changes)' : 'অনুষ্ঠান যোগ করুন (Add event)'}</Submit>{initial.id && <Link className="btn" href="/admin/events#studio">বাতিল (Cancel)</Link>}</div>
    </ActionForm>
  );
}
