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
  const [pending, setPending] = useState(null); // duplicate-stage decision

  async function doCreate(form, mode = 'normal') {
    try {
      return await createEntry(form, { mode });
    } catch (err) {
      return { error: err.message || 'Something went wrong.' };
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formEl = event.currentTarget;
    setLoading(true);
    setStatus(null);
    setPending(null);

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

    const result = await doCreate(form, 'normal');

    if (result?.ok) {
      setStatus({ kind: 'success', message: 'Entry added to your collection.' });
      formEl.reset();
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    } else if (result?.conflict) {
      // The stage already has an entry â€” ask how to proceed.
      setPending({ ...result, form, formEl });
    } else {
      setStatus({ kind: 'error', message: result?.error || 'Something went wrong.' });
    }

    setLoading(false);
  }

  async function handleChoice(mode) {
    if (!pending) return;
    setLoading(true);
    setStatus(null);

    const result = await doCreate(pending.form, mode);

    if (result?.ok) {
      setStatus({ kind: 'success', message: 'Entry added to your collection.' });
      pending.formEl.reset();
      if (fileRef.current) fileRef.current.value = '';
      setPending(null);
      router.refresh();
    } else if (result?.conflict) {
      setPending({ ...result, form: pending.form, formEl: pending.formEl });
    } else {
      setStatus({ kind: 'error', message: result?.error || 'Something went wrong.' });
      setPending(null);
    }

    setLoading(false);
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <h2>Add an entry</h2>

      {status && <p className={`notice notice--${status.kind}`}>{status.message}</p>}

      {pending && (
        <div className="choice-box" role="alert">
          <p>
            Stage <strong>{pending.existingStage}</strong> is already used by{' '}
            <strong>{pending.existingTitle}</strong>. What would you like to do?
          </p>
          <div className="choice-box__actions">
            <button
              type="button"
              className="btn btn--primary btn--small"
              disabled={loading}
              onClick={() => handleChoice('duplicate')}
            >
              Add duplicate
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              disabled={loading}
              onClick={() => {
                setPending(null);
              }}
            >
              Choose another stage
            </button>
          </div>
        </div>
      )}

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
            maxLength={80}
            placeholder="ឧ. ការចិញ្ចឹមដង្កូវនាង"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="entry-stage">
            Stage <small>(required)</small>
          </label>
          <select
            id="entry-stage"
            className="field__input"
            name="stage"
            required
          >
            <option value="">â€” Select a stage â€”</option>
            <option value="Silkworm">Silkworm</option>
            <option value="Cocoon">Cocoon</option>
            <option value="Thread">Thread</option>
            <option value="Cloth">Cloth</option>
          </select>
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

      <div className="field">
        <label className="field__label" htmlFor="entry-source">
          Source <small>(required â€” museum, farm, or origin credited)</small>
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
            Photo <small>(required â€” max 5 MB, JPG/PNG/WebP)</small>
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
        {loading ? 'Addingâ€¦' : 'Add to my collection'}
      </button>
    </form>
  );
}
