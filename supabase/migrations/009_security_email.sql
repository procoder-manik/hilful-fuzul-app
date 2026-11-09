-- ধাপ ১৪: নিরাপত্তা ও ইমেইল-ভিত্তিক লগইন
-- 001 থেকে 008 আগে চালানো থাকতে হবে। বারবার চালালেও সমস্যা নেই।

-- অ্যাডমিন লগইনে দুই-ধাপ (OTP) চালু/বন্ধ: অ্যাডমিন > সেটিংস > নিরাপত্তা থেকে বদলানো যায় (ডিফল্ট চালু)
alter table settings add column if not exists admin_mfa boolean not null default true;

-- সংগঠনের ঠিকানা
update settings set address = 'রামচন্দ্রপুর (বাগান), কাহারোল, দিনাজপুর' where id = 1;

-- SMS খরচ বাঁচাতে বন্ধ রাখা হলো (বিজ্ঞপ্তি অ্যাপ ও ইমেইলে যাবে)। দরকার হলে সেটিংস থেকে আবার চালু করা যায়।
update settings set notify_sms = false where id = 1;
