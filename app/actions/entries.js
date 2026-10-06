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

export async function createEntry(formData, options = {}) {
  const mode = options?.mode || 'normal';
  let user = null;
  let supabaseHandle = null;

  try {
    supabaseHandle = await createClient();
    const { data } = await supabaseHandle.auth.getUser();
    user = data.user;
  } catch (err) {
    return { error: err.message || 'Could not connect to Supabase.' };
  }
  if (!user) return { error: 'You need to be signed in to write.' };

  const title = String(formData.get('title') || '').trim();
  if (!title) return { error: 'A title is required.' };
  if (title.length > 80) return { error: 'Title must be 80 characters or fewer.' };

  // Source: required, max 100 characters.
  const source = String(formData.get('source') || '').trim();
  if (!source) return { error: 'A source (museum, farm, or origin) is required.' };
  if (source.length > 100) return { error: 'Source must be 100 characters or fewer.' };

  // Description: no minimum, max 300 words.
  const description = String(formData.get('description') || '').trim();
  if (!description) return { error: 'A description is required.' };
  const wordCount = description.split(/\s+/).filter(Boolean).length;
  if (wordCount > 300) return { error: `Description must be 300 words or fewer (yours has ${wordCount}).` };

  // Image URL: required (set by EntryForm.js after client-side upload).
  const image_url = String(formData.get('image_url') || '').trim();
  if (!image_url) return { error: 'At least one photo is required. Upload an image below.' };

  // Stage: must be one of the four lifecycle names (or empty, though empty won't
  // pass the required checks).
  const rawStage = String(formData.get('stage') || '').trim();
  const VALID_STAGES = ['Silkworm', 'Cocoon', 'Thread', 'Cloth'];
  let stage = '';
  if (rawStage) {
    if (!VALID_STAGES.includes(rawStage)) {
      return { error: 'Stage must be one of: Silkworm, Cocoon, Thread, Cloth.' };
    }
    stage = rawStage;
  }

  const slug = `${slugify(title)}-${crypto.randomUUID().slice(0, 6)}`;

  // Duplicate check — only against the user's own form-created entries
  // (is_seed = false). Seed entries keep their stage value regardless.
  if (stage && mode !== 'duplicate') {
    const { data: mine, error: fetchErr } = await supabaseHandle
      .from('entries')
      .select('id, stage, title')
      .eq('user_id', user.id)
      .eq('is_seed', false);
    if (fetchErr) return { error: fetchErr.message };

    const clash = (mine || []).find((entry) => entry.stage === stage);
    if (clash) {
      return {
        conflict: true,
        existingStage: clash.stage,
        existingTitle: clash.title,
      };
    }
  }

  // Rate limit: max 10 entries per user per day (light abuse prevention).
  const today = new Date().toISOString().slice(0, 10);
  const { count: todayCount, error: countErr } = await supabaseHandle
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today);
  if (!countErr && todayCount >= 10) {
    return { error: 'You can add up to 10 entries per day. Come back tomorrow.' };
  }

  // Max total: 50 entries per user (sanity ceiling).
  const { count: totalCount, error: totalErr } = await supabaseHandle
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if (!totalErr && totalCount >= 50) {
    return { error: 'You\'ve reached the maximum of 50 entries.' };
  }

  try {
    const { error } = await supabaseHandle.from('entries').insert({
      user_id: user.id,
      slug,
      title,
      khmer_title: String(formData.get('khmer_title') || '').trim(),
      description,
      place: String(formData.get('place') || '').trim(),
      image_url,
      stage,
      contributor: user.user_metadata?.display_name?.trim() || 'Anonymous collector',
      source,
      is_seed: false,
    });

    if (error) return { error: error.message };
  } catch (err) {
    return { error: err.message || 'Something went wrong on the server.' };
  }

  revalidatePath('/');
  revalidatePath('/my-collection');
  return { ok: true };
}

export async function updateEntry(formData) {

  let user = null;
  let supabaseHandle = null;

  try {
    supabaseHandle = await createClient();
    const { data } = await supabaseHandle.auth.getUser();
    user = data.user;
  } catch (err) {
    return { error: err.message || 'Could not connect.' };
  }
  if (!user) return { error: 'You need to be signed in.' };

  const slug = String(formData.get('slug') || '').trim();
  if (!slug) return { error: 'Missing entry.' };

  // Validate fields (same rules as createEntry)
  const title = String(formData.get('title') || '').trim();
  if (!title) return { error: 'Title is required.' };
  if (title.length > 80) return { error: 'Title must be 80 characters or fewer.' };

  const source = String(formData.get('source') || '').trim();
  if (!source) return { error: 'Source is required.' };
  if (source.length > 100) return { error: 'Source must be 100 characters or fewer.' };

  const description = String(formData.get('description') || '').trim();
  if (!description) return { error: 'Description is required.' };
  const wordCount = description.split(/\s+/).filter(Boolean).length;
  if (wordCount > 300) {
    return { error: 'Description must be 300 words or fewer.' };
  }

  const rawStage = String(formData.get('stage') || '').trim();
  if (!rawStage) return { error: 'Stage is required.' };
  const VALID_STAGES = ['Silkworm', 'Cocoon', 'Thread', 'Cloth'];
  if (!VALID_STAGES.includes(rawStage)) return { error: 'Invalid stage value.' };

  const payload = {
    title,
    khmer_title: String(formData.get('khmer_title') || '').trim(),
    description,
    source,
    stage: rawStage,
    place: String(formData.get('place') || '').trim(),
  };

  const imageUrl = String(formData.get('image_url') || '').trim();
  if (imageUrl) payload.image_url = imageUrl;

  try {
    const { data: result, error } = await supabaseHandle
      .from('entries')
      .update(payload)
      .eq('slug', slug)
      .eq('user_id', user.id)
      .select();

    if (error) return { error: error.message };

    // .select() returns the updated row; empty means RLS refused it
    if (!result || result.length === 0) {
      console.error('Update refused by RLS for slug:', slug, 'user:', user.id);
      return { error: 'That change wasn\'t saved.' };
    }

    revalidatePath('/');
    revalidatePath('/my-collection');
    revalidatePath(`/entries/${slug}`);
    return { ok: true, slug };
  } catch (err) {
    console.error('Update exception:', err);
    return { error: 'That change wasn\'t saved.' };
  }
}

export async function deleteEntry(formData) {
  let supabaseHandle = null;
  let user = null;
  try {
    supabaseHandle = await createClient();
    const { data } = await supabaseHandle.auth.getUser();
    user = data.user;
  } catch (err) {
    return { error: err.message || 'Could not connect to Supabase.' };
  }
  if (!user) return { error: 'You need to be signed in.' };

  const slug = String(formData.get('slug') || '');
  if (!slug) return { error: 'Missing entry.' };

  try {
    const { data: result, error } = await supabaseHandle
      .from('entries')
      .delete()
      .eq('slug', slug)
      .eq('user_id', user.id)
      .eq('is_seed', false) // seed entries can't be deleted through the UI
      .select();

    if (error) return { error: error.message };

    // .select() returns the deleted row(s); empty means RLS refused
    if (!result || result.length === 0) {
      console.error('Delete refused by RLS for slug:', slug, 'user:', user.id);
      return { error: 'That change wasn\'t saved.' };
    }
  } catch (err) {
    return { error: err.message || 'Something went wrong on the server.' };
  }

  revalidatePath('/');
  revalidatePath('/my-collection');
  redirect('/my-collection');
}