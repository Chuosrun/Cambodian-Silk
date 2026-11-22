import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EntryCard from '../../components/EntryCard';
import EntryForm from './EntryForm';
import DeleteButton from '../../components/DeleteButton';

export const dynamic = 'force-dynamic';

const STATUS_LABELS = {
  pending: { en: 'Pending review', km: 'កំពុងរង់ចាំការត្រួតពិនិត្យ' },
  published: { en: 'Published', km: 'បានបោះពុម្ពផ្សាយ' },
  returned: { en: 'Returned', km: 'បានបញ្ជូនត្រឡប់' },
};

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

  const hasEntries = myEntries.length > 0;

  return (
    <main className="page">
      <h1 className="page__title">My collection</h1>
      <p className="page__lead">
        Everything you add, with its review status. A pending or returned entry waits for a
        reviewer before it appears in the public archive. You can edit or remove your own
        entries anytime - nobody else can touch them.
      </p>

      {dbError && (
        <p className="notice notice--error">
          Could not reach the database ({dbError}). If you haven&apos;t done it yet, run{' '}
          <code>supabase/schema.sql</code> in the Supabase SQL Editor, then refresh.
        </p>
      )}

      {hasEntries ? (
        <>
          <p>
            <a href="#add-entry" className="btn btn--primary btn--large">
              Add Your Collection
            </a>
          </p>

          <section className="collection-grid" aria-label="My entries">
            {myEntries.map((entry) => {
              const label = STATUS_LABELS[entry.status] || {
                en: entry.status || 'Unknown',
                km: '',
              };
              return (
                <div key={entry.id} className="collection__item">
                  <EntryCard entry={entry} />
                  <p className="status-badge" aria-label={`Status: ${label.en}`}>
                    {label.en}
                    {label.km && <span lang="km"> · {label.km}</span>}
                  </p>
                  {!entry.is_seed && (
                    <>
                      <Link className="btn btn--small" href={`/edit/${entry.slug}`}>
                        Edit
                      </Link>
                      <DeleteButton slug={entry.slug} />
                    </>
                  )}
                </div>
              );
            })}
          </section>

          <div id="add-entry" className="add-entry-anchor">
            <EntryForm user={user} />
          </div>
        </>
      ) : (
        <>
          <EntryForm user={user} />
          <p className="empty">
            You haven&apos;t added any entries yet. Use the form above to start your collection.
            (Make sure your database is set up and you&apos;re signed in to see entries here.)
          </p>
        </>
      )}
    </main>
  );
}
