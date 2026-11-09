import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** সার্ভার কম্পোনেন্ট, সার্ভার অ্যাকশন ও রুট হ্যান্ডলারে ব্যবহারের জন্য (লগইন করা ব্যবহারকারীর অনুমতিতে) */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // সার্ভার কম্পোনেন্ট থেকে কুকি লেখা যায় না; middleware সেশন রিফ্রেশ করে
          }
        },
      },
    },
  );
}
