-- AJ Construction staff portal — schema, triggers, and RLS policies.
--
-- One-time setup: paste this whole file into the Supabase dashboard's
-- SQL Editor (your project → SQL Editor → New query) and run it once.
--
-- After running this file, one more manual step in the dashboard (SQL alone
-- cannot do this part):
--   Authentication → Hooks → enable "Custom Access Token" and point it at
--   public.custom_access_token_hook (created below). This is what puts a
--   user's role into their JWT, which every RLS policy here reads from.
--
-- Role model (see the plan for the full rationale):
--   global_admin  — Conect-R. Full access, always. No one else can touch
--                   a global_admin's row.
--   super_admin   — the owners. Full access to data; can invite people and
--                   assign/change roles for anyone EXCEPT a global_admin.
--   admin         — secretary + management team. Full access to data;
--                   cannot invite anyone or change any role.

-- --------------------------------------------------------------------------
-- 1. Table
-- --------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('global_admin', 'super_admin', 'admin')),
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per staff member. Created automatically when an invited user '
  'accepts their invite — see handle_new_user() below. Never insert into '
  'this table directly except for the very first bootstrap accounts.';

alter table public.profiles enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
-- The Custom Access Token Hook runs as supabase_auth_admin, not as the
-- signed-in user, so it needs its own read grant independent of RLS.
grant select on public.profiles to supabase_auth_admin;

-- --------------------------------------------------------------------------
-- 2. Auto-create a profile row when an invited user's account is created
-- --------------------------------------------------------------------------
--
-- api/invite-user.js calls supabase.auth.admin.inviteUserByEmail(email,
-- { data: { full_name, role, invited_by } }) — that "data" object lands in
-- auth.users.raw_user_meta_data, which this trigger reads to populate the
-- matching profiles row the moment the auth.users row is created.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, invited_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'admin'),
    nullif(new.raw_user_meta_data ->> 'invited_by', '')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- --------------------------------------------------------------------------
-- 3. Custom Access Token Hook — puts the role into the JWT
-- --------------------------------------------------------------------------
--
-- RLS policies check auth.jwt() rather than querying profiles on every row,
-- which is both faster (no per-row subquery) and safer: the role travels in
-- a token signed by Supabase, not in anything the browser could edit. This
-- function must be wired up as the "Custom Access Token" hook in the
-- dashboard (Authentication → Hooks) — that registration step can't be done
-- from SQL alone.

create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
begin
  select role into user_role from public.profiles where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if jsonb_typeof(claims -> 'app_metadata') is null then
    claims := jsonb_set(claims, '{app_metadata}', '{}');
  end if;

  claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(coalesce(user_role, 'admin')));
  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- --------------------------------------------------------------------------
-- 4. Row Level Security policies
-- --------------------------------------------------------------------------
--
-- Every future table (estimates, contracts, once that phase starts) should
-- follow this same shape: a "global_admin full access" policy, a
-- "super_admin full access" policy, and an "admin full access to data, but
-- not to who-has-an-account" split — copy the pattern below rather than
-- inventing a new one per table.

-- Anyone signed in can see the team list (name + role), not just admins —
-- reasonable for a small staff portal, and nothing sensitive is exposed.
create policy "authenticated can view profiles"
on public.profiles for select
to authenticated
using (true);

-- A global_admin can do anything to any row, including other global_admins.
create policy "global_admin manages all profiles"
on public.profiles for all
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'global_admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'global_admin');

-- A super_admin can create/change/remove any profile EXCEPT a global_admin's.
-- The `role <> 'global_admin'` check on both sides stops a super_admin from
-- touching an existing global_admin row, and from ever setting someone's
-- role TO global_admin.
create policy "super_admin manages non-global-admin profiles"
on public.profiles for all
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  and role <> 'global_admin'
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  and role <> 'global_admin'
);

-- admin gets no insert/update/delete policy at all here on purpose — with no
-- policy granting a write, RLS denies it by default. They keep the
-- read-only "authenticated can view profiles" policy above.
