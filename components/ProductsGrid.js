'use client';

import { useState, useMemo } from 'react';
import EntryCard from './EntryCard';

// Search + card grid for the /products shelf. Same search box and matching
// rules as the home page (title, Khmer title, description, source, place),
// done in the browser over the published products the server already sent.
export default function ProductsGrid({ products }) {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLocaleLowerCase();

  const visibleProducts = useMemo(() => {
    if (!normalizedQuery) return products;
    return products.filter((entry) =>
      [entry.title, entry.khmer_title, entry.description, entry.source, entry.place].some(
        (field) => (field || '').toLocaleLowerCase().includes(normalizedQuery),
      ),
    );
  }, [products, normalizedQuery]);

  return (
    <>
      <div className="search" style={{ margin: '0 0 2rem' }}>
        <label className="search__label" htmlFor="products-search">
          Search the products
        </label>
        <div className="search__box">
          <svg
            className="search__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="products-search"
            className="search__input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or description"
          />
        </div>
        <p className="search__count">
          {visibleProducts.length} of {products.length} products
        </p>
      </div>

      {visibleProducts.length > 0 ? (
        <section className="grid" aria-label="Silk products shared by the community">
          {visibleProducts.map((product) => (
            <EntryCard key={product.slug || product.id} entry={product} />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <p className="empty-state__text">
            No products match that yet. Try a different search.
          </p>
          <button className="empty-state__btn" onClick={() => setQuery('')}>
            Clear search
          </button>
        </div>
      )}
    </>
  );
}
