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

  async function doCreate(form) {
    try {
      return await createEntry(form);
    } catch (err) {
      return { error: err.message || 'Something went wrong.' };
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formEl = event.currentTarget;
    setLoading(true);
    setStatus(null);

    // --- Client-side image validation ---
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus({ kind: 'error', message: 'At least one photo is required (jpg, jpeg, png, or webp).' });
      setLoading(false);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setStatus({ kind: 'error', message: 'Photo must be JPG, JPEG, PNG, or WebP.' });
      setLoading(false);
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setStatus({ kind: 'error', message: 'Photo must be under 5 MB.' });
      setLoading(false);
      return;
    }

    // --- Upload to Supabase Storage ---
    let imageUrl = '';
    const supabase = createClient();
    if (!user?.id) {
      setStatus({ kind: 'error', message: 'You need to be signed in to add a photo.' });
      setLoading(false);
      return;
    }

    const path = `${user.id}/${crypto.randomUUID()}`;
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, file);
    if (uploadError) {
      setStatus({ kind: 'error', message: 'Image upload failed: ' + uploadError.message });
      setLoading(false);
      return;
    }

    imageUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;

    // --- Build form data ---
    const form = new FormData(formEl);
    form.set('image_url', imageUrl);

    const result = await doCreate(form);

    if (result?.ok) {
      setStatus({ kind: 'success', message: 'Your entry has been submitted and is waiting for review. It will appear once it is published.' });
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

      <div className="field">
        <label className="field__label" htmlFor="entry-khmer">
          Khmer title
        </label>
        <input
          id="entry-khmer"
          className="field__input"
          name="khmer_title"
          lang="km"
          maxLength={80}
          placeholder="ឧ. ការចិញ្ចឹមដង្កូវនាង"
        />
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
          placeholder="What did you observe, document, or learn?"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="entry-source">
          Source <small>(required - museum, farm, or origin credited)</small>
        </label>
        <input
          id="entry-source"
          className="field__input"
          name="source"
          required
          maxLength={100}
          placeholder="e.g. National Museum of Cambodia"
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
            Photo <small>(required - max 5 MB, JPG/PNG/WebP)</small>
          </label>
          <input
            id="entry-image"
            className="field__input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            ref={fileRef}
            required
          />
        </div>
      </div>

      <button type="submit" className="btn btn--primary" disabled={loading}>
        {loading ? 'Adding...' : 'Add to my collection'}
      </button>
    </form>
  );
}
