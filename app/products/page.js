import { getPublishedProducts } from '@/lib/data';
import ProductsGrid from '@/components/ProductsGrid';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const { products, error: dbError } = await getPublishedProducts();

  return (
    <main className="page">
      <header className="hero" style={{ display: 'block' }}>
        <div className="hero__text">
          <p className="hero__eyebrow">សិល្បរូបនៃសូត្រ · The craft that endures</p>
          <h1 className="hero__title">
            Silk <span className="hero__title-accent">Products</span>
          </h1>
          <p className="hero__lead">
            Every piece in this collection comes from people who work with Cambodian silk.
            Scroll through the products to see what the community has shared - scarves, fabric,
            and craft passed down through generations.
          </p>
        </div>
      </header>

      {dbError && (
        <p className="notice notice--error">
          Could not load products ({dbError}).
        </p>
      )}

      {products.length > 0 ? (
        <ProductsGrid products={products} />
      ) : !dbError ? (
        <div className="empty-state">
          <p className="empty-state__text">
            No products have been shared yet. Add your own silk piece and it will appear here
            once it is published.
          </p>
        </div>
      ) : null}
    </main>
  );
}