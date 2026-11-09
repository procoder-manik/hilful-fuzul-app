'use client';
import { createBrowserClient } from '@supabase/ssr';

/** ব্রাউজারে (ক্লায়েন্ট কম্পোনেন্টে) ব্যবহারের জন্য */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
