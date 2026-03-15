# Fitness Planner - Project TODO

## Database & Schema
- [x] User profiles table (age, gender, height, weight, fitness level, body type, injuries, goals, equipment)
- [x] Exercises table (name, description, muscle groups, difficulty, equipment, workout type, instructions)
- [x] Workout plans table (user-linked, AI-generated or custom, name, description, schedule)
- [x] Workout plan exercises table (linking exercises to plans with sets/reps/weight/rest)
- [x] Workout sessions table (active workout tracking, start/end time, status)
- [x] Workout session logs table (per-set logging: exercise, set number, reps, weight, completed)
- [x] Seed curated exercise database with 90 exercises

## Backend API
- [x] User profile CRUD (onboarding data save/update)
- [x] Exercise library queries (list, filter by type/equipment/muscle group, search)
- [x] AI workout plan generation endpoint (LLM integration)
- [x] Workout plan CRUD (create, read, update, delete plans)
- [x] Workout session management (start, log sets, complete, abandon)
- [x] Progress/statistics queries (weight progression, workout history, performance stats)

## Frontend - Theming & Layout
- [x] Dark athletic theme with energetic accent colors
- [x] Dashboard layout with sidebar navigation
- [x] Responsive design for mobile workout use

## Frontend - Onboarding
- [x] Multi-step onboarding wizard
- [x] Personal info collection (age, gender, height, weight)
- [x] Fitness profile (level, body type, injuries/limitations)
- [x] Goals selection (muscle gain, fat loss, strength, endurance, general fitness, athletic performance)
- [x] Equipment availability selection
- [x] Onboarding completion and profile save

## Frontend - Core Pages
- [x] Dashboard/home page with workout overview
- [x] Exercise library page with search and filters
- [x] Exercise detail view with instructions and muscle groups
- [x] Workout plans page (view all plans)
- [x] Workout plan detail/edit page
- [x] AI workout generation page/flow

## Frontend - Active Workout
- [x] Active workout session interface
- [x] Exercise instructions display during workout
- [x] Set/rep/weight logging per exercise
- [x] Auto-starting rest timer between sets
- [x] Customizable rest durations
- [x] Workout completion summary

## Frontend - Progress Tracking
- [x] Progress dashboard with data visualizations
- [x] Weight progression charts over time
- [x] Workout history log
- [x] Performance statistics (volume, frequency, PRs)

## Testing & Polish
- [x] Backend API tests (vitest) - 23 tests passing
- [x] UI polish and error handling
- [x] Loading states and empty states

## Bug Fixes
- [x] Starting a workout from a plan should auto-populate exercises with sets, reps, rest times pre-filled
- [x] Users should only need to add custom exercises when doing a custom/quick workout

## New Features
- [x] Personal Records (PRs) tracking for 5 main compound lifts (Bench Press, Back Squat, Deadlift, Leg Press, Overhead Press)
- [x] Auto-detect new PRs when logging sets
- [x] Display PRs on dashboard and progress page

## Workout Templates
- [x] Create workout_templates and workout_template_exercises database tables
- [x] Backend API: create template from completed session, list templates, get template, delete template
- [x] Save-as-template button on completed workout session detail page
- [x] Templates listing page accessible from sidebar navigation
- [x] Start a new workout session directly from a template with exercises pre-populated
- [x] Write tests for template CRUD and session-from-template flow

## Documentation
- [x] Create skills.md - project-specific skills and conventions for agents
- [x] Create agents.md - reference guide for any agent working on this project
- [x] Create progress.md - comprehensive summary of all progress made in the codebase
