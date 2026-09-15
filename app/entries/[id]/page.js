import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEntryBySlug } from '@/lib/data';
import CoverImage from '@/components/CoverImage';

export const dynamic = 'force-dynamic';

export default async function EntryPage({ params }) {
  const { id } = await params;
  const entry = await getEntryBySlug(id);

  if (!entry) notFound();

  const {
    stage,
    title,
    khmer_title,
    description,
    contributor,
    place,
    image_url,
  } = entry;

  return (
    <main className="page page--detail">
      <Link href="/" className="back">
        ← Back to archive
      </Link>

      <article className="detail">
        <div className="detail__media">
          <CoverImage
            src={image_url}
            alt={title}
            monogram={String(khmer_title || title || 'ស').trim()[0] || 'ស'}
          />
        </div>

        <div className="detail__content">
          {stage && <p className="detail__stage">STAGE {stage}</p>}
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
            <p>
              <strong>Place:</strong> {place || 'Unknown'}
            </p>
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