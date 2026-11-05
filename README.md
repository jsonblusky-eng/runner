# Stride Log

A mobile-first PWA for logging workouts and tracking training goals. Log runs, strength sessions, treks, walks, cycling and more, see streaks, weekly mileage and goal progress on a dashboard, and keep history searchable and filterable.

## Features

- **Activity logging** — distance, moving/total time, elevation, pace & speed preview, effort (1–10), notes, and run types (easy, long, tempo, hill, race, recovery)
- **Strength sessions** — exercise name, set count and duration
- **Goals** — daily/weekly/monthly targets for distance, duration, sessions or elevation, filtered by activity type, with progress bars
- **Dashboard** — current streak, latest activity, mileage warnings and a weekly distance chart
- **History** — filter by type, date range, run type, or free-text search
- **PWA** — installable, with an update prompt when a new build ships

## Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS, react-hook-form + Zod, TanStack Query, Recharts, lucide-react
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Tooling:** Oxlint, Vitest, vite-plugin-pwa

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL from `supabase/schema.sql` in the Supabase SQL editor (or push with `supabase db push` if you use the CLI). All tables are protected by Row Level Security — a user only sees their own rows.

   For incremental changes after initial setup, run the SQL files from `supabase/migrations/` in order (e.g. `0001_init.sql`, `0002_strength_sets.sql`, `0003_goals_updated_at.sql`).

3. **Configure environment** — copy `.env.example` to `.env` and fill in:

   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   VITE_ALLOW_SIGNUP=false   # set to true only while creating your own account
   ```

   If Supabase is not configured, the app shows a setup screen instead of crashing.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | Oxlint |
| `npm test` | Vitest (unit tests for date/time/pace/stats helpers) |

## Project structure

```
src/
  components/     Reusable UI (Button, Card, Chip, BottomSheet, Toast, …)
  features/
    activities/   Log, history, detail pages + Supabase queries
    goals/        Goals page, goal form, Supabase queries
    dashboard/    Dashboard with streak, chart and warnings
    settings/     Theme, week start, sign out
    auth/         Auth provider, login page, route guard
    layout/       App shell with tab bar
  lib/            Pure domain logic (dates, time, pace, stats, format)
  types/          Database row types, Zod form schemas
supabase/         schema.sql + ordered migrations
```

Domain math (streaks, goal progress, mileage warnings) lives in pure, unit-tested modules under `src/lib/`, kept separate from the UI.
