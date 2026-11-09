import type { Role } from './types';

export type Field = { k: string; l: string; type?: 'text' | 'textarea' | 'number' | 'date' | 'image' | 'checkbox'; req?: boolean };
export type Kind = { title: string; sub: string; table: string; order: string; asc: boolean; fields: Field[]; list: string[]; folder: string };

export const CONTENT_ROLES: Role[] = ['admin', 'editor'];

export const KINDS: Record<string, Kind> = {
  programs: {
    title: 'সেবা ও কার্যক্রম', sub: 'হোমপেজ ও সেবা পাতায় দেখাবে', table: 'programs', order: 'sort', asc: true, folder: 'programs', list: ['icon', 'title', 'beneficiaries'],
    fields: [{ k: 'icon', l: 'আইকন (একটি ইমোজি, যেমন 🩸)' }, { k: 'title', l: 'শিরোনাম', req: true }, { k: 'description', l: 'বিবরণ', type: 'textarea' }, { k: 'beneficiaries', l: 'এখন পর্যন্ত উপকৃত মানুষ', type: 'number' }, { k: 'sort', l: 'ক্রম (ছোট সংখ্যা আগে)', type: 'number' }],
  },
  committee: {
    title: 'কমিটি ও টিম', sub: 'কমিটি পাতা ও হোমপেজে দেখাবে', table: 'committee', order: 'sort', asc: true, folder: 'committee', list: ['name', 'role', 'phone'],
    fields: [{ k: 'name', l: 'নাম', req: true }, { k: 'role', l: 'পদ (যেমন: সভাপতি, সাধারণ সম্পাদক, কোষাধ্যক্ষ)', req: true }, { k: 'duty', l: 'দায়িত্ব (কোন কাজ দেখেন)', type: 'textarea' }, { k: 'bio', l: 'সংক্ষিপ্ত পরিচিতি (ওয়েবসাইটে দেখাবে)', type: 'textarea' }, { k: 'phone', l: 'মোবাইল (ওয়েবসাইটে দেখাবে না)' }, { k: 'email', l: 'ইমেইল (ওয়েবসাইটে দেখাবে না)' }, { k: 'facebook', l: 'ফেসবুক প্রোফাইলের লিংক (ঐচ্ছিক)' }, { k: 'is_founder', l: 'প্রতিষ্ঠাতা / প্রধান উদ্যোক্তা (ওয়েবসাইটে আলাদা করে দেখাবে)', type: 'checkbox' }, { k: 'photo_url', l: 'ছবি', type: 'image' }, { k: 'sort', l: 'ক্রম (ছোট সংখ্যা আগে দেখাবে)', type: 'number' }],
  },
  posts: {
    title: 'সংবাদ ও পোস্ট', sub: 'সংবাদ পাতা ও হোমপেজে দেখাবে', table: 'posts', order: 'published_on', asc: false, folder: 'posts', list: ['title', 'published_on', 'is_published'],
    fields: [{ k: 'title', l: 'শিরোনাম', req: true }, { k: 'published_on', l: 'তারিখ', type: 'date' }, { k: 'body', l: 'লেখা (প্রতিটি অনুচ্ছেদ আলাদা লাইনে)', type: 'textarea' }, { k: 'image_url', l: 'ছবি', type: 'image' }, { k: 'is_published', l: 'প্রকাশিত', type: 'checkbox' }],
  },
};
