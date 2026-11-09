import 'server-only';
import { createHash } from 'crypto';
import { createAdminClient } from './supabase/admin';
import { askModel } from './chat/llm';
import { getLang } from './lang';
import type { Settings } from './types';

const PROMPT = `You are a professional Bangla-to-English translator for a Bangladeshi non-profit (a library and youth association that gives interest-free loans, runs Quran classes, free health checks and winter clothes distribution).
You get a JSON array of Bangla strings. Translate each into natural, concise English suitable for a public website.
Rules:
- Transliterate personal names into English letters (e.g. "মোঃ আব্দুর রহিম" -> "Md. Abdur Rahim").
- "করজে হাসানা" -> "Qard al-Hasan (interest-free loan)" on first mention, afterwards just "interest-free loan".
- Keep numbers, amounts, phone numbers, URLs and emails unchanged but use Western digits.
- Keep line breaks. Do not add explanations.
- Return ONLY a JSON array of strings, same length and same order as the input.`;

const BN = /[\u0980-\u09FF]/;
const mem = new Map<string, string>();
const key = (lang: string, text: string) => `${lang}:${createHash('sha1').update(text).digest('hex')}`;

/** একবারে এআইকে কতটা পাঠানো হবে */
const BATCH_ITEMS = 25, BATCH_CHARS = 7000;

async function callAI(batch: string[]): Promise<string[] | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('settings').select('*').eq('id', 1).single();
  if (!data) return null;
  const ai = await askModel(data as Settings, PROMPT, [{ role: 'user', content: JSON.stringify(batch) }], { temperature: 0, maxTokens: 6000, timeoutMs: 40000 });
  if (!ai) return null;
  try {
    const raw = ai.text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const arr = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
    if (Array.isArray(arr) && arr.length === batch.length && arr.every((x) => typeof x === 'string' && x.trim())) return arr;
  } catch { /* নিচে null */ }
  console.error('[translate] এআই এর উত্তর পড়া যায়নি');
  return null;
}

/**
 * বাংলা লেখাগুলো ইংরেজিতে। আগে ক্যাশ (ডেটাবেস) দেখে, না থাকলে এআই দিয়ে করে ক্যাশে রাখে।
 * এআই চালু না থাকলে বা ব্যর্থ হলে মূল বাংলা লেখাই ফেরত যায়, যাতে সাইট কখনো ভাঙে না।
 */
export async function translateMany(texts: string[], lang: 'bn' | 'en' = 'en'): Promise<string[]> {
  if (lang === 'bn') return texts;
  const need = [...new Set(texts.filter((t) => t && BN.test(t)))];
  const out = new Map<string, string>();
  const todo: string[] = [];
  for (const t of need) { const hit = mem.get(key(lang, t)); hit ? out.set(t, hit) : todo.push(t); }

  const admin = createAdminClient();
  if (todo.length) {
    const ids = todo.map((t) => key(lang, t));
    for (let i = 0; i < ids.length; i += 150) {
      const { data } = await admin.from('translations').select('id, result').in('id', ids.slice(i, i + 150));
      const found = new Map((data ?? []).map((r) => [r.id as string, r.result as string]));
      todo.slice(i, i + 150).forEach((t, j) => { const r = found.get(ids[i + j]); if (r) { out.set(t, r); mem.set(ids[i + j], r); } });
    }
  }
  const missing = todo.filter((t) => !out.has(t));
  for (let i = 0; i < missing.length;) {
    const batch: string[] = []; let chars = 0;
    while (i < missing.length && batch.length < BATCH_ITEMS && (batch.length === 0 || chars + missing[i].length <= BATCH_CHARS)) { chars += missing[i].length; batch.push(missing[i++]); }
    const res = await callAI(batch);
    if (!res) continue;                       // ক্যাশ না করে মূল লেখাই থাকবে
    const rows = batch.map((src, j) => ({ id: key(lang, src), lang, source: src, result: res[j] }));
    await admin.from('translations').upsert(rows, { onConflict: 'id' });
    rows.forEach((r, j) => { out.set(batch[j], r.result); mem.set(r.id, r.result); });
  }
  if (mem.size > 4000) mem.clear();
  return texts.map((t) => out.get(t) ?? t);
}

/** সারির তালিকার নির্দিষ্ট ঘরগুলো বর্তমান ভাষায় (বাংলা হলে কিছুই করে না) */
export async function translateRows<T extends Record<string, unknown>>(rows: T[], fields: (keyof T & string)[]): Promise<T[]> {
  if (getLang() === 'bn' || !rows.length) return rows;
  const texts: string[] = [];
  rows.forEach((r) => fields.forEach((f) => { if (typeof r[f] === 'string') texts.push(r[f] as string); }));
  const tr = await translateMany(texts, 'en');
  let i = 0;
  return rows.map((r) => {
    const c = { ...r } as Record<string, unknown>;
    fields.forEach((f) => { if (typeof r[f] === 'string') c[f] = tr[i++]; });
    return c as T;
  });
}

/** ওয়েবসাইটে দেখানো সেটিংসের লেখাগুলো বর্তমান ভাষায় */
export async function translateSettings(s: Settings): Promise<Settings> {
  if (getLang() === 'bn') return s;
  const parts: string[] = [
    s.org_name, s.short_name ?? '', s.tagline ?? '', s.address ?? '', s.pay_info ?? '', s.quran_info ?? '',
    s.hero?.title ?? '', s.hero?.title2 ?? '', s.hero?.sub ?? '',
    ...s.ticker, ...s.member_terms, ...s.loan_terms,
    ...s.pay_methods.flatMap((m) => [m.label, m.note]),
    s.office_hours ?? '',
  ];
  const tr = await translateMany(parts, 'en');
  let i = 0; const next = () => tr[i++];
  const org_name = next(), short_name = next(), tagline = next(), address = next(), pay_info = next(), quran_info = next();
  const hero = { ...s.hero, title: next(), title2: next(), sub: next() };
  const take = (n: number) => tr.slice(i, (i += n));
  return {
    ...s, org_name, short_name: s.short_name ? short_name : null, tagline: s.tagline ? tagline : null, address: s.address ? address : null,
    pay_info: s.pay_info ? pay_info : null, quran_info: s.quran_info ? quran_info : null, hero,
    ticker: take(s.ticker.length), member_terms: take(s.member_terms.length), loan_terms: take(s.loan_terms.length),
    pay_methods: s.pay_methods.map((m) => { const [label, note] = take(2); return { ...m, label, note }; }),
    office_hours: s.office_hours ? take(1)[0] : null,
  };
}

/**
 * অ্যাডমিন কিছু সম্পাদনা করলে আগেভাগেই ইংরেজি অনুবাদ করে ক্যাশে রাখে,
 * যাতে প্রথম ইংরেজি ভিজিটরকে অপেক্ষা করতে না হয়। ব্যর্থ হলেও মূল কাজে কোনো প্রভাব নেই।
 */
export async function warmTranslations(): Promise<number> {
  try {
    const admin = createAdminClient();
    const [{ data: s }, { data: ev }, { data: pr }, { data: cm }, { data: po }] = await Promise.all([
      admin.from('settings').select('*').eq('id', 1).single(),
      admin.from('events').select('title, topic, venue, chief_guest, special_guest, presided_by, outcome'),
      admin.from('programs').select('title, description'),
      admin.from('committee').select('name, role, duty'),
      admin.from('posts').select('title, body').eq('is_published', true).order('published_on', { ascending: false }).limit(30),
    ]);
    const texts: string[] = [];
    const add = (rows: Record<string, unknown>[] | null) => (rows ?? []).forEach((r) => Object.values(r).forEach((v) => typeof v === 'string' && v && texts.push(v)));
    add(ev); add(pr); add(cm); add(po);
    if (s) {
      const x = s as Settings;
      [x.org_name, x.short_name, x.tagline, x.address, x.pay_info, x.quran_info, x.hero?.title, x.hero?.title2, x.hero?.sub, ...(x.ticker ?? []), ...(x.member_terms ?? []), ...(x.loan_terms ?? []), ...(x.pay_methods ?? []).flatMap((m) => [m.label, m.note])]
        .forEach((v) => typeof v === 'string' && v && texts.push(v));
    }
    const before = mem.size;
    await translateMany(texts, 'en');
    return mem.size - before;
  } catch (e) {
    console.error('[translate] আগেভাগে অনুবাদ ব্যর্থ', e instanceof Error ? e.message : e);
    return 0;
  }
}
