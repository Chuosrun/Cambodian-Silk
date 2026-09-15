'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createEntry } from '../actions/entries';

export default function EntryForm({ user }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    // Capture the form now — React nulls currentTarget after the handler
    // yields at an `await`, so it can't be read later.
    const formEl = event.currentTarget;
    setLoading(true);
    setStatus(null);

    let imageUrl = '';
    const file = fileRef.current?.files?.[0];

    if (file) {
      const supabase = createClient();
      if (!user?.id) {
        setStatus({ kind: 'error', message: 'You need to be signed in to add a photo.' });
        setLoading(false);
        return;
      }

      const path = `${user.id}/${crypto.randomUUID()}`;
      const { error: uploadError } = await supabase.storage
        .from('entry-images')
        .upload(path, file);
      if (uploadError) {
        setStatus({ kind: 'error', message: 'Image upload failed: ' + uploadError.message });
        setLoading(false);
        return;
      }

      imageUrl = supabase.storage.from('entry-images').getPublicUrl(path).data.publicUrl;
    }

    const form = new FormData(formEl);
    form.set('image_url', imageUrl);

    let result = null;
    try {
      result = await createEntry(form);
    } catch (err) {
      setStatus({ kind: 'error', message: err.message || 'Something went wrong.' });
      setLoading(false);
      return;
    }

    if (result?.ok) {
      setStatus({ kind: 'success', message: 'Entry added to your collection.' });
      formEl.reset();
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    } else {
      setStatus({ kind: 'error', message: result?.error || 'Something went wrong.' });
    }

    setLoading(false);
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <h2>Add an entry</h2>

      {status && <p className={`notice notice--${status.kind}`}>{status.message}</p>}

      <div className="field">
        <label className="field__label" htmlFor="entry-title">
          Title <small>(required)</small>
        </label>
        <input
          id="entry-title"
          className="field__input"
          name="title"
          required
          placeholder="e.g. Feeding the silkworms"
        />
      </div>

      <div className="entry-form__row">
        <div className="field">
          <label className="field__label" htmlFor="entry-khmer">
            Khmer title
          </label>
          <input
            id="entry-khmer"
            className="field__input"
            name="khmer_title"
            lang="km"
            placeholder="ឈ្មោះជាភាសាខ្មែរ"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="entry-stage">
          Stage <small>(optional)</small>
          </label>
          <input id="entry-stage" className="field__input" name="stage" placeholder="e.g. 02" />
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="entry-description">
          Description
        </label>
        <textarea
          id="entry-description"
          className="field__input"
          name="description"
          rows={4}
          placeholder="What did you observe, document, or learn at this stage?"
        />
      </div>

      <div className="entry-form__row">
        <div className="field">
          <label className="field__label" htmlFor="entry-place">
            Place
          </label>
          <input id="entry-place" className="field__input" name="place" placeholder="e.g. Koh Dach" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="entry-image">
            Photo <small>(optional)</small>
          </label>
          <input
            id="entry-image"
          className="field__input"
            type="file"
            accept="image/*"
            ref={fileRef}
          />
        </div>
      </div>

      <button type="submit" className="btn btn--primary" disabled={loading}>
        {loading ? 'Adding…' : 'Add to my collection'}
      </button>
    </form>
  );
}