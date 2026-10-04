'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createEntry, updateEntry } from '../app/actions/entries';

const VALID_STAGES = ['Silkworm', 'Cocoon', 'Thread', 'Cloth'];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

function validateField(name, value) {
  const trimmed = (value || '').trim();
  switch (name) {
    case 'title':
      if (!trimmed) return 'Title is required.';
      if (trimmed.length > 80) return 'Title must be 80 characters or fewer.';
      return null;
    case 'source':
      if (!trimmed) return 'Source (museum, farm, or origin) is required.';
      if (trimmed.length > 100) return 'Source must be 100 characters or fewer.';
      return null;
    case 'description':
      if (!trimmed) return 'Description is required.';
      if (trimmed.length < 300) return `Description needs at least 300 characters (${trimmed.length} so far).`;
      if (trimmed.length > 400) return 'Description must be 400 characters or fewer.';
      return null;
    case 'stage':
      if (!trimmed) return 'Stage is required.';
      if (!VALID_STAGES.includes(trimmed)) return 'Stage must be one of: Silkworm, Cocoon, Thread, Cloth.';
      return null;
    case 'khmer_title':
      if (trimmed.length > 80) return 'Khmer title must be 80 characters or fewer.';
      return null;
    case 'place':
      if (trimmed.length > 80) return 'Place must be 80 characters or fewer.';
      return null;
    default:
      return null;
  }
}

export default function ContributeForm({ user, entry }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [conflict, setConflict] = useState(null);

  const isEdit = Boolean(entry);

  function clearErrors() {
    setFieldErrors({});
    setGeneralError(null);
    setConflict(null);
  }
async function handleSubmit(event) {
    event.preventDefault();
    clearErrors();
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    // Per-field validation
    const errors = {};
    for (const field of ['title', 'source', 'description', 'stage', 'khmer_title', 'place']) {
      const err = validateField(field, formData.get(field));
      if (err) errors[field] = err;
    }

    // File validation — required on create, optional on edit
    const file = fileRef.current?.files?.[0];
    if (!file && !isEdit) {
      errors.image = 'At least one photo is required (JPG, PNG, or WebP).';
    } else if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.image = 'Photo must be JPG, JPEG, PNG, or WebP.';
      } else if (file.size > MAX_SIZE) {
        errors.image = 'Photo must be under 5 MB.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    // Upload photo (if provided)
    let imageUrl = entry?.image_url || '';
    if (file) {
      try {
        const supabase = createClient();
        const nameParts = file.name.split('.');
        const ext = nameParts.length > 1 ? nameParts.pop() : 'jpg';
        const path = `${user.id}/${crypto.randomUUID()}.${ext.toLowerCase()}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(path, file);

        if (uploadError) {
          console.error('Upload failed:', uploadError);
          setGeneralError('Could not upload the photo. Try a different image or check your connection.');
          setLoading(false);
          return;
        }

        imageUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
      } catch (err) {
        console.error('Upload exception:', err);
        setGeneralError('Something went wrong with the photo upload. Please try again.');
        setLoading(false);
        return;
      }
    }

    formData.set('image_url', imageUrl);

    // Save
    try {
      let result;
      if (isEdit) {
        formData.set('slug', entry.slug);
        result = await updateEntry(formData);
      } else {
        result = await createEntry(formData, { mode: 'normal' });
      }

      if (result?.error) {
        console.error('Save error:', result.error);
        setGeneralError('Something went wrong while saving. Please try again.');
        setLoading(false);
        return;
      }

      if (result?.conflict) {
        setConflict(result);
        setLoading(false);
        return;
      }

      // Success
      const resultSlug = result?.slug || entry?.slug;
      if (resultSlug) {
        router.push(`/entries/${resultSlug}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('Save exception:', err);
      setGeneralError('Something went wrong while saving. Please try again.');
      setLoading(false);
    }
  }

  async function handleDuplicate() {
    clearErrors();
    setLoading(true);

    const form = document.querySelector('.entry-form');
    const formData = new FormData(form);
    formData.set('image_url', entry?.image_url || '');

    const result = await createEntry(formData, { mode: 'duplicate' });

    if (result?.error) {
      console.error('Save error:', result.error);
      setGeneralError('Something went wrong while saving. Please try again.');
      setLoading(false);
      return;
    }

    if (result?.slug) {
      router.push(`/entries/${result.slug}`);
    } else {
      router.refresh();
    }
  }
return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? 'Edit entry' : 'Add an entry'}</h2>

      {generalError && (
        <p className="notice notice--error">{generalError}</p>
      )}

      {conflict && (
        <div className="choice-box" role="alert">
          <p>
            You already have an entry at <strong>{conflict.existingStage}</strong> stage
            ({conflict.existingTitle}). Add another at the same stage?
          </p>
          <div className="choice-box__actions">
            <button type="button" className="btn btn--primary btn--small" disabled={loading} onClick={handleDuplicate}>
              Add duplicate
            </button>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setConflict(null)}>
              Choose another stage
            </button>
          </div>
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor="contribute-title">
          Title <small>(required — 80 characters max)</small>
        </label>
        <input
          id="contribute-title"
          className="field__input"
          name="title"
          defaultValue={entry?.title || ''}
          placeholder="e.g. Feeding the silkworms"
          required
        />
        {fieldErrors.title && <p className="field__error">{fieldErrors.title}</p>}
      </div>

      <div className="entry-form__row">
        <div className="field">
          <label className="field__label" htmlFor="contribute-khmer">
            Khmer title <small>(80 characters max)</small>
          </label>
          <input
            id="contribute-khmer"
            className="field__input"
            name="khmer_title"
            lang="km"
            defaultValue={entry?.khmer_title || ''}
            placeholder="ឧ. ការចិញ្ចឹមដង្កូវនាង"
          />
          {fieldErrors.khmer_title && <p className="field__error">{fieldErrors.khmer_title}</p>}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="contribute-stage">
            Stage <small>(required)</small>
          </label>
          <select id="contribute-stage" className="field__input" name="stage" required>
            <option value="">— Select a stage —</option>
            {VALID_STAGES.map((s) => (
              <option key={s} value={s} selected={entry?.stage === s}>{s}</option>
            ))}
          </select>
          {fieldErrors.stage && <p className="field__error">{fieldErrors.stage}</p>}
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="contribute-description">
          Description <small>(required — 300 to 400 characters)</small>
        </label>
        <textarea
          id="contribute-description"
          className="field__input"
          name="description"
          rows={5}
          defaultValue={entry?.description || ''}
          placeholder="Describe what you observed, documented, or learned at this stage."
        />
        {fieldErrors.description && <p className="field__error">{fieldErrors.description}</p>}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="contribute-source">
          Source <small>(required — museum, farm, or origin credited)</small>
        </label>
        <input
          id="contribute-source"
          className="field__input"
          name="source"
          defaultValue={entry?.source || ''}
          placeholder="e.g. National Museum of Cambodia"
          required
        />
        {fieldErrors.source && <p className="field__error">{fieldErrors.source}</p>}
      </div>

      <div className="entry-form__row">
        <div className="field">
          <label className="field__label" htmlFor="contribute-place">
            Place <small>(80 characters max)</small>
          </label>
          <input id="contribute-place" className="field__input" name="place"
            defaultValue={entry?.place || ''} placeholder="e.g. Koh Dach" />
          {fieldErrors.place && <p className="field__error">{fieldErrors.place}</p>}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="contribute-image">
            Photo <small>{isEdit ? '(optional — leave empty to keep the current one)' : '(required — max 5 MB, JPG/PNG/WebP)'}</small>
          </label>
          <input id="contribute-image" className="field__input" type="file"
            accept=".jpg,.jpeg,.png,.webp" ref={fileRef} />
          {fieldErrors.image && <p className="field__error">{fieldErrors.image}</p>}
        </div>
      </div>

      <button type="submit" className="btn btn--primary" disabled={loading}>
        {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add to archive'}
      </button>
    </form>
  );
}