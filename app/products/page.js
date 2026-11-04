import { createClient } from '@/lib/supabase/server';
import EntryCard from '@/components/EntryCard';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  let products = [];
  let dbError = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('is_seed', false)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    products = data || [];
  } catch (err) {
    dbError = err.message;
  }

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
        <section className="grid" aria-label="Silk products shared by the community">
          {products.map((product) => (
            <EntryCard key={product.slug || product.id} entry={product} />
          ))}
        </section>
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