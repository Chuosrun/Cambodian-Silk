-- ============================================================
-- Cambodian Silk Archives — Sprint 2 database setup
-- Paste this whole file into Supabase → SQL Editor → Run.
-- It is idempotent: safe to run more than once.
-- ============================================================

-- 1) Enable UUID generation
create extension if not exists "pgcrypto";

-- 2) The archive entries table.
--    Seed rows (Sprint 1's 8 entries) have user_id = NULL (owned by nobody).
--    Contributor rows belong to exactly one auth user (user_id).
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  slug text not null unique,
  stage text not null default '',
  title text not null default '',
  khmer_title text not null default '',
  description text not null default '',
  contributor text not null default '',
  place text not null default '',
  image_url text not null default '',
  created_at timestamptz not null default now()
);

-- 3) Row-Level Security: the actual security boundary.
alter table public.entries enable row level security;

-- Everyone (even anonymous visitors) can read.
create policy "entries_readable_by_all" on public.entries
  for select using (true);

-- Signed-in users can add rows that belong to themselves.
create policy "entries_insert_own" on public.entries
  for insert with check (auth.uid() = user_id);

-- Users can edit only their own rows.
create policy "entries_update_own" on public.entries
  for update using (auth.uid() = user_id);

-- Users can delete only their own rows.
create policy "entries_delete_own" on public.entries
  for delete using (auth.uid() = user_id);

-- 4) Public image storage bucket (for photo uploads).
insert into storage.buckets (id, name, public)
values ('entry-images', 'entry-images', true)
on conflict (id) do nothing;

-- Anyone can view uploaded images.
create policy "entry_images_public_read" on storage.objects
  for select using (bucket_id = 'entry-images');

-- Only signed-in users can upload.
create policy "entry_images_authenticated_upload" on storage.objects
  for insert with check (
    bucket_id = 'entry-images' and auth.role() = 'authenticated'
  );

-- Owners can delete their own uploads (first path segment = user id).
create policy "entry_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'entry-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5) Seed the 8 Sprint 1 entries.
insert into public.entries (slug, stage, title, khmer_title, description, contributor, place, image_url)
values
  ('slek-mon', '01', 'Young Silkworms Feeding', 'ដង្កូវនាងកំពុងស៊ីស្លឹកមន',
   'Newly hatched silkworms are placed in wide, flat bamboo trays and fed freshly chopped young mulberry leaves.',
   'Cambodian Silk Archives', 'Mulberry farms along the Mekong', '/images/01_Young_Silkworms_Feeding.jpg'),
  ('feeding-cycle', '02', 'The Feeding Cycle', 'វដ្តនៃការស៊ីស្លឹកមន',
   'For roughly 25 to 30 days, the worms eat relentlessly, grow rapidly, and shed their skin several times before pupating.',
   'Cambodian Silk Archives', 'Cambodian sericulture farms', '/images/01_Young_Silkworms_Feeding.jpg'),
  ('spinning-cocoons', '03', 'Spinning the Golden Cocoon', 'ការបង្វិលសំបុកសូត្រមាស',
   'Mature caterpillars move onto dried twigs or woven nesting frames and spin liquid fibroin around themselves in a continuous figure-eight pattern.',
   'Cambodian Silk Archives', 'Koh Oknha Tei', '/images/03_Spinning_Cocoons_Hanging.jpg'),
  ('golden-cocoons', '04', 'Golden Cocoons on Branches', 'សំបុកនាងមាសលើមែកឈើ',
   'Traditional Cambodian silkworms naturally produce vibrant golden-yellow casings, which are gathered after the pupae fully enclose themselves.',
   'Cambodian Silk Archives', 'Cambodia', '/images/04_Golden_Cocoons_on_Branches.jpg'),
  ('harvested-cocoons', '05', 'Harvested Cocoons', 'ការប្រមូលសំបុកសូត្រ',
   'The hardened cocoons are manually plucked from their branches and gathered in baskets before the extraction process begins.',
   'Cambodian Silk Archives', 'Koh Oknha Tei', '/images/05_Harvested_Cocoons_Basket.jpg'),
  ('boiling-cocoons', '06', 'Boiling and Extraction', 'ការដាំសំបុកសូត្រ',
   'Cocoons are submerged in boiling water over a charcoal or wood-fired stove. The heat prevents the pupa from damaging the silk and melts the sericin glue.',
   'Cambodian Silk Archives', 'Koh Dach', '/images/06_Boiling_Cocoons_Pot.jpg'),
  ('reeling-silk', '07', 'Reeling the Silk', 'ការស្រាវសូត្រ',
   'A weaver catches loose filaments from the hot water, twists threads from dozens of cocoons together, and hand-reels the strand onto a wooden spinning wheel.',
   'Cambodian Silk Archives', 'Koh Dach', '/images/07_Reeling_Silk_Spinning_Wheel.jpg'),
  ('drying-silk-yarn', '08', 'Drying Finished Silk Yarn', 'ការហាលអំបោះសូត្រ',
   'Raw silk skeins are washed to remove residual gum, hung in the sun to dry, and sometimes dyed before being loaded onto a traditional loom.',
   'Cambodian Silk Archives', 'Cambodia', '/images/08_Drying_Finished_Silk_Yarn.jpg')
on conflict (slug) do nothing;