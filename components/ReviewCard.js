'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { deleteEntry } from '../app/actions/entries';
import EntryCard from '@/components/EntryCard';

export default function ReviewCard({ entry }) {
  const router = useRouter();
  const noteRef = useRef(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleReview(decision) {
    setBusy(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('review_entry', {
        entry_id: entry.id,
        decision,
      });

      if (error) {
        setMessage({ kind: 'error', text: 'Something went wrong calling review_entry.' });
        console.error('review_entry error:', error);
        setBusy(false);
        return;
      }

      if (data === false) {
        setMessage({ kind: 'error', text: 'Review refused. Either you are not a reviewer or the entry is not pending.' });
        setBusy(false);
        return;
      }

      setMessage({ kind: 'success', text: decision === 'published' ? 'Published.' : 'Returned to contributor.' });
      router.refresh();
    } catch (err) {
      setMessage({ kind: 'error', text: 'Something went wrong.' });
      console.error('review exception:', err);
      setBusy(false);
    }
  }

  return (
    <div className="review-item">
      <EntryCard entry={entry} />

      <div className="review-actions">
        {message && (
          <p className={`notice notice--${message.kind}`}>{message.text}</p>
        )}
        <button
          type="button"
          className="btn btn--primary btn--small"
          disabled={busy}
          onClick={() => handleReview('published')}
        >
          {busy ? 'Working...' : 'Publish'}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          disabled={busy}
          onClick={() => handleReview('returned')}
        >
          Return
        </button>
        <button
          type="button"
          className="btn btn--danger btn--small"
          disabled={busy}
          onClick={async () => {
            const form = new FormData();
            form.set('slug', entry.slug);
            form.set('return_to', '/review');
            const result = await deleteEntry(form);
            if (result?.error) {
              setMessage({ kind: 'error', text: result.error });
            } else {
              setMessage({ kind: 'success', text: 'Deleted.' });
              router.refresh();
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}