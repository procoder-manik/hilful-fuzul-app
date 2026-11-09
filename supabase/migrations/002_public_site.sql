-- =============================================================
-- ধাপ ৩: পাবলিক ওয়েবসাইট
-- Supabase > SQL Editor এ পেস্ট করে Run চাপুন (ধাপ ১ এর পরে)
-- =============================================================

-- পাঠাগারের বই কতগুলো পাঠাগারে আছে (কে নিয়েছে তা প্রকাশ না করে)
create or replace view v_book_availability as
select b.id, b.title, b.author, b.category, b.copies, b.shelf, b.cover_url, b.added_on,
  (b.copies - coalesce(o.out_count, 0))::int as available
from books b
left join (select book_id, count(*) out_count from book_lendings where returned_on is null group by book_id) o on o.book_id = b.id;
grant select on v_book_availability to anon, authenticated;

-- ওয়েবসাইটের ফর্মে স্প্যাম ঠেকাতে লেখার দৈর্ঘ্যের সীমা
alter table contact_messages drop constraint if exists contact_len;
alter table contact_messages add constraint contact_len check (char_length(message) <= 3000 and char_length(name) <= 120);
alter table applications drop constraint if exists app_len;
alter table applications add constraint app_len check (char_length(name) <= 120 and char_length(coalesce(address,'')) <= 400);

-- সদস্য নিজের পোর্টাল থেকে বই ধারের ইতিহাস দেখতে পারবেন
drop policy if exists own_lendings on book_lendings;
create policy own_lendings on book_lendings for select using (member_id = my_member());

-- সংবাদের জন্য সূচি
create index if not exists posts_published on posts (published_on desc) where is_published;
create index if not exists events_date on events (event_date);
