-- sprint3_moderation.sql
-- Task 1: make moderation real in the database and codify the live state.
--
-- Run AFTER schema.sql, add_source_column.sql and sprint2_harden.sql, in the
-- Supabase SQL Editor. Safe to run twice (idempotent). Backward compatible with
-- the currently deployed app: deploy the JS changes AFTER this file is applied.
--
-- No keys, tokens or real user ids belong in this file (AGENTS.md rule 3).

begin;

-- 1) reviewers: codify live shape and lock it down
create table if not exists public.reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.reviewers enable row level security;
revoke all on table public.reviewers from anon, authenticated;
-- (no policies on purpose; reviewers are added by hand in the SQL Editor:
--  insert into public.reviewers (user_id) values ('<uuid>');  never commit a real uuid)

-- 2) entries: codify status + add audit columns
alter table public.entries add column if not exists status text not null default 'pending';
alter table public.entries add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.entries add column if not exists reviewed_at timestamptz;
alter table public.entries drop constraint if exists entries_status_check;
alter table public.entries add constraint entries_status_check
  check (status in ('pending','published','returned'));
-- safety backfill for a rebuild from scratch; no-op on live (all 8 seeds already published)
update public.entries set status = 'published' where is_seed and status = 'pending';
create index if not exists entries_status_seed_idx on public.entries (status, is_seed);
create index if not exists entries_user_id_idx on public.entries (user_id);

-- 2b) D2 (ENABLED): detach seed rows from their owner so that deleting an auth
--     user can never cascade-delete the 8 seed entries (entries.user_id is
--     ON DELETE CASCADE). Side effect: seeds no longer appear in that user's
--     /my-collection list. Idempotent: a second run updates 0 rows.
update public.entries set user_id = null where is_seed = true;

-- 3) least privilege on entries (RLS still applies; PostgREST never uses these)
revoke truncate, references, trigger on table public.entries from anon, authenticated;
revoke insert, update, delete on table public.entries from anon;

-- 4) functions (copy of live behaviour + hardening)
create or replace function public.is_reviewer()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.reviewers where user_id = (select auth.uid())); $$;
revoke all on function public.is_reviewer() from public;
grant execute on function public.is_reviewer() to anon, authenticated, service_role;

create or replace function public.review_entry(entry_id uuid, decision text)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_reviewer() then return false; end if;
  if decision not in ('published','returned') then return false; end if;
  update public.entries
     set status = decision, reviewed_by = (select auth.uid()), reviewed_at = now()
   where id = entry_id and status = 'pending' and is_seed = false;
  return found;
end;
$$;
revoke all on function public.review_entry(uuid, text) from public, anon;
grant execute on function public.review_entry(uuid, text) to authenticated;

-- 5) guard trigger: only constrains API roles; SQL Editor (postgres), SECURITY DEFINER
--    functions (review_entry) and service_role pass straight through.
--    MUST stay SECURITY INVOKER so current_user is the API role.
create or replace function public.entries_guard()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if current_user not in ('authenticated','anon') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_seed := false;
    new.reviewed_by := null;
    new.reviewed_at := null;
    return new;
  end if;
  -- UPDATE
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.is_seed is distinct from old.is_seed then
    raise exception 'id, user_id and is_seed are read-only' using errcode = '42501';
  end if;
  new.created_at  := old.created_at;
  new.reviewed_by := old.reviewed_by;
  new.reviewed_at := old.reviewed_at;
  return new;
end;
$$;
drop trigger if exists entries_guard on public.entries;
create trigger entries_guard before insert or update on public.entries
  for each row execute function public.entries_guard();

-- 6) policies: drop legacy + live names, recreate. Status rules unchanged from live.
drop policy if exists "entries_readable_by_all"            on public.entries;
drop policy if exists "entries_insert_own"                 on public.entries;
drop policy if exists "entries_update_own"                 on public.entries;
drop policy if exists "entries_delete_own"                 on public.entries;
drop policy if exists "anyone can read published entries"  on public.entries;
drop policy if exists "owners add their own entries"       on public.entries;
drop policy if exists "owners edit their own entries"      on public.entries;

create policy "anyone can read published entries" on public.entries for select
  using (status = 'published'
         or (select auth.uid()) = user_id
         or (select public.is_reviewer()));

create policy "owners add their own entries" on public.entries for insert
  with check ((select auth.uid()) = user_id and status = 'pending' and is_seed = false);

create policy "owners edit their own entries" on public.entries for update
  using ((select auth.uid()) = user_id and is_seed = false)
  with check ((select auth.uid()) = user_id and is_seed = false
              and (status = 'pending' or (select public.is_reviewer())));

create policy "entries_delete_own" on public.entries for delete
  using (is_seed = false
         and ((select auth.uid()) = user_id or (select public.is_reviewer())));

commit;


-- =====================================================================
-- ROLLBACK (COMMENTED). Restores the LIVE policies documented in
-- ARCHITECTURE.md section 2. To use it, remove the leading "-- " from
-- each line of the block below and run it in the SQL Editor.
--
-- Not reverted on purpose (additive and harmless): the reviewed_by and
-- reviewed_at columns, entries_status_check, the two indexes, the
-- reviewers lockdown and the entries grant revokes.
-- The user_id detach on seed rows (section 2b) cannot be undone by SQL
-- alone because the old owner ids are not recorded here. If ever needed,
-- re-attach by hand: update public.entries set user_id = '<owner uuid>' where is_seed;
-- =====================================================================
--
-- begin;
--
-- -- a) remove the guard trigger and its function
-- drop trigger if exists entries_guard on public.entries;
-- drop function if exists public.entries_guard();
--
-- -- b) drop the 4 new policies
-- drop policy if exists "anyone can read published entries" on public.entries;
-- drop policy if exists "owners add their own entries"      on public.entries;
-- drop policy if exists "owners edit their own entries"     on public.entries;
-- drop policy if exists "entries_delete_own"                on public.entries;
--
-- -- c) recreate the 4 live policies (no is_seed = false terms)
-- create policy "anyone can read published entries" on public.entries for select
--   using (status = 'published'
--          or auth.uid() = user_id
--          or public.is_reviewer());
--
-- create policy "owners add their own entries" on public.entries for insert
--   with check (auth.uid() = user_id and status = 'pending');
--
-- create policy "owners edit their own entries" on public.entries for update
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id and (status = 'pending' or public.is_reviewer()));
--
-- create policy "entries_delete_own" on public.entries for delete
--   using (auth.uid() = user_id or public.is_reviewer());
--
-- -- d) restore the live review_entry (sets status only; no audit columns, no seed check)
-- create or replace function public.review_entry(entry_id uuid, decision text)
-- returns boolean language plpgsql security definer set search_path = ''
-- as $$
-- begin
--   if not public.is_reviewer() then return false; end if;
--   if decision not in ('published','returned') then return false; end if;
--   update public.entries set status = decision
--    where id = entry_id and status = 'pending';
--   return found;
-- end;
-- $$;
-- revoke all on function public.review_entry(uuid, text) from public, anon;
-- grant execute on function public.review_entry(uuid, text) to authenticated, service_role;
--
-- commit;

-- =====================================================================
-- Optional D2 reference: ENABLED above in section 2b. The statement is:
--   update public.entries set user_id = null where is_seed;
-- =====================================================================

