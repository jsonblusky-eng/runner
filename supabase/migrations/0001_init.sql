-- Stride · Phase 1 schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- All tables are protected by Row Level Security: a user can only see their own rows.

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  type text not null check (type in ('run','strength','trek','walk','cycling','other')),
  distance_km numeric(7,2) check (distance_km >= 0),
  moving_time_sec integer check (moving_time_sec >= 0),
  total_time_sec integer check (total_time_sec >= 0),
  elevation_m integer check (elevation_m >= 0),
  run_type text check (run_type in ('easy','long','tempo','hill','race','recovery')),
  effort smallint check (effort between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_time_sec is null or moving_time_sec is null or total_time_sec >= moving_time_sec)
);

create index if not exists activities_user_date_idx
  on public.activities (user_id, activity_date desc);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  period text not null check (period in ('daily','weekly','monthly')),
  metric text not null check (metric in ('distance_km','duration_min','sessions','elevation_m')),
  activity_type text check (activity_type in ('run','strength','trek','walk','cycling','other')),
  target_value numeric(10,2) not null check (target_value > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_idx on public.goals (user_id, period);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

alter table public.activities enable row level security;
alter table public.goals enable row level security;

drop policy if exists "own rows" on public.activities;
create policy "own rows" on public.activities
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own rows" on public.goals;
create policy "own rows" on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- The anon role gets no access. Signed-in users are authorised by RLS above.
revoke all on public.activities from anon;
revoke all on public.goals from anon;
grant select, insert, update, delete on public.activities to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
