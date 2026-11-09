import 'server-only';
import { createClient } from '@supabase/supabase-js';

/** কুকি ছাড়া পাবলিক ক্লায়েন্ট: শুধু ওয়েবসাইটে সবার জন্য উন্মুক্ত তথ্য পড়তে */
export function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
