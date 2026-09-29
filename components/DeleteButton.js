'use client';

import { deleteEntry } from '../app/actions/entries';

export default function DeleteButton({ slug }) {
  function handleSubmit(e) {
    if (!window.confirm('Remove this entry from your collection? This cannot be undone.')) {
      e.preventDefault();
    }
  }

  return (
    <form action={deleteEntry} onSubmit={handleSubmit}>
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" className="btn btn--ghost btn--danger">
        Remove from my collection
      </button>
    </form>
  );
}