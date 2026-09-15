// Central data access for the archive.
// Reads from Supabase when configured, and falls back to the static
// Sprint 1 data file if the database isn't set up yet.

import entries from '../data/entries';

function hasEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function adaptStatic(entry) {
  return {
    id: entry.id,
    slug: entry.id,
    stage: entry.stage,
    title: entry.title,
    khmer_title: entry.khmerTitle,
    description: entry.description,
    contributor: entry.contributor,
    place: entry.place,
    image_url: entry.image,
  };
}

export async function getArchiveEntries() {
  if (!hasEnv()) return entries.map(adaptStatic);

  try {
    const { createClient } = await import('./supabase/server');
    const supabase = await createClient();
    const { data, error } = await supabase.from('entries').select('*');
    if (error) throw error;
    if (!data || data.length === 0) return entries.map(adaptStatic);
    return data;
  } catch {
    return entries.map(adaptStatic);
  }
}

export async function getEntryBySlug(slug) {
  const staticHit = entries.find((entry) => entry.id === slug) || null;

  if (!hasEnv()) return staticHit;

  try {
    const { createClient } = await import('./supabase/server');
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return staticHit;
    return data;
  } catch {
    return staticHit;
  }
}