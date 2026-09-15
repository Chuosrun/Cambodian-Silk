import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EntryCard from '../../components/EntryCard';
import EntryForm from './EntryForm';
import { deleteEntry } from '../actions/entries';

export const dynamic = 'force-dynamic';

export default async function MyCollection() {
  let user = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    user = currentUser;
  } catch {
    user = null;
  }

  if (!user) redirect('/login');

  // Try to read the user's entries; if the table is missing (schema.sql not
  // run yet), show a clear notice instead of a 500 error page.
  let myEntries = [];
  let dbError = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    myEntries = data || [];
  } catch (err) {
    dbError = err.message;
  }

  // Keep the collection in lifecycle order by stage number.
  myEntries.sort((a, b) => {
    const na = parseInt(a.stage, 10) || 0;
    const nb = parseInt(b.stage, 10) || 0;
    return na - nb;
  });

  return (
    <main className="page">
      <h1 className="page__title">My collection</h1>
      <p className="page__lead">
        Everything you add lives here and in the public archive. You can add or remove your own
        entries anytime — nobody else can touch them.
      </p>

      {dbError && (
        <p className="notice notice--error">
          Could not reach the database ({dbError}). If you haven&apos;t done it yet, run{' '}
          <code>supabase/schema.sql</code> in the Supabase SQL Editor, then refresh.
        </p>
      )}

      <EntryForm user={user} />

      {myEntries.length > 0 ? (
        <section className="collection-grid" aria-label="My entries">
          {myEntries.map((entry) => (
            <div key={entry.id} className="collection__item">
              <EntryCard entry={entry} />
              <form action={deleteEntry}>
                <input type="hidden" name="slug" value={entry.slug} />
                <button type="submit" className="btn btn--ghost btn--danger">
                  Remove from my collection
                </button>
              </form>
            </div>
          ))}
        </section>
      ) : (
        <p className="empty">
          You haven&apos;t added any entries yet. Use the form above to start your collection.
          (Make sure your database is set up and you&apos;re signed in to see entries here.)
        </p>
      )}
    </main>
  );
}