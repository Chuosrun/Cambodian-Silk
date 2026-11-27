-- tables.sql
-- Live tables in the public schema, rebuilt from the running Supabase project
-- (columns from information_schema, constraints from pg_constraint) on 27 Nov 2026.
-- Meant for a FRESH project. Do not run it against the live database: the
-- tables already exist there.
--
-- Rebuild order:
--   1. this file (tables.sql)
--   2. functions.sql  (is_reviewer, review_entry, entries_guard)
--   3. policies.sql   (row-level security and storage policies)
--   4. create the storage bucket "photos" in the dashboard and make it public
--   5. add yourself as a reviewer by hand, with your own user id (never commit it):
--        insert into public.reviewers (user_id) values ('<your-user-uuid>');
--
-- Note: the 8 original entries were inserted separately (see schema.sql). They
-- have is_seed = true, status = 'published' and user_id = null.
-- No keys, tokens or user ids belong in this file.

create table if not exists public.entries (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  slug text not null,
  stage text not null default ''::text,
  title text not null default ''::text,
  khmer_title text not null default ''::text,
  description text not null default ''::text,
  contributor text not null default ''::text,
  place text not null default ''::text,
  image_url text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  source text default ''::text,
  is_seed boolean not null default false,
  status text not null default 'pending'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone
);

create table if not exists public.reviewers (
  user_id uuid not null
);

alter table public.entries add constraint entries_description_length CHECK ((char_length(TRIM(BOTH FROM description)) <= 2000));
alter table public.entries add constraint entries_khmer_title_length CHECK ((char_length(TRIM(BOTH FROM khmer_title)) <= 80));
alter table public.entries add constraint entries_pkey PRIMARY KEY (id);
alter table public.entries add constraint entries_place_length CHECK ((char_length(TRIM(BOTH FROM place)) <= 80));
alter table public.entries add constraint entries_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.entries add constraint entries_slug_key UNIQUE (slug);
alter table public.entries add constraint entries_source_length CHECK ((char_length(TRIM(BOTH FROM source)) <= 100));
alter table public.entries add constraint entries_stage_check CHECK ((stage = ANY (ARRAY['Silkworm'::text, 'Cocoon'::text, 'Thread'::text, 'Cloth'::text, ''::text])));
alter table public.entries add constraint entries_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'published'::text, 'returned'::text])));
alter table public.entries add constraint entries_title_length CHECK ((char_length(TRIM(BOTH FROM title)) <= 80));
alter table public.entries add constraint entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.reviewers add constraint reviewers_pkey PRIMARY KEY (user_id);
alter table public.reviewers add constraint reviewers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- ---------------------------------------------------------------------
-- Not part of the dump above. Copied from sprint3_moderation.sql so that a
-- rebuild matches the live project.
-- ---------------------------------------------------------------------

-- Row-level security on (the policies in policies.sql only apply when it is on).
alter table public.entries enable row level security;

-- reviewers: RLS on with NO policies, on purpose. Only is_reviewer() reads it.
alter table public.reviewers enable row level security;
revoke all on table public.reviewers from anon, authenticated;

-- Least privilege on entries.
revoke truncate, references, trigger on table public.entries from anon, authenticated;
revoke insert, update, delete on table public.entries from anon;

-- Indexes.
create index if not exists entries_status_seed_idx on public.entries (status, is_seed);
create index if not exists entries_user_id_idx on public.entries (user_id);

-- The guard trigger. Run this AFTER functions.sql, because it calls entries_guard().
--   drop trigger if exists entries_guard on public.entries;
--   create trigger entries_guard before insert or update on public.entries
--     for each row execute function public.entries_guard();
