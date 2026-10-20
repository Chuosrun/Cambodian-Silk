import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EntryCard from '../../components/EntryCard';
import DeleteButton from '../../components/DeleteButton';

export const dynamic = 'force-dynamic';

const STATUS_LABELS = {
  pending: { en: 'Pending review', km: 'កំពុងរង់ចាំការត្រួតពិនិត្យ' },
  published: { en: 'Published', km: 'បានបោះពុម្ពផ្សាយ' },
  returned: { en: 'Returned', km: 'បានបញ្ជូនត្រឡប់' },
};

const STAGE_ORDER = { Silkworm: 1, Cocoon: 2, Thread: 3, Cloth: 4 };

export default async function MyEntries() {
  let user = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (!user) redirect('/login');

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

  myEntries.sort((a, b) => {
    const na = STAGE_ORDER[a.stage] || 0;
    const nb = STAGE_ORDER[b.stage] || 0;
    if (na !== nb) return na - nb;
    return a.slug.localeCompare(b.slug);
  });

  return (
    <main className="page">
      <h1 className="page__title">My entries</h1>
      <p className="page__lead">
        Everything you have submitted, with its review status. A pending or returned entry
        waits for a reviewer before it appears in the public archive.
      </p>

      {dbError && (
        <p className="notice notice--error">
          Could not reach the database ({dbError}). If you have not run the Lab 10 SQL yet,
          run it in the Supabase SQL Editor, then refresh.
        </p>
      )}

      {myEntries.length > 0 ? (
        <section className="collection-grid" aria-label="My submitted entries">
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
                  {label.km && (
                    <span lang="km"> · {label.km}</span>
                  )}
                </p>
                {!entry.is_seed && (
                  <>
                    <a className="btn btn--small" href={`/edit/${entry.slug}`}>
                      Edit
                    </a>
                    <DeleteButton slug={entry.slug} />
                  </>
                )}
              </div>
            );
          })}
        </section>
      ) : (
        <p className="empty">
          You have not submitted any entries yet. Use the contribute form to add your first
          entry to the archive.
        </p>
      )}
    </main>
  );
}