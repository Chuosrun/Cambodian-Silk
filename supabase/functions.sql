-- functions.sql
-- Live functions in the public schema, dumped from the running Supabase
-- project (pg_get_functiondef) on 27 Nov 2026.
--
-- To rebuild: run tables.sql first, then this file, then policies.sql
-- (the policies call is_reviewer()).
--
-- Also create the trigger that runs entries_guard() after the tables exist.
-- It is not part of the function dump, so it is repeated here from
-- sprint3_moderation.sql:
--
--   drop trigger if exists entries_guard on public.entries;
--   create trigger entries_guard before insert or update on public.entries
--     for each row execute function public.entries_guard();
--
-- Add yourself as a reviewer by hand, with your own user id (never commit it):
--   insert into public.reviewers (user_id) values ('<your-user-uuid>');
--
-- No keys, tokens or user ids belong in this file.

CREATE OR REPLACE FUNCTION public.is_reviewer()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select exists (select 1 from public.reviewers where user_id = (select auth.uid())); $function$
;

CREATE OR REPLACE FUNCTION public.review_entry(entry_id uuid, decision text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.is_reviewer() then return false; end if;
  if decision not in ('published','returned') then return false; end if;
  update public.entries
     set status = decision, reviewed_by = (select auth.uid()), reviewed_at = now()
   where id = entry_id and status = 'pending' and is_seed = false;
  return found;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.entries_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

-- Grants (from sprint3_moderation.sql; the dump does not include them)
revoke all on function public.is_reviewer() from public;
grant execute on function public.is_reviewer() to anon, authenticated, service_role;
revoke all on function public.review_entry(uuid, text) from public, anon;
grant execute on function public.review_entry(uuid, text) to authenticated;
