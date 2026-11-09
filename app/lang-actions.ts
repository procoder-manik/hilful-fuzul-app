'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function setLang(lang: 'bn' | 'en') {
  cookies().set('lang', lang === 'en' ? 'en' : 'bn', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  revalidatePath('/', 'layout');
}
