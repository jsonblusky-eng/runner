-- Strength sets · Phase 2
-- Adds exercise name and set count to activities so strength workouts
-- can store what was trained, not just how long it took.

alter table public.activities
  add column if not exists exercise_name text check (exercise_name is null or length(btrim(exercise_name)) > 0),
  add column if not exists sets integer check (sets >= 1);
