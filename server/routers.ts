import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getRodeosByUser,
  getRodeoById,
  createRodeo,
  updateRodeo,
  deleteRodeo,
  getPerformancesByUser,
  getPerformancesByRodeo,
  getPerformanceById,
  createPerformance,
  updatePerformance,
  deletePerformance,
  getVideosByPerformance,
  createVideo,
  deleteVideo,
  getNotificationPrefs,
  upsertNotificationPrefs,
  getUpcomingRodeosWithDeadlines,
  getExpensesByRodeo,
  getExpensesByUser,
  createExpense,
  updateExpense,
  deleteExpense,
  listHorses,
  createHorse,
  updateHorse,
  deleteHorse,
  getSeasonGoal,
  upsertSeasonGoal,
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  getRodeoContacts,
  linkContactToRodeo,
  unlinkContactFromRodeo,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { DISCIPLINES, DISCIPLINE_LABELS, EXPENSE_CATEGORIES, ROUND_TYPES, PARTNER_ROLES, type Discipline } from "../drizzle/schema";

const disciplineEnum = z.enum(DISCIPLINES);
const rodeoTypeEnum = z.enum(["jackpot", "amateur", "professional"]);
const roundEnum = z.enum(ROUND_TYPES);

// ─── Auth ─────────────────────────────────────────────────────────────────────

const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Rodeos ───────────────────────────────────────────────────────────────────

const rodeosRouter = router({
  list: protectedProcedure.query(({ ctx }) => getRodeosByUser(ctx.user.id)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => getRodeoById(input.id, ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        discipline: disciplineEnum,
        disciplines: z.array(disciplineEnum).optional(), // multi-discipline
        rodeotype: rodeoTypeEnum.default("jackpot"),
        rodeoDate: z.number(), // UTC ms
        entryDeadline: z.number(),
        locationName: z.string().optional(),
        locationAddress: z.string().optional(),
        locationLat: z.number().optional(),
        locationLng: z.number().optional(),
        locationPlaceId: z.string().optional(),
        parkingNotes: z.string().optional(),
        countryCode: z.string().optional(),
        notes: z.string().optional(),
        notifyDaysBefore: z.number().default(14),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const created = await createRodeo({
        userId: ctx.user.id,
        name: input.name,
        discipline: input.discipline,
        disciplines: input.disciplines ? JSON.stringify(input.disciplines) : null,
        rodeotype: input.rodeotype,
        rodeoDate: new Date(input.rodeoDate),
        entryDeadline: new Date(input.entryDeadline),
        locationName: input.locationName ?? null,
        locationAddress: input.locationAddress ?? null,
        locationLat: input.locationLat ?? null,
        locationLng: input.locationLng ?? null,
        locationPlaceId: input.locationPlaceId ?? null,
        parkingNotes: input.parkingNotes ?? null,
        countryCode: input.countryCode ?? null,
        notes: input.notes ?? null,
        notifyDaysBefore: input.notifyDaysBefore,
        isEntered: false,
        notificationSent: false,
      });
      return { success: true, id: created.insertId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        discipline: disciplineEnum.optional(),
        rodeotype: rodeoTypeEnum.optional(),
        rodeoDate: z.number().optional(),
        entryDeadline: z.number().optional(),
        locationName: z.string().optional().nullable(),
        locationAddress: z.string().optional().nullable(),
        locationLat: z.number().optional().nullable(),
        locationLng: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
        isEntered: z.boolean().optional(),
        notifyDaysBefore: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (rest.rodeoDate !== undefined) data.rodeoDate = new Date(rest.rodeoDate);
      if (rest.entryDeadline !== undefined) data.entryDeadline = new Date(rest.entryDeadline);
      await updateRodeo(id, ctx.user.id, data as Parameters<typeof updateRodeo>[2]);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteRodeo(input.id, ctx.user.id);
      return { success: true };
    }),

  checkDeadlines: protectedProcedure.mutation(async ({ ctx }) => {
    const upcoming = await getUpcomingRodeosWithDeadlines(3);
    const userRodeos = upcoming.filter((r) => r.userId === ctx.user.id);
    for (const rodeo of userRodeos) {
      const daysLeft = Math.ceil(
        (rodeo.entryDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      await notifyOwner({
        title: `Entry Deadline Approaching: ${rodeo.name}`,
        content: `Your entry deadline for "${rodeo.name}" (${DISCIPLINE_LABELS[rodeo.discipline]}) is in ${daysLeft} day(s) on ${rodeo.entryDeadline.toLocaleDateString()}.`,
      });
      await updateRodeo(rodeo.id, rodeo.userId, { notificationSent: true });
    }
    return { notified: userRodeos.length };
  }),
});

// ─── Performances ─────────────────────────────────────────────────────────────

const performancesRouter = router({
  list: protectedProcedure.query(({ ctx }) => getPerformancesByUser(ctx.user.id)),

  listByRodeo: protectedProcedure
    .input(z.object({ rodeoId: z.number() }))
    .query(({ ctx, input }) => getPerformancesByRodeo(input.rodeoId, ctx.user.id)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => getPerformanceById(input.id, ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        rodeoId: z.number(),
        discipline: disciplineEnum,
        round: roundEnum.default("regular"),
        timeSeconds: z.number().optional(),
        score: z.number().optional(),
        penaltySeconds: z.number().default(0),
        prizeMoneyCents: z.number().int().min(0).default(0),
        notes: z.string().optional(),
        runDate: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createPerformance({
        userId: ctx.user.id,
        rodeoId: input.rodeoId,
        discipline: input.discipline,
        round: input.round,
        timeSeconds: input.timeSeconds ?? null,
        score: input.score ?? null,
        penaltySeconds: input.penaltySeconds,
        prizeMoneyCents: input.prizeMoneyCents,
        notes: input.notes ?? null,
        runDate: new Date(input.runDate),
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        round: roundEnum.optional(),
        timeSeconds: z.number().optional().nullable(),
        score: z.number().optional().nullable(),
        penaltySeconds: z.number().optional(),
        prizeMoneyCents: z.number().int().min(0).optional(),
        notes: z.string().optional().nullable(),
        runDate: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, runDate, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (runDate !== undefined) data.runDate = new Date(runDate);
      await updatePerformance(id, ctx.user.id, data as Parameters<typeof updatePerformance>[2]);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deletePerformance(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Videos ───────────────────────────────────────────────────────────────────

const videosRouter = router({
  listByPerformance: protectedProcedure
    .input(z.object({ performanceId: z.number() }))
    .query(({ ctx, input }) => getVideosByPerformance(input.performanceId, ctx.user.id)),

  getUploadUrl: protectedProcedure
    .input(
      z.object({
        performanceId: z.number(),
        filename: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // We'll upload via the upload endpoint; just return a signed key
      const ext = input.filename.split(".").pop() ?? "mp4";
      const key = `videos/${ctx.user.id}/${input.performanceId}/${nanoid()}.${ext}`;
      return { key };
    }),

  confirmUpload: protectedProcedure
    .input(
      z.object({
        performanceId: z.number(),
        s3Key: z.string(),
        url: z.string(),
        filename: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createVideo({
        userId: ctx.user.id,
        performanceId: input.performanceId,
        s3Key: input.s3Key,
        url: input.url,
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        thumbnailUrl: null,
        durationSeconds: null,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteVideo(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Analytics ────────────────────────────────────────────────────────────────

const analyticsRouter = router({
  // Returns per-rodeo winnings, expenses, and net P&L
  financials: protectedProcedure
    .input(z.object({ period: z.enum(["week", "month", "year", "all"]).default("all") }))
    .query(async ({ ctx, input }) => {
      const allRuns = await getPerformancesByUser(ctx.user.id);
      const allExpenses = await getExpensesByUser(ctx.user.id);
      const allRodeos = await getRodeosByUser(ctx.user.id);

      const now = Date.now();
      const msMap = { week: 7, month: 30, year: 365, all: 99999 };
      const cutoff = now - msMap[input.period] * 24 * 60 * 60 * 1000;

      const filteredRuns = allRuns.filter((r) => r.runDate.getTime() >= cutoff);
      const filteredExpenses = allExpenses.filter((e) => e.date.getTime() >= cutoff);

      // Aggregate winnings per rodeo
      const winningsByRodeo: Record<number, number> = {};
      for (const run of filteredRuns) {
        winningsByRodeo[run.rodeoId] = (winningsByRodeo[run.rodeoId] ?? 0) + (run.prizeMoneyCents ?? 0);
      }

      // Aggregate expenses per rodeo
      const expensesByRodeo: Record<number, number> = {};
      for (const exp of filteredExpenses) {
        expensesByRodeo[exp.rodeoId] = (expensesByRodeo[exp.rodeoId] ?? 0) + exp.amountCents;
      }

      // Build per-rodeo P&L
      const rodeoIds = new Set([...Object.keys(winningsByRodeo), ...Object.keys(expensesByRodeo)].map(Number));
      const rodeoMap = Object.fromEntries(allRodeos.map((r) => [r.id, r]));

      const perRodeo = Array.from(rodeoIds).map((rodeoId) => {
        const rodeo = rodeoMap[rodeoId];
        const winnings = winningsByRodeo[rodeoId] ?? 0;
        const expenses = expensesByRodeo[rodeoId] ?? 0;
        return {
          rodeoId,
          rodeoName: rodeo?.name ?? "Unknown Rodeo",
          rodeoDate: rodeo?.rodeoDate?.getTime() ?? 0,
          winningsCents: winnings,
          expensesCents: expenses,
          netCents: winnings - expenses,
        };
      }).sort((a, b) => b.rodeoDate - a.rodeoDate);

      const totalWinnings = perRodeo.reduce((s, r) => s + r.winningsCents, 0);
      const totalExpenses = perRodeo.reduce((s, r) => s + r.expensesCents, 0);

      // Chart data: monthly buckets
      const chartBuckets: Record<string, { winnings: number; expenses: number }> = {};
      for (const run of filteredRuns) {
        const key = run.runDate.toISOString().slice(0, 7); // YYYY-MM
        if (!chartBuckets[key]) chartBuckets[key] = { winnings: 0, expenses: 0 };
        chartBuckets[key].winnings += run.prizeMoneyCents ?? 0;
      }
      for (const exp of filteredExpenses) {
        const key = exp.date.toISOString().slice(0, 7);
        if (!chartBuckets[key]) chartBuckets[key] = { winnings: 0, expenses: 0 };
        chartBuckets[key].expenses += exp.amountCents;
      }
      const chartData = Object.entries(chartBuckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, vals]) => ({ month, ...vals }));

      return { perRodeo, totalWinnings, totalExpenses, netTotal: totalWinnings - totalExpenses, chartData };
    }),

  summary: protectedProcedure
    .input(
      z.object({
        discipline: disciplineEnum.optional(),
        period: z.enum(["week", "month", "year", "all"]).default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const all = await getPerformancesByUser(ctx.user.id);
      const now = Date.now();
      const msMap = { week: 7, month: 30, year: 365, all: 99999 };
      const cutoff = now - msMap[input.period] * 24 * 60 * 60 * 1000;

      let filtered = all.filter((p) => p.runDate.getTime() >= cutoff);
      if (input.discipline) filtered = filtered.filter((p) => p.discipline === input.discipline);

      const timed = filtered.filter((p) => p.timeSeconds != null);
      const scored = filtered.filter((p) => p.score != null);

      const times = timed.map((p) => (p.timeSeconds ?? 0) + (p.penaltySeconds ?? 0));
      const scores = scored.map((p) => p.score ?? 0);

      return {
        totalRuns: filtered.length,
        bestTime: times.length ? Math.min(...times) : null,
        avgTime: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
        worstTime: times.length ? Math.max(...times) : null,
        bestScore: scores.length ? Math.max(...scores) : null,
        avgScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
        chartData: filtered.map((p) => ({
          date: p.runDate.getTime(),
          time: p.timeSeconds != null ? (p.timeSeconds + (p.penaltySeconds ?? 0)) : null,
          score: p.score,
          discipline: p.discipline,
        })),
      };
    }),
});

// ─── Drills ───────────────────────────────────────────────────────────────────

const drillsRouter = router({
  getSuggestions: protectedProcedure
    .input(z.object({ discipline: disciplineEnum }))
    .query(async ({ input }) => {
      const label = DISCIPLINE_LABELS[input.discipline as Discipline];
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an expert rodeo coach. Provide exactly 5 specific, actionable training drills for the given rodeo discipline. Return JSON only.",
          },
          {
            role: "user",
            content: `Give me 5 training drills for ${label}. Each drill should have a title, description (2-3 sentences), difficulty (beginner/intermediate/advanced), and duration (e.g. '15 minutes').`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "drills",
            strict: true,
            schema: {
              type: "object",
              properties: {
                drills: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                      duration: { type: "string" },
                    },
                    required: ["title", "description", "difficulty", "duration"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["drills"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : "{}";
      try {
        const parsed = JSON.parse(content);
        return parsed.drills as Array<{
          title: string;
          description: string;
          difficulty: string;
          duration: string;
        }>;
      } catch {
        return [];
      }
    }),
});

// ─── Notification Prefs ───────────────────────────────────────────────────────

const notificationsRouter = router({
  getPrefs: protectedProcedure.query(({ ctx }) => getNotificationPrefs(ctx.user.id)),

  updatePrefs: protectedProcedure
    .input(
      z.object({
        enableEntryDeadline: z.boolean().optional(),
        defaultDaysBefore: z.number().min(1).max(60).optional(),
        enableEmail: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertNotificationPrefs({
        userId: ctx.user.id,
        enableEntryDeadline: input.enableEntryDeadline ?? true,
        defaultDaysBefore: input.defaultDaysBefore ?? 14,
        enableEmail: input.enableEmail ?? true,
      });
      return { success: true };
    }),
});

// ─── Expenses ─────────────────────────────────────────────────────────────────

const expenseCategoryEnum = z.enum(EXPENSE_CATEGORIES);

const expensesRouter = router({
  listByRodeo: protectedProcedure
    .input(z.object({ rodeoId: z.number() }))
    .query(({ ctx, input }) => getExpensesByRodeo(input.rodeoId, ctx.user.id)),

  listAll: protectedProcedure.query(({ ctx }) => getExpensesByUser(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        rodeoId: z.number(),
        category: expenseCategoryEnum,
        description: z.string().optional(),
        amountCents: z.number().int().min(0),
        date: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createExpense({
        userId: ctx.user.id,
        rodeoId: input.rodeoId,
        category: input.category,
        description: input.description ?? null,
        amountCents: input.amountCents,
        date: new Date(input.date),
        notes: input.notes ?? null,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        category: expenseCategoryEnum.optional(),
        description: z.string().optional().nullable(),
        amountCents: z.number().int().min(0).optional(),
        date: z.number().optional(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, date, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (date !== undefined) data.date = new Date(date);
      await updateExpense(id, ctx.user.id, data as Parameters<typeof updateExpense>[2]);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteExpense(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Horses Router ───────────────────────────────────────────────────────────
const horsesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listHorses(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      disciplines: z.array(disciplineEnum).optional(),
      breed: z.string().max(128).optional(),
      color: z.string().max(64).optional(),
      age: z.number().int().min(0).max(40).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createHorse({
        userId: ctx.user.id,
        name: input.name,
        disciplines: input.disciplines ? JSON.stringify(input.disciplines) : null,
        breed: input.breed ?? null,
        color: input.color ?? null,
        age: input.age ?? null,
        notes: input.notes ?? null,
      });
      return result;
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(128).optional(),
      disciplines: z.array(disciplineEnum).optional(),
      breed: z.string().max(128).optional().nullable(),
      color: z.string().max(64).optional().nullable(),
      age: z.number().int().min(0).max(40).optional().nullable(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, disciplines, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (disciplines !== undefined) data.disciplines = JSON.stringify(disciplines);
      await updateHorse(id, ctx.user.id, data as Parameters<typeof updateHorse>[2]);
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteHorse(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Season Goals ───────────────────────────────────────────────────────────────
const seasonGoalsRouter = router({
  get: protectedProcedure
    .input(z.object({ year: z.number().int().optional() }))
    .query(async ({ ctx, input }) => {
      const year = input.year ?? new Date().getFullYear();
      return getSeasonGoal(ctx.user.id, year);
    }),

  upsert: protectedProcedure
    .input(z.object({
      year: z.number().int().optional(),
      targetDollars: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const year = input.year ?? new Date().getFullYear();
      await upsertSeasonGoal(ctx.user.id, year, Math.round(input.targetDollars * 100));
      return { success: true };
    }),
});

// ─── Contacts ────────────────────────────────────────────────────────────────────
const contactsRouter = router({
  list: protectedProcedure.query(({ ctx }) => listContacts(ctx.user.id)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      role: z.enum(PARTNER_ROLES).default("partner"),
      phone: z.string().max(32).optional().nullable(),
      email: z.string().email().optional().nullable(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await createContact({
        userId: ctx.user.id,
        name: input.name,
        role: input.role,
        phone: input.phone ?? null,
        email: input.email ?? null,
        notes: input.notes ?? null,
      });
      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(128).optional(),
      role: z.enum(PARTNER_ROLES).optional(),
      phone: z.string().max(32).optional().nullable(),
      email: z.string().email().optional().nullable(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateContact(id, ctx.user.id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteContact(input.id, ctx.user.id);
      return { success: true };
    }),

  getForRodeo: protectedProcedure
    .input(z.object({ rodeoId: z.number() }))
    .query(({ ctx, input }) => getRodeoContacts(input.rodeoId, ctx.user.id)),

  linkToRodeo: protectedProcedure
    .input(z.object({ rodeoId: z.number(), contactId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await linkContactToRodeo(input.rodeoId, input.contactId, ctx.user.id);
      return { success: true };
    }),

  unlinkFromRodeo: protectedProcedure
    .input(z.object({ rodeoId: z.number(), contactId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await unlinkContactFromRodeo(input.rodeoId, input.contactId, ctx.user.id);
      return { success: true };
    }),
});

// ─── App Router ─────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  rodeos: rodeosRouter,
  performances: performancesRouter,
  videos: videosRouter,
  analytics: analyticsRouter,
  drills: drillsRouter,
  notifications: notificationsRouter,
   expenses: expensesRouter,
  horses: horsesRouter,
  seasonGoals: seasonGoalsRouter,
  contacts: contactsRouter,
});
export type AppRouter = typeof appRouter;
