-- =============================================================
-- ধাপ ৬: মেনু বিল্ডার (ড্রপডাউন ও মেগা মেনু), হেডার ও ফুটার ডিজাইনার
-- Supabase > SQL Editor এ পেস্ট করে Run চাপুন (ধাপ ১-৫ এর পরে)
-- =============================================================

create table if not exists menu_items (
  id         uuid primary key default gen_random_uuid(),
  location   text not null check (location in ('header', 'footer-1', 'footer-2', 'footer-3', 'footer-bottom')),
  parent_id  uuid references menu_items(id) on delete cascade,   -- ড্রপডাউন বা মেগা মেনুর ভেতরের আইটেম
  label      text not null,
  label_en   text,
  url        text not null default '#',
  new_tab    boolean not null default false,
  icon       text,
  descr      text,
  descr_en   text,
  sort       int not null default 0,
  visible    boolean not null default true,
  is_mega    boolean not null default false,
  mega       jsonb not null default '{}',                         -- মেগা মেনুর ডানদিকের ব্লক (নতুন বই, অনুষ্ঠান, সংবাদ, নিজের কার্ড)
  created_at timestamptz default now()
);
create index if not exists menu_items_loc on menu_items (location, sort);
alter table menu_items enable row level security;
drop policy if exists public_read on menu_items;
create policy public_read on menu_items for select using (visible);
drop policy if exists staff_all on menu_items;
create policy staff_all on menu_items for all using (is_staff()) with check (is_staff());

alter table settings add column if not exists header_cfg jsonb not null default '{}';
alter table settings add column if not exists footer_cfg jsonb not null default '{}';

-- শুরুর মেনু (শুধু মেনু পুরোপুরি খালি থাকলে)
do $$
declare lib uuid;
begin
  if not exists (select 1 from menu_items) then
    insert into menu_items (location, label, label_en, url, sort) values
      ('header', 'হোম', 'Home', '/', 1), ('header', 'আমাদের কথা', 'About', '/about', 2),
      ('header', 'সেবা', 'Services', '/services', 3), ('header', 'স্বচ্ছতা', 'Transparency', '/transparency', 4);
    insert into menu_items (location, label, label_en, url, sort, is_mega, mega)
      values ('header', 'পাঠাগার', 'Library', '/library', 5, true,
        '{"blocks":[{"type":"books","title":"নতুন বই","title_en":"New books","count":4}]}'::jsonb)
      returning id into lib;
    insert into menu_items (location, parent_id, label, label_en, url, sort, icon, descr, descr_en) values
      ('header', lib, 'সব বই', 'All books', '/library', 1, '📚', 'ইসলামিক ও জীবনমুখী বইয়ের তালিকা', 'Islamic and life-skills books'),
      ('header', lib, 'নতুন বই', 'New arrivals', '/library?cat=new', 2, '✨', 'সম্প্রতি যুক্ত হওয়া বই', 'Recently added books');
    insert into menu_items (location, label, label_en, url, sort) values
      ('header', 'অনুষ্ঠান', 'Events', '/events', 6), ('header', 'কমিটি', 'Committee', '/committee', 7),
      ('header', 'সংবাদ', 'News', '/news', 8), ('header', 'যোগাযোগ', 'Contact', '/contact', 9),
      ('footer-1', 'আমাদের কথা', 'About us', '/about', 1), ('footer-1', 'কার্যনির্বাহী কমিটি', 'Executive committee', '/committee', 2),
      ('footer-1', 'সংবাদ', 'News', '/news', 3), ('footer-1', 'অনুষ্ঠান', 'Events', '/events', 4),
      ('footer-2', 'সদস্য হোন', 'Join us', '/join', 1), ('footer-2', 'আয়-ব্যয়ের হিসাব', 'Accounts', '/transparency', 2),
      ('footer-2', 'পাঠাগার', 'Library', '/library', 3), ('footer-2', 'সহায়তা ও প্রশ্নোত্তর', 'Help and FAQ', '/support', 4),
      ('footer-2', 'শর্তাবলী', 'Terms', '/terms', 5), ('footer-2', 'গোপনীয়তা নীতি', 'Privacy policy', '/privacy', 6);
  end if;
end $$;
