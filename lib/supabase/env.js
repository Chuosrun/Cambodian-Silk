// Central, forgiving reader for the Supabase environment config.
// Guards against the three classic setup mistakes:
//   1. pasting the REST API URL (…/rest/v1/) instead of the project URL
//   2. stray spaces or trailing slashes
//   3. missing / empty values

export function getConfig() {
  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  // Strip any path that got accidentally appended (e.g. /rest/v1).
  const schemeMatch = rawUrl.match(/^https?:\/\/[^/]+/);
  if (schemeMatch) rawUrl = schemeMatch[0].replace(/\/+$/, '');

  return {
    url: rawUrl,
    anonKey,
    ready: Boolean(rawUrl && anonKey),
  };
}