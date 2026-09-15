import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Email-confirmation / magic-link confirmation handler.
// Supabase appends ?token_hash=...&type=email to the redirect URL;
// we exchange that token for a real session here.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL('/login?error=could_not_verify', request.url));
}