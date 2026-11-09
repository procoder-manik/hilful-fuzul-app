-- =============================================================
-- ধাপ ৭: রিপোর্ট ও ফিল্টার, সেবার রেকর্ড, লগইনের ইতিহাস, কমিটির প্রোফাইল
-- Supabase > SQL Editor এ পেস্ট করে Run চাপুন (ধাপ ১-৬ এর পরে)
-- =============================================================

-- ---------- লগইনের ইতিহাস (সফল ও ব্যর্থ চেষ্টা) ----------
create table if not exists login_events (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete set null,
  identifier text,                 -- যে মোবাইল/ইমেইল দিয়ে চেষ্টা (ব্যর্থ হলে আংশিক লুকানো)
  role       text,
  audience   text,                 -- সদস্য না কমিটির ট্যাব
  ok         boolean not null,
  reason     text,
  ip         text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists login_events_recent on login_events (created_at desc);
alter table login_events enable row level security;
drop policy if exists admin_read on login_events;
create policy admin_read on login_events for select using (my_role() = 'admin');   -- লেখে শুধু সার্ভার

-- ---------- কে কোন সেবা নিল (ডায়াবেটিস পরীক্ষা, শীতবস্ত্র, শিক্ষাবৃত্তি ইত্যাদি) ----------
create table if not exists service_records (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid references programs(id) on delete set null,
  service     text not null,                     -- সেবার নাম (সেবা মুছে গেলেও থাকে)
  person_name text not null,
  phone       text,
  member_id   uuid references members(id) on delete set null,
  served_on   date not null default current_date,
  quantity    int  not null default 1 check (quantity > 0),
  note        text,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);
create index if not exists service_records_date on service_records (served_on desc);
alter table service_records enable row level security;
drop policy if exists staff_all on service_records;
create policy staff_all on service_records for all using (is_staff()) with check (is_staff());

-- ---------- দাতার পদবী ও সদস্যের সাথে যোগ ----------
alter table donations add column if not exists donor_title text;
alter table donations add column if not exists member_id uuid references members(id) on delete set null;
create index if not exists donations_date on donations (donated_on desc);
create index if not exists payments_date on payments (paid_on desc);
create index if not exists loans_date on loans (issued_on desc);

-- ---------- কমিটির প্রোফাইল ----------
alter table committee add column if not exists email text;
alter table committee add column if not exists bio text;
alter table committee add column if not exists facebook text;
alter table committee add column if not exists is_founder boolean not null default false;
-- কমিটির মোবাইল ও ইমেইল ওয়েবসাইটের ভিজিটর (anon) কখনো পড়তে পারবে না
revoke select on committee from anon;
grant select (id, name, role, duty, photo_url, sort, bio, facebook, is_founder) on committee to anon;

-- ---------- সদস্য পেজে দেখানো (সদস্য চাইলে লুকাতে পারবেন) ----------
alter table members add column if not exists show_public boolean not null default true;
