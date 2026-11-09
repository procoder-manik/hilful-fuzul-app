import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Settings } from '@/lib/types';

/* ---------- ইমেইল (SMTP) ---------- */
export const emailConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transport: any = null;

export async function sendEmail(to: string, subject: string, text: string): Promise<string> {
  if (!emailConfigured()) return 'skipped:smtp-not-configured';
  try {
    if (!transport) {
      const nodemailer = (await import('nodemailer')).default;
      const port = Number(process.env.SMTP_PORT || 587);
      transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port, secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }
    await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
    return 'sent';
  } catch (e) {
    console.error('[email]', e instanceof Error ? e.message : e);
    return 'failed:' + (e instanceof Error ? e.message : 'error').slice(0, 120);
  }
}

/* ---------- SMS (যেকোনো GET-ভিত্তিক গেটওয়ে) ---------- */
export const smsConfigured = () => !!process.env.SMS_URL;

/** SMS_URL এ {to} (01XXXXXXXXX), {to88} (8801XXXXXXXXX) ও {message} বসানো থাকে */
export async function sendSms(phone: string, message: string): Promise<string> {
  if (!smsConfigured()) return 'skipped:sms-not-configured';
  try {
    const local = phone.replace(/\D/g, '');
    const url = process.env.SMS_URL!
      .replaceAll('{to88}', encodeURIComponent('88' + local.replace(/^88/, '')))
      .replaceAll('{to}', encodeURIComponent(local))
      .replaceAll('{message}', encodeURIComponent(message));
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const body = (await res.text()).slice(0, 160);
    if (!res.ok) return `failed:${res.status} ${body}`;
    const bad = process.env.SMS_FAIL_TEXT?.trim();       // গেটওয়ে ভুল হলেও 200 দিলে এই লেখা দেখে ব্যর্থ ধরা হয়
    if (bad && body.toLowerCase().includes(bad.toLowerCase())) return `failed:${body}`;
    return 'sent';
  } catch (e) {
    console.error('[sms]', e instanceof Error ? e.message : e);
    return 'failed:' + (e instanceof Error ? e.message : 'error').slice(0, 120);
  }
}

/* ---------- বিজ্ঞপ্তি তৈরি ও পাঠানো ---------- */
export type NotifyInput = {
  memberId?: string | null; userId?: string | null;
  kind: string; key?: string;
  title: string; body: string; sms?: string;
  email?: string | null; phone?: string | null;
  settings?: Pick<Settings, 'notify_email' | 'notify_sms'>;
};

/**
 * অ্যাপের ভেতরে বিজ্ঞপ্তি সংরক্ষণ করে, তারপর ইমেইল থাকলে ইমেইলে ও ফোন থাকলে SMS এ পাঠায়।
 * একই (প্রাপক, ধরন, কী) আবার এলে কিছুই করে না। এই ফাংশন কখনো error ছুড়ে না, যাতে মূল কাজ (যেমন চাঁদা জমা) না আটকায়।
 */
export async function notify(o: NotifyInput): Promise<{ created: boolean }> {
  try {
    const admin = createAdminClient();
    let { email, phone, userId } = o;
    if (o.memberId && (email === undefined || phone === undefined || userId === undefined)) {
      const [{ data: m }, { data: p }] = await Promise.all([
        admin.from('members').select('phone, email').eq('id', o.memberId).maybeSingle(),
        admin.from('profiles').select('id, email, phone').eq('member_id', o.memberId).maybeSingle(),
      ]);
      email = email ?? m?.email ?? p?.email ?? null;
      phone = phone ?? m?.phone ?? p?.phone ?? null;
      userId = userId ?? p?.id ?? null;
    } else if (!o.memberId && o.userId && (email === undefined || phone === undefined)) {
      const { data: p } = await admin.from('profiles').select('email, phone').eq('id', o.userId).maybeSingle();
      email = email ?? p?.email ?? null;
      phone = phone ?? p?.phone ?? null;
    }
    const recipient = o.memberId ?? o.userId;
    if (!recipient) return { created: false };

    const { data: row, error } = await admin.from('notifications').insert({
      recipient_key: recipient, member_id: o.memberId ?? null, user_id: userId ?? null,
      kind: o.kind, dedupe_key: o.key ?? crypto.randomUUID(), title: o.title, body: o.body,
    }).select('id').single();
    if (error) {
      if (error.code !== '23505') console.error('[notify]', error.message);
      return { created: false };
    }

    let flags = o.settings;
    if (!flags) {
      const { data: s } = await admin.from('settings').select('notify_email, notify_sms').eq('id', 1).single();
      flags = { notify_email: s?.notify_email ?? true, notify_sms: s?.notify_sms ?? true };
    }
    const [email_status, sms_status] = await Promise.all([
      !email ? 'skipped:no-email' : !flags.notify_email ? 'skipped:off' : sendEmail(email, o.title, o.body),
      !phone ? 'skipped:no-phone' : !flags.notify_sms ? 'skipped:off' : sendSms(phone, (o.sms ?? o.body).slice(0, 300)),
    ]);
    await admin.from('notifications').update({ email_status, sms_status }).eq('id', row.id);
    return { created: true };
  } catch (e) {
    console.error('[notify]', e instanceof Error ? e.message : e);
    return { created: false };
  }
}
