import Link from 'next/link';
import styles from './EntryCard.module.css';
import CoverImage from './CoverImage';

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function EntryCard({ entry }) {
  const {
    slug,
    stage,
    title,
    khmer_title,
    description,
    contributor,
    place,
    image_url,
    created_at,
  } = entry || {};

  const dateLabel = formatDate(created_at);

  return (
    <Link href={`/entries/${slug}`} className={styles.link}>
      <article className={styles.card}>
        <div className={styles.media}>
          <CoverImage
            src={image_url}
            alt={title || 'Silk archive entry'}
            monogram={String(khmer_title || title || 'ស').trim()[0] || 'ស'}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.kicker}>
            {stage && <span className={styles.stage}>STAGE {stage}</span>}
            {dateLabel && <span className={styles.date}>{dateLabel}</span>}
          </div>

          <h2 className={styles.title}>{title || 'Untitled Entry'}</h2>
          {khmer_title && (
            <p className={styles.khmer} lang="km">
              {khmer_title}
            </p>
          )}
          <p className={styles.desc}>{description || 'No description available.'}</p>

          <div className={styles.meta}>
            <span>{contributor || 'Anonymous'}</span>
            {place && (
              <>
                <span className={styles.metaDot} aria-hidden="true">
                  ·
                </span>
                <span>{place}</span>
              </>
            )}
          </div>

          <span className={styles.explore}>
            Explore entry <span className={styles.arrow} aria-hidden="true">→</span>
          </span>
        </div>
      </article>
    </Link>
  );
}