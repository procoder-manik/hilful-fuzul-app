-- =============================================================
-- ধাপ ৫: নিবন্ধন ও প্রোফাইল, ইমেইল/ফোনে লগইন, বিজ্ঞপ্তি, দুই ভাষা
-- Supabase > SQL Editor এ পেস্ট করে Run চাপুন (ধাপ ১-৪ এর পরে)
-- =============================================================

-- ---------- সদস্য ও আবেদনের নতুন তথ্য ----------
alter table members add column if not exists mother_name text;
alter table members add column if not exists email text;
alter table members add column if not exists verified_at timestamptz;
-- যারা আগে থেকেই সদস্য, তাদের যাচাইকৃত ধরা হলো
update members set verified_at = coalesce(created_at, now()) where verified_at is null;

alter table applications add column if not exists mother_name text;
alter table applications add column if not exists email text;
alter table applications add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table applications add column if not exists pay_method text;      -- আবেদনকারী যে মাধ্যমে ফি পাঠিয়েছেন বলে জানিয়েছেন
alter table applications add column if not exists pay_trx text;         -- ট্রানজ্যাকশন আইডি, কমিটি মিলিয়ে দেখবে
alter table applications add column if not exists pay_claimed_at timestamptz;
create unique index if not exists applications_user_uq on applications (user_id) where user_id is not null;

-- ---------- লগইন পরিচয়: মোবাইল বা ইমেইল ----------
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists email text;
update profiles p set phone = m.phone from members m where p.member_id = m.id and p.phone is null;
create unique index if not exists profiles_phone_uq on profiles (phone) where phone is not null;
create unique index if not exists profiles_email_uq on profiles (lower(email)) where email is not null;

-- আবেদনকারী নিজের আবেদন দেখতে পারবেন; নতুন আবেদন এখন শুধু সার্ভার (service role) তৈরি করে
drop policy if exists own_application on applications;
create policy own_application on applications for select using (user_id = auth.uid());
drop policy if exists public_insert on applications;
alter table applications drop constraint if exists app_len;
alter table applications add constraint app_len check (char_length(name) <= 120 and char_length(coalesce(address,'')) <= 400 and char_length(coalesce(pay_trx,'')) <= 80);

-- ---------- সেটিংস ----------
alter table settings add column if not exists pay_methods   jsonb   not null default '[]';  -- বিকাশ, রকেট, নগদ, ব্যাংক
alter table settings add column if not exists notify_email  boolean not null default true;
alter table settings add column if not exists notify_sms    boolean not null default true;
alter table settings add column if not exists notify_last_run date;

-- ---------- বিজ্ঞপ্তি ----------
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_key text not null,                         -- সদস্যের id বা (সদস্য হওয়ার আগে) লগইনের id
  member_id     uuid references members(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  kind          text not null,
  dedupe_key    text not null default '',              -- একই বিজ্ঞপ্তি দুইবার যাওয়া ঠেকায়
  title         text not null,
  body          text not null,
  read_at       timestamptz,
  email_status  text,
  sms_status    text,
  created_at    timestamptz not null default now(),
  unique (recipient_key, kind, dedupe_key)
);
create index if not exists notifications_user on notifications (user_id, created_at desc);
create index if not exists notifications_member on notifications (member_id, created_at desc);
create index if not exists notifications_recent on notifications (created_at desc);
alter table notifications enable row level security;
drop policy if exists staff_all on notifications;
create policy staff_all on notifications for all using (is_staff()) with check (is_staff());
drop policy if exists own_notifications on notifications;
create policy own_notifications on notifications for select using (user_id = auth.uid() or member_id = my_member());

-- ---------- ইংরেজি অনুবাদের ক্যাশ (এআই একবার অনুবাদ করলে আবার করতে হয় না) ----------
create table if not exists translations (
  id         text primary key,        -- ভাষা:লেখার হ্যাশ
  lang       text not null,
  source     text not null,
  result     text not null,
  created_at timestamptz not null default now()
);
alter table translations enable row level security;   -- কোনো পলিসি নেই: শুধু সার্ভার পড়ে ও লেখে
