-- Goals timestamps
-- goals previously had no updated_at column or trigger; bring it in line
-- with activities so last-change time is tracked.

alter table public.goals
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();
