# Maszyna

A shared fitness and nutrition tracking app for couples (and solo users) — track macros, workouts, step counts, and plan meals together.

## Run & Operate

- `pnpm --filter @workspace/fitcouple run dev` — run the frontend (via workflow)
- `pnpm run typecheck` — full typecheck across all packages
- Required env vars:
  - `VITE_SUPABASE_URL` — Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
  - `VITE_DEV_SUPABASE_REDIRECT_URL` (optional) — override redirect URL for auth callbacks

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4
- Auth & DB: Supabase (auth, PostgreSQL, real-time)
- UI: shadcn/ui components + Radix primitives
- Routing: wouter
- i18n: English + Polish (custom context)

## Where things live

- `artifacts/fitcouple/src/` — all frontend source
  - `pages/` — route components (landing, auth/*, app)
  - `components/screens/` — Dashboard, Kitchen, Workout, Planner, Profile
  - `components/ui/` — shadcn/ui components
  - `lib/auth-context.tsx` — Supabase auth + profile state
  - `lib/user-context.tsx` — local user state + demo data
  - `lib/i18n/` — translations (EN/PL)
  - `lib/realtime-hooks.ts` — Supabase real-time hooks
  - `lib/supabase/client.ts` — browser Supabase client

## Architecture decisions

- Auth via Supabase (`@supabase/ssr`) with cookie-based sessions.
- Profile data stored in Supabase `profiles` table; settings in `user_settings`.
- Demo/sample data hardcoded in `user-context.tsx` for local state (pre-Supabase persistence).
- Real-time partner sync via Supabase Postgres changes subscription.
- Routing handled by wouter (replaces Next.js file-based routing).

## Product

- Landing page with Get Started / Sign In CTAs
- Auth: sign up (solo or couple mode), login, email confirmation, OAuth callback
- Main app shell with bottom navigation: Dashboard, Kitchen, Workout, Planner, Profile
- Dashboard: macro rings, water intake, steps, partner's day overview
- Kitchen: recipe browser with filtering
- Workout: log workouts, track sets/reps/weight
- Planner: weekly meal and workout planning
- Profile: measurements, logs, achievements, settings modal with macro calculator

## Gotchas

- Supabase env vars must be set as `VITE_*` (not `NEXT_PUBLIC_*`) — the app will silently fail to auth without them.
- The Supabase DB schema (profiles, user_settings, meal_logs, etc.) must be applied manually via SQL; see `.migration-backup/lib/db/schema.sql`.
- `@tailwindcss/typography` plugin is included but `postcss.config.mjs` should NOT exist — Tailwind v4 uses the Vite plugin instead.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Original Next.js backup in `.migration-backup/` — do not delete
