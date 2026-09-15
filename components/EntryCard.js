import Link from 'next/link';
import styles from './EntryCard.module.css';
import CoverImage from './CoverImage';

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
  } = entry;

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
          {stage && <span className={styles.stage}>STAGE {stage}</span>}
          <h2 className={styles.title}>{title || 'Untitled Entry'}</h2>
          {khmer_title && (
            <p className={styles.khmer} lang="km">
              {khmer_title}
            </p>
          )}
          <p className={styles.desc}>{description || 'No description available.'}</p>

          <div className={styles.meta}>
            <p>
              <span className={styles.label}>Contributor: </span>
              {contributor || 'Unknown'}
            </p>
            <p>
              <span className={styles.label}>Place: </span>
              {place || 'Unknown'}
            </p>
          </div>

          <span className={styles.explore}>
            Explore entry <span className={styles.arrow} aria-hidden="true">→</span>
          </span>
        </div>
      </article>
    </Link>
  );
}