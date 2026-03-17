# Fitness Planner — Skills Guide

This document defines the project-specific skills, conventions, and patterns that any AI agent should follow when working on the Fitness Planner codebase. It serves as a living reference for maintaining consistency, avoiding regressions, and accelerating development.

---

## Skill 1: Database Schema Management

The project uses **Drizzle ORM** with a MySQL/TiDB backend. All schema definitions live in `drizzle/schema.ts`.

**When modifying the schema, always follow this sequence:**

1. Edit `drizzle/schema.ts` with the new or modified table definition.
2. Run `pnpm drizzle-kit generate` to produce a migration `.sql` file in the `drizzle/` directory.
3. Read the generated SQL file and apply it using `webdev_execute_sql`.
4. Restart the dev server if the change affects runtime queries.

**Conventions to maintain:**

- All timestamps should use `timestamp` type with `defaultNow()`.
- Use `int("id").autoincrement().primaryKey()` for all primary keys.
- Foreign keys are stored as `int` columns referencing the parent table's `id` (no formal FK constraints in the current schema — enforce at the application layer).
- JSON columns (e.g., `goals`, `equipment`, `muscleGroups`) store arrays of strings and should be cast with `as string[]` when reading.
- Enum columns use `mysqlEnum` with explicit string arrays.

| Table | Purpose | Key Relationships |
|---|---|---|
| `users` | Auth and identity | Root entity |
| `user_profiles` | Onboarding data, physiology, goals | `userId` → `users.id` |
| `exercises` | Curated exercise database (90+ seeded) | Standalone |
| `workout_plans` | AI-generated or user-created plans | `userId` → `users.id` |
| `workout_plan_days` | Days within a plan | `planId` → `workout_plans.id` |
| `workout_plan_exercises` | Exercises within a plan day | `planDayId` → `workout_plan_days.id` |
| `workout_sessions` | Active or completed workout sessions | `userId` → `users.id`, optional `planDayId` |
| `session_logs` | Individual set logs within a session | `sessionId` → `workout_sessions.id` |
| `personal_records` | Best lifts for tracked exercises | `userId` → `users.id` |
| `workout_templates` | Saved from completed sessions | `userId` → `users.id` |
| `workout_template_exercises` | Exercises within a template | `templateId` → `workout_templates.id` |

---

## Skill 2: tRPC Router Development

All backend logic is exposed through tRPC procedures in `server/routers.ts`. Database query helpers live in `server/db.ts`.

**When adding a new feature endpoint:**

1. Add the database helper function(s) in `server/db.ts`. Keep them pure — accept parameters, return raw Drizzle rows.
2. Add the tRPC procedure in `server/routers.ts` under the appropriate router namespace.
3. Use `protectedProcedure` for any endpoint that requires authentication. Use `publicProcedure` only for truly public data (e.g., exercise library browsing).
4. Always validate inputs with Zod schemas.
5. For ownership checks, always verify `ctx.user.id` matches the resource's `userId` before returning or mutating data.

**Existing router namespaces:**

| Namespace | Description |
|---|---|
| `auth` | Login state (`me`) and logout |
| `profile` | User profile CRUD and onboarding data |
| `exercises` | Exercise library listing and detail |
| `plans` | Workout plan CRUD, day management, exercise management |
| `ai` | LLM-powered plan generation and fitness chat |
| `sessions` | Workout session lifecycle (start, log sets, complete, abandon) |
| `planDay` | Fetch exercises for a specific plan day |
| `prs` | Personal records retrieval |
| `templates` | Workout template CRUD and session-from-template |
| `progress` | Workout statistics, exercise history, weekly activity |

---

## Skill 3: AI / LLM Integration

The app uses the Manus built-in LLM via `invokeLLM()` from `server/_core/llm.ts`. No external API keys are needed.

**Two AI features exist:**

1. **Workout Plan Generation** (`ai.generatePlan`): Sends user profile data and preferences to the LLM with a structured JSON schema. The LLM returns a complete multi-day plan which is then saved to the database. Always use `response_format` with `json_schema` to ensure parseable output.

2. **Fitness Chat** (`ai.chat`): A conversational assistant that receives the user's profile context and a sample of available exercises. Uses the `FloatingAIChat` component on the frontend.

**When extending AI features:**

- Always call `invokeLLM` from server-side procedures only — never expose the API key to the client.
- Include the user's profile context in the system prompt for personalization.
- For structured output, always use `response_format.json_schema` with `strict: true`.
- Handle parsing failures gracefully with try/catch around `JSON.parse`.

---

## Skill 4: Frontend Page Development

The frontend uses **React 19 + Tailwind CSS 4 + shadcn/ui** with a dark athletic theme. All pages live in `client/src/pages/`.

**When creating or modifying a page:**

1. Use the `DashboardLayout` component for all authenticated pages — it provides the sidebar, user profile display, and navigation.
2. Import data with `trpc.*.useQuery()` and mutate with `trpc.*.useMutation()`.
3. Use `useAuth()` for authentication state. Redirect unauthenticated users to the login URL via `getLoginUrl()`.
4. Register new routes in `client/src/App.tsx` inside the `<Switch>` block.
5. Add navigation entries in `client/src/components/DashboardLayout.tsx` in the `navItems` array.

**Design conventions:**

- The app uses a **dark theme** (`defaultTheme="dark"`) with green accent colors (`oklch(0.7 0.2 145)` primary).
- Always pair `bg-*` with appropriate `text-*` classes to avoid invisible text.
- Use `framer-motion` for page transitions and micro-interactions.
- Show loading skeletons during data fetches, not blank screens.
- Use `sonner` toast notifications for success/error feedback.
- The `useUnit()` hook handles kg/lbs conversion — always use `formatWeight()` when displaying weights.

**Existing pages:**

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Dashboard with stats, PRs, recent workouts |
| Onboarding | `/onboarding` | 4-step profile setup wizard |
| Plans | `/plans` | List of user's workout plans |
| PlanDetail | `/plans/:id` | View/edit a plan with days and exercises |
| GeneratePlan | `/generate` | AI workout plan generation form |
| Exercises | `/exercises` | Searchable exercise library |
| ExerciseDetail | `/exercises/:id` | Single exercise with instructions |
| ActiveWorkout | `/workout` | Live workout session with timer |
| Templates | `/templates` | Saved workout templates |
| SessionDetail | `/sessions/:id` | Completed session review |
| Progress | `/progress` | Charts and statistics |
| Profile | `/profile` | User profile editing |

---

## Skill 5: Active Workout Session Flow

The workout session system is the most complex feature. Understanding its flow is critical.

**Session lifecycle:**

1. A session is created via `sessions.start` (quick workout), from a plan day (auto-populates exercises), or from a template (`templates.startSession`).
2. During the session, the user logs sets via `sessions.logSet`. Each log records exercise name, set number, reps, weight, and optional duration/notes.
3. After logging a set, the system automatically checks for new Personal Records on tracked exercises (Bench Press, Back Squat, Deadlift, Leg Press, Overhead Press).
4. A rest timer auto-starts after each logged set. Rest duration is customizable per exercise.
5. The session is completed via `sessions.complete`, which calculates total duration.
6. Completed sessions can be saved as reusable templates via `templates.createFromSession`.

**When modifying the workout flow:**

- The `ActiveWorkout.tsx` page manages complex local state for exercises, sets, and the timer. Be careful with state updates.
- Plan-based and template-based sessions pre-populate exercises from the backend. Quick workouts start empty.
- The rest timer uses `setInterval` with cleanup in `useEffect`. Always clear intervals on unmount.
- PR detection happens server-side in the `sessions.logSet` mutation — the response includes `newPR` and `prWeight` flags.

---

## Skill 6: Testing Conventions

Tests use **Vitest** and live in `server/*.test.ts`. The project currently has **35 passing tests** across 2 test files.

**When writing tests:**

1. Create a mock `TrpcContext` using the pattern from `server/auth.logout.test.ts` — mock `req`, `res`, and `user` objects.
2. Use `appRouter.createCaller(ctx)` to call procedures directly without HTTP.
3. Tests hit the real database — use unique identifiers or clean up after tests to avoid conflicts.
4. Group related tests in `describe` blocks.
5. Always run `pnpm test` and ensure all tests pass before delivering changes.

**Test coverage areas:**

- Auth logout (cookie clearing)
- Profile CRUD
- Exercise listing and filtering
- Plan creation and retrieval
- Session lifecycle (start, log, complete)
- PR detection and retrieval
- Plan day exercise fetching
- Template CRUD and session-from-template

---

## Skill 7: Unit Preference System

The app supports **kg and lbs** weight units. The user's preference is stored in `user_profiles.preferredUnit`.

**How it works:**

- All weights are stored in the database in **kilograms** (the canonical unit).
- The `useUnit()` hook on the frontend reads the user's preference and provides `formatWeight()` and conversion helpers (`kgToLbs`, `lbsToKg`).
- When displaying weights, always use `formatWeight()` — never show raw `weightKg` values directly.
- When accepting weight input from users, convert to kg before sending to the backend if the user's preference is lbs.

---

## Skill 8: Handling Debug Logging

The codebase currently contains some debug `fetch` calls in `Home.tsx` (agent logging to `127.0.0.1:7782`). These were added during development for debugging the onboarding redirect flow.

**Convention:** Debug logging blocks are wrapped in `// #region agent log` and `// #endregion` comments. These should be removed before production deployment. When encountering these blocks, clean them up unless they are actively being used for debugging.

---

## Skill 9: ExerciseDB Media Integration

Exercise guidance media is fetched from ExerciseDB in `server/exerciseMedia.ts` and exposed through `exercises.mediaByName`.

When extending media support:

1. Keep ExerciseDB fetch logic server-side only.
2. Use `mediaByName` from the exercise detail page (`ExerciseDetail.tsx`) for image/video guidance.
3. Handle missing media gracefully (show fallback UI, no broken embeds).
4. Configure integration via environment variables:
   - `EXERCISEDB_API_URL`
   - `EXERCISEDB_API_HOST`
   - `EXERCISEDB_API_KEY`
