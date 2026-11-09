-- =============================================================
-- হিলফুল ফুজুল পাঠাগার ও যুব সংঘ : ডেটাবেস (ধাপ ১)
-- Supabase > SQL Editor এ পুরোটা পেস্ট করে Run চাপুন
-- =============================================================
create extension if not exists pgcrypto;
create extension if not exists pg_cron;

-- ---------- enums ----------
do $$ begin create type member_status as enum ('active','frozen','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_type  as enum ('registration','monthly','reactivation'); exception when duplicate_object then null; end $$;
do $$ begin create type loan_mode     as enum ('lump','installment'); exception when duplicate_object then null; end $$;
do $$ begin create type user_role     as enum ('member','treasurer','librarian','editor','admin'); exception when duplicate_object then null; end $$;

-- ---------- settings (একটি মাত্র সারি, অ্যাডমিন থেকে সব বদলানো যাবে) ----------
create table if not exists settings (
  id            int primary key default 1 check (id = 1),
  org_name      text not null default 'হিলফুল ফুজুল পাঠাগার ও যুব সংঘ',
  short_name    text default 'হিলফুল ফুজুল',
  tagline       text default 'পাঠাগার, করজে হাসানা ও সমাজসেবা',
  established   text default '২০১৮',
  address text, phone text, email text, whatsapp text, facebook text,
  logo_url text,
  reg_fee       numeric(10,2) not null default 200,
  due_day       int not null default 10 check (due_day between 1 and 28),
  freeze_months int not null default 3 check (freeze_months between 1 and 12),
  show_borrower_names boolean not null default true,
  theme         jsonb not null default '{"skin":"mango"}',
  home_sections jsonb not null default '[]',
  hero          jsonb not null default '{}',
  ticker        text[] not null default '{}',
  member_terms  text[] not null default '{}',
  loan_terms    text[] not null default '{}',
  pay_info text, quran_info text,
  updated_at    timestamptz not null default now()
);
insert into settings (id) values (1) on conflict do nothing;

-- ---------- sequences for human readable numbers ----------
create sequence if not exists member_no_seq start 101;
create sequence if not exists loan_no_seq start 1;
create sequence if not exists app_no_seq start 1001;
create or replace function next_member_no() returns text language sql as $$ select 'HF-' || nextval('member_no_seq') $$;
create or replace function next_slip_no()   returns text language sql as $$ select 'QH-' || extract(year from current_date)::int || '-' || lpad(nextval('loan_no_seq')::text, 3, '0') $$;

-- ---------- members ----------
create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  member_no   text unique not null default next_member_no(),
  name        text not null,
  father_name text, phone text unique not null, nid text, dob date,
  address text, occupation text, nominee text,
  photo_url text, signature_url text,
  monthly_amount numeric(10,2) not null check (monthly_amount > 0),
  join_date   date not null default current_date,
  status      member_status not null default 'active',
  reset_from  date,              -- আনফ্রিজ বা পুনঃসক্রিয়ের পর বকেয়া গণনা এখান থেকে শুরু
  frozen_at   date,
  notes text,
  created_at  timestamptz default now()
);

create table if not exists profiles (   -- প্রতিটি লগইন অ্যাকাউন্টের ভূমিকা
  id        uuid primary key references auth.users on delete cascade,
  role      user_role not null default 'member',
  member_id uuid references members(id) on delete set null,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  app_no int not null default nextval('app_no_seq'),
  name text not null, father_name text, phone text not null, nid text, dob date,
  address text, occupation text, nominee text, monthly_amount numeric(10,2),
  photo_url text, signature_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  member_id uuid references members(id),
  created_at timestamptz default now()
);

-- ---------- money ----------
create table if not exists payments (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references members(id) on delete restrict,
  type       payment_type not null,
  for_month  date,                 -- যে মাসের চাঁদা (মাসের ১ তারিখ), শুধু monthly
  amount     numeric(10,2) not null check (amount > 0),
  paid_on    date not null default current_date,
  method     text,
  receipt_no text unique not null default ('R-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  note text,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  constraint one_payment_per_month unique (member_id, type, for_month),
  constraint monthly_has_month check (type <> 'monthly' or for_month is not null)
);
create index if not exists payments_paid_on on payments (paid_on);

create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  anonymous boolean not null default false,
  phone text,
  amount numeric(10,2) not null check (amount > 0),
  purpose text default 'সাধারণ তহবিল', method text,
  donated_on date not null default current_date,
  receipt_no text unique not null default ('D-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  created_by uuid references auth.users,
  created_at timestamptz default now()
);
create index if not exists donations_on on donations (donated_on);

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  slip_no text unique not null default next_slip_no(),
  member_id uuid not null references members(id) on delete restrict,
  amount numeric(10,2) not null check (amount > 0),
  term_months int not null check (term_months in (3,6,12)),
  mode loan_mode not null default 'lump',
  issued_on date not null default current_date,
  due_on date not null,
  guarantor_name text not null, guarantor_phone text, purpose text,
  borrower_signature_url text,
  created_by uuid references auth.users,
  created_at timestamptz default now()
);
create table if not exists loan_repayments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  paid_on date not null default current_date,
  receipt_no text unique not null default ('L-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

-- ঋণের নিয়ম: শুধু সক্রিয় সদস্য, একসাথে একটির বেশি চলমান ঋণ নয়, শেষ তারিখ নিজে হিসাব
create or replace function before_loan_insert() returns trigger language plpgsql as $$
begin
  if (select status from members where id = new.member_id) is distinct from 'active' then
    raise exception 'শুধু সক্রিয় সদস্য ঋণ পাবেন';
  end if;
  if exists (
    select 1 from loans l
    where l.member_id = new.member_id
      and l.amount > coalesce((select sum(r.amount) from loan_repayments r where r.loan_id = l.id), 0)
  ) then
    raise exception 'এই সদস্যের একটি ঋণ এখনো চলমান';
  end if;
  new.due_on := (new.issued_on + make_interval(months => new.term_months))::date;
  return new;
end $$;
drop trigger if exists trg_before_loan on loans;
create trigger trg_before_loan before insert on loans for each row execute function before_loan_insert();

-- ফেরত যেন ঋণের চেয়ে বেশি না হয়
create or replace function before_repayment_insert() returns trigger language plpgsql as $$
declare bal numeric;
begin
  select l.amount - coalesce(sum(r.amount),0) into bal
  from loans l left join loan_repayments r on r.loan_id = l.id
  where l.id = new.loan_id group by l.amount;
  if new.amount > bal then raise exception 'ফেরতের পরিমাণ বাকি টাকার (%) চেয়ে বেশি', bal; end if;
  return new;
end $$;
drop trigger if exists trg_before_repay on loan_repayments;
create trigger trg_before_repay before insert on loan_repayments for each row execute function before_repayment_insert();

-- ---------- library ----------
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null, author text, category text,
  copies int not null default 1 check (copies > 0),
  shelf text, cover_url text,
  added_on date not null default current_date
);
create table if not exists book_lendings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  borrower_name text not null, borrower_phone text,
  out_on date not null default current_date,
  expected_on date, returned_on date,
  created_at timestamptz default now()
);

-- ---------- website content ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null, topic text,
  event_date date not null, event_time text, venue text,
  chief_guest text, special_guest text, presided_by text, outcome text,
  show_popup boolean not null default false,
  show_in_hero boolean not null default false,
  design jsonb not null default '{}',     -- ব্যানার ডিজাইনার: রং, গ্রেডিয়েন্ট, ফন্ট, ছবি, আইকন
  created_at timestamptz default now()
);
create table if not exists programs (id uuid primary key default gen_random_uuid(), icon text, title text not null, description text, beneficiaries int not null default 0, sort int not null default 0);
create table if not exists committee (id uuid primary key default gen_random_uuid(), name text not null, role text not null, duty text, phone text, photo_url text, sort int not null default 0);
create table if not exists posts (id uuid primary key default gen_random_uuid(), title text not null, slug text unique, body text, image_url text, published_on date not null default current_date, is_published boolean not null default true, seo jsonb not null default '{}');
create table if not exists pages (id uuid primary key default gen_random_uuid(), title text not null, slug text unique not null, in_menu boolean not null default true, blocks jsonb not null default '[]', seo jsonb not null default '{}', updated_at timestamptz default now());
create table if not exists contact_messages (id uuid primary key default gen_random_uuid(), name text not null, phone text, subject text, message text not null, is_read boolean not null default false, created_at timestamptz default now());
create table if not exists chat_logs (id uuid primary key default gen_random_uuid(), member_id uuid references members(id) on delete set null, who text, question text, answer text, created_at timestamptz default now());
create table if not exists activity_log (id bigserial primary key, actor uuid, action text not null, created_at timestamptz default now());

-- ---------- role helpers (security definer: RLS এর লুপ এড়াতে) ----------
create or replace function my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;
create or replace function my_member() returns uuid
language sql stable security definer set search_path = public as $$
  select member_id from profiles where id = auth.uid()
$$;
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()) in ('admin','treasurer','librarian','editor'), false)
$$;

-- নতুন লগইন অ্যাকাউন্ট তৈরি হলে profile নিজে থেকে তৈরি (role ও member_id app_metadata থেকে)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, member_id, full_name)
  values (
    new.id,
    coalesce(nullif(new.raw_app_meta_data->>'role','')::user_role, 'member'),
    nullif(new.raw_app_meta_data->>'member_id','')::uuid,
    new.raw_user_meta_data->>'full_name'
  ) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ---------- automatic freeze ----------
create or replace function run_auto_freeze() returns int
language plpgsql security definer set search_path = public as $$
declare r record; s record; streak int; mon date; lower_bound date; n int := 0;
begin
  select * into s from settings where id = 1;
  for r in select * from members where status = 'active' loop
    streak := 0;
    mon := date_trunc('month', current_date)::date;
    if extract(day from current_date) <= s.due_day then mon := (mon - interval '1 month')::date; end if;
    lower_bound := greatest(date_trunc('month', r.join_date)::date, coalesce(date_trunc('month', r.reset_from)::date, '1900-01-01'::date));
    while mon >= lower_bound loop
      exit when exists (select 1 from payments where member_id = r.id and type = 'monthly' and for_month = mon);
      streak := streak + 1;
      mon := (mon - interval '1 month')::date;
    end loop;
    if streak >= s.freeze_months then
      update members set status = 'frozen', frozen_at = current_date where id = r.id;
      insert into activity_log(action) values (r.name || ' এর সদস্যপদ স্বয়ংক্রিয়ভাবে স্থগিত (' || streak || ' মাস বকেয়া)');
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

-- ভুল সংশোধন: ফি ছাড়া আনফ্রিজ (শুধু অ্যাডমিন/কোষাধ্যক্ষ)
create or replace function unfreeze_member(p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() not in ('admin','treasurer') then raise exception 'অনুমতি নেই'; end if;
  update members set status = 'active', reset_from = date_trunc('month', current_date), frozen_at = null where id = p_member;
  insert into activity_log(actor, action) select auth.uid(), name || ' আনফ্রিজ করা হয়েছে' from members where id = p_member;
end $$;

-- নিয়ম মেনে পুনঃসক্রিয়: ফি জমা + সক্রিয়
create or replace function reactivate_member(p_member uuid, p_method text default 'নগদ') returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() not in ('admin','treasurer') then raise exception 'অনুমতি নেই'; end if;
  insert into payments (member_id, type, amount, method, created_by)
  values (p_member, 'reactivation', (select reg_fee from settings where id = 1), p_method, auth.uid());
  update members set status = 'active', reset_from = date_trunc('month', current_date), frozen_at = null where id = p_member;
end $$;

revoke execute on function run_auto_freeze() from public, anon, authenticated;
grant execute on function run_auto_freeze() to service_role;
revoke execute on function unfreeze_member(uuid) from public, anon;
revoke execute on function reactivate_member(uuid, text) from public, anon;

-- প্রতিদিন রাত ১টায় (বাংলাদেশ সময় সকাল ৭টা) স্বয়ংক্রিয় ফ্রিজ
do $$ begin
  perform cron.unschedule('auto-freeze-daily');
exception when others then null; end $$;
select cron.schedule('auto-freeze-daily', '0 1 * * *', $$select public.run_auto_freeze()$$);

-- ---------- views ----------
-- সদস্যভিত্তিক বকেয়া (যে দেখছে তার RLS প্রযোজ্য)
create or replace view v_member_dues with (security_invoker = true) as
with s as (select due_day from settings where id = 1),
months as (
  select m.id member_id, gs::date mon
  from members m,
  generate_series(date_trunc('month', m.join_date), date_trunc('month', current_date), interval '1 month') gs
)
select m.id, m.member_no, m.name, m.phone, m.status, m.monthly_amount, m.join_date,
  count(*) filter (where p.id is null and (mo.mon < date_trunc('month', current_date) or extract(day from current_date) > (select due_day from s)))::int as overdue_months,
  (select coalesce(sum(x.amount),0) from payments x where x.member_id = m.id) as total_paid
from members m
join months mo on mo.member_id = m.id
left join payments p on p.member_id = m.id and p.type = 'monthly' and p.for_month = mo.mon
group by m.id;

-- পাবলিক (ওয়েবসাইটে দেখানোর জন্য, ব্যক্তিগত তথ্য ছাড়া)
create or replace view v_public_stats as
select
  (select coalesce(sum(amount),0) from payments) + (select coalesce(sum(amount),0) from donations) as total_fund,
  (select coalesce(sum(amount),0) from payments) as total_contributions,
  (select coalesce(sum(amount),0) from donations) as total_donations,
  (select coalesce(sum(amount),0) from loans) as total_loaned,
  (select coalesce(sum(amount),0) from loan_repayments) as total_repaid,
  (select coalesce(sum(amount),0) from payments  where date_trunc('month',paid_on)    = date_trunc('month',current_date))
 +(select coalesce(sum(amount),0) from donations where date_trunc('month',donated_on) = date_trunc('month',current_date)) as month_collected,
  (select coalesce(sum(amount),0) from loans where date_trunc('month',issued_on) = date_trunc('month',current_date)) as month_loaned,
  (select count(*) from members)::int as members,
  (select count(*) from members where status = 'active')::int as active_members,
  (select count(distinct member_id) from loans)::int as borrowers,
  (select coalesce(sum(beneficiaries),0) from programs)::int as program_beneficiaries,
  (select coalesce(sum(copies),0) from books)::int as books,
  (select count(*) from books)::int as book_titles;

create or replace view v_monthly_summary as
select d::date as month,
  (select coalesce(sum(amount),0) from payments  where date_trunc('month',paid_on)    = d)
 +(select coalesce(sum(amount),0) from donations where date_trunc('month',donated_on) = d) as collected,
  (select coalesce(sum(amount),0) from loans           where date_trunc('month',issued_on) = d) as loaned,
  (select coalesce(sum(amount),0) from loan_repayments where date_trunc('month',paid_on)   = d) as repaid,
  (select count(*) from members where date_trunc('month', join_date) <= d)::int as members
from generate_series(date_trunc('month', current_date) - interval '11 months', date_trunc('month', current_date), interval '1 month') d;

create or replace view v_public_loans as
select l.id,
  case when s.show_borrower_names then m.name else regexp_replace(m.name, '\s+\S+$', ' ***') end as borrower,
  l.amount, l.term_months, l.issued_on, l.due_on,
  case when l.amount <= coalesce(r.repaid,0) then 'paid'
       when current_date > l.due_on then 'overdue' else 'running' end as status
from loans l
join members m on m.id = l.member_id
cross join settings s
left join (select loan_id, sum(amount) repaid from loan_repayments group by loan_id) r on r.loan_id = l.id;

create or replace view v_public_donations as
select id, case when anonymous then 'নাম প্রকাশে অনিচ্ছুক' else donor_name end as donor,
  amount, purpose, donated_on
from donations;

revoke all on v_member_dues from anon;
grant select on v_public_stats, v_monthly_summary, v_public_loans, v_public_donations to anon, authenticated;

-- ---------- row level security ----------
do $$ declare t text; begin
  foreach t in array array['settings','members','profiles','applications','payments','donations','loans','loan_repayments','books','book_lendings','events','programs','committee','posts','pages','contact_messages','chat_logs','activity_log'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
  -- কমিটি (staff) সব টেবিলে পড়া-লেখা করতে পারবে, profiles ছাড়া
  foreach t in array array['settings','members','applications','payments','donations','loans','loan_repayments','books','book_lendings','events','programs','committee','posts','pages','contact_messages','chat_logs','activity_log'] loop
    execute format('drop policy if exists staff_all on %I', t);
    execute format('create policy staff_all on %I for all using (is_staff()) with check (is_staff())', t);
  end loop;
  -- ওয়েবসাইটের কনটেন্ট সবাই পড়তে পারবে
  foreach t in array array['settings','books','events','programs','committee','pages'] loop
    execute format('drop policy if exists public_read on %I', t);
    execute format('create policy public_read on %I for select using (true)', t);
  end loop;
  -- যে কেউ আবেদন, বার্তা ও চ্যাট পাঠাতে পারবে
  foreach t in array array['applications','contact_messages','chat_logs'] loop
    execute format('drop policy if exists public_insert on %I', t);
    execute format('create policy public_insert on %I for insert with check (true)', t);
  end loop;
end $$;

drop policy if exists public_read on posts;
create policy public_read on posts for select using (is_published);

-- সদস্য শুধু নিজের তথ্য দেখবে
drop policy if exists own_member on members;
create policy own_member on members for select using (id = my_member());
drop policy if exists own_payments on payments;
create policy own_payments on payments for select using (member_id = my_member());
drop policy if exists own_loans on loans;
create policy own_loans on loans for select using (member_id = my_member());
drop policy if exists own_repayments on loan_repayments;
create policy own_repayments on loan_repayments for select using (loan_id in (select id from loans where member_id = my_member()));

-- profiles: নিজেরটা দেখা; ভূমিকা বদলাতে পারবেন শুধু অ্যাডমিন
drop policy if exists own_profile on profiles;
create policy own_profile on profiles for select using (id = auth.uid() or is_staff());
drop policy if exists admin_profiles on profiles;
create policy admin_profiles on profiles for all using (my_role() = 'admin') with check (my_role() = 'admin');

-- ---------- storage (ছবি ও ডকুমেন্ট) ----------
insert into storage.buckets (id, name, public) values ('media','media', true), ('documents','documents', false)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media staff write" on storage.objects;
create policy "media staff write" on storage.objects for insert with check (bucket_id = 'media' and public.is_staff());
drop policy if exists "media staff modify" on storage.objects;
create policy "media staff modify" on storage.objects for update using (bucket_id = 'media' and public.is_staff());
drop policy if exists "media staff delete" on storage.objects;
create policy "media staff delete" on storage.objects for delete using (bucket_id = 'media' and public.is_staff());
drop policy if exists "documents staff" on storage.objects;
create policy "documents staff" on storage.objects for all using (bucket_id = 'documents' and public.is_staff()) with check (bucket_id = 'documents' and public.is_staff());
