'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function signUp({ email, password, displayName }) {
  // Work out where this app is hosted from the request itself, so
  // confirmation links point at the right domain on any deployment.
  const h = await headers();
  const requestOrigin =
    h.get('origin') ||
    (h.get('host') ? `https://${h.get('host')}` : null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin || 'http://localhost:3000';

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: (displayName || '').trim() },
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  });

  if (error) return { error: error.message };
  return { ok: true };
}