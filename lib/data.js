// Central data access for the archive.
// Entries live in Supabase — the Sprint 1 data file has been retired.
// There is no static fallback: if the database is unreachable or empty,
// the archive returns an empty list rather than a broken page.

function hasEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

function sortByStage(list) {
  return [...list].sort((a, b) => {
    const na = parseInt(a.stage, 10) || 0;
    const nb = parseInt(b.stage, 10) || 0;
    return na - nb;
  });
}

export async function getArchiveEntries() {
  if (!hasEnv()) return [];

  try {
    const { createClient } = await import('./supabase/server');
    const supabase = await createClient();
    const { data, error } = await supabase.from('entries').select('*');
    if (error) throw error;
    return sortByStage(data || []);
  } catch {
    return [];
  }
}

export async function getEntryBySlug(slug) {
  if (!hasEnv()) return null;

  try {
    const { createClient } = await import('./supabase/server');
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}