import type { Metadata } from 'next';
import { PageTitle } from '@/components/cards';
import { getSiteSettings } from '@/lib/settings';
import { getT } from '@/lib/lang';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT();
  return { title: t('গোপনীয়তা নীতি', 'Privacy policy'), description: t('সদস্যদের ব্যক্তিগত তথ্য কীভাবে সংরক্ষণ ও ব্যবহার করা হয়।', 'How members’ personal information is stored and used.'), alternates: { canonical: '/privacy' } };
}

export default async function Privacy() {
  const t = getT();
  const s = await getSiteSettings();
  return (
    <>
      <PageTitle title={t('গোপনীয়তা নীতি', 'Privacy policy')} />
      <section style={{ padding: '20px 0 60px' }}><div className="wrap card prose" style={{ maxWidth: 820 }}>
        <h2>{t('কোন তথ্য রাখা হয়', 'What we store')}</h2>
        <p>{t('নিবন্ধন ও সদস্যপদের জন্য নাম, পিতা-মাতার নাম, মোবাইল নম্বর, ইমেইল, ঠিকানা, জাতীয় পরিচয়পত্র নম্বর, ছবি ও স্বাক্ষর এবং চাঁদা ও ঋণের হিসাব। পাসওয়ার্ড কখনো সরাসরি সংরক্ষিত হয় না, এনক্রিপ্ট করা অবস্থায় থাকে।', 'For registration and membership: name, parents’ names, mobile number, email, address, national ID number, photo and signature, plus contribution and loan records. Passwords are never stored in plain text; they are kept encrypted.')}</p>
        <h2>{t('কে দেখতে পারেন', 'Who can see it')}</h2>
        <p>{t('সদস্য শুধু নিজের হিসাব দেখতে পারেন। কমিটির দায়িত্বপ্রাপ্ত সদস্যরা দাপ্তরিক কাজে প্রয়োজনীয় অংশ দেখতে পারেন। কোনো তথ্য বিক্রি করা হয় না।', 'A member can only see their own records. Committee members can see only what they need for their duties. No information is sold.')}</p>
        <h2>{t('ওয়েবসাইটে যা প্রকাশ হয়', 'What is shown publicly')}</h2>
        <p>{t('স্বচ্ছতার জন্য ঋণগ্রহীতার নাম, পরিমাণ ও তারিখ এবং দাতার নাম ও পরিমাণ প্রকাশ করা হয়। মোবাইল নম্বর, ঠিকানা বা জামিনদারের তথ্য কখনো প্রকাশ হয় না। কেউ নাম প্রকাশ করতে না চাইলে কমিটিকে জানালে নাম গোপন রাখা হবে।', 'For transparency we publish borrowers’ names, amounts and dates, and donors’ names and amounts. Mobile numbers, addresses and guarantor details are never published. If you do not want your name shown, tell the committee and it will be hidden.')}</p>
        <h2>{t('বিজ্ঞপ্তি', 'Notifications')}</h2>
        <p>{t('চাঁদা জমা, বকেয়া ও সদস্যপদ স্থগিতের সতর্কতা আপনার প্রোফাইলে এবং আপনি ইমেইল বা মোবাইল দিলে সেখানে পাঠানো হয়। SMS পাঠাতে মোবাইল নম্বর একটি SMS সেবাদাতার কাছে যায়।', 'Payment confirmations, overdue notices and suspension warnings are shown in your profile and, if you gave an email or mobile number, sent there. To send SMS, your mobile number is passed to an SMS provider.')}</p>
        <h2>{t('চ্যাট সহকারী', 'Chat assistant')}</h2>
        <p>{t('চ্যাট সহকারী একটি এআই সেবা ব্যবহার করে। লগইন করে নিজের হিসাব জিজ্ঞেস করলে আপনার নাম ও হিসাবের তথ্য উত্তর তৈরির জন্য সেই এআই সেবায় পাঠানো হয়। হিসাব জানতে না চাইলে চ্যাটে ব্যক্তিগত তথ্য লিখবেন না।', 'The chat assistant uses an AI service. If you are logged in and ask about your own account, your name and account details are sent to that AI service to prepare the answer. Do not type personal information into the chat if you do not need to.')}</p>
        <h2>{t('যোগাযোগ', 'Contact')}</h2>
        <p>{t('তথ্য সংশোধন বা মুছে ফেলার অনুরোধ করতে', 'To ask for your data to be corrected or deleted, contact')} {s.email ?? s.phone ?? t('কমিটির', 'the committee')}{t(' এ যোগাযোগ করুন।', '.')}</p>
      </div></section>
    </>
  );
}
