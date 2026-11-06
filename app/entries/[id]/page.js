import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEntryBySlug } from '@/lib/data';
import CoverImage from '@/components/CoverImage';
import DeleteButton from '@/components/DeleteButton';

export const dynamic = 'force-dynamic';

// Non-published entries are only visible to their owner and reviewers (RLS);
// keep them out of search engines.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const entry = await getEntryBySlug(id);
  if (entry && entry.status !== 'published') {
    return { robots: { index: false, follow: false } };
  }
  return {};
}

export default async function EntryPage({ params }) {
  const { id } = await params;
  const entry = await getEntryBySlug(id);

  if (!entry) notFound();

  const {
    slug,
    stage,
    title,
    khmer_title,
    description,
    contributor,
    place,
    image_url,
    source,
    user_id,
    is_seed,
    status,
  } = entry;

  // Check if the current user is the owner
  let currentUser = null;
  let supabase = null;
  try {
    supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    currentUser = data.user;
  } catch {
    currentUser = null;
  }
  const isOwner = currentUser && user_id === currentUser.id && !is_seed;

  // Reviewers can delete anyone's non-seed entries.
  let isReviewer = false;
  if (currentUser && supabase) {
    try {
      const { data: r } = await supabase.rpc('is_reviewer');
      isReviewer = Boolean(r);
    } catch { isReviewer = false; }
  }
  const canDelete = (isOwner || isReviewer) && !is_seed;

  return (
    <main className="page page--detail">
      <Link href="/" className="back">
        ← Back to archive
      </Link>

      {status === 'pending' && (
        <p className="notice">
          Pending review. Only you and reviewers can see this entry.
        </p>
      )}
      {status === 'returned' && (
        <p className="notice">
          Returned by a reviewer. Only you and reviewers can see this entry.
        </p>
      )}

      {isOwner && (
        <div className="detail__actions">
          <Link href={`/edit/${slug}`} className="btn">
            Edit
          </Link>
          <DeleteButton slug={slug} />
        </div>
      )}
      {canDelete && !isOwner && (
        <div className="detail__actions">
          <DeleteButton slug={slug} />
        </div>
      )}

      <article className="detail">
        <div className="detail__media">
          <CoverImage
            src={image_url}
            alt={title}
            monogram={String(khmer_title || title || 'ស').trim()[0] || 'ស'}
          />
        </div>

        <div className="detail__content">
          {stage && <p className="detail__stage">{stage.toUpperCase()}</p>}
          <h1 className="detail__title">{title}</h1>
          {khmer_title && (
            <p className="detail__khmer" lang="km">
              {khmer_title}
            </p>
          )}
          <p className="detail__desc">{description || 'No description available.'}</p>

          <div className="detail__meta">
            <p>
              <strong>Contributor:</strong> {contributor || 'Unknown'}
            </p>
            {place && (
              <p>
                <strong>Place:</strong> {place}
              </p>
            )}
            {source && (
              <p>
                <strong>Source:</strong> {source}
              </p>
            )}
          </div>

          <section className="detail__notes" aria-labelledby="notes-heading">
            <h2 id="notes-heading">Archive notes</h2>
            <p>
              This entry is ready for additional observations, source notes, and supporting
              material.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}