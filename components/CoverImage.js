'use client';

import { useState } from 'react';
import styles from './CoverImage.module.css';

// Renders an archive photo that degrades gracefully:
// - real image → object-fit cover fill
// - missing src OR broken load → an elegant silk-motif placeholder
export default function CoverImage({ src, alt = '', monogram = 'ស' }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        className={styles.image}
        alt={alt || 'Silk archive image'}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={styles.placeholder} role="img" aria-label={alt || 'No image available'}>
      <span className={styles.monogram} aria-hidden="true">
        {monogram}
      </span>
      <span className={styles.rule} aria-hidden="true" />
    </div>
  );
}