'use client';

import { useState, useMemo, useEffect } from 'react';
import EntryCard from '../../components/EntryCard';

/* Lifecycle stage ranges mapped to the stored stage codes */
const STAGE_RANGES = {
  Silkworm: ['01', '02'],
  Cocoon: ['03', '04', '05'],
  Thread: ['06', '07'],
  Cloth: ['08'],
};

const STAGES = [
  { num: 1, label: 'Silkworm' },
  { num: 2, label: 'Cocoon' },
  { num: 3, label: 'Thread' },
  { num: 4, label: 'Cloth' },
];

/**
 * Reports whether the viewport currently matches a media query.
 * Uses window.matchMedia where available; otherwise falls back to a
 * plain width check on resize. Lets us avoid rendering (and fetching)
 * the hero collage images on small screens.
 */
function useMediaQuery(query, { minWidth } = {}) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (typeof window.matchMedia === 'function') {
      const mq = window.matchMedia(query);
      const update = () => setMatches(mq.matches);
      update();
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }

    const update = () => setMatches(window.innerWidth >= (minWidth || Infinity));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [query, minWidth]);

  return matches;
}

export default function ArchiveGrid({ entries }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null); // null = 'All'

  const normalizedQuery = query.trim().toLocaleLowerCase();

  /* Combined filter: stage category + search text — also match source and place */
  const visibleEntries = useMemo(() => {
    let filtered = entries;

    if (activeFilter) {
      const validStages = STAGE_RANGES[activeFilter] || [];
      filtered = filtered.filter((entry) => validStages.includes(entry.stage));
    }

    if (normalizedQuery) {
      filtered = filtered.filter((entry) =>
        [entry.title, entry.khmer_title, entry.description, entry.source, entry.place].some(
          (field) => (field || '').toLocaleLowerCase().includes(normalizedQuery),
        ),
      );
    }

    return filtered;
  }, [entries, activeFilter, normalizedQuery]);

  /* Up to 3 distinct images for the hero collage; prefer cocoon/thread/spinning */
  const collageImages = useMemo(() => {
    const seen = new Set();
    const unique = entries.filter((e) => {
      if (e.image_url && !seen.has(e.image_url)) {
        seen.add(e.image_url);
        return true;
      }
      return false;
    });
    const prefer = unique.filter((e) =>
      /cocoon|thread|reel|spin|boil|golden|spinning|harvest/i.test(e.title || ''),
    );
    const rest = unique.filter((e) => !prefer.includes(e));
    return [...prefer, ...rest].slice(0, 3);
  }, [entries]);

  /* Render the collage only on screens wide enough to show it — the images
     are not fetched on mobile at all (helps load time). */
  const showCollage = useMediaQuery('(min-width: 769px)', { minWidth: 769 });

  const clearFilters = () => {
    setQuery('');
    setActiveFilter(null);
  };

  return (
    <main className="page">
      <header className="hero">
        <div className="hero__text">
          <p className="hero__eyebrow">សារមន្ទីរសូត្រខ្មែរ · A living archive</p>
          <h1 className="hero__title">
            Cambodian Silk
            <br />
            <span className="hero__title-accent">Archives</span>
          </h1>
          <p className="hero__lead">
            Follow the patient transformation of Tromol Meas, from mulberry-fed silkworm to golden
            thread. Signed in? Add your own entries to the archive.
          </p>

          <div className="search">
            <label className="search__label" htmlFor="archive-search">
              Search the archive
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
                id="archive-search"
                className="search__input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or description"
              />
            </div>
            <p className="search__count">
              {visibleEntries.length} of {entries.length} entries
            </p>
          </div>
        </div>

        {showCollage && collageImages.length > 0 && (
          <div className="hero__collage">
            <div className="hero__collage-item hero__collage-item--wide">
              <img
                src={collageImages[0].image_url}
                alt={collageImages[0].title || 'Cambodian silk archive — early lifecycle'}
                loading="eager"
              />
            </div>
            <div className="hero__collage-item">
              <img
                src={(collageImages[1] || collageImages[0]).image_url}
                alt={collageImages[1]?.title || 'Silk production process'}
                loading="eager"
              />
            </div>
            <div className="hero__collage-item">
              <img
                src={(collageImages[2] || collageImages[0]).image_url}
                alt={collageImages[2]?.title || 'Golden silk thread'}
                loading="eager"
              />
            </div>
          </div>
        )}
      </header>

      {/* ---- Stage strip: clickable lifecycle categories ---- */}
      <div className="stage-strip" role="tablist" aria-label="Silk lifecycle stages">
        {STAGES.map((s) => {
          const isActive = activeFilter === s.label;
          return (
            <button
              key={s.label}
              className={`stage-item${isActive ? ' stage-item--active' : ''}`}
              onClick={() => setActiveFilter(isActive ? null : s.label)}
              role="tab"
              aria-selected={isActive}
            >
              <span className="stage-item__num">{s.num}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ---- Filter chips below search ---- */}
      <div className="filters" role="group" aria-label="Filter by stage">
        {['All', 'Silkworm', 'Cocoon', 'Thread', 'Cloth'].map((chip) => {
          const isActive = (chip === 'All' && !activeFilter) || chip === activeFilter;
          return (
            <button
              key={chip}
              className={`filter-chip${isActive ? ' filter-chip--active' : ''}`}
              onClick={() => setActiveFilter(chip === 'All' ? null : chip)}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* ---- Archive grid ---- */}
      {visibleEntries.length > 0 ? (
        <section className="grid" aria-label="Silk archive entries">
          {visibleEntries.map((entry) => (
            <EntryCard key={entry.slug || entry.id} entry={entry} />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <p className="empty-state__text">
            No entries match that yet. Try adjusting your search or filter.
          </p>
          {(query || activeFilter) && (
            <button className="empty-state__btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}
    </main>
  );
}