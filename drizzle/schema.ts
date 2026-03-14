import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, float } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profile - stores onboarding data, physiology, goals, equipment
 */
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  age: int("age"),
  gender: varchar("gender", { length: 32 }),
  heightCm: float("heightCm"),
  weightKg: float("weightKg"),
  fitnessLevel: mysqlEnum("fitnessLevel", ["beginner", "intermediate", "advanced"]),
  bodyType: varchar("bodyType", { length: 64 }),
  injuries: text("injuries"),
  goals: json("goals"), // array of goal strings
  equipment: json("equipment"), // array of equipment strings
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Curated exercise database
 */
export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  workoutType: varchar("workoutType", { length: 64 }).notNull(), // plyometrics, weights, cardio, hiit, yoga, stretching, calisthenics, bodyweight, crossfit, sport_specific
  muscleGroups: json("muscleGroups"), // array of muscle group strings
  equipment: varchar("equipment", { length: 128 }), // none, dumbbells, barbell, etc.
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

/**
 * Workout plans - AI-generated or user-created
 */
export const workoutPlans = mysqlTable("workout_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isAiGenerated: boolean("isAiGenerated").default(false).notNull(),
  daysPerWeek: int("daysPerWeek"),
  goalFocus: varchar("goalFocus", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type InsertWorkoutPlan = typeof workoutPlans.$inferInsert;

/**
 * Workout plan days - each day in a plan
 */
export const workoutPlanDays = mysqlTable("workout_plan_days", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  dayNumber: int("dayNumber").notNull(), // 1, 2, 3...
  name: varchar("name", { length: 255 }).notNull(), // "Push Day", "Leg Day", etc.
  description: text("description"),
});

export type WorkoutPlanDay = typeof workoutPlanDays.$inferSelect;
export type InsertWorkoutPlanDay = typeof workoutPlanDays.$inferInsert;

/**
 * Exercises within a workout plan day
 */
export const workoutPlanExercises = mysqlTable("workout_plan_exercises", {
  id: int("id").autoincrement().primaryKey(),
  planDayId: int("planDayId").notNull(),
  exerciseId: int("exerciseId"),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
  sets: int("sets").notNull(),
  reps: varchar("reps", { length: 64 }).notNull(), // "8-12", "30s", "AMRAP"
  restSeconds: int("restSeconds").default(60).notNull(),
  notes: text("notes"),
  orderIndex: int("orderIndex").notNull(),
});

export type WorkoutPlanExercise = typeof workoutPlanExercises.$inferSelect;
export type InsertWorkoutPlanExercise = typeof workoutPlanExercises.$inferInsert;

/**
 * Workout sessions - active or completed workouts
 */
export const workoutSessions = mysqlTable("workout_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planDayId: int("planDayId"),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  durationSeconds: int("durationSeconds"),
  notes: text("notes"),
});

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = typeof workoutSessions.$inferInsert;

/**
 * Individual set logs within a workout session
 */
export const sessionLogs = mysqlTable("session_logs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  exerciseId: int("exerciseId"),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
  setNumber: int("setNumber").notNull(),
  reps: int("reps"),
  weightKg: float("weightKg"),
  durationSeconds: int("durationSeconds"),
  completed: boolean("completed").default(true).notNull(),
  notes: text("notes"),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
});

export type SessionLog = typeof sessionLogs.$inferSelect;
export type InsertSessionLog = typeof sessionLogs.$inferInsert;

/**
 * Personal records - tracks best lifts for key exercises
 */
export const personalRecords = mysqlTable("personal_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
  maxWeightKg: float("maxWeightKg").notNull(),
  repsAtMax: int("repsAtMax"),
  achievedAt: timestamp("achievedAt").defaultNow().notNull(),
  previousMaxKg: float("previousMaxKg"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = typeof personalRecords.$inferInsert;

/**
 * Workout templates - saved from completed sessions for quick re-use
 */
export const workoutTemplates = mysqlTable("workout_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sourceSessionId: int("sourceSessionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type InsertWorkoutTemplate = typeof workoutTemplates.$inferInsert;

/**
 * Exercises within a workout template
 */
export const workoutTemplateExercises = mysqlTable("workout_template_exercises", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
  sets: int("sets").notNull(),
  reps: varchar("reps", { length: 64 }).notNull(),
  weightKg: float("weightKg"),
  restSeconds: int("restSeconds").default(60).notNull(),
  notes: text("notes"),
  orderIndex: int("orderIndex").notNull(),
});

export type WorkoutTemplateExercise = typeof workoutTemplateExercises.$inferSelect;
export type InsertWorkoutTemplateExercise = typeof workoutTemplateExercises.$inferInsert;
