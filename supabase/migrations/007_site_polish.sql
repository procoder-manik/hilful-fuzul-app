-- =============================================================
-- ধাপ ৮: যোগাযোগের বাড়তি তথ্য (দ্বিতীয় ফোন, ইউটিউব, ম্যাপ, অফিসের সময়)
-- Supabase > SQL Editor এ পেস্ট করে Run চাপুন (ধাপ ১-৭ এর পরে)
-- =============================================================
alter table settings add column if not exists phone2       text;
alter table settings add column if not exists youtube      text;
alter table settings add column if not exists map_url      text;
alter table settings add column if not exists office_hours text;
