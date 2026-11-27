-- policies.sql
-- Live row-level security and storage policies, dumped from the running
-- Supabase project (pg_policies, schemas public and storage) on 27 Nov 2026.
--
-- To rebuild: run tables.sql first, then functions.sql (the policies call
-- is_reviewer()), then this file.
--
-- Notes
-- * Row-level security must be switched on for the policies to apply:
alter table public.entries enable row level security;
-- (reviewers also has RLS on, with NO policies on purpose; see
--  sprint3_moderation.sql. Only is_reviewer() can read it.)
-- * Uploads go to the storage bucket named "photos". Create that bucket in the
--   Supabase dashboard (Storage) and make it public, because the app builds
--   photo links with getPublicUrl(). The two "entry_images_*" policies below
--   belong to an older bucket called "entry-images" that the app no longer
--   uses. They are kept here because they are still live in the database.
-- * No keys, tokens or user ids belong in this file.

-- ---------------------------------------------------------------------
-- storage.objects: the "photos" bucket (current)
-- ---------------------------------------------------------------------
create policy "contributors delete their own photos" on storage.objects as PERMISSIVE for DELETE to authenticated
  using (((bucket_id = 'photos'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

create policy "contributors upload into their own folder" on storage.objects as PERMISSIVE for INSERT to authenticated
  with check (((bucket_id = 'photos'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

-- ---------------------------------------------------------------------
-- storage.objects: the "entry-images" bucket (older, no longer used by the app)
-- ---------------------------------------------------------------------
create policy entry_images_authenticated_upload on storage.objects as PERMISSIVE for INSERT to public
  with check (((bucket_id = 'entry-images'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

create policy entry_images_owner_delete on storage.objects as PERMISSIVE for DELETE to public
  using (((bucket_id = 'entry-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

create policy entry_images_public_read on storage.objects as PERMISSIVE for SELECT to public
  using ((bucket_id = 'entry-images'::text));

-- ---------------------------------------------------------------------
-- public.entries
-- ---------------------------------------------------------------------
create policy "anyone can read published entries" on public.entries as PERMISSIVE for SELECT to public
  using (((status = 'published'::text) OR (( SELECT auth.uid() AS uid) = user_id) OR ( SELECT is_reviewer() AS is_reviewer)));

create policy entries_delete_own on public.entries as PERMISSIVE for DELETE to public
  using (((is_seed = false) AND ((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT is_reviewer() AS is_reviewer))));

create policy "owners add their own entries" on public.entries as PERMISSIVE for INSERT to public
  with check (((( SELECT auth.uid() AS uid) = user_id) AND (status = 'pending'::text) AND (is_seed = false)));

create policy "owners edit their own entries" on public.entries as PERMISSIVE for UPDATE to public
  using (((( SELECT auth.uid() AS uid) = user_id) AND (is_seed = false)))
  with check (((( SELECT auth.uid() AS uid) = user_id) AND (is_seed = false) AND ((status = 'pending'::text) OR ( SELECT is_reviewer() AS is_reviewer))));
