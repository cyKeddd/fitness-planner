import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User 1");
    expect(result?.email).toBe("test1@example.com");
    expect(result?.id).toBe(1);
  });
});

describe("exercises.list", () => {
  it("returns exercises without filters (public endpoint)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.exercises.list({});
    expect(result).toHaveProperty("exercises");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.exercises)).toBe(true);
    expect(result.total).toBeGreaterThan(0);
  });

  it("returns exercises filtered by workout type", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.exercises.list({ workoutType: "weights" });
    expect(result.exercises.length).toBeGreaterThan(0);
    result.exercises.forEach(ex => {
      expect(ex.workoutType).toBe("weights");
    });
  });

  it("returns exercises filtered by difficulty", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.exercises.list({ difficulty: "beginner" });
    expect(result.exercises.length).toBeGreaterThan(0);
    result.exercises.forEach(ex => {
      expect(ex.difficulty).toBe("beginner");
    });
  });

  it("returns exercises filtered by search term", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.exercises.list({ search: "Squat" });
    expect(result.exercises.length).toBeGreaterThan(0);
    result.exercises.forEach(ex => {
      expect(ex.name.toLowerCase()).toContain("squat");
    });
  });

  it("respects limit parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.exercises.list({ limit: 5 });
    expect(result.exercises.length).toBeLessThanOrEqual(5);
  });
});

describe("exercises.get", () => {
  it("returns a specific exercise by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // First get the list to find a valid ID
    const list = await caller.exercises.list({ limit: 1 });
    expect(list.exercises.length).toBeGreaterThan(0);
    const exerciseId = list.exercises[0].id;

    const exercise = await caller.exercises.get({ id: exerciseId });
    expect(exercise).not.toBeNull();
    expect(exercise?.id).toBe(exerciseId);
    expect(exercise?.name).toBeTruthy();
    expect(exercise?.description).toBeTruthy();
    expect(exercise?.workoutType).toBeTruthy();
    expect(exercise?.difficulty).toBeTruthy();
  });

  it("returns null for non-existent exercise", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const exercise = await caller.exercises.get({ id: 99999 });
    expect(exercise).toBeNull();
  });
});

describe("profile", () => {
  it("requires authentication for profile.get", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.profile.get()).rejects.toThrow();
  });

  it("requires authentication for profile.upsert", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.profile.upsert({ age: 25 })).rejects.toThrow();
  });

  it("can upsert and get a profile", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const updated = await caller.profile.upsert({
      age: 25,
      gender: "male",
      heightCm: 180,
      weightKg: 75,
      fitnessLevel: "intermediate",
      bodyType: "mesomorph",
      goals: ["muscle_gain", "strength"],
      equipment: ["barbell", "dumbbells"],
      onboardingCompleted: true,
    });

    expect(updated).not.toBeNull();
    expect(updated?.age).toBe(25);
    expect(updated?.gender).toBe("male");
    expect(updated?.heightCm).toBe(180);
    expect(updated?.fitnessLevel).toBe("intermediate");
    expect(updated?.onboardingCompleted).toBe(true);

    const profile = await caller.profile.get();
    expect(profile).not.toBeNull();
    expect(profile?.age).toBe(25);
  });
});

describe("plans", () => {
  it("requires authentication for plans.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.plans.list()).rejects.toThrow();
  });

  it("can create, get, and delete a plan", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Create
    const plan = await caller.plans.create({
      name: "Test Plan",
      description: "A test workout plan",
      daysPerWeek: 4,
      goalFocus: "strength",
    });
    expect(plan).not.toBeNull();
    expect(plan?.name).toBe("Test Plan");
    expect(plan?.daysPerWeek).toBe(4);

    // List
    const plans = await caller.plans.list();
    expect(plans.length).toBeGreaterThan(0);
    const found = plans.find(p => p.id === plan?.id);
    expect(found).toBeTruthy();

    // Get with details
    const detail = await caller.plans.get({ id: plan!.id });
    expect(detail).not.toBeNull();
    expect(detail?.name).toBe("Test Plan");
    expect(detail?.days).toBeDefined();

    // Delete
    const deleteResult = await caller.plans.delete({ id: plan!.id });
    expect(deleteResult.success).toBe(true);
  });

  it("can add days and exercises to a plan", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const plan = await caller.plans.create({
      name: "Day Test Plan",
      daysPerWeek: 3,
    });
    expect(plan).not.toBeNull();

    // Add a day
    const day = await caller.plans.addDay({
      planId: plan!.id,
      dayNumber: 1,
      name: "Push Day",
      description: "Chest, shoulders, triceps",
    });
    expect(day).not.toBeNull();
    expect(day?.name).toBe("Push Day");

    // Add an exercise to the day
    const exercise = await caller.plans.addExercise({
      planDayId: day!.id,
      exerciseName: "Bench Press",
      sets: 4,
      reps: "8-10",
      restSeconds: 90,
      orderIndex: 0,
    });
    expect(exercise).not.toBeNull();
    expect(exercise?.exerciseName).toBe("Bench Press");
    expect(exercise?.sets).toBe(4);

    // Verify in plan detail
    const detail = await caller.plans.get({ id: plan!.id });
    expect(detail?.days.length).toBe(1);
    expect(detail?.days[0].exercises.length).toBe(1);
    expect(detail?.days[0].exercises[0].exerciseName).toBe("Bench Press");

    // Cleanup
    await caller.plans.delete({ id: plan!.id });
  });
});

describe("sessions", () => {
  it("requires authentication for sessions.list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.sessions.list()).rejects.toThrow();
  });

  it("can start, log sets, and complete a session", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Start a session
    const session = await caller.sessions.start({
      name: "Test Workout",
    });
    expect(session).not.toBeNull();
    expect(session?.name).toBe("Test Workout");
    expect(session?.status).toBe("active");

    // Check active session
    const active = await caller.sessions.active();
    expect(active).not.toBeNull();
    expect(active?.id).toBe(session?.id);

    // Log a set
    const log = await caller.sessions.logSet({
      sessionId: session!.id,
      exerciseName: "Bench Press",
      setNumber: 1,
      reps: 10,
      weightKg: 60,
      completed: true,
    });
    expect(log).not.toBeNull();
    expect(log?.exerciseName).toBe("Bench Press");
    expect(log?.reps).toBe(10);
    expect(log?.weightKg).toBe(60);

    // Log another set
    await caller.sessions.logSet({
      sessionId: session!.id,
      exerciseName: "Bench Press",
      setNumber: 2,
      reps: 8,
      weightKg: 65,
      completed: true,
    });

    // Get session with logs
    const detail = await caller.sessions.get({ id: session!.id });
    expect(detail?.logs.length).toBe(2);

    // Complete session
    const completed = await caller.sessions.complete({
      sessionId: session!.id,
    });
    expect(completed?.status).toBe("completed");
    expect(completed?.durationSeconds).toBeGreaterThanOrEqual(0);

    // Verify in list
    const sessions = await caller.sessions.list();
    expect(sessions.length).toBeGreaterThan(0);
  });

  it("can abandon a session", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const session = await caller.sessions.start({ name: "Abandon Test" });
    expect(session?.status).toBe("active");

    const abandoned = await caller.sessions.abandon({ sessionId: session!.id });
    expect(abandoned?.status).toBe("abandoned");
  });
});

describe("planDay", () => {
  it("requires authentication for planDay.getExercises", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.planDay.getExercises({ planDayId: 1 })).rejects.toThrow();
  });

  it("returns exercises for a plan day", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Create a plan with a day and exercises
    const plan = await caller.plans.create({ name: "PlanDay Test", daysPerWeek: 3 });
    const day = await caller.plans.addDay({ planId: plan!.id, dayNumber: 1, name: "Push Day" });
    await caller.plans.addExercise({
      planDayId: day!.id,
      exerciseName: "Bench Press",
      sets: 4,
      reps: "8-10",
      restSeconds: 90,
      orderIndex: 0,
    });
    await caller.plans.addExercise({
      planDayId: day!.id,
      exerciseName: "Overhead Press",
      sets: 3,
      reps: "10-12",
      restSeconds: 60,
      orderIndex: 1,
    });

    // Fetch via planDay.getExercises
    const exercises = await caller.planDay.getExercises({ planDayId: day!.id });
    expect(exercises.length).toBe(2);
    expect(exercises[0].exerciseName).toBe("Bench Press");
    expect(exercises[0].sets).toBe(4);
    expect(exercises[1].exerciseName).toBe("Overhead Press");

    // Cleanup
    await caller.plans.delete({ id: plan!.id });
  });
});

describe("personal records", () => {
  it("requires authentication for prs.getAll", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.prs.getAll()).rejects.toThrow();
  });

  it("returns empty array when no PRs exist", async () => {
    const ctx = createAuthContext(999);
    const caller = appRouter.createCaller(ctx);
    const prs = await caller.prs.getAll();
    expect(Array.isArray(prs)).toBe(true);
  });

  it("auto-creates PR when logging a set for a tracked exercise", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Start a session and log a bench press set
    const session = await caller.sessions.start({ name: "PR Test" });
    const log = await caller.sessions.logSet({
      sessionId: session!.id,
      exerciseName: "Bench Press",
      setNumber: 1,
      reps: 5,
      weightKg: 100,
      completed: true,
    });
    expect(log).toHaveProperty("newPR");

    // Check PR was created
    const pr = await caller.prs.getForExercise({ exerciseName: "Bench Press" });
    expect(pr).not.toBeNull();
    expect(pr?.maxWeightKg).toBeGreaterThanOrEqual(100);

    // Cleanup
    await caller.sessions.abandon({ sessionId: session!.id });
  });

  it("does not create PR for non-tracked exercises", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const session = await caller.sessions.start({ name: "Non-PR Test" });
    const log = await caller.sessions.logSet({
      sessionId: session!.id,
      exerciseName: "Bicep Curl",
      setNumber: 1,
      reps: 12,
      weightKg: 15,
      completed: true,
    });
    expect(log?.newPR).toBe(false);

    const pr = await caller.prs.getForExercise({ exerciseName: "Bicep Curl" });
    expect(pr).toBeNull();

    await caller.sessions.abandon({ sessionId: session!.id });
  });
});

describe("progress", () => {
  it("requires authentication for progress.stats", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.progress.stats()).rejects.toThrow();
  });

  it("returns stats for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.progress.stats();
    expect(stats).not.toBeNull();
    expect(stats).toHaveProperty("totalSessions");
    expect(stats).toHaveProperty("totalVolume");
    expect(stats).toHaveProperty("totalReps");
    expect(stats).toHaveProperty("uniqueExercises");
    expect(stats).toHaveProperty("recentSessions");
  });

  it("returns weekly activity", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const activity = await caller.progress.weeklyActivity();
    expect(Array.isArray(activity)).toBe(true);
  });

  it("returns exercise history", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const history = await caller.progress.exerciseHistory({ exerciseName: "Bench Press" });
    expect(Array.isArray(history)).toBe(true);
  });
});
