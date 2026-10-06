-- ============================================================
-- Cambodian Silk Archives — Sprint 2 hardening migration
-- Run AFTER schema.sql. Idempotent (safe to re-run).
-- Addresses: is_seed column, lifecycle enum stages, atomic
-- reorder function, and re-inserts the lost seed entry.
-- ============================================================

-- 1) is_seed column — distinguishes original archive entries from
--    user-submitted ones. Seed entries are excluded from bulk
--    operations like stage-reorder even if they share a user_id.
alter table public.entries
  add column if not exists is_seed boolean not null default false;

-- 2) Fix stage values: seed entries' numeric codes were scrambled
--    by a non-atomic reorder bug. Reset them by slug to the correct
--    lifecycle stage name, ignoring whatever number they currently hold.
update public.entries set stage = 'Silkworm' where slug = 'slek-mon';
update public.entries set stage = 'Silkworm' where slug = 'feeding-cycle';
update public.entries set stage = 'Cocoon'   where slug = 'spinning-cocoons';
update public.entries set stage = 'Cocoon'   where slug = 'golden-cocoons';
update public.entries set stage = 'Cocoon'   where slug = 'harvested-cocoons';
update public.entries set stage = 'Thread'   where slug = 'reeling-silk';
update public.entries set stage = 'Cloth'    where slug = 'drying-silk-yarn';

-- 3) Mark all seed entries as seed (user-submitted entries get false
--    by default from the app).
update public.entries set is_seed = true
where slug in (
  'slek-mon', 'feeding-cycle', 'spinning-cocoons',
  'golden-cocoons', 'harvested-cocoons', 'reeling-silk',
  'drying-silk-yarn'
);

-- 4) Catch-all: map any remaining numeric stages (from user-created entries
--    that predate the migration) to their correct lifecycle name, so the
--    check constraint below cannot fail on user data.
update public.entries set stage = 'Silkworm' where stage in ('01', '02');
update public.entries set stage = 'Cocoon'   where stage in ('03', '04', '05');
update public.entries set stage = 'Thread'   where stage in ('06', '07');
update public.entries set stage = 'Cloth'    where stage = '08';

-- 5) Stage check constraint — only valid lifecycle names are stored.
--    The app also validates, but this is the database-level guarantee.
alter table public.entries
  drop constraint if exists entries_stage_check;

alter table public.entries
  add constraint entries_stage_check
  check (stage in ('Silkworm', 'Cocoon', 'Thread', 'Cloth', ''));

-- 6) Re-insert the missing seed entry (Boiling and Extraction).
--    It was lost when a non-atomic reorder committed the stage bumps
--    before the insert failed — the original Bug Zero.
--    Stage = 'Thread' because boiling/extraction sits between harvest
--    (Cocoon) and reeling (Thread).
insert into public.entries (
  slug, stage, title, khmer_title, description,
  contributor, place, image_url, source, user_id, is_seed
)
select
  'boiling-cocoons',
  'Thread',
  'Boiling and Extraction',
  'ការដាំសំបុកសូត្រ',
  'Cocoons are submerged in boiling water over a charcoal or wood-fired stove. The heat softens the sericin gum, allowing the delicate fibres to be unwound, and prevents the pupa from cutting through the silk - a critical step between harvest and reeling.',
  'Cambodian Silk Archives',
  'Koh Dach',
  '',           -- ← image_url — replace after re-uploading the photo (original was /images/06_Boiling_Cocoons_Pot.jpg)
  '',           -- ← source — fill in a museum or farm credit if you have one
  user_id,
  true
from public.entries
where slug = 'slek-mon'  -- borrow the user_id from any claimed seed entry
limit 1
on conflict (slug) do nothing;