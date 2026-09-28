export default function Loading() {
  return (
    <main className="page" style={{ paddingTop: '2rem' }}>
      {/* Skeleton hero area */}
      <div className="skeleton-hero" aria-hidden="true">
        <div className="skeleton-hero__text">
          <div className="skeleton-box" style={{ width: '6rem', height: '0.9rem', marginBottom: '1rem' }} />
          <div className="skeleton-box" style={{ width: '22rem', height: '3.8rem', marginBottom: '1.3rem' }} />
          <div className="skeleton-box" style={{ width: '30rem', height: '1.2rem' }} />
        </div>
        <div className="skeleton-hero__collage">
          <div className="skeleton-box skeleton-collage-tall" />
          <div className="skeleton-collage-stack">
            <div className="skeleton-box" style={{ flex: 1 }} />
            <div className="skeleton-box" style={{ flex: 1 }} />
          </div>
        </div>
      </div>

      {/* Skeleton stage strip */}
      <div className="skeleton-strip" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="skeleton-box" style={{ width: '8rem', height: '2.8rem' }} />
        ))}
      </div>

      {/* Skeleton filter chips */}
      <div className="skeleton-chips" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="skeleton-box" style={{ width: n === 1 ? '4rem' : '6rem', height: '2rem' }} />
        ))}
      </div>

      {/* Skeleton card grid */}
      <div className="skeleton-grid" aria-hidden="true">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="skeleton-card">
            <div className="skeleton-box skeleton-card__media" />
            <div className="skeleton-card__content">
              <div className="skeleton-box" style={{ width: '30%', height: '0.7rem', marginBottom: '0.6rem' }} />
              <div className="skeleton-box" style={{ width: '70%', height: '1.4rem', marginBottom: '0.4rem' }} />
              <div className="skeleton-box" style={{ width: '50%', height: '1rem', marginBottom: '0.7rem' }} />
              <div className="skeleton-box" style={{ width: '90%', height: '0.8rem' }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}