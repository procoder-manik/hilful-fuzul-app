import { NextResponse } from 'next/server';
import { loadFacts, factsToText } from '@/lib/chat/facts';
import { askModel, finalize, SYSTEM_PROMPT, type ChatMsg } from '@/lib/chat/llm';
import { ruleAnswer } from '@/lib/chat/rules';
import { tooMany } from '@/lib/ratelimit';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const reply = (answer: string, status = 200) => NextResponse.json({ answer }, { status });

export async function POST(req: Request) {
  try {
    if (tooMany('chat', 25)) return reply('অল্প সময়ে অনেক প্রশ্ন করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।', 429);

    const body = await req.json().catch(() => null) as { messages?: { role?: string; content?: unknown }[]; sid?: unknown } | null;
    const msgs: ChatMsg[] = (Array.isArray(body?.messages) ? body!.messages : [])
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .map((m) => ({ role: m.role as ChatMsg['role'], content: String(m.content).trim().slice(0, 600) }))
      .slice(-10);
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== 'user') return reply('প্রশ্ন লিখুন।', 400);

    const facts = await loadFacts();
    if (!facts.s.chat_enabled) return reply('চ্যাট সহকারী এখন বন্ধ আছে। অনুগ্রহ করে /contact পেজে বার্তা পাঠান।', 403);

    const system = `${SYSTEM_PROMPT}\n\nওয়েবসাইটের ভাষা: ${facts.lang === 'en' ? 'English' : 'বাংলা'}\n\n===== তথ্যভাণ্ডার =====\n${factsToText(facts)}`;
    const ai = await askModel(facts.s, system, msgs);
    const out = ai ? finalize(ai.text) : ruleAnswer(last.content, facts);

    // কে কী জিজ্ঞেস করল, অ্যাডমিন প্যানেলের "চ্যাট লগ" এ দেখার জন্য
    createAdminClient().from('chat_logs').insert({
      member_id: facts.memberId,
      who: facts.who === 'member' ? facts.name ?? 'সদস্য' : facts.who === 'staff' ? 'কমিটি' : 'অতিথি',
      question: last.content, answer: out.answer, unanswered: out.unanswered,
      session_id: typeof body?.sid === 'string' ? body.sid.slice(0, 40) : null,
    }).then(({ error }) => { if (error) console.error('[chat-log]', error.message); });

    return reply(out.answer);
  } catch (e) {
    console.error('[chat]', e);
    return reply('দুঃখিত, এখন উত্তর দিতে পারছি না। একটু পরে আবার চেষ্টা করুন।', 500);
  }
}
