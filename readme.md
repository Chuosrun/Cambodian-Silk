# Cambodian Silk Archives

A bilingual (Khmer and English) archive of how Cambodia's naturally golden silk, Tromol Meas, is made, from mulberry-fed silkworm to finished cloth.

- Live site: https://cambodian-silk.vercel.app/
- Repo: https://github.com/Chuosrun/Cambodian-Silk

Lines marked FILL IN or UNSURE are things the code cannot tell me. I have to answer them myself before submitting.

---

## 1. What this is

The Cambodian Silk Archives documents the lifecycle of Tromol Meas, Cambodia's rare golden raw silk, using knowledge from silkworm farmers and mulberry cultivators on Koh Oknha Tei and Koh Dach. Eight original entries walk through four stages (Silkworm, Cocoon, Thread, Cloth). Anyone can browse and search them without an account. Signed-in contributors can add their own entries with a photo, and a reviewer reads each one before the public can see it.

## 2. Who it's for

People in Cambodia who want to see, and add to, the record of how their own silk is made: farmers, weavers, and students and relatives of both. Things I changed because of them:

- **Khmer first.** Every original entry has a Khmer title beside the English one. The contribution form shows validation errors in English and Khmer. The "waiting for review" message and the status labels on `/my-entries` are bilingual. Dates use the Khmer locale when the browser language is Khmer.
- **Phones first.** The layout is checked at 375px, 768px and 1280px. On phones the hero photo collage is not rendered at all, so those images are never downloaded on a slow connection. Letter-spacing on the Khmer eyebrow text is removed on mobile, because spaced-out Khmer falls apart.
- **No name rules.** There is no first-name and last-name split anywhere. The contributor credit comes from the account's display name, and falls back to "Anonymous collector" when none is set (`app/actions/entries.js`). That fallback means a contributor with no display name is not credited by name, which I list in section 6.
- **Photos are capped.** Uploads are limited to JPG, PNG and WebP at 5 MB, checked in the form and again by the storage bucket.
- **Credit is shown.** Each entry shows a source line (hidden when empty) and the contributor. Section 6 lists the gaps that remain.

## 3. How it works

**Stack:** Next.js 15 (App Router) on Vercel. Supabase provides accounts (Auth), data (Postgres) and photos (Storage). The only dependencies are `next`, `react`, `react-dom`, `@supabase/supabase-js` and `@supabase/ssr`.

**Tables**

| Table | Purpose |
|---|---|
| `entries` | Every entry. Columns: `id`, `user_id` (owner, references `auth.users`), `slug` (unique), `stage`, `title`, `khmer_title`, `description`, `contributor`, `place`, `image_url`, `source`, `is_seed`, `status`, `reviewed_by`, `reviewed_at`, `created_at` |
| `reviewers` | The list of user ids allowed to review. Row-level security is on with no policies, and table privileges are revoked from `anon` and `authenticated`, so the API cannot read or write it. Only the SQL Editor can add a reviewer. |

**Constraints on `entries`:** `stage` must be Silkworm, Cocoon, Thread, Cloth or empty. `status` must be `pending`, `published` or `returned`, and new rows default to `pending`.

**The three statuses**

| Status | Meaning | Who can see it |
|---|---|---|
| `pending` | Submitted, waiting for a reviewer | Its owner and reviewers |
| `published` | Approved | Everyone, including logged-out visitors |
| `returned` | A reviewer sent it back | Its owner and reviewers |

**Policies on `entries`** (from `supabase/sprint3_moderation.sql`)

- **Select:** `status = 'published'`, or you own the row, or you are a reviewer.
- **Insert:** you must be the owner, `status` must be `pending`, and `is_seed` must be false.
- **Update:** you must own the row and it must not be a seed row. The result must be `pending` unless you are a reviewer.
- **Delete:** the row must not be a seed row, and you must be the owner or a reviewer.

**Functions:** `is_reviewer()` answers "am I on the list?". `review_entry(entry_id, decision)` moves a pending, non-seed entry to `published` or `returned` and records `reviewed_by` and `reviewed_at`. Both are `security definer` with an empty `search_path`.

**Trigger:** `entries_guard` runs on insert and update for the API roles. It forces `is_seed` to false on insert, and on update it makes `id`, `user_id` and `is_seed` read-only and keeps `created_at`, `reviewed_by` and `reviewed_at` unchanged.

**Pages**

| Route | What it shows |
|---|---|
| `/` | The 8 original entries (`is_seed` and published), with client-side search and stage filters |
| `/products` | Published contributor entries (`is_seed` false) |
| `/entries/[id]` | One entry. Edit and Delete show only for the owner, and Delete also for reviewers. |
| `/contribute`, `/my-collection` | Add an entry with a photo |
| `/edit/[slug]` | Edit your own entry |
| `/my-entries` | Your entries with their review status |
| `/review` | Reviewer-only queue: pending entries with Publish, Return and Delete. Non-reviewers get a 404. |

**Photos:** new uploads go to the `photos` bucket at `<user id>/<random uuid>.<ext>`. The bucket is public to read, limited to images under 5 MB, and its policies only allow writing into your own folder. The 8 original photos live in `public/images/`. An older `entry-images` bucket from Sprint 2 still exists but new uploads no longer use it.

## 4. Security decisions

**The gate.** `review_entry` lives in the database, not in the interface. It checks `is_reviewer()` first, refuses any decision except `published` or `returned`, and only touches rows that are `pending` and not seed rows. A contributor cannot publish their own entry because three things refuse it on their own: the insert policy requires `pending`, the update policy refuses any non-pending result from a non-reviewer, and the `reviewers` table cannot be written through the API.

**What a hidden Publish button does and doesn't protect.** Hiding the Review link, and returning a 404 on `/review` for non-reviewers, is politeness. It keeps honest users from seeing a screen they can't use. It protects nothing, because anyone can open the browser console and call the API directly. The database refusing is the actual protection, which is why every rule above is written as SQL.

**Every write checks that a row came back.** When row-level security refuses an update or delete, Supabase reports success with zero rows changed. The edit and delete code checks for a returned row and shows "That change wasn't saved" when there isn't one.

**Decisions the briefs left to me**

- **What a returned entry says.** The contributor sees the entry marked "Returned" (with a Khmer label) on `/my-entries`, and the entry page says "Returned by a reviewer. Only you and reviewers can see this entry." There is no reviewer note, because I never added a note column. A returned contributor is not told why. This is a known gap.
- **Editing sends an entry back to review.** When a non-reviewer edits a published entry it becomes `pending` and leaves the public shelf, so a published entry cannot be quietly changed into something else.
- **Reviewers can take down published entries by deleting them.** A reviewer cannot edit someone else's entry, and `review_entry` only works on pending rows, so deletion is the only takedown tool. I chose that so a reviewer can remove something harmful without being able to rewrite a contributor's words.
- **Reviewers cannot touch the 8 original entries.** Seed rows are excluded from `review_entry` and from the update and delete policies. Their owner link was also removed, so deleting an account can never cascade-delete the original archive.
- **Search never shows pending entries.** Search runs on the same published-only list as the home page. Contributors see their own pending entries only on `/my-entries`.
- **Limits.** A contributor can add 10 entries per day and 50 in total, checked in the server action. If the count query fails, the entry is refused instead of skipping the limit.

**Known weaknesses:** no reviewer note on returned entries, photos left in storage after an entry is deleted, and Khmer wording that no native speaker has checked yet.

## 5. AI use

All AI work went through Cline in VS Code. Two models were used. **DeepSeek V4 Flash** wrote the code changes. **Claude Sonnet 5.5** ran the security and audit passes, reading the full codebase afterward to find gaps the first model missed. I ran the SQL and the console attacks myself in the Supabase dashboard and the browser, so neither model touched the live database.

| Model | Task | Verdict |
|---|---|---|
| DeepSeek V4 Flash | Visual design pass: tokens, hero, cards, responsive grid | Kept. I adjusted spacing and the mobile grid after testing at 375px. |
| DeepSeek V4 Flash | Contribution form, edit and delete actions, row-returned checks | Kept the structure. I changed the description rule to "no minimum, 300 words maximum" after the first version required 300 to 400 characters. |
| DeepSeek V4 Flash | Review queue (`/review`, Publish, Return, Delete) | Kept. I changed the Delete action's dynamic import to a static import, because the dynamic version fails for server actions. |
| DeepSeek V4 Flash | Bilingual validation messages | **Rewrote.** The first Khmer strings were garbled characters, not real Khmer. I only caught it by reading them. I replaced all seven, and they still need a native speaker. |
| DeepSeek V4 Flash | Cleanup of corrupted characters (em dashes and a Khmer placeholder saved with bad bytes) | Kept. Em dashes became plain hyphens and the file was re-saved without a BOM. |
| DeepSeek V4 Flash | Checking my partner's three code review findings | Kept. All three were real and are fixed: a daily limit that was skipped when the count query failed, an upload policy not scoped to the user's folder, and a hard-coded `en-GB` date. |
| DeepSeek V4 Flash | Planning pass that mapped the codebase and led to `sprint3_moderation.sql` | Partly rejected. It first claimed anyone could read pending entries and self-publish. The live database already blocked both, so I dropped that plan and kept the smaller one that records the live policies and adds the seed guards. |
| Claude Sonnet 5.5 | Security and audit review of the whole project after building was done: checked RLS policies against the live DB, listed gaps (orphaned photos, English-only nav, missing reviewer note column), verified the `review_entry` function cannot be called by a non-reviewer, and confirmed no secrets in the git history. | Kept. Its findings match what I already knew from the partner code review. It did not flag anything new that the code review missed. |

**How I checked the work:** I read every diff and ran `npm run build`. I compared policy names against `pg_policies` in the live database before running any SQL. I attacked my own site from a second account in the browser console (insert with `published`, update to `published`, `review_entry`, insert into `reviewers`, and a logged-out read of unpublished rows). A classmate also reviewed the code.

My Prompt Journal has the individual prompts in more detail.


## 6. Sources and credits

- **The 8 original entries** describe sericulture practice on **Koh Oknha Tei** and **Koh Dach**, drawn from veteran silkworm farmers and mulberry cultivators there. FILL IN: the names of the people you spoke to, or write "a farmer on Koh Dach who asked not to be named" for anyone who did not want to be named.
- **Photos:** FILL IN who took the 8 photos in `public/images/` and when. Credit any photo you did not take.
- **The original entries have an empty `source` field** in `supabase/schema.sql`, and their contributor is the generic "Cambodian Silk Archives". So their cards do not yet name a source. FILL IN real sources through the SQL Editor, then update this section.
- **Two original entries share one photo.** "Young Silkworms Feeding" and "The Feeding Cycle" both point to `01_Young_Silkworms_Feeding.jpg`, and there is no `02_` photo file. One of them needs its own photo.
- **Contributor entries** show the contributor's account display name, or "Anonymous collector" if none is set, plus the source they type in (required on the form).
- **Boiling and Extraction** was lost and re-inserted (see the AI use and security sections). The migration row has an empty `image_url`. UNSURE whether I have added its photo since. Check the live site.

## 7. Running it locally

```bash
git clone https://github.com/Chuosrun/Cambodian-Silk.git
cd Cambodian-Silk
npm install
npm run dev
```

Create a file named `.env.local` in the project root (it is gitignored) with these variables, names only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (optional, used for auth email links, defaults to `http://localhost:3000`)

The Supabase URL and publishable key are public by design. They are sent to every visitor's browser, and row-level security is what protects the data. No secret or service-role key is used anywhere in this app, and none belongs in the repo.

**Database setup**, in the Supabase SQL Editor, in this order:

1. `supabase/schema.sql`
2. `supabase/add_source_column.sql`
3. `supabase/sprint2_harden.sql`
4. The `photos` bucket and its two storage policies from the Lab 7 guide (this block is not in the repo)
5. `supabase/sprint3_moderation.sql`
6. Add yourself as a reviewer by hand, using your own user id (never commit a real id):
   `insert into public.reviewers (user_id) values ('<your-user-uuid>');`

Then run `npm run build` to confirm it compiles.

## 8. Submission checklist

- Live URL loads logged out and shows published entries only: yes, https://cambodian-silk.vercel.app/ (FILL IN: date re-checked)
- A stranger cannot publish their own entry through the page or the console: yes, tested from a second account in Lab 10 (FILL IN: date)
- Logged out, the API returns nothing pending or returned: yes, tested in Lab 10, the query for non-published rows returned an empty list (FILL IN: date)
- Contributors can edit and delete only their own entries: yes, policies in `supabase/sprint3_moderation.sql` (reviewers can also delete non-seed entries, but cannot edit them)
- No secrets anywhere in the repo history: yes, `.env.local` is gitignored, and a search of the history found no service-role key (FILL IN: the exact command you re-run before submitting)
- At least eight real entries, each with a credited source: **not yet.** There are 8 real entries, but their `source` field is empty. FILL IN after adding sources.
- Khmer renders on every screen a user meets, including the queue: UNSURE. Entries, status labels and validation messages have Khmer. The navigation and the `/review` queue text are English only. Fix this or say so.
- Works at phone width: yes, tested at 375px (FILL IN: device or browser width)
- No test entries, lorem ipsum or TODO comments in shipped pages: UNSURE. A pending console test entry ("waiting politely") exists. It is not public, but delete it or leave it on purpose. Check `/products` before submitting.
- No console errors on the main pages: FILL IN after checking
- jesseorndorff is a collaborator on this repo: FILL IN (add at github.com/Chuosrun/Cambodian-Silk/settings/access)
- Supabase project restored and awake on: FILL IN (date)
- Demo video link opens in a private window: FILL IN (link)
- Reflection pasted in the Canvas submission: FILL IN
- Posted in the Show Your Archive discussion: FILL IN
- Q&A slot booked for: FILL IN (date and time)

