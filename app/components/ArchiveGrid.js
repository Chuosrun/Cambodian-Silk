'use client';

import { useState } from 'react';
import EntryCard from '../../components/EntryCard';

export default function ArchiveGrid({ entries }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const visibleEntries = entries.filter((entry) => {
    if (!normalizedQuery) return true;
    return [entry.title, entry.khmer_title, entry.description].some((field) =>
      (field || '').toLocaleLowerCase().includes(normalizedQuery),
    );
  });

  return (
    <>
      <header className="hero">
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or description"
            />
          </div>
          <p className="search__count">
            {visibleEntries.length} of {entries.length} entries
          </p>
        </div>
      </header>

      <section className="grid" aria-label="Silk archive entries">
        {visibleEntries.length > 0 ? (
          visibleEntries.map((entry) => (
            <EntryCard key={entry.slug || entry.id} entry={entry} />
          ))
        ) : (
          <p className="empty">No entries found. មិនមានកំណត់ត្រាដែលត្រូវគ្នាទេ។</p>
        )}
      </section>
    </>
  );
}