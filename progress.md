# Fitness Planner — Development Progress

This document provides a comprehensive summary of all development work completed on the Fitness Planner project, reconstructed from the codebase, git history, and migration files. It covers both Manus agent sessions and direct GitHub contributions.

---

## Project Timeline

| Version | Date | Author | Summary |
|---|---|---|---|
| `43dd74a` | Mar 13, 2026 | Manus Agent | Initial project bootstrap (template scaffold) |
| `afbcb40` | Mar 14, 2026 | Manus Agent | Complete MVP with all core features |
| `e8e22ca` | Mar 14, 2026 | Manus Agent | Plan auto-population fix and Personal Records |
| `8e906d7` | Mar 14, 2026 | Manus Agent | Workout templates feature |
| `5287ba0` | Mar 14, 2026 | Vraj Gupta (GitHub) | Onboarding fix, unit preferences, UI refinements |
| `9cc49fe` | Mar 14, 2026 | Manus Agent | Sync GitHub changes, fix TS error, apply migration |
| `7eb51b8` | Mar 14, 2026 | Vraj Gupta (GitHub) | README with live URL |
| `local` | Mar 15, 2026 | Manus Agent | ExerciseDB media integration (real exercise image/video in detail view) |
| `local` | Mar 15, 2026 | Manus Agent | Added repo workflow rule to always commit+push after edits |

---

## Phase 1: Project Bootstrap (`43dd74a`)

The project was initialized using the Manus web app template with the following capabilities enabled: **database** (MySQL/TiDB via Drizzle ORM), **server** (Express + tRPC), and **user authentication** (Manus OAuth). This provided the foundational scaffold including the auth flow, tRPC setup, Vite build pipeline, and shadcn/ui component library.

---

## Phase 2: Complete MVP (`afbcb40`)

This was the largest single development phase, delivering the full application from scratch. The work encompassed database design, backend API development, exercise seeding, frontend theming, and all core page implementations.

### Database Schema (Migration `0001`)

Eleven database tables were designed and created to support the full feature set. The schema covers user profiles with physiology data, a curated exercise library, hierarchical workout plans (plan → days → exercises), workout sessions with individual set logs, and personal records tracking. All tables use auto-incrementing integer primary keys and UTC timestamps.

### Exercise Database Seeding

A seed script (`seed-exercises.mjs`) was created and executed to populate the `exercises` table with **90+ curated exercises** spanning 10 workout categories: plyometrics, weight training, cardio, HIIT, yoga, stretching, calisthenics, bodyweight, CrossFit, and sport-specific training. Each exercise includes a description, step-by-step instructions, target muscle groups, required equipment, and difficulty level.

### Backend API (`server/db.ts` and `server/routers.ts`)

The complete backend API was built with approximately **1,120 lines of code** across the database helper layer and tRPC router layer. The API provides full CRUD operations for user profiles, workout plans (including nested day and exercise management), workout sessions with set logging, and progress statistics. The AI integration was implemented using the Manus built-in LLM with structured JSON schema output for workout plan generation.

| Router | Endpoints | Description |
|---|---|---|
| `profile` | `get`, `upsert` | User profile and onboarding data |
| `exercises` | `list`, `get` | Exercise library with filtering |
| `plans` | `list`, `get`, `create`, `update`, `delete`, `addDay`, `deleteDay`, `addExercise`, `updateExercise`, `deleteExercise` | Full plan management |
| `ai` | `generatePlan` | LLM-powered workout plan generation |
| `sessions` | `list`, `active`, `get`, `start`, `logSet`, `updateLog`, `deleteLog`, `complete`, `abandon` | Workout session lifecycle |
| `progress` | `stats`, `exerciseHistory`, `weeklyActivity` | Statistics and charts data |

### Frontend Theme and Layout

A **dark athletic theme** was designed with the following characteristics: a near-black background (`oklch(0.13 0.02 260)`), green primary accent (`oklch(0.7 0.2 145)`), and the Inter font family. The `DashboardLayout` component provides persistent sidebar navigation with icons for all major sections. The theme uses CSS custom properties for consistent color application across all shadcn/ui components.

### Frontend Pages (12 pages, ~4,400 lines)

All twelve application pages were built in this phase:

**Dashboard (`Home.tsx`, 234 lines):** The landing page displays a personalized greeting, four summary stat cards (total workouts, total volume, total reps, exercises done), quick-access cards for plans and the exercise library, and a recent workouts list. It redirects unauthenticated users to login and users without completed onboarding to the onboarding wizard.

**Onboarding (`Onboarding.tsx`, 294 lines):** A 4-step wizard that collects user data sequentially. Step 1 gathers basic info (age, gender, height, weight). Step 2 collects fitness level, body type, and injuries. Step 3 presents fitness goals as a multi-select grid. Step 4 presents available equipment as a multi-select grid. Progress is shown via a step indicator and progress bar.

**Plans (`Plans.tsx`, 148 lines):** Lists all user workout plans with cards showing plan name, description, days per week, goal focus, and AI-generated badge. Includes a "Create Plan" button and navigation to plan details.

**Plan Detail (`PlanDetail.tsx`, 439 lines):** Displays a single plan with all its days and exercises. Each day card shows the exercise list with sets, reps, and rest times. Includes a "Start Workout" button per day that creates a session with the plan day linked.

**AI Generate (`GeneratePlan.tsx`, 170 lines):** A form for AI workout plan generation. Users select goal focus, days per week, session duration, and add optional notes. The form submits to the `ai.generatePlan` endpoint and redirects to the new plan on success.

**Exercise Library (`Exercises.tsx`, 163 lines):** A searchable, filterable grid of exercises. Filters include workout type, equipment, difficulty, and muscle group. Each exercise card shows the name, type badge, difficulty badge, and muscle groups.

**Exercise Detail (`ExerciseDetail.tsx`, 115 lines):** Displays a single exercise with full description, step-by-step instructions, equipment needed, difficulty level, and targeted muscle groups.

**Active Workout (`ActiveWorkout.tsx`, 876 lines):** The most complex page. It manages the full workout session flow including exercise listing, set logging with reps/weight/duration inputs, an auto-starting rest timer with circular progress visualization, and session completion. Supports three entry modes: quick workout (empty), plan-based (pre-populated), and template-based (pre-populated).

**Templates (`Templates.tsx`, 193 lines):** Lists saved workout templates with exercise counts and creation dates. Each template card has "Start Workout" and "Delete" actions.

**Session Detail (`SessionDetail.tsx`, 198 lines):** Displays a completed workout session with duration, exercise breakdown, and individual set logs. Includes a "Save as Template" dialog.

**Progress (`Progress.tsx`, 290 lines):** Data visualization page with three sections: a weekly activity bar chart (workouts per day over the last 8 weeks), an exercise weight progression line chart (select any exercise to see weight over time), and summary statistics.

**Profile (`Profile.tsx`, 234 lines):** Displays and allows editing of all user profile fields collected during onboarding, plus the unit preference toggle.

### Test Suite (23 tests)

The initial test suite covered auth logout, profile CRUD, exercise listing/filtering, plan creation/retrieval, session lifecycle, and progress stats.

---

## Phase 3: Plan Auto-Population and Personal Records (`e8e22ca`)

This phase addressed a critical usability bug and added a new feature.

### Bug Fix: Plan Workout Auto-Population

When starting a workout from a plan day, the Active Workout page previously required users to manually add exercises even though the plan already defined them. The fix involved adding a `planDay.getExercises` endpoint and updating the `ActiveWorkout` page to detect when a `planDayId` is present on the active session, fetch the plan day's exercises, and pre-populate the local exercise state with names, sets, reps, and rest times already filled in. The "Add Custom Exercise" section remains available for adding extra exercises on top of the plan.

### Feature: Personal Records Tracking

A new `personal_records` table was created (migration `0002`) to track best lifts for five key compound exercises: **Bench Press, Back Squat, Deadlift, Leg Press, and Overhead Press**. The PR detection logic was integrated into the `sessions.logSet` mutation — after logging a set, the system checks if the weight exceeds the user's current PR for that exercise and updates the record if so. The response includes `newPR` and `prWeight` flags, which trigger a celebratory toast notification on the frontend. PR cards were added to both the Dashboard and Progress pages, showing the current max weight, reps at max, date achieved, and improvement delta from the previous record.

### Test Additions (6 new tests, 29 total)

Tests were added for PR detection/retrieval and plan day exercise fetching.

---

## Phase 4: Workout Templates (`8e906d7`)

This phase added the ability to save completed workouts as reusable templates.

### Database (Migration `0003`)

Two new tables were created: `workout_templates` (stores template metadata and links to the source session) and `workout_template_exercises` (stores the exercise configuration copied from the session logs).

### Backend

Four new endpoints were added under the `templates` router: `list` (get all user templates), `get` (get template with exercises), `createFromSession` (copy a completed session's exercises into a new template), `delete`, and `startSession` (create a new active session pre-populated with the template's exercises).

### Frontend

The **Templates page** was created and added to the sidebar navigation with a Bookmark icon. The **Session Detail page** received a "Save as Template" button that opens a dialog for naming and describing the template. The **Active Workout page** was updated to support a third entry mode — starting from a template — which pre-populates exercises just like plan-based sessions.

### Test Additions (6 new tests, 35 total)

Tests cover template creation from completed sessions, rejection of template creation from active sessions, starting sessions from templates, and template deletion.

---

## Phase 5: GitHub Contributions by Owner (`5287ba0`)

Vraj Gupta made direct changes to the GitHub repository, which were synced into the project. These changes touched 17 files with approximately 945 lines added and 94 removed.

### Unit Preference System

A new `preferredUnit` column was added to the `user_profiles` table (migration `0004`) with an enum of `kg` and `lbs`, defaulting to `kg`. A new `useUnit()` hook (`client/src/hooks/useUnit.ts`, 60 lines) was created to provide `formatWeight()`, `kgToLbs()`, `lbsToKg()`, and `parseInputWeight()` functions. The hook reads the user's preference from their profile and handles all conversion logic. Weight displays across the Dashboard, Progress, Active Workout, Session Detail, and Templates pages were updated to use `formatWeight()` instead of hardcoded "kg" strings. The Profile page received a unit preference toggle.

### Floating AI Chat

A new `FloatingAIChat` component (`client/src/components/FloatingAIChat.tsx`, 79 lines) was created using the pre-built `AIChatBox` component wrapped in a `Sheet` (slide-out panel). It connects to the `ai.chat` endpoint and provides a persistent floating chat button (green circle in the bottom-right corner) available on all dashboard pages. The component was integrated into `DashboardLayout.tsx`.

### Enhanced Plan Detail Page

The `PlanDetail.tsx` page received significant enhancements (409 lines changed). New features include the ability to **add exercises** to existing plan days (with a form for exercise name, sets, reps, and rest time) and **delete exercises** from plan days (with a confirmation dialog). The page also received UI polish and better state management.

### Plans Page Enhancements

The Plans listing page (`Plans.tsx`, 39 lines changed) received additional UI improvements including better card layouts and action buttons.

### Onboarding Redirect Fix

The `Home.tsx` page received fixes for the onboarding redirect logic to properly detect when a user has not completed onboarding and redirect them to the wizard. Debug logging was added (wrapped in `#region agent log` blocks) to diagnose redirect timing issues.

### Onboarding Flow Improvements

The `Onboarding.tsx` page received refinements (19 lines changed) to improve the step transitions and data submission flow.

---

## Phase 6: Sync and Stabilization (`9cc49fe`)

This phase merged the GitHub changes into the Manus project, fixed a TypeScript compilation error, and applied the pending database migration.

The TypeScript error `TS2502` in `PlanDetail.tsx` was caused by a circular type reference where `typeof day` was used in the `onStart` callback parameter of the `PlanDayCard` component — since `day` was being defined in the same type annotation, TypeScript could not resolve the circular dependency. The fix replaced `typeof day` with an explicit inline type definition and used `any` for the callback parameter type.

The `preferredUnit` migration (`0004_preferred_unit.sql`) was applied to add the column to the live database, resolving test failures caused by the missing column.

---

## Phase 7: README (`7eb51b8`)

Vraj Gupta added a `README.md` to the GitHub repository with the live URL: `frameworkfitness.manus.space`.

---

## Phase 8: ExerciseDB Media Integration (`local`)

This phase replaced local placeholder exercise visuals with real exercise media fetched from ExerciseDB and displayed in the exercise detail experience.

### Backend and API Updates

- Added `server/exerciseMedia.ts` to fetch and cache ExerciseDB media by exercise name.
- Added `exercises.mediaByName` endpoint in `server/routers.ts`.
- Removed local SVG/image catalog plumbing from `server/db.ts` and seed coverage enforcement.

### Frontend Updates

- `ExerciseDetail.tsx` now loads ExerciseDB media via `trpc.exercises.mediaByName` and renders:
  - real exercise image (when available),
  - exercise video player (when available),
  - graceful no-media fallback UI.
- Removed local image rendering additions from `Exercises.tsx`, `ActiveWorkout.tsx`, and `SessionDetail.tsx`.

### Testing and Cleanup

- Removed temporary local image catalog test.
- Reverted exercise-list test assertions that depended on synthetic `imageUrls`.

---

## Phase 9: Commit-and-Push Workflow Rule (`local`)

Project documentation was updated to enforce a repository workflow rule:

- agents and skills guidance now state that edits should be committed and pushed in the same session by default;
- exceptions are only when the user explicitly asks to keep changes local.

---

## Current State Summary

The application is fully functional with the following metrics:

| Metric | Value |
|---|---|
| Total TypeScript lines | ~16,190 |
| Frontend pages | 12 |
| Backend endpoints | 30+ |
| Database tables | 11 |
| Seeded exercises | 90+ |
| Database migrations | 5 (0000–0004) |
| Vitest tests | 40 |
| TypeScript errors | 0 |

### Feature Completeness

| Feature | Status | Notes |
|---|---|---|
| User authentication (OAuth) | Complete | Manus OAuth with session cookies |
| Onboarding wizard (4 steps) | Complete | Collects all physiology and preference data |
| Exercise library (90+ exercises) | Complete | Search, filter by type/equipment/difficulty/muscle |
| AI workout plan generation | Complete | LLM with structured JSON output |
| Manual plan creation and editing | Complete | Add/delete days and exercises |
| Active workout sessions | Complete | Three entry modes (quick, plan, template) |
| Set/rep/weight logging | Complete | Per-set logging with notes |
| Auto-starting rest timer | Complete | Customizable per exercise, circular progress UI |
| Personal Records tracking | Complete | 5 compound lifts, auto-detection, toast notifications |
| Workout templates | Complete | Save from session, start from template |
| Progress tracking (charts) | Complete | Weekly activity, weight progression, stats |
| Unit preference (kg/lbs) | Complete | Toggle in profile, automatic conversion |
| Floating AI chat | Complete | Contextual fitness advice |
| Profile management | Complete | Edit all onboarding fields |
| Dark athletic theme | Complete | Green accent, Inter font |
| Dashboard with stats | Complete | Summary cards, PRs, recent workouts |

### Known Issues and Technical Debt

1. **Debug logging in Home.tsx** — Agent debug `fetch` calls to `127.0.0.1:7782` remain in the code, wrapped in `#region agent log` blocks. These should be removed before production deployment.

2. **No formal foreign key constraints** — The database uses integer columns for relationships but does not enforce FK constraints at the database level. Referential integrity is maintained at the application layer.

3. **ExerciseDB dependency** — Exercise media now depends on external API availability and credentials. Add monitoring and fallback strategy for API failures/rate limits.

4. **No workout calendar view** — Users cannot see their workout schedule on a calendar. This has been a recurring suggestion for future development.
