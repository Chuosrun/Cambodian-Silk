import Link from 'next/link';
import { notFound } from 'next/navigation';
import entries from '../../../data/entries';

export function generateStaticParams() {
  return entries.map((entry) => ({ id: entry.id }));
}

export default async function EntryPage({ params }) {
  const { id } = await params;
  const entry = entries.find((item) => item.id === id);

  if (!entry) notFound();

  return (
    <main className="page page--detail">
      <Link href="/" className="back">
        ← Back to archive
      </Link>

      <article className="detail">
        <div className="detail__media">
          <img src={entry.image} alt={entry.title} />
        </div>

        <div className="detail__content">
          <p className="detail__stage">STAGE {entry.stage}</p>
          <h1 className="detail__title">{entry.title}</h1>
          <p className="detail__khmer" lang="km">
            {entry.khmerTitle}
          </p>
          <p className="detail__desc">{entry.description}</p>

          <div className="detail__meta">
            <p>
              <strong>Contributor:</strong> {entry.contributor}
            </p>
            <p>
              <strong>Place:</strong> {entry.place}
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