import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getRodeosByUser: vi.fn().mockResolvedValue([]),
  getRodeoById: vi.fn().mockResolvedValue(null),
  createRodeo: vi.fn().mockResolvedValue(undefined),
  updateRodeo: vi.fn().mockResolvedValue(undefined),
  deleteRodeo: vi.fn().mockResolvedValue(undefined),
  getPerformancesByUser: vi.fn().mockResolvedValue([]),
  getPerformancesByRodeo: vi.fn().mockResolvedValue([]),
  getPerformanceById: vi.fn().mockResolvedValue(null),
  createPerformance: vi.fn().mockResolvedValue(undefined),
  updatePerformance: vi.fn().mockResolvedValue(undefined),
  deletePerformance: vi.fn().mockResolvedValue(undefined),
  getVideosByPerformance: vi.fn().mockResolvedValue([]),
  createVideo: vi.fn().mockResolvedValue(undefined),
  deleteVideo: vi.fn().mockResolvedValue(undefined),
  getNotificationPrefs: vi.fn().mockResolvedValue(null),
  upsertNotificationPrefs: vi.fn().mockResolvedValue(undefined),
  getUpcomingRodeosWithDeadlines: vi.fn().mockResolvedValue([]),
  getExpensesByRodeo: vi.fn().mockResolvedValue([]),
  getExpensesByUser: vi.fn().mockResolvedValue([]),
  createExpense: vi.fn().mockResolvedValue(undefined),
  updateExpense: vi.fn().mockResolvedValue(undefined),
  deleteExpense: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({
      drills: [
        { title: "Barrel Pattern Drill", description: "Practice the cloverleaf pattern at a slow lope.", difficulty: "beginner", duration: "20 minutes" },
        { title: "Speed Control Exercise", description: "Work on rate and collection approaching barrels.", difficulty: "intermediate", duration: "30 minutes" },
      ]
    }) } }],
  }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "test-user",
      email: "cowboy@rodeo.com",
      name: "Cowboy Joe",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

describe("rodeos router", () => {
  it("list returns empty array when no rodeos", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.rodeos.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("create accepts valid rodeo input", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.rodeos.create({
      name: "Cheyenne Frontier Days",
      discipline: "barrel_racing",
      rodeotype: "professional",
      rodeoDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      entryDeadline: Date.now() + 16 * 24 * 60 * 60 * 1000,
      locationName: "Frontier Park",
      locationAddress: "Cheyenne, WY",
      notifyDaysBefore: 14,
    });
    expect(result).toEqual({ success: true });
  });

  it("create rejects invalid discipline", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.rodeos.create({
        name: "Test Rodeo",
        discipline: "invalid_discipline" as any,
        rodeotype: "jackpot",
        rodeoDate: Date.now() + 10000,
        entryDeadline: Date.now() + 5000,
        notifyDaysBefore: 7,
      })
    ).rejects.toThrow();
  });

  it("checkDeadlines returns notified count", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.rodeos.checkDeadlines();
    expect(result).toHaveProperty("notified");
    expect(typeof result.notified).toBe("number");
  });
});

describe("performances router", () => {
  it("list returns empty array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.performances.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create accepts timed performance", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.performances.create({
      rodeoId: 1,
      discipline: "barrel_racing",
      timeSeconds: 17.23,
      penaltySeconds: 0,
      runDate: Date.now(),
    });
    expect(result).toEqual({ success: true });
  });

  it("create accepts scored performance", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.performances.create({
      rodeoId: 1,
      discipline: "bareback",
      score: 85.5,
      runDate: Date.now(),
    });
    expect(result).toEqual({ success: true });
  });
});

describe("expenses router", () => {
  it("listByRodeo returns empty array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.listByRodeo({ rodeoId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create accepts valid expense", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.create({
      rodeoId: 1,
      category: "entry_fee",
      description: "Barrel racing entry",
      amountCents: 5000,
      date: Date.now(),
    });
    expect(result).toEqual({ success: true });
  });

  it("create rejects negative amounts", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.expenses.create({
        rodeoId: 1,
        category: "fuel",
        amountCents: -100,
        date: Date.now(),
      })
    ).rejects.toThrow();
  });

  it("create rejects invalid category", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.expenses.create({
        rodeoId: 1,
        category: "invalid_cat" as any,
        amountCents: 1000,
        date: Date.now(),
      })
    ).rejects.toThrow();
  });

  it("delete returns success", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.expenses.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

describe("drills router", () => {
  it("getSuggestions returns array of drills", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.drills.getSuggestions({ discipline: "barrel_racing" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("description");
    expect(result[0]).toHaveProperty("difficulty");
    expect(result[0]).toHaveProperty("duration");
  });
});

describe("notifications router", () => {
  it("getPrefs returns null when no prefs set", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.notifications.getPrefs();
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("updatePrefs accepts valid input", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.notifications.updatePrefs({
      enableEntryDeadline: true,
      defaultDaysBefore: 14,
    });
    expect(result).toEqual({ success: true });
  });
});
