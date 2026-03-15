import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { invokeLLMMock, getProfileMock, listExercisesMock } = vi.hoisted(() => ({
  invokeLLMMock: vi.fn(),
  getProfileMock: vi.fn(),
  listExercisesMock: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: invokeLLMMock,
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    getProfile: getProfileMock,
    listExercises: listExercisesMock,
  };
});

import { appRouter } from "./routers";

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

describe("ai.chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getProfileMock.mockResolvedValue({
      age: 29,
      gender: "male",
      fitnessLevel: "intermediate",
      goals: ["strength", "muscle gain"],
      equipment: ["barbell", "bench"],
      injuries: "Mild shoulder irritation",
    });

    listExercisesMock.mockResolvedValue({
      exercises: [
        { name: "Bench Press" },
        { name: "Deadlift" },
        { name: "Back Squat" },
      ],
      total: 3,
    });

    invokeLLMMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Drive your knees forward slightly and add paused goblet squats.",
          },
        },
      ],
    });
  });

  it("builds a precise concise system prompt and forwards chat history", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const result = await caller.ai.chat({
      messages: [
        { role: "user", content: "How do I improve my squat depth?" },
        { role: "assistant", content: "Start with ankle mobility work." },
      ],
    });

    expect(result).toBe("Drive your knees forward slightly and add paused goblet squats.");
    expect(getProfileMock).toHaveBeenCalledWith(1);
    expect(listExercisesMock).toHaveBeenCalledWith({ limit: 50 });
    expect(invokeLLMMock).toHaveBeenCalledTimes(1);

    const llmArgs = invokeLLMMock.mock.calls[0][0] as {
      messages: Array<{ role: string; content: string }>;
    };

    expect(llmArgs.messages).toHaveLength(3);
    expect(llmArgs.messages[1]).toEqual({
      role: "user",
      content: "How do I improve my squat depth?",
    });
    expect(llmArgs.messages[2]).toEqual({
      role: "assistant",
      content: "Start with ankle mobility work.",
    });

    const systemPrompt = llmArgs.messages[0]?.content ?? "";
    expect(llmArgs.messages[0]?.role).toBe("system");
    expect(systemPrompt).toContain("Answer with precise, concise, practical coaching.");
    expect(systemPrompt).toContain("Start with the direct answer in the first sentence.");
    expect(systemPrompt).toContain("Keep most replies to 2-5 short sentences or 2-4 bullet points.");
    expect(systemPrompt).toContain("Do not repeat the user's question or add filler.");
    expect(systemPrompt).toContain("Goals: strength, muscle gain");
    expect(systemPrompt).toContain("Equipment: barbell, bench");
    expect(systemPrompt).toContain("Injuries/Limitations: Mild shoulder irritation");
    expect(systemPrompt).toContain(
      "Available exercises in the app (sample): Bench Press, Deadlift, Back Squat"
    );
  });

  it("falls back cleanly when profile data is unavailable", async () => {
    getProfileMock.mockResolvedValue(undefined);
    listExercisesMock.mockResolvedValue({
      exercises: [{ name: "Push-Up" }],
      total: 1,
    });

    const caller = appRouter.createCaller(createAuthContext());

    await caller.ai.chat({
      messages: [{ role: "user", content: "Give me a quick push warm-up." }],
    });

    const llmArgs = invokeLLMMock.mock.calls[0][0] as {
      messages: Array<{ role: string; content: string }>;
    };
    const systemPrompt = llmArgs.messages[0]?.content ?? "";

    expect(systemPrompt).toContain("No profile data.");
    expect(systemPrompt).toContain("Available exercises in the app (sample): Push-Up");
  });
});
