import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEntryBySlug } from '@/lib/data';
import CoverImage from '@/components/CoverImage';
import DeleteButton from '@/components/DeleteButton';

export const dynamic = 'force-dynamic';

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
  } = entry;

  // Check if the current user is the owner
  let currentUser = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    currentUser = data.user;
  } catch {
    currentUser = null;
  }
  const isOwner = currentUser && user_id === currentUser.id && !is_seed;

  return (
    <main className="page page--detail">
      <Link href="/" className="back">
        ← Back to archive
      </Link>

      {isOwner && (
        <div className="detail__actions">
          <Link href={`/edit/${slug}`} className="btn">
            Edit
          </Link>
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