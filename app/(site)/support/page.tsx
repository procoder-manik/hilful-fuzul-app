import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { BuiltinPage } from '@/components/blocks/BuiltinPage';
import { getSiteSettings } from '@/lib/settings';
import { faqSchema, graph } from '@/lib/schema';
import { getT } from '@/lib/lang';
import { bn, tk } from '@/lib/fmt';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('সহায়তা ও প্রশ্নোত্তর', 'Help and FAQ'), description: t('সদস্যপদ, মাসিক চাঁদা, বিনা সুদে ঋণ, সদস্যপদ স্থগিত ও পাঠাগার নিয়ে সাধারণ প্রশ্নের উত্তর।', 'Answers to common questions about membership, monthly contributions, interest-free loans, suspension and the library.'), alternates: { canonical: '/support' } };
}

export default async function Support() {
  const t = getT();
  const s = await getSiteSettings();
  const faq: [string, string][] = [
    [t('কীভাবে সদস্য হব?', 'How do I become a member?'), t(`ওয়েবসাইটে নিবন্ধন করুন (নাম, মোবাইল ও পাসওয়ার্ড দিয়ে অ্যাকাউন্ট তৈরি হবে), তারপর প্রোফাইলে দেওয়া নিয়মে এককালীন ${tk(s.reg_fee)} ভর্তি ফি জমা দিন। কমিটি যাচাই করলে আপনি যাচাইকৃত সদস্য হবেন।`, `Register on the website (an account is created with your name, mobile and password), then pay the one-time ${tk(s.reg_fee)} joining fee as shown in your profile. Once the committee verifies it you become a verified member.`)],
    [t('কীভাবে লগইন করব?', 'How do I log in?'), t('নিবন্ধনের সময় দেওয়া মোবাইল নম্বর অথবা ইমেইল এবং আপনার পাসওয়ার্ড দিয়ে লগইন করুন।', 'Log in with the mobile number or email you registered with, and your password.')],
    [t('কারা ঋণ নিতে পারবেন?', 'Who can take a loan?'), t('শুধু সক্রিয় ও যাচাইকৃত সদস্যরা। একজন জামিনদার লাগবে এবং একসাথে একটির বেশি ঋণ চলমান রাখা যাবে না।', 'Only active, verified members. One guarantor is required and you cannot have more than one running loan at a time.')],
    [t('ঋণে কি কোনো সুদ বা সার্ভিস চার্জ আছে?', 'Is there any interest or service charge on loans?'), t('না। এটি সম্পূর্ণ করজে হাসানা। যত টাকা নেবেন তত টাকাই ফেরত দেবেন।', 'No. It is a pure interest-free loan (Qard al-Hasan). You repay exactly what you borrowed.')],
    [t('ঋণের মেয়াদ কত দিন?', 'How long is the loan term?'), t('৩ মাস, ৬ মাস বা ১ বছর। মেয়াদ শেষে একবারে বা মাসিক কিস্তিতে ফেরত দেওয়া যায়।', '3 months, 6 months or 1 year. You can repay in one go or in monthly instalments.')],
    [t('মাসিক চাঁদা কবে দিতে হবে?', 'When is the monthly contribution due?'), t(`প্রতি মাসের ${bn(s.due_day)} তারিখের মধ্যে।`, `By the ${bn(s.due_day)}th of every month.`)],
    [t('টাকা পাঠালে কি জানতে পারব?', 'Will I be notified when I pay?'), t('হ্যাঁ। প্রতিটি জমা, বকেয়া এবং স্থগিতের আগের সতর্কতা আপনার প্রোফাইলে দেখা যাবে। ইমেইল দিলে ইমেইলে, মোবাইল দিলে SMS এও জানানো হয়।', 'Yes. Every payment, overdue amount and pre-suspension warning appears in your profile, and is also sent by email or SMS if you provided them.')],
    [t('সদস্যপদ স্থগিত হলে কী করব?', 'What if my membership is suspended?'), t(`টানা ${bn(s.freeze_months)} মাস চাঁদা বকেয়া থাকলে সদস্যপদ স্বয়ংক্রিয়ভাবে স্থগিত হয়। স্থগিত হওয়ার ৭ ও ৩ দিন আগে সতর্কবার্তা পাবেন। পুনরায় ${tk(s.reg_fee)} দিয়ে সক্রিয় করা যায়। টাকা দিয়েছেন কিন্তু হিসাবে ওঠেনি, এমন হলে কোষাধ্যক্ষকে জানান।`, `If contributions are overdue for ${bn(s.freeze_months)} consecutive months, membership is suspended automatically. You get warnings 7 and 3 days before. You can reactivate by paying ${tk(s.reg_fee)} again. If you paid but it was not recorded, tell the treasurer.`)],
    [t('আমার জমার হিসাব কীভাবে দেখব?', 'How can I see my payment record?'), t('লগইন করে "আমার অ্যাকাউন্ট" পাতায় মাসভিত্তিক জমা, বকেয়া, পরবর্তী শেষ তারিখ ও ঋণের অবস্থা দেখতে পারবেন।', 'Log in and open "My account" to see monthly payments, dues, the next due date and your loan status.')],
    [t('পাসওয়ার্ড ভুলে গেলে কী করব?', 'What if I forget my password?'), t('কোষাধ্যক্ষের সাথে যোগাযোগ করুন। তিনি নতুন পাসওয়ার্ড সেট করে দেবেন।', 'Contact the treasurer. They will set a new password for you.')],
    [t('পাঠাগার থেকে বই বাড়িতে নেওয়া যায়?', 'Can I take library books home?'), t('সাধারণত পাঠাগারে বসে পড়তে হয়। বিশেষ প্রয়োজনে পাঠাগার সম্পাদকের অনুমতিতে নির্দিষ্ট সময়ের জন্য নেওয়া যায়।', 'Books are normally read at the library. In special cases they can be borrowed for a fixed time with the librarian’s permission.')],
    [t('কীভাবে দান করব?', 'How can I donate?'), s.pay_info ?? t('অফিসে কোষাধ্যক্ষের কাছে নগদ দিতে পারেন।', 'You can give cash to the treasurer at the office.')],
  ];
  return (
    <>
      <JsonLd data={graph(s, [faqSchema(faq)], [[t('সহায়তা', 'Help'), '/support']])} />
      <BuiltinPage slug="support" title={t('সহায়তা ও প্রশ্নোত্তর', 'Help and FAQ')}>
      <section style={{ padding: '20px 0 60px' }}><div className="wrap" style={{ maxWidth: 820 }}>
        {faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p className="muted" style={{ margin: '8px 0 0' }}>{a}</p></details>)}
        <p style={{ marginTop: 20 }}>{t('উত্তর না পেলে', 'If you cannot find an answer,')} <Link href="/contact">{t('যোগাযোগ করুন', 'contact us')}</Link>{t('।', '.')}</p>
      </div></section>
      </BuiltinPage>
    </>
  );
}
