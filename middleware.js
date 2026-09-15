import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getConfig } from '@/lib/supabase/env';

export async function middleware(request) {
  // No Supabase configured yet → let pages fall back to static data.
  const env = getConfig();
  if (!env.ready) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session if it has expired.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect the personal area: must be signed in.
  if (!user && request.nextUrl.pathname.startsWith('/my-collection')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/my-collection/:path*'],
};