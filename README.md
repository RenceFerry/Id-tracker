# ID Registry

Tracks student ID purchases: name, year, block, number of IDs bought, whether
paid, the date bought, and whether the ID has been released. Built with
Next.js (App Router) and Supabase.

**Features:** admin login (Supabase Auth) with public read-only access,
light/dark theme toggle, edit-via-modal (so Paid/Released can't be flipped
by an accidental click), delete confirmation, year/block dropdowns (1–6), a
settings panel to set the price per ID with a computed Total column, search,
and pagination (10 entries per page).

## 1. Set up Supabase

1. Create a project at supabase.com (or use an existing one).
2. Open **SQL Editor** and run everything in `supabase/schema.sql`. This
   creates the `id_orders` and `app_settings` tables and their RLS policies
   (public read, authenticated-only write).
3. Grab your keys from **Project Settings -> API**:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this one secret — server-only)

## 2. Set up the admin account

This app has no public sign-up page — you add admin accounts by hand so only
people you choose can sign in and edit.

1. In the Supabase dashboard, go to **Authentication -> Providers -> Email**
   and turn **off** "Allow new users to sign up". This matters: the RLS
   policies in `schema.sql` grant write access to *any* authenticated user,
   so if signups were left open, anyone could create an account via the
   Supabase API and get editor access.
2. Go to **Authentication -> Users -> Add user** and create an email +
   password for yourself (and anyone else who should be able to edit).
3. That's it — no separate admin flag or table. "Authenticated" (signed in)
   = admin; signed out = read-only.

To reset a password later, do it from the same **Authentication -> Users**
screen — there's no self-service "forgot password" flow built into the app.

## 3. Configure environment variables

```
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY`. `CRON_SECRET` is optional but recommended once deployed.

## 4. Run locally

```
npm install
npm run dev
```

Visit http://localhost:3000. Signed out, you see the registry, stats, and
search/pagination, read-only. Click "Admin sign in" and log in with an
account you created in step 2 to also see the add-entry form and, per row,
"Edit" (opens a modal covering every field, including Paid/Released) and
"Remove" (asks for confirmation first).

## 5. Data model

Table `id_orders`:

| column        | type    | notes                          |
|---------------|---------|---------------------------------|
| id            | uuid    | primary key                    |
| student_name  | text    |                                 |
| year          | text    | "Year 1"–"Year 6" (dropdown)   |
| block         | text    | "Block 1"–"Block 6" (dropdown) |
| idTyp         | text    | "BSIT" or "BMMA" (dropdown)    |
| quantity      | int     | number of IDs bought           |
| paid          | boolean |                                 |
| date_bought   | date    |                                 |
| released      | boolean |                                 |
| created_at    | timestamptz | auto-set on insert          |

There's also a single-row `app_settings` table holding `price_per_id`,
editable from the Settings button in the header (admins only). The table's
Total column is `quantity * price_per_id`, computed client-side.

`year` and `block` are entered via dropdowns (Year 1–6, Block 1–6) rather
than free text, so data stays consistent for search and reporting. If your
program uses different labels (e.g. actual section letters), just edit the
`YEAR_OPTIONS` / `BLOCK_OPTIONS` arrays in `lib/constants.ts`.

## 6. Search, pagination, and theme

- The search box filters by student name, year, or block, and is server-side
  (`GET /api/orders?q=...&page=...&pageSize=...`), so it works correctly
  together with pagination.
- 10 entries load per page (`PAGE_SIZE` in `app/page.tsx`); change that
  constant if you want a different page size.
- The stat cards labeled "(page)" reflect only the currently loaded page,
  since paginated data isn't all in the browser at once. "Total entries"
  reflects the full filtered count across all pages.
- The theme toggle saves to `localStorage` and is applied before first
  paint (see the inline script in `app/layout.tsx`), so there's no flash of
  the wrong theme on reload.

## 7. How the admin/public split actually works

The real boundary is Postgres Row Level Security, not the UI:

- `id_orders` and `app_settings` both allow `select` (read) to everyone —
  the `anon` role (signed-out visitors) and `authenticated` role alike.
- `insert` / `update` / `delete` are only granted to `authenticated`.

The browser talks to Supabase through Next.js API routes
(`app/api/orders/...`, `app/api/settings/...`). When you're signed in, the
client (`lib/authFetch.ts`) attaches your session's access token as a
Bearer header; the API route (`lib/supabaseRequest.ts`) forwards that token
to Supabase, so Postgres evaluates the request as your authenticated user.
Signed out, requests carry no token and are evaluated as `anon` — read-only.

This means even if someone called the API directly (skipping the UI
entirely), they still couldn't write without a valid session — hiding the
Edit/Remove/Settings buttons for signed-out visitors is a UI convenience,
not the actual protection.

## 8. Keeping Supabase awake (cron)

Supabase's free tier pauses a project after 7 days of no activity. The route
`app/api/cron/keep-alive/route.ts` runs a trivial read against `id_orders`
(using the service role key, which bypasses RLS) to count as activity.
`vercel.json` schedules it once a day:

```json
{
  "crons": [{ "path": "/api/cron/keep-alive", "schedule": "0 0 * * *" }]
}
```

Vercel Cron only runs once the project is **deployed to Vercel** (it doesn't
run in local dev, and it's not available on every plan — check your current
Vercel plan's cron limits). If you deploy elsewhere, you can instead point
any external scheduler (cron-job.org, GitHub Actions on a schedule, etc.) at
`https://your-app-url/api/cron/keep-alive` on whatever interval you like —
daily is enough to prevent the 7-day pause.

If you set `CRON_SECRET` in your env vars, Vercel Cron sends it automatically
as a Bearer token; an external scheduler needs to send the same header
manually:

```
Authorization: Bearer your-cron-secret
```

## 9. Deploying

Push this to a GitHub repo and import it in Vercel, or run `vercel` from this
folder. Add the same environment variables in the Vercel project settings
(Production and Preview). Cron only fires on deployed environments.
