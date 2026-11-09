import { BLOCK_MAP, type Block } from './blocks';
import { builtinBySlug } from './builtin';

const mk = (slug: string, i: number, type: string, props: Record<string, string>, style: Partial<Block> = {}): Block => ({
  id: `${slug}-${i}`, type, on: true, props: { ...(BLOCK_MAP[type]?.defaults ?? {}), ...props }, bg: 'none', pat: 'none', op: 0.1, ...style,
});
const header = (slug: string, extra: Record<string, string> = {}) => { const d = builtinBySlug(slug)!; return { title: d.title, title_en: d.title_en, text: d.text, text_en: d.text_en, crumbs: '1', align: 'left', ...extra }; };

const ABOUT_L = `## আমাদের লক্ষ্য
সমাজকে আরও সুন্দর করে গড়ে তোলা, যুবসমাজকে মাদকের ছোবল থেকে রক্ষা করা এবং দ্বীনের পথে ফিরিয়ে আনা।
## আমাদের উদ্দেশ্য
- সদস্যদের সঞ্চয় থেকে বিনা সুদে করজে হাসানা প্রদান
- পাঠাগারের মাধ্যমে ইসলামিক ও জীবনমুখী জ্ঞানের চর্চা
- ছোট থেকে বয়স্ক সবার জন্য বিনামূল্যে কুরআন শিক্ষা
- ফ্রি স্বাস্থ্যসেবা, শীতবস্ত্র বিতরণ ও মেধাবীদের শিক্ষাবৃত্তি
- খেলাধুলার মাধ্যমে তরুণদের সুস্থ বিনোদন নিশ্চিত করা`;
const ABOUT_L_EN = `## Our mission
To build a better society, protect our youth from the curse of drugs and bring them back to the path of faith.
## Our goals
- Giving interest-free loans (Qard al-Hasan) from members’ savings
- Promoting Islamic and practical knowledge through our library
- Free Quran classes for everyone, young and old
- Free health checks, winter clothes distribution and scholarships for bright students
- Healthy recreation for young people through sports`;
const ABOUT_R = `## নামের পেছনের গল্প
নবুওয়াতের আগে মক্কায় অন্যায়ের বিরুদ্ধে ও মজলুমের পক্ষে দাঁড়াতে যে শান্তিসংঘ গঠিত হয়েছিল, তার নাম ছিল হিলফুল ফুজুল। সেই চেতনা থেকেই আমাদের পথচলা।`;
const ABOUT_R_EN = `## The story behind our name
Before prophethood, a peace pact called Hilful Fuzul was formed in Makkah to stand against injustice and for the oppressed. Our journey began from that same spirit.`;

const PRIVACY = `## কোন তথ্য রাখা হয়
নিবন্ধন ও সদস্যপদের জন্য নাম, পিতা-মাতার নাম, মোবাইল নম্বর, ইমেইল, ঠিকানা, জাতীয় পরিচয়পত্র নম্বর, ছবি ও স্বাক্ষর এবং চাঁদা ও ঋণের হিসাব। পাসওয়ার্ড কখনো সরাসরি সংরক্ষিত হয় না, এনক্রিপ্ট করা অবস্থায় থাকে।
## কে দেখতে পারেন
সদস্য শুধু নিজের হিসাব দেখতে পারেন। কমিটির দায়িত্বপ্রাপ্ত সদস্যরা দাপ্তরিক কাজে প্রয়োজনীয় অংশ দেখতে পারেন। কোনো তথ্য বিক্রি করা হয় না।
## ওয়েবসাইটে যা প্রকাশ হয়
স্বচ্ছতার জন্য ঋণগ্রহীতার নাম, পরিমাণ ও তারিখ এবং দাতার নাম ও পরিমাণ প্রকাশ করা হয়। মোবাইল নম্বর, ঠিকানা বা জামিনদারের তথ্য কখনো প্রকাশ হয় না। কেউ নাম প্রকাশ করতে না চাইলে কমিটিকে জানালে নাম গোপন রাখা হবে।
## বিজ্ঞপ্তি
চাঁদা জমা, বকেয়া ও সদস্যপদ স্থগিতের সতর্কতা আপনার প্রোফাইলে এবং আপনি ইমেইল বা মোবাইল দিলে সেখানে পাঠানো হয়। SMS পাঠাতে মোবাইল নম্বর একটি SMS সেবাদাতার কাছে যায়।
## চ্যাট সহকারী
চ্যাট সহকারী একটি এআই সেবা ব্যবহার করে। লগইন করে নিজের হিসাব জিজ্ঞেস করলে আপনার নাম ও হিসাবের তথ্য উত্তর তৈরির জন্য সেই এআই সেবায় পাঠানো হয়। হিসাব জানতে না চাইলে চ্যাটে ব্যক্তিগত তথ্য লিখবেন না।
## যোগাযোগ
তথ্য সংশোধন বা মুছে ফেলার অনুরোধ করতে {email} {phone} এ যোগাযোগ করুন।`;
const PRIVACY_EN = `## What we store
For registration and membership: name, parents’ names, mobile number, email, address, national ID number, photo and signature, plus contribution and loan records. Passwords are never stored in plain text; they are kept encrypted.
## Who can see it
A member can only see their own records. Committee members can see only what they need for their duties. No information is sold.
## What is shown publicly
For transparency we publish borrowers’ names, amounts and dates, and donors’ names and amounts. Mobile numbers, addresses and guarantor details are never published. If you do not want your name shown, tell the committee and it will be hidden.
## Notifications
Payment confirmations, overdue notices and suspension warnings are shown in your profile and, if you gave an email or mobile number, sent there. To send SMS, your mobile number is passed to an SMS provider.
## Chat assistant
The chat assistant uses an AI service. If you are logged in and ask about your own account, your name and account details are sent to that AI service to prepare the answer. Do not type personal information into the chat if you do not need to.
## Contact
To ask for your data to be corrected or deleted, contact {email} {phone}.`;

const FAQ_BN = `কীভাবে সদস্য হব? | ওয়েবসাইটে নিবন্ধন করুন (নাম, মোবাইল ও পাসওয়ার্ড দিয়ে অ্যাকাউন্ট তৈরি হবে), তারপর প্রোফাইলে দেওয়া নিয়মে এককালীন {reg_fee} ভর্তি ফি জমা দিন। কমিটি যাচাই করলে আপনি যাচাইকৃত সদস্য হবেন।
কীভাবে লগইন করব? | নিবন্ধনের সময় দেওয়া মোবাইল নম্বর অথবা ইমেইল এবং আপনার পাসওয়ার্ড দিয়ে লগইন করুন।
কারা ঋণ নিতে পারবেন? | শুধু সক্রিয় ও যাচাইকৃত সদস্যরা। একজন জামিনদার লাগবে এবং একসাথে একটির বেশি ঋণ চলমান রাখা যাবে না।
ঋণে কি কোনো সুদ বা সার্ভিস চার্জ আছে? | না। এটি সম্পূর্ণ করজে হাসানা। যত টাকা নেবেন তত টাকাই ফেরত দেবেন।
ঋণের মেয়াদ কত দিন? | ৩ মাস, ৬ মাস বা ১ বছর। মেয়াদ শেষে একবারে বা মাসিক কিস্তিতে ফেরত দেওয়া যায়।
মাসিক চাঁদা কবে দিতে হবে? | প্রতি মাসের {due_day} তারিখের মধ্যে।
টাকা পাঠালে কি জানতে পারব? | হ্যাঁ। প্রতিটি জমা, বকেয়া এবং স্থগিতের আগের সতর্কতা আপনার প্রোফাইলে দেখা যাবে। ইমেইল দিলে ইমেইলে, মোবাইল দিলে SMS এও জানানো হয়।
সদস্যপদ স্থগিত হলে কী করব? | টানা {freeze_months} মাস চাঁদা বকেয়া থাকলে সদস্যপদ স্বয়ংক্রিয়ভাবে স্থগিত হয়। স্থগিত হওয়ার ৭ ও ৩ দিন আগে সতর্কবার্তা পাবেন। পুনরায় {reg_fee} দিয়ে সক্রিয় করা যায়। টাকা দিয়েছেন কিন্তু হিসাবে ওঠেনি, এমন হলে কোষাধ্যক্ষকে জানান।
আমার জমার হিসাব কীভাবে দেখব? | লগইন করে "আমার অ্যাকাউন্ট" পাতায় মাসভিত্তিক জমা, বকেয়া, পরবর্তী শেষ তারিখ ও ঋণের অবস্থা দেখতে পারবেন।
পাসওয়ার্ড ভুলে গেলে কী করব? | কোষাধ্যক্ষের সাথে যোগাযোগ করুন। তিনি নতুন পাসওয়ার্ড সেট করে দেবেন।
পাঠাগার থেকে বই বাড়িতে নেওয়া যায়? | সাধারণত পাঠাগারে বসে পড়তে হয়। বিশেষ প্রয়োজনে পাঠাগার সম্পাদকের অনুমতিতে নির্দিষ্ট সময়ের জন্য নেওয়া যায়।
কীভাবে দান করব? | {pay_info}`;
const FAQ_EN = `How do I become a member? | Register on the website (an account is created with your name, mobile and password), then pay the one-time {reg_fee} joining fee as shown in your profile. Once the committee verifies it you become a verified member.
How do I log in? | Log in with the mobile number or email you registered with, and your password.
Who can take a loan? | Only active, verified members. One guarantor is required and you cannot have more than one running loan at a time.
Is there any interest or service charge on loans? | No. It is a pure interest-free loan (Qard al-Hasan). You repay exactly what you borrowed.
How long is the loan term? | 3 months, 6 months or 1 year. You can repay in one go or in monthly instalments.
When is the monthly contribution due? | By the {due_day}th of every month.
Will I be notified when I pay? | Yes. Every payment, overdue amount and pre-suspension warning appears in your profile, and is also sent by email or SMS if you provided them.
What if my membership is suspended? | If contributions are overdue for {freeze_months} consecutive months, membership is suspended automatically. You get warnings 7 and 3 days before. You can reactivate by paying {reg_fee} again. If you paid but it was not recorded, tell the treasurer.
How can I see my payment record? | Log in and open "My account" to see monthly payments, dues, the next due date and your loan status.
What if I forget my password? | Contact the treasurer. They will set a new password for you.
Can I take library books home? | Books are normally read at the library. In special cases they can be borrowed for a fixed time with the librarian’s permission.
How can I donate? | {pay_info}`;

/** আগে থেকে তৈরি পেজের ডিফল্ট লেআউট (সম্পাদনাযোগ্য কম্পোনেন্ট)। null হলে পেজটির মূল কন্টেন্ট কোডে বাঁধা তথ্য থেকে আসে (page_body)। */
export function defaultBlocks(slug: string): Block[] | null {
  switch (slug) {
    case 'about': return [mk(slug, 0, 'page_header', header(slug, { text: '{org_name} একটি অরাজনৈতিক, স্বেচ্ছাসেবী সামাজিক সংগঠন।', text_en: '{org_name} is a non-political, voluntary social organisation.' })), mk(slug, 1, 'prose_cards', { left: ABOUT_L, left_en: ABOUT_L_EN, right: ABOUT_R, right_en: ABOUT_R_EN, kpis: '1' })];
    case 'services': return [mk(slug, 0, 'page_header', header(slug)), mk(slug, 1, 'service_grid', {}), mk(slug, 2, 'qard', {})];
    case 'contact': return [mk(slug, 0, 'page_header', header(slug)), mk(slug, 1, 'contact_us', {})];
    case 'support': return [mk(slug, 0, 'page_header', header(slug)), mk(slug, 1, 'faq', { heading: '', heading_en: '', items: FAQ_BN, items_en: FAQ_EN }), mk(slug, 2, 'buttons', { items: 'উত্তর না পেলে যোগাযোগ করুন | /contact | primary', align: 'center' })];
    case 'terms': return [mk(slug, 0, 'page_header', header(slug)), mk(slug, 1, 'two_lists', {})];
    case 'privacy': return [mk(slug, 0, 'page_header', header(slug)), mk(slug, 1, 'prose', { text: PRIVACY, text_en: PRIVACY_EN, width: 'narrow' })];
    default: return null;
  }
}
export const FAQ_DEFAULT = { bn: FAQ_BN, en: FAQ_EN };
