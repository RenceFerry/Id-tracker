-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- If you already ran an older version of this file, running this again is
-- safe: table/policy creation is idempotent (create-if-not-exists / drop-then-recreate).

create extension if not exists pgcrypto;

create table if not exists id_orders (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  year text not null,
  block text not null,
  quantity int not null default 1 check (quantity > 0),
  idType text not null default 'BSIT'
  paid boolean not null default false,
  date_bought date not null default current_date,
  released boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists id_orders_date_bought_idx on id_orders (date_bought desc);

-- Single-row settings table, currently just the price per ID used to
-- calculate the Total column in the UI.
create table if not exists app_settings (
  id int primary key default 1,
  price_per_id numeric not null default 0,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into app_settings (id, price_per_id)
values (1, 0)
on conflict (id) do nothing;

-- Row Level Security: anyone can read, only signed-in (authenticated)
-- users can write. This is the actual access boundary — the app's UI
-- also hides admin controls from signed-out visitors, but that's just
-- a convenience; Postgres is what actually stops writes.
alter table id_orders enable row level security;
alter table app_settings enable row level security;

drop policy if exists "Allow anon full access" on id_orders;
drop policy if exists "Public read access" on id_orders;
drop policy if exists "Authenticated insert" on id_orders;
drop policy if exists "Authenticated update" on id_orders;
drop policy if exists "Authenticated delete" on id_orders;

create policy "Public read access"
  on id_orders for select
  to anon, authenticated
  using (true);

create policy "Authenticated insert"
  on id_orders for insert
  to authenticated
  with check (true);

create policy "Authenticated update"
  on id_orders for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated delete"
  on id_orders for delete
  to authenticated
  using (true);

drop policy if exists "Allow anon full access" on app_settings;
drop policy if exists "Public read access" on app_settings;
drop policy if exists "Authenticated update" on app_settings;

create policy "Public read access"
  on app_settings for select
  to anon, authenticated
  using (true);

create policy "Authenticated update"
  on app_settings for update
  to authenticated
  using (true)
  with check (true);

-- IMPORTANT: these policies grant write access to ANY authenticated
-- user. Do two things in the Supabase dashboard so that only accounts
-- you create can sign in:
--   1. Authentication -> Providers -> Email -> turn OFF "Allow new users
--      to sign up". This app has no public sign-up form, but leaving
--      self-signup enabled would let anyone create an account via the
--      Supabase API directly and become an editor.
--   2. Authentication -> Users -> Add user, to create each admin's
--      email + password by hand.
