import Link from 'next/link';
import styles from './EntryCard.module.css';

export default function EntryCard({
  id,
  stage,
  title,
  khmerTitle,
  description,
  contributor,
  place,
  image,
}) {
  return (
    <Link href={`/entries/${id}`} className={styles.link}>
      <article className={styles.card}>
        <div className={styles.media}>
          <img src={image} alt={title || 'Silk archive entry'} loading="lazy" />
        </div>

        <div className={styles.content}>
          <span className={styles.stage}>STAGE {stage}</span>
          <h2 className={styles.title}>{title || 'Untitled Entry'}</h2>
          <p className={styles.khmer} lang="km">
            {khmerTitle}
          </p>
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