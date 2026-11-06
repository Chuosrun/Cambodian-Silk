# ARCHITECTURE.md - Cambodian Silk Archives

Status: Architect Briefing, updated with LIVE Supabase findings (preflight 1 + preflight 2).
Scope: what the system really is today, what is wrong, and the 3-task roadmap.
The build spec for Roadmap Task 1 lives in `implementation_plan.md`.

Conventions to respect in every task (from repo history and AGENTS.md):
- Only dependencies allowed: `next`, `react`, `react-dom`, `@supabase/supabase-js`, `@supabase/ssr`. No new packages.
- Rule 3: no keys, tokens, passwords in any committed file. Config lives in `.env.local` and Vercel env vars. Never use or add a service-role key.
- ASCII only in source files, except Khmer text. The repo history has three "replace em dashes" fix commits for mojibake. Do not type em dashes or the ellipsis character.
- Commit messages end with `[AI-assisted]`.
- Windows + PowerShell. Existing files mix CRLF/LF; keep each file's current line endings.

---

## 1. Stack (what is actually implemented)

| Layer | Reality |
|---|---|
| Framework | Next.js 15 App Router, plain JS (`.js`), `@/` alias via `jsconfig.json`. Server Actions for writes. |
| Styling | Hand-written `app/globals.css` + CSS modules (`EntryCard.module.css`, `CoverImage.module.css`). No Tailwind, no UI kit. |
| Auth | Supabase email + password. Email confirmation handled by `app/auth/confirm/route.js`. Session refresh in `middleware.js`. |
| Route protection | `middleware.js` matcher covers ONLY `/my-collection`. `/my-entries`, `/contribute`, `/edit/[slug]`, `/review` guard themselves inside the page. |
| DB | Supabase Postgres. Tables: `entries`, `reviewers`. RLS enabled on both. |
| Storage | Browser uploads straight to bucket `photos`. `supabase/schema.sql` defines bucket `entry-images`. They do not match (Task 2). |
| Secrets | `.env.local` is git-ignored and untracked. It holds only URL, publishable key, site URL. Rule 3 holds. |
| Scripts | `dev`, `build`, `start` only. There is no lint script and no test script. |

## 2. LIVE database state (verified, supersedes the repo SQL files)

`supabase/*.sql` in the repo is OUT OF DATE. The live database was changed by hand in the dashboard.

**`public.entries` columns:** id, user_id (nullable, FK auth.users ON DELETE CASCADE), slug (unique), stage, title, khmer_title, description, contributor, place, image_url, source (nullable, default ''), is_seed, status (default 'pending'), created_at.
Not present yet: `reviewed_by`, `reviewed_at`.

**`public.reviewers`:** one column `user_id`. RLS on, zero policies. 1 reviewer row (the project owner).
Table grants: anon and authenticated hold ALL privileges (INSERT/UPDATE/DELETE/TRUNCATE...). RLS with no policies blocks row access through the API today, so this is not exploitable now, but it is one mistaken policy away from letting anyone make themselves a reviewer.

**Live RLS policies on `entries` (exactly 4, all restrictive):**

| Policy | Cmd | Rule |
|---|---|---|
| anyone can read published entries | SELECT | `status='published' OR auth.uid()=user_id OR is_reviewer()` |
| owners add their own entries | INSERT | check `auth.uid()=user_id AND status='pending'` |
| owners edit their own entries | UPDATE | using `auth.uid()=user_id`; check `auth.uid()=user_id AND (status='pending' OR is_reviewer())` |
| entries_delete_own | DELETE | `auth.uid()=user_id OR is_reviewer()` |

**Live functions:**
- `is_reviewer()` - SQL, STABLE, SECURITY DEFINER, `search_path ''`. EXECUTE: PUBLIC, anon, authenticated, service_role.
- `review_entry(entry_id uuid, decision text)` - plpgsql, SECURITY DEFINER, `search_path ''`. Sets `status` only, where `status='pending'`. EXECUTE: authenticated, service_role (no PUBLIC, no anon - good).
- No triggers on `entries`.

**Live CHECK constraints on `entries`:** title <= 80 chars, khmer_title <= 80, place <= 80, source <= 100, description <= 2000 chars, stage in (Silkworm, Cocoon, Thread, Cloth, ''), status in (pending, published, returned).

**Data:** 8 rows, all `is_seed=true`, all `published`, ALL 8 OWNED by a user (user_id not null), none with an empty image. No contributor rows yet.

## 3. Feature state

### 3a. "Worm-to-Silk" showcase
Flow: `app/page.js` -> `lib/data.js getArchiveEntries()` (status='published' AND is_seed=true, sorted Silkworm -> Cocoon -> Thread -> Cloth) -> `app/components/ArchiveGrid.js` (hero, search, stage strip, filter chips, `EntryCard` grid) -> `/entries/[id]` detail.
Reality: it is a filterable card list. The "stage strip" (`ArchiveGrid.js` 164-179) is a second set of filter buttons, not a step-by-step process view. It works, but it is not yet "interactive process" storytelling. (Roadmap Task 3.)

### 3b. User account + product collection
Flow: `/signup` -> email confirm (`/auth/confirm`) -> `/login` -> `/my-collection` (`EntryForm.js` uploads the photo to storage from the browser, then server action `createEntry`) -> row inserted `pending` -> reviewer opens `/review` -> `ReviewCard.js` calls RPC `review_entry` (publish / return) -> published rows appear on `/products` -> owner sees status on `/my-entries`; edit goes through `ContributeForm.js` + `updateEntry`, which sends the row back to `pending` unless the editor is a reviewer.
Works end to end: signup/login/logout, create/edit/delete with server-side validation, daily limit (10) and total cap (50), review queue, status badges, products/homepage split, seed delete protection in app code.

## 4. Findings (corrected against the live DB)

### Corrections to my first briefing
| First briefing said | Live reality |
|---|---|
| Public can read pending entries (`select using (true)`) | FALSE. The live SELECT policy is published OR owner OR reviewer. `/entries/[id]` is already protected by RLS. |
| Any user can self-publish by PATCHing `status` | FALSE. Live INSERT/UPDATE checks force `pending` for non-reviewers. |
| `boiling-cocoons` has an empty image | FALSE live. All 8 seeds have images. Only the repo SQL is stale. |
| `is_reviewer` / `review_entry` missing | They exist live and are well written. They are only missing from the repo. |

### Still real (ranked)
| ID | Sev | Finding | Where |
|---|---|---|---|
| F1 | High | `is_seed` is not protected by the DB. A user can INSERT or UPDATE `is_seed=true` on their own row. If a reviewer publishes it, it lands on the homepage lifecycle grid. | live INSERT/UPDATE policies; `lib/data.js:34` trusts the flag |
| F2 | High | Seed rows are editable and deletable through the REST API by their owner (all 8 are owned). Editing one forces `pending`, so it vanishes from the homepage. `/edit/[slug]` and `updateEntry` have no seed guard. Delete is guarded only in app code. | `app/edit/[slug]/page.js:28`, `app/actions/entries.js:196-201`, live DELETE policy |
| F3 | High | Cascade hazard: all 8 seeds are owned and `entries.user_id` is `ON DELETE CASCADE`. Deleting that auth user deletes the whole archive. | live FK `entries_user_id_fkey` |
| F4 | High | Open redirects. `next` is trusted and passed to `new URL(next, request.url)` / `router.push(next)`. `type` goes to `verifyOtp` unchecked. | `app/auth/confirm/route.js:11-12,16,18`; `app/login/LoginForm.js:10,39` |
| F5 | Med | The `reviewers` table grants ALL to anon/authenticated. It is safe today only because RLS has no policies. | live grants |
| F6 | Med | The repo no longer describes the live DB (policies, `status`, `reviewers`, both functions are dashboard-only). A rebuild from the repo yields an insecure DB. | `supabase/schema.sql` |
| F7 | Med | No audit trail on review: `review_entry` records neither reviewer nor time. It also does not exclude seeds. | live function |
| F8 | Med | Reviewer Delete on `/review` is redirected to `/my-collection` and the success message is lost. | `app/actions/entries.js:271`, `components/ReviewCard.js:76-86` |
| F9 | Med | App validation is looser than the DB constraints: the app allows 300 words but the DB caps description at 2000 characters (Khmer has no spaces, so word count is meaningless for it). `khmer_title` and `place` lengths are not validated server-side. A violation returns the raw Postgres message to the user. | `app/actions/entries.js:42-45,114-116,124,203` |
| F10 | Low | The 50-entry cap check fails open when its query errors. | `app/actions/entries.js:105` |
| F11 | Low | `getArchiveEntries` swallows every error and returns `[]`, so a DB outage looks like "no entries match". | `lib/data.js:37-39` |
| F12 | Low | `updateEntry` does not revalidate `/products` or `/my-entries`. | `app/actions/entries.js:211-213` |

### Task 1 status (SQL applied in Supabase, JS in the repo)
- F1 FIXED: `entries_guard` trigger forces `is_seed=false` on API inserts and blocks `is_seed` changes; policies require `is_seed = false`.
- F2 FIXED: update and delete policies exclude seed rows; `/edit/[slug]` shows a notice for seeds and `updateEntry` adds `.eq('is_seed', false)`.
- F3 FIXED: seed rows detached (`user_id = null`), so deleting an auth user can no longer cascade-delete them.
- F4 FIXED: `lib/safe-redirect.js` (`safeNext`) is used in the login form, `/auth/confirm` and `deleteEntry`; OTP `type` is allow-listed.
- F5 FIXED: `revoke all on public.reviewers from anon, authenticated` (RLS on, no policies).
- F6 FIXED: `supabase/sprint3_moderation.sql` codifies reviewers, status, audit columns, both functions, the trigger and all 4 policies; `schema.sql` points to it.
- F7 FIXED: `review_entry` records `reviewed_by` and `reviewed_at` and skips seed rows.
- F8 FIXED: reviewer Delete on `/review` sends `return_to=/review` and stays on `/review`.
- F9 FIXED (validation part): 2000-character description cap, 80-character `khmer_title` and `place` caps, and friendly errors instead of raw Postgres text. Word-count-vs-Khmer rule still stands as an app-level limit only.
- F10 FIXED: the 50-entry cap check now fails closed.
- F11 FIXED: `getArchiveEntries` and `getEntryBySlug` log errors with `console.error` (they still return `[]` / `null`).
- F12 FIXED: `updateEntry` revalidates `/products` and `/my-entries`.

### Backlog (not in Task 1)
- Storage: bucket mismatch `photos` vs `entry-images`; 5 MB / MIME limits only in the browser; `image_url` accepted as any string; orphaned files after delete, replace, or failed create; two duplicated upload code paths (`app/my-collection/EntryForm.js:61-71`, `components/ContributeForm.js:106-119`).
- "Return with feedback" is promised on `/review` but not built (`ReviewCard.js` `noteRef` unused; the RPC takes no note).
- `contributor` is free text writable by the owner (impersonation). It needs an auth-derived value.
- `/entries/[id]` has no `generateMetadata` (no share preview). The hero collage uses `<img>` on desktop only.
- `middleware.js` protects only `/my-collection`; the page-level `redirect('/login')` drops the `next` param.
- `SiteNav` calls `rpc('is_reviewer')` on every page render.
- `schema.sql` "idempotent" claim is false (`create policy` without `drop policy if exists`).
- The rate limit day boundary uses UTC (resets 07:00 Cambodia time).

## 5. Prioritized roadmap

### Task 1 (URGENT): Make moderation real and codified in the database
Fixes F1-F8, the validation part of F9, and F10-F12. Adds `supabase/sprint3_moderation.sql` (idempotent), a trigger guard, tightened policies, audit columns, `reviewers` lockdown, the `safeNext` redirect helper, and seed guards in the app. Full spec: `implementation_plan.md`.

### Task 2: Storage correctness
Pick one bucket (`entry-images`) and codify it in SQL with `file_size_limit` and `allowed_mime_types`. Validate `image_url` server-side (it must be inside our bucket and the user's own folder). Delete orphaned files on delete, replace and failed create. Merge the two upload code paths into one helper.

### Task 3: Worm-to-Silk showcase + share links + return feedback
Build an ordered, interactive process view for the four stages. Add `generateMetadata` + Open Graph for entry pages. Add a `review_note` column, an RPC parameter, and display in `/my-entries`.

## 6. Decisions already made
- A reviewer MAY publish their own entries (needed to test the full flow with one account).
- Order of work: Task 1, then Task 2, then Task 3.

## 7. Open decision for the owner (not blocking Task 1)
D2: DECIDED and applied. The 8 seed rows are detached from the user (`update public.entries set user_id = null where is_seed = true;`, section 2b of `sprint3_moderation.sql`) to remove the cascade hazard (F3). Side effect: seeds no longer appear in that user's `/my-collection` list.



