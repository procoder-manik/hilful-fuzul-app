import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * পূর্ণ ক্ষমতার ক্লায়েন্ট (service role)। শুধু সার্ভারে, শুধু সেই কাজে যা RLS দিয়ে করা যায় না:
 * যেমন সদস্যের লগইন অ্যাকাউন্ট তৈরি বা পিন রিসেট। কখনো ক্লায়েন্টে ইমপোর্ট করবেন না।
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
