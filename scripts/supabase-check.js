// One-off health check for the Sprint 2 Supabase setup.
// Run: node scripts/supabase-check.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function readEnv(path) {
  const out = {};
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

const env = readEnv('.env.local');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  const { count, error } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true });
  console.log('ENTRIES TABLE: ' + (error ? 'MISSING/ERROR -> ' + error.message : 'OK — rows: ' + count));

  const { error: listErr } = await supabase.storage.from('entry-images').list('', { limit: 1 });
  console.log('IMAGE BUCKET: ' + (listErr ? 'MISSING/ERROR -> ' + listErr.message : 'OK'));
})();