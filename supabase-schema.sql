create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.app_state (
  id text primary key,
  campaigns jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_state (id, campaigns)
values ('main', '[]'::jsonb)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.app_state enable row level security;

drop policy if exists "profiles are readable by signed in users" on public.profiles;
create policy "profiles are readable by signed in users"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "users can create their own profile" on public.profiles;
create policy "users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "campaign state is readable by signed in users" on public.app_state;
create policy "campaign state is readable by signed in users"
on public.app_state
for select
to authenticated
using (id = 'main');

drop policy if exists "signed in users can update shared campaign state" on public.app_state;
create policy "signed in users can update shared campaign state"
on public.app_state
for update
to authenticated
using (id = 'main')
with check (id = 'main');

drop policy if exists "signed in users can create shared campaign state" on public.app_state;
create policy "signed in users can create shared campaign state"
on public.app_state
for insert
to authenticated
with check (id = 'main');
