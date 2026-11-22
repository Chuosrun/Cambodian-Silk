# Cambodian Silk Archives

A bilingual (Khmer and English) archive of how Cambodia's naturally golden silk, Tromol Meas, is made, from mulberry-fed silkworm to finished cloth.

- Live site: https://cambodian-silk.vercel.app/
- Repo: https://github.com/Chuosrun/Cambodian-Silk

## 1. What this is

An archive of the lifecycle of Tromol Meas, Cambodia's rare golden raw silk, drawn from silkworm farmers and mulberry cultivators on Koh Oknha Tei and Koh Dach. Eight original entries cover four stages (Silkworm, Cocoon, Thread, Cloth). Anyone can browse and search without an account. Signed-in contributors add their own entries with a photo, and a reviewer approves each one before the public sees it.

## 2. Who it's for

People in Cambodia who want to see, and add to, the record of how their own silk is made: farmers, weavers, and their students and relatives.

- **Khmer first.** Every original entry has a Khmer title. Form errors, the "waiting for review" message and the status labels on `/my-collection` are bilingual.
- **Phones first.** Layout breakpoints at 560px, 640px, 768px and 900px, tested at 375px. The hero photo collage is not rendered on phones, so those images are never downloaded on a slow connection.
- **No name rules.** There is no first-name/last-name split. The credit is the account's display name, or "Anonymous collector" if none is set.
- **Photos capped.** JPG, PNG or WebP, 5 MB, checked in the form.
- **Where Khmer is missing.** The navigation, login and signup pages, the footer and the `/review` queue are English only. Entry titles, the contribution form, status labels and the submit message are Khmer too.

## 3. How it works

**Stack:** Next.js 15 (App Router) on Vercel, with Supabase for accounts, data and photos. Only five dependencies: `next`, `react`, `react-dom`, `@supabase/supabase-js`, `@supabase/ssr`.

**Data:** two tables. `entries` holds every entry (including `status`, `is_seed`, `source`, `reviewed_by`, `reviewed_at`). `reviewers` lists the user ids allowed to review.

| Status | Meaning | Who can see it |
|---|---|---|
| `pending` | Submitted, waiting | Its owner and reviewers |
| `published` | Approved | Everyone, including logged-out visitors |
| `returned` | Sent back by a reviewer | Its owner and reviewers |

| Route | What it shows |
|---|---|
| `/` | The 8 original entries, with search and stage filters, and a preview of up to 3 published products below the grid (a "Products" button jumps to it) |
| `/products` | All published contributor entries |
| `/entries/[id]` | One entry (Edit and Delete for its owner) |
| `/my-collection` | Your entries with their review status, Edit and Delete, and the form to add a new one. Once you have entries, a big "Add Your Collection" button at the top jumps to the form at the bottom. |
| `/contribute` | Add an entry with a photo (the same form that Edit uses) |
| `/edit/[slug]` | Edit your own entry |
| `/review` | Reviewer queue: Publish, Return, Delete. Others get a 404. |

Photos upload from the browser to the `photos` bucket. The 8 original photos are in `public/images/`.

## 4. Security decisions

The rules live in the database (`supabase/sprint3_moderation.sql`), not in the interface.

- **Row-level security on `entries`.** You can read an entry if it is published, you own it, or you are a reviewer. You can insert only as yourself, as `pending`, and never as an original entry. You can update only your own non-original entries, and the result must stay `pending` unless you are a reviewer.
- **The gate is `review_entry()`.** It checks the caller is a reviewer, accepts only `published` or `returned`, and only acts on `pending`, non-original rows. A trigger makes `user_id`, `is_seed` and the review columns read-only to the API.
- **`reviewers` is locked.** RLS is on with no policies and privileges are revoked, so only the SQL Editor can add a reviewer.
- **Hiding the Review link is politeness, not protection.** Anyone can call the API from the console, so the database refuses instead.
- **Writes confirm a row came back.** When RLS refuses an update or delete, Supabase reports success with zero rows changed, so the code checks and shows "That change wasn't saved".
- **Editing sends a published entry back to `pending`**, so it cannot be quietly changed after approval.
- **Reviewers can delete but not edit** others' entries, so they can remove harm without rewriting someone's words. They cannot touch the 8 originals, which are also detached from any user so deleting an account cannot delete them.
- **A reviewer may publish their own entries.** This was a deliberate choice so one account can test the whole flow. A contributor who is not a reviewer cannot.
- **Limits:** 10 entries per day and 50 in total per user. If the count check fails, the entry is refused.
- **Safe redirects** after login, and no secrets in the repo (see section 7).

**Known weaknesses:** returned entries have no reviewer note, so the contributor is not told why. Photos are not deleted from storage when an entry is. Upload type and size limits are enforced in the browser form, and I have not confirmed that the storage bucket enforces them too. `image_url` is not checked server-side to be inside our bucket. The contributor name is taken from the account on create and the edit form never changes it, but the database policy would still let an owner overwrite that column through the API. Khmer wording has not been checked by a native speaker. Both the home and `/products` pages read every published row, with no pagination.

## 5. AI use

All AI work went through Cline in VS Code. **DeepSeek V4 Flash** wrote the code changes. **Claude Sonnet 5.5** ran the security and audit review. I ran all SQL and the console attacks myself, so no model touched the live database.

| Model | Task | Verdict |
|---|---|---|
| DeepSeek V4 Flash | Visual design pass and responsive grid | Kept. I adjusted spacing and the mobile grid after testing at 375px. |
| DeepSeek V4 Flash | Contribution form, edit and delete, review queue | Kept. Edits and deletes check that a row came back, because RLS refusals report success with zero rows. |
| DeepSeek V4 Flash | Bilingual validation messages | **Rewrote.** The first Khmer strings were garbled characters (commit `95ae035`). I caught it by reading them. They still need a native speaker. |
| DeepSeek V4 Flash | Corrupted characters (em dashes saved as mojibake) | Kept, after three fix commits replaced em dashes with plain hyphens. |
| DeepSeek V4 Flash | First architecture briefing | **Partly wrong.** It said anyone could read pending entries and self-publish. I checked the live policies, found both were already blocked, and recorded the corrections in `ARCHITECTURE.md`. It was right about other gaps (seed rows editable, open redirects, `reviewers` privileges), which I fixed in `sprint3_moderation.sql`. |
| DeepSeek V4 Flash | Review of three findings from a partner | All three real and fixed (commit `f7d1d30`): the entry-limit check failed open, the upload policy was not scoped to the user's folder, and dates were hard-coded to one locale. |
| Claude Sonnet 5.5 | Security and audit review of the whole site | FILL IN: two or three things it found, and what I did about each. |

**How I checked:** I read every diff, ran `npm run build`, compared policy names with the live `pg_policies` before running SQL, and attacked my own site from a second account in the console (self-publish insert and update, `review_entry`, insert into `reviewers`, logged-out read of unpublished rows).

## 6. Sources and credits

- **The 8 original entries** are credited on every card to contributor **Chuosrun Lim**, source **Silk Island Cambodia (Koh Dach)**. Their subject matter comes from silkworm farmers and mulberry cultivators on Koh Oknha Tei and Koh Dach.
- **Photos** in `public/images/`: I (Chuosrun Lim) took all of these photos at Silk Island Cambodia (Koh Dach).
- **Gap:** "Young Silkworms Feeding" and "The Feeding Cycle" share one photo (`01_Young_Silkworms_Feeding.jpg`). One needs its own.
- **Contributor entries** show the account display name and the source typed on the form (required). The two products on the shelf are credited to "Prey Kabbas Weavers Cooperative" and "National Museum of Cambodia".

## 7. Running it locally

```bash
git clone https://github.com/Chuosrun/Cambodian-Silk.git
cd Cambodian-Silk
npm install
npm run dev
```

Create `.env.local` in the project root (gitignored), names only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (optional, defaults to `http://localhost:3000`)

The URL and publishable key are public by design; row-level security protects the data. No secret or service-role key is used or belongs in the repo.

In the Supabase SQL Editor, run in order: `supabase/schema.sql`, `add_source_column.sql`, `sprint2_harden.sql`, the `photos` bucket and policies from the Lab 7 guide (not in the repo), then `sprint3_moderation.sql`. Add yourself as a reviewer by hand, with your own id (never commit it):
`insert into public.reviewers (user_id) values ('<your-user-uuid>');`

## 8. Submission checklist

- Live URL loads logged out and shows published entries only: yes, re-checked 22 Nov 2026. It shows the 8 original entries and 2 published products.
- A stranger cannot publish their own entry through the page or the console: yes, tested from a second account in Lab 10 (20 Nov 2026).
- Logged out, the API returns nothing pending or returned: yes, re-checked 22 Nov 2026 with the publishable key only. A read of non-published entries returned 0 rows, a read of `reviewers` was refused (401), and a call to `review_entry` was refused (401).
- Contributors can edit and delete only their own entries: yes (reviewers can also delete non-original entries, but not edit them).
- No secrets in the repo history: yes, `.env.local` is gitignored and was never committed. `git log origin/main -G "sb_secret_|eyJ[A-Za-z0-9_-]{20,}\."` finds no commits (22 Nov 2026). The only env file in history is `.env.local.example`, which holds placeholders.
- At least eight real entries, each with a credited source: yes. All 8 original entries show source "Silk Island Cambodia (Koh Dach)" and contributor "Chuosrun Lim". Two photos are duplicated (see section 6).
- Khmer renders on every screen a user meets, including the queue: **no.** Entries, the contribution form, status labels and the submit message have Khmer. The navigation, login, signup, footer and `/review` do not.
- Works at phone width: yes, tested at 375px.
- No test entries, lorem ipsum or TODO comments in shipped pages: no TODO or lorem ipsum in the code (searched `app/`, `components/`, `lib/`). FILL IN: check `/review` and `/my-collection` for leftover test entries and say what you found.
- No console errors on the main pages: FILL IN
- jesseorndorff is a collaborator on this repo: **invitation sent but not accepted yet** (22 Nov 2026). FILL IN once accepted.
- Supabase project restored and awake on: awake on 22 Nov 2026 (the live API answered).
- Demo video link opens in a private window: FILL IN (link)
- Reflection pasted in the Canvas submission: FILL IN
- Posted in the Show Your Archive discussion: FILL IN
- Q&A slot booked for: Dec 1, 9:50 AM
