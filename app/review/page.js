import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReviewCard from '@/components/ReviewCard';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  let isReviewer = false;
  let user = null;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData.user;
    if (user) {
      const { data: r } = await supabase.rpc('is_reviewer');
      isReviewer = Boolean(r);
    }
  } catch {
    isReviewer = false;
  }

  if (!user || !isReviewer) {
    notFound();
  }

  let pending = [];
  let dbError = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }); // oldest first

    if (error) throw new Error(error.message);
    pending = data || [];
  } catch (err) {
    dbError = err.message;
  }

  return (
    <main className="page">
      <h1 className="page__title">Review queue</h1>
      <p className="page__lead">
        Entries waiting for review, oldest first. Publish an entry to make it public, or return it
        to its contributor with feedback.
      </p>

      {dbError && (
        <p className="notice notice--error">
          Could not load the queue ({dbError}).
        </p>
      )}

      {pending.length > 0 ? (
        <section className="review-grid" aria-label="Pending entries">
          {pending.map((entry) => (
            <ReviewCard key={entry.id} entry={entry} />
          ))}
        </section>
      ) : !dbError ? (
        <p className="empty">
          The queue is empty. New contributor entries will wait here for review.
        </p>
      ) : null}
    </main>
  );
}