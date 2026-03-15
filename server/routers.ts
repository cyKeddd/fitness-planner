import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== USER PROFILE ====================
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getProfile(ctx.user.id);
    }),

    upsert: protectedProcedure
      .input(z.object({
        age: z.number().min(10).max(120).optional(),
        gender: z.string().optional(),
        heightCm: z.number().min(50).max(300).optional(),
        weightKg: z.number().min(20).max(500).optional(),
        fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        bodyType: z.string().optional(),
        injuries: z.string().optional(),
        goals: z.array(z.string()).optional(),
        equipment: z.array(z.string()).optional(),
        preferredUnit: z.enum(["kg", "lbs"]).optional(),
        onboardingCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertProfile({ userId: ctx.user.id, ...input });
      }),
  }),

  // ==================== EXERCISES ====================
  exercises: router({
    list: publicProcedure
      .input(z.object({
        workoutType: z.string().optional(),
        equipment: z.string().optional(),
        difficulty: z.string().optional(),
        muscleGroup: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listExercises(input ?? {});
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getExercise(input.id);
      }),
  }),

  // ==================== WORKOUT PLANS ====================
  plans: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPlans(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const plan = await db.getPlan(input.id);
        if (!plan || plan.userId !== ctx.user.id) return null;
        const days = await db.getPlanDays(plan.id);
        const daysWithExercises = await Promise.all(
          days.map(async (day) => ({
            ...day,
            exercises: await db.getPlanDayExercises(day.id),
          }))
        );
        return { ...plan, days: daysWithExercises };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        daysPerWeek: z.number().min(1).max(7).optional(),
        goalFocus: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createPlan({ userId: ctx.user.id, ...input });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        daysPerWeek: z.number().min(1).max(7).optional(),
        goalFocus: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const plan = await db.getPlan(input.id);
        if (!plan || plan.userId !== ctx.user.id) throw new Error("Plan not found");
        const { id, ...data } = input;
        return db.updatePlan(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const plan = await db.getPlan(input.id);
        if (!plan || plan.userId !== ctx.user.id) throw new Error("Plan not found");
        await db.deletePlan(input.id);
        return { success: true };
      }),

    // Plan day management
    addDay: protectedProcedure
      .input(z.object({
        planId: z.number(),
        dayNumber: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const plan = await db.getPlan(input.planId);
        if (!plan || plan.userId !== ctx.user.id) throw new Error("Plan not found");
        return db.createPlanDay(input);
      }),

    deleteDay: protectedProcedure
      .input(z.object({ dayId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePlanDay(input.dayId);
        return { success: true };
      }),

    // Plan exercise management
    addExercise: protectedProcedure
      .input(z.object({
        planDayId: z.number(),
        exerciseId: z.number().optional(),
        exerciseName: z.string(),
        sets: z.number().min(1),
        reps: z.string(),
        restSeconds: z.number().min(0).optional(),
        notes: z.string().optional(),
        orderIndex: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const day = await db.getPlanDay(input.planDayId);
        if (!day) throw new Error("Plan day not found");
        const plan = await db.getPlan(day.planId);
        if (!plan || plan.userId !== ctx.user.id) throw new Error("Plan not found");
        return db.addPlanExercise(input);
      }),

    updateExercise: protectedProcedure
      .input(z.object({
        id: z.number(),
        sets: z.number().min(1).optional(),
        reps: z.string().optional(),
        restSeconds: z.number().min(0).optional(),
        notes: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updatePlanExercise(id, data);
      }),

    deleteExercise: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePlanExercise(input.id);
        return { success: true };
      }),
  }),

  // ==================== AI WORKOUT GENERATION ====================
  ai: router({
    generatePlan: protectedProcedure
      .input(z.object({
        goalFocus: z.string(),
        daysPerWeek: z.number().min(1).max(7),
        sessionDuration: z.number().min(15).max(180).optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfile(ctx.user.id);

        const profileContext = profile ? `
User Profile:
- Age: ${profile.age ?? "Unknown"}
- Gender: ${profile.gender ?? "Unknown"}
- Height: ${profile.heightCm ? profile.heightCm + " cm" : "Unknown"}
- Weight: ${profile.weightKg ? profile.weightKg + " kg" : "Unknown"}
- Fitness Level: ${profile.fitnessLevel ?? "Unknown"}
- Body Type: ${profile.bodyType ?? "Unknown"}
- Injuries/Limitations: ${profile.injuries ?? "None"}
- Available Equipment: ${profile.equipment ? (profile.equipment as string[]).join(", ") : "Unknown"}
` : "No profile data available.";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert fitness coach and workout programmer. Create a detailed, personalized workout plan based on the user's profile and goals. Return ONLY valid JSON matching the schema exactly. Do not include any markdown formatting, code blocks, or extra text.`
            },
            {
              role: "user",
              content: `Create a ${input.daysPerWeek}-day per week workout plan focused on "${input.goalFocus}".
${input.sessionDuration ? `Target session duration: ${input.sessionDuration} minutes.` : ""}
${input.additionalNotes ? `Additional notes: ${input.additionalNotes}` : ""}

${profileContext}

Return a JSON object with this exact structure:
{
  "name": "Plan name",
  "description": "Brief description",
  "days": [
    {
      "dayNumber": 1,
      "name": "Day name (e.g., Push Day)",
      "description": "Brief day description",
      "exercises": [
        {
          "exerciseName": "Exercise name",
          "sets": 3,
          "reps": "8-12",
          "restSeconds": 90,
          "notes": "Optional form tips"
        }
      ]
    }
  ]
}`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "workout_plan",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        dayNumber: { type: "integer" },
                        name: { type: "string" },
                        description: { type: "string" },
                        exercises: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              exerciseName: { type: "string" },
                              sets: { type: "integer" },
                              reps: { type: "string" },
                              restSeconds: { type: "integer" },
                              notes: { type: "string" },
                            },
                            required: ["exerciseName", "sets", "reps", "restSeconds", "notes"],
                            additionalProperties: false,
                          }
                        }
                      },
                      required: ["dayNumber", "name", "description", "exercises"],
                      additionalProperties: false,
                    }
                  }
                },
                required: ["name", "description", "days"],
                additionalProperties: false,
              }
            }
          }
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") throw new Error("Failed to generate workout plan");

        let planData: any;
        try {
          planData = JSON.parse(content);
        } catch {
          throw new Error("Failed to parse AI response");
        }

        // Save the plan to database
        const plan = await db.createPlan({
          userId: ctx.user.id,
          name: planData.name,
          description: planData.description,
          isAiGenerated: true,
          daysPerWeek: input.daysPerWeek,
          goalFocus: input.goalFocus,
        });

        if (!plan) throw new Error("Failed to create plan");

        for (const dayData of planData.days) {
          const day = await db.createPlanDay({
            planId: plan.id,
            dayNumber: dayData.dayNumber,
            name: dayData.name,
            description: dayData.description,
          });
          if (!day) continue;

          const exercisesToInsert = dayData.exercises.map((ex: any, idx: number) => ({
            planDayId: day.id,
            exerciseName: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
            orderIndex: idx,
          }));
          await db.bulkInsertPlanExercises(exercisesToInsert);
        }

        return { planId: plan.id, name: plan.name };
      }),

    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfile(ctx.user.id);
        const { exercises } = await db.listExercises({ limit: 50 });

        const profileContext = profile ? `
User Profile:
- Age: ${profile.age ?? "Unknown"}
- Gender: ${profile.gender ?? "Unknown"}
- Fitness Level: ${profile.fitnessLevel ?? "Unknown"}
- Goals: ${profile.goals ? (profile.goals as string[]).join(", ") : "Unknown"}
- Equipment: ${profile.equipment ? (profile.equipment as string[]).join(", ") : "Unknown"}
- Injuries/Limitations: ${profile.injuries ?? "None"}
` : "No profile data.";

        const exerciseNames = exercises.slice(0, 30).map(e => e.name).join(", ");

        const systemPrompt = `You are a helpful fitness coach and personal trainer assistant. You help users with:
- Exercise form and technique advice
- Workout programming and plan suggestions
- Warm-up and cool-down recommendations
- Progress and recovery tips

${profileContext}

Available exercises in the app (sample): ${exerciseNames}

Answer with precise, concise, practical coaching.

Response rules:
- Start with the direct answer in the first sentence.
- Keep most replies to 2-5 short sentences or 2-4 bullet points.
- Prioritize concrete advice over background theory.
- Use profile details only when they improve the answer.
- Do not repeat the user's question or add filler.
- Ask at most one short follow-up question, and only if needed for a safe or accurate answer.
- Mention pain, injury, or medical cautions only when relevant.
- If the question is broad, give the shortest useful answer and offer to expand.

Use markdown only when it improves readability. Be encouraging, but never wordy.`;

        const messagesForLLM = [
          { role: "system" as const, content: systemPrompt },
          ...input.messages.map(m => ({ role: m.role, content: m.content })),
        ];

        const response = await invokeLLM({ messages: messagesForLLM });
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("Failed to get AI response");
        }
        return content;
      }),
  }),

  // ==================== WORKOUT SESSIONS ====================
  sessions: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUserSessions(ctx.user.id, input?.limit ?? 20, input?.offset ?? 0);
      }),

    active: protectedProcedure.query(async ({ ctx }) => {
      return db.getActiveSession(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getSession(input.id);
        if (!session || session.userId !== ctx.user.id) return null;
        const logs = await db.getSessionLogs(session.id);
        return { ...session, logs };
      }),

    start: protectedProcedure
      .input(z.object({
        planDayId: z.number().optional(),
        name: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Abandon any existing active session
        const active = await db.getActiveSession(ctx.user.id);
        if (active) {
          await db.updateSession(active.id, { status: "abandoned" });
        }
        return db.createSession({ userId: ctx.user.id, ...input });
      }),

    logSet: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        exerciseId: z.number().optional(),
        exerciseName: z.string(),
        setNumber: z.number().min(1),
        reps: z.number().min(0).optional(),
        weightKg: z.number().min(0).optional(),
        durationSeconds: z.number().min(0).optional(),
        completed: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const log = await db.addSessionLog(input);
        // Check for new PR
        if (input.weightKg && input.weightKg > 0 && input.completed !== false) {
          const newPr = await db.checkAndUpdatePR(ctx.user.id, input.exerciseName, input.weightKg, input.reps ?? 1);
          if (newPr) {
            return { ...log, newPR: true, prWeight: input.weightKg };
          }
        }
        return { ...log, newPR: false };
      }),

    updateLog: protectedProcedure
      .input(z.object({
        id: z.number(),
        reps: z.number().min(0).optional(),
        weightKg: z.number().min(0).optional(),
        durationSeconds: z.number().min(0).optional(),
        completed: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateSessionLog(id, data);
      }),

    deleteLog: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSessionLog(input.id);
        return { success: true };
      }),

    complete: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) throw new Error("Session not found");
        const now = new Date();
        const durationSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);
        return db.updateSession(input.sessionId, {
          status: "completed",
          completedAt: now,
          durationSeconds,
          notes: input.notes,
        });
      }),

    abandon: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) throw new Error("Session not found");
        return db.updateSession(input.sessionId, { status: "abandoned" });
      }),
  }),

  // ==================== PLAN DAY EXERCISES (for active workout) ====================
  planDay: router({
    getExercises: protectedProcedure
      .input(z.object({ planDayId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlanDayExercises(input.planDayId);
      }),
  }),

  // ==================== PERSONAL RECORDS ====================
  prs: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return db.getPersonalRecords(ctx.user.id);
    }),

    getForExercise: protectedProcedure
      .input(z.object({ exerciseName: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getPersonalRecord(ctx.user.id, input.exerciseName);
      }),
  }),

  // ==================== WORKOUT TEMPLATES ====================
  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserTemplates(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const template = await db.getTemplate(input.id);
        if (!template || template.userId !== ctx.user.id) return null;
        const exercises = await db.getTemplateExercises(template.id);
        return { ...template, exercises };
      }),

    createFromSession: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) throw new Error("Session not found");
        if (session.status !== "completed") throw new Error("Can only create templates from completed sessions");
        return db.createTemplateFromSession(ctx.user.id, input.sessionId, input.name, input.description);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getTemplate(input.id);
        if (!template || template.userId !== ctx.user.id) throw new Error("Template not found");
        await db.deleteTemplate(input.id);
        return { success: true };
      }),

    startSession: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getTemplate(input.templateId);
        if (!template || template.userId !== ctx.user.id) throw new Error("Template not found");
        const exercises = await db.getTemplateExercises(template.id);

        // Abandon any existing active session
        const active = await db.getActiveSession(ctx.user.id);
        if (active) {
          await db.updateSession(active.id, { status: "abandoned" });
        }

        // Create a new session from the template
        const session = await db.createSession({
          userId: ctx.user.id,
          name: template.name,
        });
        if (!session) throw new Error("Failed to create session");

        return { session, exercises };
      }),
  }),

  // ==================== PROGRESS / STATS ====================
  progress: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getWorkoutStats(ctx.user.id);
    }),

    exerciseHistory: protectedProcedure
      .input(z.object({
        exerciseName: z.string(),
        limit: z.number().min(1).max(100).optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getExerciseProgress(ctx.user.id, input.exerciseName, input.limit ?? 30);
      }),

    weeklyActivity: protectedProcedure.query(async ({ ctx }) => {
      return db.getWeeklyActivity(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
