import Link from 'next/link';
import EntryCard from './EntryCard';
import { getPublishedProducts } from '../lib/data';
import styles from './ProductsShowcase.module.css';

const PREVIEW_COUNT = 3;

// Homepage preview of the /products shelf. Uses the same query helper, so
// only published, non-seed entries can ever appear here. If the query fails
// the section is hidden: the archive itself must still load.
export default async function ProductsShowcase() {
  const { products, error } = await getPublishedProducts({ limit: PREVIEW_COUNT });

  if (error) return null;

  return (
    <section id="silk-products" className={styles.showcase} aria-labelledby="showcase-title">
      <p className={styles.eyebrow}>ផលិតផលសូត្រ · From the community</p>
      <h2 id="showcase-title" className={styles.title}>
        Silk <span className={styles.accent}>Products</span>
      </h2>
      <p className={styles.lead}>
        Pieces shared by people who work with Cambodian silk. Every one is submitted by a member
        of the community and appears here only after a reviewer approves it.
      </p>

      {products.length > 0 ? (
        <div className="grid">
          {products.map((product) => (
            <EntryCard key={product.slug || product.id} entry={product} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          No products have been shared yet. Be the first to add a silk piece.
        </p>
      )}

      <div className={styles.actions}>
        <Link href="/products" className="btn btn--primary">
          Explore All Products
        </Link>
        <Link href="/my-collection" className="btn btn--ghost">
          Share your own piece
        </Link>
      </div>
    </section>
  );
}
