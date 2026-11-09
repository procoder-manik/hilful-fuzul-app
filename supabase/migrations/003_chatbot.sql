-- =============================================================
-- ধাপ ৪: চ্যাট সহকারী
-- Supabase > SQL Editor এ পেস্ট করে Run চাপুন (ধাপ ১ ও ২ এর পরে)
-- =============================================================

-- সেটিংসে চ্যাটবটের নিয়ন্ত্রণ (API কী ডেটাবেসে থাকে না, থাকে .env.local এ)
alter table settings add column if not exists chat_enabled  boolean not null default true;
alter table settings add column if not exists chat_provider text    not null default 'gemini';
alter table settings add column if not exists chat_model    text;
alter table settings add column if not exists chat_notes    text;
alter table settings drop constraint if exists chat_provider_ok;
alter table settings add constraint chat_provider_ok check (chat_provider in ('gemini', 'openrouter'));

-- চ্যাট লগে: কোন প্রশ্নের উত্তর দেওয়া যায়নি তা চিহ্নিত করা
alter table chat_logs add column if not exists unanswered boolean not null default false;
alter table chat_logs add column if not exists session_id text;
create index if not exists chat_logs_created on chat_logs (created_at desc);
create index if not exists chat_logs_unanswered on chat_logs (created_at desc) where unanswered;
alter table chat_logs drop constraint if exists chat_len;
alter table chat_logs add constraint chat_len check (char_length(question) <= 600);

-- চ্যাট লগ এখন শুধু সার্ভার (service role) লেখে, তাই সবার জন্য খোলা লেখার অনুমতি বন্ধ
drop policy if exists public_insert on chat_logs;
