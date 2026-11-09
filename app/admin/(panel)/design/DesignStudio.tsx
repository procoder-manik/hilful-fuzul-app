'use client';
import { useState } from 'react';
import { ActionForm, Submit } from '../../_components/ActionForm';
import { HeaderView } from '@/components/site/HeaderView';
import { FooterView } from '@/components/site/FooterView';
import { FOOTER_DEFAULT, HEADER_DEFAULT, type FooterCfg, type HeaderCfg } from '@/lib/layoutcfg';
import type { MegaData, MenuNode } from '@/lib/menu';
import type { ActionState } from '@/lib/guard';
import { fieldHint } from '@/lib/adminlabels';
import { Info } from '../../_components/Fld';

type Org = { name: string; short: string | null; tagline: string | null; logo: string | null; established: string | null };
type Contact = { phone: string | null; email: string | null; address: string | null; facebook: string | null; whatsapp: string | null };
type Action = (p: ActionState, f: FormData) => Promise<ActionState>;

function Field({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactNode }) { const h = fieldHint(label); return <label className="f"><span>{label}{h.en && <small className="en-hint">{h.en}</small>}{suffix}</span>{children}{h.info && <Info>{h.info}</Info>}</label>; }
function Check({ label, v, set }: { label: string; v: boolean; set: (b: boolean) => void }) { const h = fieldHint(label); return <label className="chk"><input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} /> <span className="chk-t">{label}{h.en && <small className="en-hint">{h.en}</small>}{h.info && <Info>{h.info}</Info>}</span></label>; }
function Pick<T extends string | number>({ label, v, set, opts }: { label: string; v: T; set: (x: T) => void; opts: [T, string][] }) {
  return <Field label={label}><select value={v} onChange={(e) => set((typeof v === 'number' ? Number(e.target.value) : e.target.value) as T)}>{opts.map(([k, n]) => <option key={String(k)} value={k}>{n}</option>)}</select></Field>;
}
function Range({ label, v, set, min, max, unit = '' }: { label: string; v: number; set: (n: number) => void; min: number; max: number; unit?: string }) {
  return <Field label={label} suffix={`: ${v}${unit}`}><input type="range" min={min} max={max} value={v} onChange={(e) => set(Number(e.target.value))} /></Field>;
}
function Txt({ label, v, set, max = 200 }: { label: string; v: string; set: (s: string) => void; max?: number }) { return <Field label={label}><input value={v} maxLength={max} onChange={(e) => set(e.target.value)} /></Field>; }
function Col({ label, v, set }: { label: string; v: string; set: (s: string) => void }) { return <Field label={label}><input type="color" value={v} onChange={(e) => set(e.target.value)} style={{ padding: 2, height: 42 }} /></Field>; }

export function HeaderStudio({ initial, org, menu, mega, contact, action }: { initial: HeaderCfg; org: Org; menu: MenuNode[]; mega: MegaData; contact: Contact; action: Action }) {
  const [c, setC] = useState<HeaderCfg>(initial);
  const u = <K extends keyof HeaderCfg>(k: K) => (v: HeaderCfg[K]) => setC((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <div className="card studio-pv"><div className="row" style={{ justifyContent: 'space-between' }}><b>লাইভ প্রিভিউ<small className="en-hint">(Live preview)</small></b><span className="muted small">মেনুর ডানে তীর চাপলে ড্রপডাউন বা মেগা মেনু দেখা যাবে। মোবাইলে হেডার ছোট হয়ে নিচের ট্যাব বার আসে।</span></div>
        <div className="pv-box"><HeaderView preview cfg={c} org={org} menu={menu} mega={mega} account={{ href: '#', label: 'লগইন' }} lang="bn" contact={{ phone: contact.phone, email: contact.email }} /></div></div>
      <ActionForm action={action} className="card" style={{ marginTop: 16 }}>
        <input type="hidden" name="cfg" value={JSON.stringify(c)} />
        <h2 className="h2" style={{ marginTop: 0 }}>হেডারের ডিজাইন<small className="en-hint">(Header design)</small></h2>
        <div className="grid g3" style={{ gap: '0 14px' }}>
          <Pick label="লেআউট" v={c.layout} set={u('layout')} opts={[['classic', 'ক্লাসিক: লোগো বাঁয়ে, মেনু ডানে'], ['centered', 'মাঝখানে লোগো, নিচে মেনু (বাটন ওপরের বারে)'], ['tworow', 'দুই সারি: নিচে আলাদা পট্টিতে মেনু'], ['floating', 'ভাসমান: গোল কোণার আধুনিক বার']]} />
          {c.layout === 'tworow' && <Pick label="মেনুর পট্টির রং" v={c.band} set={u('band')} opts={[['soft', 'হালকা ধূসর'], ['accent', 'থিমের মূল রং'], ['plain', 'হেডারের মতোই']]} />}
          <Range label="উচ্চতা" v={c.height} set={u('height')} min={48} max={110} unit="px" />
          <Range label="লোগোর মাপ" v={c.logoSize} set={u('logoSize')} min={28} max={72} unit="px" />
          <Pick label="ব্যাকগ্রাউন্ড" v={c.bg} set={u('bg')} opts={[['glass', 'কাঁচের মতো স্বচ্ছ'], ['solid', 'সাদা/গাঢ় (থিম অনুযায়ী)'], ['accent', 'থিমের মূল রং'], ['custom', 'নিজের রং']]} />
          {c.bg === 'custom' && <><Col label="ব্যাকগ্রাউন্ডের রং" v={c.bgColor} set={u('bgColor')} /><Col label="লেখার রং" v={c.textColor} set={u('textColor')} /></>}
          <Pick label="মেনুর ধরন" v={c.navStyle} set={u('navStyle')} opts={[['pill', 'গোল ব্যাকগ্রাউন্ড'], ['underline', 'নিচে দাগ'], ['plain', 'সাদামাটা']]} />
          <Pick label="মেনুর অবস্থান" v={c.navAlign} set={u('navAlign')} opts={[['right', 'ডানে'], ['center', 'মাঝে'], ['left', 'বাঁয়ে']]} />
          <Range label="মেনুর লেখার মাপ" v={c.navSize} set={u('navSize')} min={12} max={19} unit="px" />
        </div>
        <div className="grid g2" style={{ gap: '0 14px', marginTop: 4 }}>
          <div>
            <Check label="স্ক্রল করলেও হেডার ওপরে আটকে থাকুক" v={c.sticky} set={u('sticky')} />
            <Check label="হেডারের নিচে ছায়া" v={c.shadow} set={u('shadow')} />
            <Check label="লোগো দেখান" v={c.showLogo} set={u('showLogo')} />
            <Check label="ট্যাগলাইন দেখান" v={c.showTagline} set={u('showTagline')} />
            <Check label="মোবাইলে সংক্ষিপ্ত নাম দেখান" v={c.showShortNameOnMobile} set={u('showShortNameOnMobile')} />
            <Check label="লগইন/অ্যাকাউন্ট বাটন দেখান" v={c.showAccount} set={u('showAccount')} />
            <Check label="ডার্ক মোড বাটন দেখান" v={c.showTheme} set={u('showTheme')} />
          </div>
          <div>
            <Check label={'আলাদা বাটন (CTA) দেখান, যেমন “সদস্য হোন”'} v={c.ctaOn} set={u('ctaOn')} />
            {c.ctaOn && <div className="grid g2" style={{ gap: '0 8px' }}><Txt label="বাটনের লেখা" v={c.ctaLabel} set={u('ctaLabel')} max={40} /><Txt label="Button text (English)" v={c.ctaLabelEn} set={u('ctaLabelEn')} max={40} /><Txt label="লিংক" v={c.ctaUrl} set={u('ctaUrl')} max={200} /></div>}
          </div>
        </div>
        <h3 className="h2">ওপরের ঘোষণা-বার (টপবার)<small className="en-hint">(Top announcement bar)</small></h3>
        <Check label="হেডারের ওপরে একটি ছোট বার দেখান" v={c.topbarOn} set={u('topbarOn')} />
        {c.topbarOn && (
          <div className="grid g3" style={{ gap: '0 14px' }}>
            <Txt label="লেখা" v={c.topbarText} set={u('topbarText')} max={160} /><Txt label="Text (English)" v={c.topbarTextEn} set={u('topbarTextEn')} max={160} />
            <div><Check label="ফোন ও ইমেইল দেখান" v={c.topbarContact} set={u('topbarContact')} /></div>
            <Col label="ব্যাকগ্রাউন্ড" v={c.topbarBg} set={u('topbarBg')} /><Col label="লেখার রং" v={c.topbarColor} set={u('topbarColor')} />
          </div>
        )}
        <div className="row" style={{ marginTop: 12 }}><Submit pendingText="সংরক্ষণ হচ্ছে...">হেডার সংরক্ষণ করুন (Save header)</Submit><button type="button" className="btn" onClick={() => setC(HEADER_DEFAULT)}>ডিফল্টে ফিরুন (Reset)</button></div>
        <p className="muted small">"ডিফল্টে ফিরুন" চাপার পর "সংরক্ষণ করুন" না চাপলে কিছু বদলাবে না। মেনুর আইটেম বদলাতে <a href="/admin/menus">মেনু</a> পাতায় যান।</p>
      </ActionForm>
    </div>
  );
}

export function FooterStudio({ initial, org, menus, contact, action }: { initial: FooterCfg; org: Org; menus: { c1: MenuNode[]; c2: MenuNode[]; c3: MenuNode[]; bottom: MenuNode[] }; contact: Contact; action: Action }) {
  const [c, setC] = useState<FooterCfg>(initial);
  const u = <K extends keyof FooterCfg>(k: K) => (v: FooterCfg[K]) => setC((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <div className="card studio-pv"><b>লাইভ প্রিভিউ<small className="en-hint">(Live preview)</small></b><div className="pv-box"><FooterView cfg={c} lang="bn" year="২০২৬" org={org} menus={menus} contact={contact} /></div></div>
      <ActionForm action={action} className="card" style={{ marginTop: 16 }}>
        <input type="hidden" name="cfg" value={JSON.stringify(c)} />
        <h2 className="h2" style={{ marginTop: 0 }}>ফুটারের ডিজাইন<small className="en-hint">(Footer design)</small></h2>
        <div className="grid g3" style={{ gap: '0 14px' }}>
          <Pick label="ব্যাকগ্রাউন্ড" v={c.bg} set={u('bg')} opts={[['surface', 'সাদা/গাঢ় (থিম অনুযায়ী)'], ['accent', 'থিমের মূল রং'], ['dark', 'গাঢ় সবুজ'], ['custom', 'নিজের রং']]} />
          {c.bg === 'custom' && <><Col label="ব্যাকগ্রাউন্ডের রং" v={c.bgColor} set={u('bgColor')} /><Col label="লেখার রং" v={c.textColor} set={u('textColor')} /></>}
          <Pick label="প্যাটার্ন" v={c.pattern} set={u('pattern')} opts={[['none', 'কোনো প্যাটার্ন নয়'], ['geo', 'জ্যামিতিক (হিরোর মতো)'], ['dots', 'বিন্দু'], ['stripes', 'কোণাকুণি দাগ'], ['waves', 'ঢেউ'], ['stars', 'তারা']]} />
          {c.pattern !== 'none' && <Range label="প্যাটার্ন কতটা স্পষ্ট" v={Math.round(c.patternOpacity * 100)} set={(n) => u('patternOpacity')(n / 100)} min={3} max={30} unit="%" />}
          <Pick label="নকশা" v={c.style} set={u('style')} opts={[['columns', 'কলাম (লিংকের কয়েকটি কলাম)'], ['cta', 'ওপরে আহ্বানের পট্টি + কলাম'], ['centered', 'মাঝখানে সাজানো'], ['minimal', 'সাদামাটা এক সারি']]} />
        </div>
        {c.style === 'cta' && (
          <div className="grid g2" style={{ gap: '0 14px' }}>
            <Txt label="আহ্বানের শিরোনাম" v={c.ctaTitle} set={u('ctaTitle')} max={120} /><Txt label="Title (English)" v={c.ctaTitleEn} set={u('ctaTitleEn')} max={120} />
            <Txt label="ছোট লেখা" v={c.ctaText} set={u('ctaText')} max={240} /><Txt label="Text (English)" v={c.ctaTextEn} set={u('ctaTextEn')} max={240} />
            <Txt label="বাটনের লেখা" v={c.ctaBtn} set={u('ctaBtn')} max={40} /><Txt label="Button (English)" v={c.ctaBtnEn} set={u('ctaBtnEn')} max={40} />
            <Txt label="বাটনের লিংক" v={c.ctaUrl} set={u('ctaUrl')} max={200} />
          </div>
        )}
        <div className="grid g2" style={{ gap: '0 14px' }}>
          <div>
            <Check label="লোগো ও নাম দেখান" v={c.showLogo} set={u('showLogo')} />
            <Check label="সংগঠনের পরিচিতি লেখা দেখান" v={c.showAbout} set={u('showAbout')} />
            <Check label="যোগাযোগ কলাম দেখান (ফোন, ইমেইল, ঠিকানা)" v={c.showContact} set={u('showContact')} />
            <Check label="সোশ্যাল লিংক (ফেসবুক, ইউটিউব, হোয়াটসঅ্যাপ) দেখান" v={c.showSocial} set={u('showSocial')} />
            <Check label="ভাষা বদলের বাটন (বাংলা | EN) দেখান" v={c.showLang} set={u('showLang')} />
            <Check label="একদম নিচের লিংকগুলো দেখান" v={c.showBottomLinks} set={u('showBottomLinks')} />
          </div>
          <div>
            {c.showAbout && <><Field label="পরিচিতি লেখা (ফাঁকা রাখলে স্বয়ংক্রিয় লেখা)"><textarea rows={3} value={c.aboutText} maxLength={400} onChange={(e) => u('aboutText')(e.target.value)} /></Field>
              <Field label="About text (English)"><textarea rows={3} value={c.aboutTextEn} maxLength={400} onChange={(e) => u('aboutTextEn')(e.target.value)} /></Field></>}
            {c.showSocial && <Txt label="ইউটিউব চ্যানেলের লিংক (ঐচ্ছিক)" v={c.youtube} set={u('youtube')} max={200} />}
          </div>
        </div>
        <h3 className="h2">লিংকের কলামের নাম<small className="en-hint">(Link column titles)</small></h3><p className="muted small" style={{ marginTop: -4 }}>কলামের ভেতরের লিংকগুলো <a href="/admin/menus?loc=footer-1">মেনু</a> পাতা থেকে সাজান।</p>
        <div className="grid g3" style={{ gap: '0 14px' }}>
          <Txt label="কলাম ১" v={c.col1Title} set={u('col1Title')} max={40} /><Txt label="Column 1 (English)" v={c.col1TitleEn} set={u('col1TitleEn')} max={40} /><div />
          <Txt label="কলাম ২" v={c.col2Title} set={u('col2Title')} max={40} /><Txt label="Column 2 (English)" v={c.col2TitleEn} set={u('col2TitleEn')} max={40} /><div />
          <Txt label="কলাম ৩ (মেনুতে আইটেম দিলে দেখাবে)" v={c.col3Title} set={u('col3Title')} max={40} /><Txt label="Column 3 (English)" v={c.col3TitleEn} set={u('col3TitleEn')} max={40} /><div />
        </div>
        <h3 className="h2">নিজের লেখার কলাম (ঐচ্ছিক)<small className="en-hint">(Custom text column)</small></h3><p className="muted small" style={{ marginTop: -4 }}>যেমন কুরআন ক্লাসের সময় বা ব্যাংক হিসাব। ফুটারে আলাদা একটি কলাম হয়ে বসবে।</p>
        <div className="grid g2" style={{ gap: '0 14px' }}>
          <Txt label="কলামের নাম" v={c.customTitle} set={u('customTitle')} max={40} /><Txt label="Column title (English)" v={c.customTitleEn} set={u('customTitleEn')} max={40} />
          <Field label="লেখা (লাইন ভেঙে লেখা যায়)"><textarea rows={3} value={c.customText} maxLength={500} onChange={(e) => u('customText')(e.target.value)} /></Field>
          <Field label="Text (English)"><textarea rows={3} value={c.customTextEn} maxLength={500} onChange={(e) => u('customTextEn')(e.target.value)} /></Field>
        </div>
        <h3 className="h2">কপিরাইট ও ক্রেডিট<small className="en-hint">(Copyright & credit)</small></h3>
        <div className="grid g2" style={{ gap: '0 14px' }}>
          <Txt label="কপিরাইট লেখা (ফাঁকা রাখলে স্বয়ংক্রিয়; {year} লিখলে চলতি বছর বসবে)" v={c.copyright} set={u('copyright')} /><Txt label="Copyright (English)" v={c.copyrightEn} set={u('copyrightEn')} />
          <Txt label="ক্রেডিটের আগের লেখা" v={c.creditPrefix} set={u('creditPrefix')} max={60} /><Txt label="Credit prefix (English)" v={c.creditPrefixEn} set={u('creditPrefixEn')} max={60} />
          <Txt label="নাম (যেমন: Manik Hossain), ফাঁকা রাখলে ক্রেডিট দেখাবে না" v={c.creditName} set={u('creditName')} max={60} /><Txt label="নামের ওপর লিংক (যেমন: https://আপনার-সাইট.com)" v={c.creditUrl} set={u('creditUrl')} max={200} />
          <Txt label="নিচে বাড়তি এক লাইন (ঐচ্ছিক)" v={c.extraText} set={u('extraText')} max={300} /><Txt label="Extra line (English)" v={c.extraTextEn} set={u('extraTextEn')} max={300} />
        </div>
        <p className="muted small">ক্রেডিট কপিরাইটের ডানে দেখাবে, নামটিতে চাপলে লিংকে যাবে।</p>
        <div className="row" style={{ marginTop: 12 }}><Submit pendingText="সংরক্ষণ হচ্ছে...">ফুটার সংরক্ষণ করুন (Save footer)</Submit><button type="button" className="btn" onClick={() => setC(FOOTER_DEFAULT)}>ডিফল্টে ফিরুন (Reset)</button></div>
      </ActionForm>
    </div>
  );
}
