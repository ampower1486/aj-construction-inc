# Staff portal setup (Supabase)

One-time setup for the `/admin` login system. Everything here happens once,
in the Supabase dashboard and in `.env` — after that, every account (except
the first two, below) is created through the portal's own invite flow.

## 1. Create the project

Create a free project at [supabase.com](https://supabase.com) — any US region
is fine (e.g. West US). Note the **Project URL**.

## 2. Run the schema

Dashboard → **SQL Editor** → New query → paste the entire contents of
`supabase/schema.sql` → Run. This creates the `profiles` table, the trigger
that auto-creates a profile when an invited user's account is created, the
Custom Access Token Hook function, and the Row Level Security policies for
the three-tier role model.

## 3. Register the Custom Access Token Hook (dashboard-only step — SQL alone can't do this)

Dashboard → **Authentication → Hooks** → enable **Custom Access Token** →
point it at `public.custom_access_token_hook` (created by the schema in step
2). This is what puts a signed-in user's role into their JWT, which every RLS
policy reads from.

## 4. Allow the invite redirect URL

Dashboard → **Authentication → URL Configuration → Redirect URLs** → add:

- `http://localhost:5173/admin/accept-invite.html` (for local dev)
- `https://<your production domain>/admin/accept-invite.html` (once this goes live)

Without this, Supabase silently ignores the `redirectTo` `api/invite-user.js`
passes and sends invitees to the project's default Site URL instead.

## 5. Get your API keys

Dashboard → **Project Settings → API**. You need three values:

| Value | Goes in |
|---|---|
| Project URL | `VITE_SUPABASE_URL` |
| `anon` / publishable key | `VITE_SUPABASE_ANON_KEY` |
| `service_role` key (click reveal) | `SUPABASE_SERVICE_ROLE_KEY` — **secret, never commit this, never prefix it VITE_** |

Put all three in `.env` for local dev (see `.env.example`). They only get
set in Vercel once this is ready to go live.

## 6. Bootstrap the first two accounts

Invite-only needs a first account to invite *from*. Create the very first
`global_admin` (you) and the first `super_admin` (the owner) directly —
this is the one normal exception to "everyone comes through an invite."

Dashboard → **Authentication → Users → Add user** → create each with an
email + password directly. Then, in the SQL Editor, give each one a
`profiles` row (the trigger only fires for *invited* users, not users
created this way in the dashboard):

```sql
insert into public.profiles (id, full_name, role)
values
  ('<the global_admin auth user''s UUID, from the Users table>', 'Armando Martinez', 'global_admin'),
  ('<the super_admin auth user''s UUID, from the Users table>', 'Owner Name', 'super_admin');
```

From this point on, invite everyone else — the owner (`super_admin`) invites
the secretary and management team as `admin`, or another `super_admin`, from
inside the portal's Team page.

## Verifying it worked

1. `npm run dev`, log in as each bootstrapped account at `/admin/login.html`.
2. As the `super_admin`, send a test invite from the Team page; confirm the
   invite email arrives and `/admin/accept-invite.html` lets you set a
   password and lands you in the portal.
3. Confirm the role boundary actually holds at the database level, not just
   in the UI: log in as an `admin`-role account and, from the browser
   console, try `fetch('/api/invite-user', {...})` directly — it must be
   refused (403), even with a valid session.
