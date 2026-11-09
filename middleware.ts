import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { adminAal, mfaRequired, otpPath } from './lib/mfa';

/** প্রতিটি রিকোয়েস্টে সেশন রিফ্রেশ করে এবং /admin ও /portal সুরক্ষিত রাখে */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAdmin = path.startsWith('/admin');
  const isPortal = path.startsWith('/portal');

  if ((isAdmin || isPortal) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  if (isAdmin && user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!data || data.role === 'member') {
      const url = request.nextUrl.clone();
      url.pathname = '/portal';
      url.search = '';
      return NextResponse.redirect(url);
    }
    // অ্যাডমিন হলে এই সেশনে OTP যাচাই না হলে প্যানেলে ঢুকতে দেওয়া হয় না
    if (data.role === 'admin' && (await mfaRequired(supabase))) {
      const a = await adminAal(supabase);
      if (a !== 'ok') {
        const url = request.nextUrl.clone();
        url.pathname = otpPath(a);
        url.search = `?next=${encodeURIComponent(path)}`;
        return NextResponse.redirect(url);
      }
    }
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
