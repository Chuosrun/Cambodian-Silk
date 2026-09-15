'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export async function createEntry(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You need to be signed in to write.' };

  const title = String(formData.get('title') || '').trim();
  if (!title) return { error: 'A title is required.' };

  const slug = `${slugify(title)}-${crypto.randomUUID().slice(0, 6)}`;

  const { error } = await supabase.from('entries').insert({
    user_id: user.id,
    slug,
    title,
    khmer_title: String(formData.get('khmer_title') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    place: String(formData.get('place') || '').trim(),
    image_url: String(formData.get('image_url') || '').trim(),
    stage: String(formData.get('stage') || '').trim(),
    contributor:
      user.user_metadata?.display_name?.trim() || 'Anonymous collector',
  });

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/my-collection');
  return { ok: true };
}

export async function deleteEntry(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You need to be signed in.' };

  const slug = String(formData.get('slug') || '');
  if (!slug) return { error: 'Missing entry.' };

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('slug', slug)
    .eq('user_id', user.id); // RLS enforces this too — belt and braces.

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/my-collection');
  redirect('/my-collection');
}