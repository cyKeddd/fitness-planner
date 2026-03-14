import { and, desc, eq, like, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  userProfiles, InsertUserProfile,
  exercises,
  workoutPlans, InsertWorkoutPlan,
  workoutPlanDays, InsertWorkoutPlanDay,
  workoutPlanExercises, InsertWorkoutPlanExercise,
  workoutSessions, InsertWorkoutSession,
  sessionLogs, InsertSessionLog,
  personalRecords, InsertPersonalRecord,
  workoutTemplates, InsertWorkoutTemplate,
  workoutTemplateExercises, InsertWorkoutTemplateExercise,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== USER PROFILE ====================

export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertProfile(data: InsertUserProfile) {
  const db = await getDb();
  if (!db) return;
  const existing = await getProfile(data.userId);
  if (existing) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, data.userId));
  } else {
    await db.insert(userProfiles).values(data);
  }
  return getProfile(data.userId);
}

// ==================== EXERCISES ====================

export async function listExercises(filters?: {
  workoutType?: string;
  equipment?: string;
  difficulty?: string;
  muscleGroup?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { exercises: [], total: 0 };

  const conditions = [];
  if (filters?.workoutType) conditions.push(eq(exercises.workoutType, filters.workoutType));
  if (filters?.equipment) conditions.push(eq(exercises.equipment, filters.equipment));
  if (filters?.difficulty) conditions.push(sql`${exercises.difficulty} = ${filters.difficulty}`);
  if (filters?.search) conditions.push(like(exercises.name, `%${filters.search}%`));
  if (filters?.muscleGroup) {
    conditions.push(sql`JSON_CONTAINS(${exercises.muscleGroups}, ${JSON.stringify(filters.muscleGroup)})`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const rows = await db.select().from(exercises).where(where).limit(limit).offset(offset);
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(exercises).where(where);
  const total = countResult[0]?.count ?? 0;

  return { exercises: rows, total };
}

export async function getExercise(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
  return rows[0] ?? null;
}

// ==================== WORKOUT PLANS ====================

export async function getUserPlans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workoutPlans).where(eq(workoutPlans.userId, userId)).orderBy(desc(workoutPlans.updatedAt));
}

export async function getPlan(planId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(workoutPlans).where(eq(workoutPlans.id, planId)).limit(1);
  return rows[0] ?? null;
}

export async function createPlan(data: InsertWorkoutPlan) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(workoutPlans).values(data);
  const id = result[0].insertId;
  return getPlan(id);
}

export async function updatePlan(planId: number, data: Partial<InsertWorkoutPlan>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(workoutPlans).set(data).where(eq(workoutPlans.id, planId));
  return getPlan(planId);
}

export async function deletePlan(planId: number) {
  const db = await getDb();
  if (!db) return;
  // Delete exercises first, then days, then plan
  const days = await db.select().from(workoutPlanDays).where(eq(workoutPlanDays.planId, planId));
  for (const day of days) {
    await db.delete(workoutPlanExercises).where(eq(workoutPlanExercises.planDayId, day.id));
  }
  await db.delete(workoutPlanDays).where(eq(workoutPlanDays.planId, planId));
  await db.delete(workoutPlans).where(eq(workoutPlans.id, planId));
}

// ==================== PLAN DAYS ====================

export async function getPlanDays(planId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workoutPlanDays).where(eq(workoutPlanDays.planId, planId)).orderBy(workoutPlanDays.dayNumber);
}

export async function getPlanDay(dayId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(workoutPlanDays).where(eq(workoutPlanDays.id, dayId)).limit(1);
  return rows[0] ?? null;
}

export async function createPlanDay(data: InsertWorkoutPlanDay) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(workoutPlanDays).values(data);
  const id = result[0].insertId;
  const rows = await db.select().from(workoutPlanDays).where(eq(workoutPlanDays.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deletePlanDay(dayId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(workoutPlanExercises).where(eq(workoutPlanExercises.planDayId, dayId));
  await db.delete(workoutPlanDays).where(eq(workoutPlanDays.id, dayId));
}

// ==================== PLAN EXERCISES ====================

export async function getPlanDayExercises(planDayId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workoutPlanExercises).where(eq(workoutPlanExercises.planDayId, planDayId)).orderBy(workoutPlanExercises.orderIndex);
}

export async function addPlanExercise(data: InsertWorkoutPlanExercise) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(workoutPlanExercises).values(data);
  const id = result[0].insertId;
  const rows = await db.select().from(workoutPlanExercises).where(eq(workoutPlanExercises.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updatePlanExercise(id: number, data: Partial<InsertWorkoutPlanExercise>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(workoutPlanExercises).set(data).where(eq(workoutPlanExercises.id, id));
  const rows = await db.select().from(workoutPlanExercises).where(eq(workoutPlanExercises.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deletePlanExercise(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(workoutPlanExercises).where(eq(workoutPlanExercises.id, id));
}

export async function bulkInsertPlanExercises(exercisesList: InsertWorkoutPlanExercise[]) {
  const db = await getDb();
  if (!db) return;
  if (exercisesList.length === 0) return;
  await db.insert(workoutPlanExercises).values(exercisesList);
}

// ==================== WORKOUT SESSIONS ====================

export async function getUserSessions(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workoutSessions)
    .where(eq(workoutSessions.userId, userId))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit).offset(offset);
}

export async function getSession(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId)).limit(1);
  return rows[0] ?? null;
}

export async function getActiveSession(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "active")))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function createSession(data: InsertWorkoutSession) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(workoutSessions).values(data);
  return getSession(result[0].insertId);
}

export async function updateSession(sessionId: number, data: Partial<InsertWorkoutSession>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(workoutSessions).set(data).where(eq(workoutSessions.id, sessionId));
  return getSession(sessionId);
}

// ==================== SESSION LOGS ====================

export async function getSessionLogs(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessionLogs)
    .where(eq(sessionLogs.sessionId, sessionId))
    .orderBy(sessionLogs.exerciseName, sessionLogs.setNumber);
}

export async function addSessionLog(data: InsertSessionLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(sessionLogs).values(data);
  const rows = await db.select().from(sessionLogs).where(eq(sessionLogs.id, result[0].insertId)).limit(1);
  return rows[0] ?? null;
}

export async function updateSessionLog(id: number, data: Partial<InsertSessionLog>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(sessionLogs).set(data).where(eq(sessionLogs.id, id));
  const rows = await db.select().from(sessionLogs).where(eq(sessionLogs.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function deleteSessionLog(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(sessionLogs).where(eq(sessionLogs.id, id));
}

// ==================== PROGRESS / STATS ====================

export async function getExerciseProgress(userId: number, exerciseName: string, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  // Get max weight per session for this exercise
  const rows = await db.execute(sql`
    SELECT sl.exerciseName, MAX(sl.weightKg) as maxWeight, MAX(sl.reps) as maxReps,
           ws.startedAt as sessionDate, ws.id as sessionId
    FROM session_logs sl
    JOIN workout_sessions ws ON sl.sessionId = ws.id
    WHERE ws.userId = ${userId} AND sl.exerciseName = ${exerciseName} AND ws.status = 'completed'
    GROUP BY ws.id, ws.startedAt, sl.exerciseName
    ORDER BY ws.startedAt DESC
    LIMIT ${limit}
  `);
  return (rows as unknown as any[][])[0] ?? [];
}

export async function getWorkoutStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const totalSessions = await db.select({ count: sql<number>`count(*)` }).from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "completed")));
  const totalVolume = await db.execute(sql`
    SELECT COALESCE(SUM(sl.weightKg * sl.reps), 0) as totalVolume,
           COALESCE(SUM(sl.reps), 0) as totalReps,
           COUNT(DISTINCT sl.exerciseName) as uniqueExercises
    FROM session_logs sl
    JOIN workout_sessions ws ON sl.sessionId = ws.id
    WHERE ws.userId = ${userId} AND ws.status = 'completed'
  `);
  const recentSessions = await db.select().from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "completed")))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(7);

  const stats = ((totalVolume as unknown as any[][])[0] ?? [])[0] ?? { totalVolume: 0, totalReps: 0, uniqueExercises: 0 };
  return {
    totalSessions: totalSessions[0]?.count ?? 0,
    totalVolume: stats.totalVolume,
    totalReps: stats.totalReps,
    uniqueExercises: stats.uniqueExercises,
    recentSessions,
  };
}

export async function getWeeklyActivity(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT DATE(startedAt) as date, COUNT(*) as count, SUM(durationSeconds) as totalDuration
    FROM workout_sessions
    WHERE userId = ${userId} AND status = 'completed' AND startedAt >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
    GROUP BY DATE(startedAt)
    ORDER BY date ASC
  `);
  return ((rows as unknown as any[][])[0]) ?? [];
}

// ==================== PERSONAL RECORDS ====================

const PR_EXERCISES = ["Bench Press", "Back Squat", "Deadlift", "Leg Press", "Overhead Press"];

export async function getPersonalRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(personalRecords)
    .where(eq(personalRecords.userId, userId))
    .orderBy(personalRecords.exerciseName);
  return rows;
}

export async function getPersonalRecord(userId: number, exerciseName: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(personalRecords)
    .where(and(eq(personalRecords.userId, userId), eq(personalRecords.exerciseName, exerciseName)))
    .limit(1);
  return rows[0] ?? null;
}

// ==================== WORKOUT TEMPLATES ====================

export async function getUserTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workoutTemplates)
    .where(eq(workoutTemplates.userId, userId))
    .orderBy(desc(workoutTemplates.updatedAt));
}

export async function getTemplate(templateId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(workoutTemplates).where(eq(workoutTemplates.id, templateId)).limit(1);
  return rows[0] ?? null;
}

export async function getTemplateExercises(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workoutTemplateExercises)
    .where(eq(workoutTemplateExercises.templateId, templateId))
    .orderBy(workoutTemplateExercises.orderIndex);
}

export async function createTemplateFromSession(userId: number, sessionId: number, name: string, description?: string) {
  const db = await getDb();
  if (!db) return null;

  // Get session logs
  const logs = await getSessionLogs(sessionId);
  if (logs.length === 0) return null;

  // Create template
  const result = await db.insert(workoutTemplates).values({
    userId,
    name,
    description: description ?? null,
    sourceSessionId: sessionId,
  });
  const templateId = result[0].insertId;

  // Group logs by exercise name to determine sets/reps/weight
  const exerciseMap = new Map<string, { sets: number; reps: number; weightKg: number | null; orderIndex: number }>();
  let orderIndex = 0;
  for (const log of logs) {
    if (!exerciseMap.has(log.exerciseName)) {
      exerciseMap.set(log.exerciseName, {
        sets: 0,
        reps: log.reps ?? 0,
        weightKg: log.weightKg,
        orderIndex: orderIndex++,
      });
    }
    const entry = exerciseMap.get(log.exerciseName)!;
    entry.sets += 1;
    // Use the max weight and typical reps
    if (log.weightKg && (entry.weightKg === null || log.weightKg > entry.weightKg)) {
      entry.weightKg = log.weightKg;
    }
  }

  // Insert template exercises
  const templateExercises: InsertWorkoutTemplateExercise[] = Array.from(exerciseMap.entries()).map(([exerciseName, data]) => ({
    templateId,
    exerciseName,
    sets: data.sets,
    reps: String(data.reps),
    weightKg: data.weightKg,
    restSeconds: 60,
    orderIndex: data.orderIndex,
  }));
  if (templateExercises.length > 0) {
    await db.insert(workoutTemplateExercises).values(templateExercises);
  }

  return getTemplate(templateId);
}

export async function deleteTemplate(templateId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(workoutTemplateExercises).where(eq(workoutTemplateExercises.templateId, templateId));
  await db.delete(workoutTemplates).where(eq(workoutTemplates.id, templateId));
}

export async function checkAndUpdatePR(userId: number, exerciseName: string, weightKg: number, reps: number): Promise<boolean> {
  // Only track PRs for the 5 main lifts (case-insensitive match)
  const matchedExercise = PR_EXERCISES.find(e => e.toLowerCase() === exerciseName.toLowerCase());
  if (!matchedExercise) return false;

  const db = await getDb();
  if (!db) return false;

  const existing = await db.select().from(personalRecords)
    .where(and(eq(personalRecords.userId, userId), eq(personalRecords.exerciseName, matchedExercise)))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    if (weightKg > current.maxWeightKg) {
      await db.update(personalRecords)
        .set({
          previousMaxKg: current.maxWeightKg,
          maxWeightKg: weightKg,
          repsAtMax: reps,
          achievedAt: new Date(),
        })
        .where(eq(personalRecords.id, current.id));
      return true;
    }
    return false;
  } else {
    await db.insert(personalRecords).values({
      userId,
      exerciseName: matchedExercise,
      maxWeightKg: weightKg,
      repsAtMax: reps,
    });
    return true; // First time logging = new PR
  }
}
