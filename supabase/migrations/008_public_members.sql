-- ধাপ ৯: ওয়েবসাইটে "আমাদের সদস্য" পাতা (কার্ড ও পপআপ)
-- 001 থেকে 007 আগে চালানো থাকতে হবে। বারবার চালালেও সমস্যা নেই।

alter table members  add column if not exists public_hidden      boolean not null default false;  -- true হলে এই সদস্য পাবলিক পাতায় আসবেন না
alter table settings add column if not exists members_page_on    boolean not null default true;   -- সদস্য পাতা চালু/বন্ধ
alter table settings add column if not exists members_show_money boolean not null default true;   -- মাসিক চাঁদা, মোট জমা ও ঋণের অঙ্ক দেখানো হবে কিনা

-- পাবলিক ভিউ: ফোন, এনআইডি, ঠিকানা, ইমেইল কখনোই নেই
create or replace view v_public_members as
select m.id, m.member_no, m.name, m.photo_url, m.join_date, m.status, (m.verified_at is not null) as verified,
  ((extract(year from age(current_date, m.join_date)) * 12 + extract(month from age(current_date, m.join_date)))::int + 1) as months_since,
  case when s.members_show_money then m.monthly_amount end as monthly_amount,
  case when s.members_show_money then coalesce(p.total_paid, 0) end as total_paid,
  coalesce(p.paid_months, 0) as paid_months,
  coalesce(l.loan_count, 0) as loan_count,
  case when s.members_show_money then coalesce(l.loan_total, 0) end as loan_total,
  case when s.members_show_money then greatest(coalesce(l.loan_total, 0) - coalesce(l.repaid, 0), 0) end as loan_balance,
  coalesce(b.books, 0) as books_borrowed,
  s.members_show_money as money_visible
from members m
cross join settings s
left join (select member_id, sum(amount) total_paid, count(*) filter (where type = 'monthly') paid_months from payments group by member_id) p on p.member_id = m.id
left join (select ln.member_id, count(*) loan_count, sum(ln.amount) loan_total, sum(coalesce(r.repaid, 0)) repaid
           from loans ln left join (select loan_id, sum(amount) repaid from loan_repayments group by loan_id) r on r.loan_id = ln.id
           group by ln.member_id) l on l.member_id = m.id
left join (select member_id, count(*) books from book_lendings where member_id is not null group by member_id) b on b.member_id = m.id
where s.id = 1 and s.members_page_on and not m.public_hidden and m.status <> 'cancelled';

grant select on v_public_members to anon, authenticated;

-- হেডার ও ফুটারের মেনুতে "সদস্য" লিংক (আগে থেকে না থাকলে)
insert into menu_items (location, label, label_en, url, sort)
select 'header', 'সদস্য', 'Members', '/members', 7 where not exists (select 1 from menu_items where url = '/members' and location = 'header');
insert into menu_items (location, label, label_en, url, sort)
select 'footer-1', 'আমাদের সদস্য', 'Our members', '/members', 5 where not exists (select 1 from menu_items where url = '/members' and location = 'footer-1');
