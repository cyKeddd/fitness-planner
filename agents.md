# Fitness Planner — Agent Reference Guide

This document is a quick-start reference for any AI agent (or developer) working on the Fitness Planner project. It provides the essential context needed to understand the codebase, make changes safely, and follow established patterns.

---

## Project Overview

Fitness Planner is a **full-stack web application** that helps users create, manage, and track personalized workout routines. It combines a curated exercise database with AI-powered plan generation, an active workout session interface with rest timers, and progress tracking with data visualizations.

**Live domains:** `fitplanner-mdwixm8e.manus.space` and `frameworkfitness.manus.space`

---

## Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui | Dark theme, dashboard layout |
| Routing | wouter | Lightweight client-side routing |
| State/Data | tRPC + TanStack React Query | End-to-end type safety |
| Backend | Express 4, tRPC 11 | All API under `/api/trpc` |
| Database | MySQL/TiDB via Drizzle ORM | Schema in `drizzle/schema.ts` |
| Auth | Manus OAuth | Session cookies, `protectedProcedure` |
| AI | Manus built-in LLM (`invokeLLM`) | Server-side only |
| Charts | Recharts | Progress visualizations |
| Animations | Framer Motion | Page transitions, micro-interactions |
| Testing | Vitest | 35 tests, server-side |

---

## Project Structure

```
fitness-planner/
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/             # Page components (one per route)
│   │   ├── components/        # Reusable UI (DashboardLayout, FloatingAIChat, shadcn/ui)
│   │   ├── hooks/             # Custom hooks (useUnit, useAuth, useMobile)
│   │   ├── contexts/          # React contexts (ThemeContext)
│   │   ├── lib/               # Utilities (trpc client, cn helper)
│   │   ├── App.tsx            # Route definitions
│   │   ├── main.tsx           # App entry point with providers
│   │   └── index.css          # Global theme (CSS variables, dark mode)
│   └── index.html             # HTML shell with Google Fonts
├── server/
│   ├── _core/                 # Framework plumbing (DO NOT EDIT)
│   │   ├── llm.ts             # LLM helper (invokeLLM)
│   │   ├── context.ts         # tRPC context builder
│   │   ├── trpc.ts            # Procedure definitions
│   │   └── ...                # OAuth, cookies, env, etc.
│   ├── db.ts                  # Database query helpers
│   ├── routers.ts             # tRPC procedure definitions
│   ├── storage.ts             # S3 file storage helpers
│   ├── auth.logout.test.ts    # Auth test
│   └── fitness.test.ts        # Feature tests (35 tests)
├── drizzle/
│   ├── schema.ts              # Database table definitions
│   ├── 0000-0004*.sql         # Migration files
│   └── meta/                  # Drizzle metadata
├── shared/                    # Shared constants and types
├── skills.md                  # Project-specific skills guide
├── agents.md                  # This file
├── progress.md                # Development progress log
└── todo.md                    # Feature tracking
```

Exercise media (image/video) is fetched from ExerciseDB via `server/exerciseMedia.ts` and shown in the exercise detail page.

---

## Critical Rules

These rules must be followed by any agent working on this project. Violating them will cause bugs, data loss, or deployment failures.

**1. Never edit files in `server/_core/`.** This directory contains framework-level plumbing (OAuth, context, Vite bridge). Modifications here will break the infrastructure.

**2. Exercise media is external.** Do not add local placeholder SVG packs for exercise guidance. Use ExerciseDB-backed media via server utilities.

**3. Always store weights in kilograms in the database.** The `useUnit()` hook handles display conversion to lbs on the frontend. Never store lbs values in the database.

**4. Always verify resource ownership in protected procedures.** Before returning or mutating any user-owned resource (plans, sessions, templates), check that `ctx.user.id` matches the resource's `userId`.

**5. Always run `pnpm test` before delivering changes.** All 35 tests must pass. If a test fails, fix the implementation first — only suspect the test if you have a concrete reason.

**6. Use `webdev_execute_sql` for migrations, not raw shell commands.** After generating a migration with `pnpm drizzle-kit generate`, read the SQL file and apply it through the webdev tool.

**7. Never hardcode the server port.** The port is dynamically assigned. Use the environment configuration.

---

## How to Add a New Feature

Follow this checklist for any new feature:

1. **Update `todo.md`** — Add unchecked items describing the feature before writing any code.
2. **Schema** — If the feature needs new tables or columns, edit `drizzle/schema.ts`, generate migration, apply SQL.
3. **DB Helpers** — Add query functions in `server/db.ts`. Keep them pure and reusable.
4. **Router** — Add tRPC procedures in `server/routers.ts` under the appropriate namespace (or create a new one).
5. **Frontend Page** — Create the page in `client/src/pages/`, register the route in `App.tsx`, add nav entry in `DashboardLayout.tsx`.
6. **Tests** — Add vitest tests in `server/fitness.test.ts` covering the new procedures.
7. **Verify** — Run `pnpm test`, check for TypeScript errors, and visually verify in the browser.
8. **Update `todo.md`** — Mark completed items as `[x]`.
9. **Checkpoint** — Save a checkpoint with a descriptive message.

---

## Authentication and Authorization

The app uses **Manus OAuth** with session cookies. The authentication flow is fully handled by the framework.

- `useAuth()` hook provides `user`, `isAuthenticated`, `loading`, and `logout()` on the frontend.
- `getLoginUrl(returnPath?)` generates the OAuth login URL with proper redirect handling.
- `protectedProcedure` on the backend automatically injects `ctx.user` and rejects unauthenticated requests.
- The `users` table has a `role` field (`user` | `admin`). The project owner is automatically assigned `admin` role.

**To add admin-only features:** Check `ctx.user.role === 'admin'` in the procedure or create an `adminProcedure` middleware.

---

## Key Patterns and Conventions

**Frontend data fetching:**
```tsx
// Reading data
const { data, isLoading } = trpc.plans.list.useQuery();

// Mutating data with optimistic updates
const mutation = trpc.plans.create.useMutation({
  onSuccess: () => {
    trpc.useUtils().plans.list.invalidate();
  },
});
```

**Database queries in db.ts:**
```ts
export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles)
    .where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
```

**Weight display (always use the hook):**
```tsx
const { formatWeight } = useUnit();
// Renders "100 kg" or "220.5 lbs" based on user preference
<span>{formatWeight(100)}</span>
```

---

## Common Pitfalls

These are mistakes that have been encountered during development. Avoid repeating them.

| Pitfall | Solution |
|---|---|
| `typeof day` causing TS2502 circular reference | Explicitly type function parameters instead of using `typeof` on props |
| `muscleGroups` from JSON column typed as `unknown` | Cast with `as string[]` or use `Array.isArray()` checks |
| Missing database column after pulling GitHub changes | Check for unapplied migration `.sql` files in `drizzle/` and apply them |
| Infinite loading from unstable query references | Stabilize objects/arrays with `useState` or `useMemo` |
| Debug fetch calls left in production code | Remove `// #region agent log` blocks before deploying |
| Plan-based workouts not auto-populating | Ensure `planDay.getExercises` endpoint is called and exercises are mapped to local state |
| Exercise image/video missing in detail view | Verify `exercises.mediaByName` is returning data and ExerciseDB env vars (`EXERCISEDB_API_KEY`, host/url) are configured |

---

## Environment Variables

The following environment variables are automatically injected by the Manus platform. Do not hardcode or commit these values.

| Variable | Purpose | Access |
|---|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string | Server only |
| `JWT_SECRET` | Session cookie signing | Server only |
| `VITE_APP_ID` | Manus OAuth app ID | Client |
| `OAUTH_SERVER_URL` | OAuth backend URL | Server only |
| `VITE_OAUTH_PORTAL_URL` | Login portal URL | Client |
| `BUILT_IN_FORGE_API_URL` | LLM and built-in APIs | Server only |
| `BUILT_IN_FORGE_API_KEY` | Bearer token for built-in APIs | Server only |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend access to built-in APIs | Client |
| `OWNER_OPEN_ID` | Project owner's OAuth ID | Server only |

---

## Useful Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm test` | Run all vitest tests |
| `pnpm build` | Production build |
| `pnpm drizzle-kit generate` | Generate migration SQL from schema changes |
| `pnpm check` | TypeScript type checking |

---

## Contact and Ownership

This project is owned by **Vraj Gupta** (vrajmgupta@gmail.com). The GitHub repository is connected via the `user_github` remote. Changes may come from both Manus agent sessions and direct GitHub commits — always sync and review before overwriting.
