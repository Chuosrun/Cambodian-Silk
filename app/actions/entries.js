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

  // Stage: digits only; single digits are zero-padded ("1" → "01").
  const rawStage = String(formData.get('stage') || '').trim();
  let stage = '';
  if (rawStage) {
    if (!/^\d+$/.test(rawStage)) {
      return { error: 'Stage must be a whole number (digits only), e.g. 1 or 12.' };
    }
    stage = String(Number(rawStage)).padStart(2, '0');
  }

  const slug = `${slugify(title)}-${crypto.randomUUID().slice(0, 6)}`;

  // Duplicate check + optional reordering — only when a stage was given and
  // the user hasn't already chosen to allow a duplicate.
  if (stage && mode !== 'duplicate') {
    const { data: mine, error: fetchErr } = await supabaseHandle
      .from('entries')
      .select('id, stage, title')
      .eq('user_id', user.id)
      .not('stage', 'eq', '');
    if (fetchErr) return { error: fetchErr.message };

    const numbered = (mine || [])
      .map((entry) => ({ ...entry, num: parseInt(entry.stage, 10) }))
      .filter((entry) => !Number.isNaN(entry.num));

    if (mode === 'reorder') {
      // Push every existing stage >= the new one up by one, then insert below it.
      const newNum = parseInt(stage, 10);
      for (const entry of numbered) {
        if (entry.num >= newNum) {
          const { error: bumpErr } = await supabaseHandle
            .from('entries')
            .update({ stage: String(entry.num + 1).padStart(2, '0') })
            .eq('id', entry.id);
          if (bumpErr) return { error: bumpErr.message };
        }
      }
    } else {
      const clash = numbered.find((entry) => entry.stage === stage);
      if (clash) {
        return {
          conflict: true,
          existingStage: clash.stage,
          existingTitle: clash.title,
          existingStages: numbered
            .map((entry) => ({ stage: entry.stage, title: entry.title }))
            .sort((a, b) => parseInt(a.stage, 10) - parseInt(b.stage, 10)),
        };
      }
    }
  }

  try {
    const { error } = await supabaseHandle.from('entries').insert({
      user_id: user.id,
      slug,
      title,
      khmer_title: String(formData.get('khmer_title') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      place: String(formData.get('place') || '').trim(),
      image_url: String(formData.get('image_url') || '').trim(),
      stage,
      contributor: user.user_metadata?.display_name?.trim() || 'Anonymous collector',
    });

    if (error) return { error: error.message };
  } catch (err) {
    return { error: err.message || 'Something went wrong on the server.' };
  }

  revalidatePath('/');
  revalidatePath('/my-collection');
  return { ok: true };
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
    const { error } = await supabaseHandle
      .from('entries')
      .delete()
      .eq('slug', slug)
      .eq('user_id', user.id); // RLS enforces this too — belt and braces.

    if (error) return { error: error.message };
  } catch (err) {
    return { error: err.message || 'Something went wrong on the server.' };
  }

  revalidatePath('/');
  revalidatePath('/my-collection');
  redirect('/my-collection');
}