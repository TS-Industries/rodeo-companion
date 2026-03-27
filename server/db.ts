import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertRodeo,
  InsertPerformance,
  InsertVideo,
  InsertNotificationPref,
  InsertExpense,
  performances,
  rodeos,
  users,
  videos,
  notificationPrefs,
  expenses,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Rodeos ───────────────────────────────────────────────────────────────────

export async function getRodeosByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rodeos).where(eq(rodeos.userId, userId)).orderBy(desc(rodeos.rodeoDate));
}

export async function getRodeoById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(rodeos)
    .where(and(eq(rodeos.id, id), eq(rodeos.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createRodeo(data: InsertRodeo) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(rodeos).values(data);
  return { insertId: (result as any)[0]?.insertId as number | undefined };
}

export async function updateRodeo(id: number, userId: number, data: Partial<InsertRodeo>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(rodeos).set(data).where(and(eq(rodeos.id, id), eq(rodeos.userId, userId)));
}

export async function deleteRodeo(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(rodeos).where(and(eq(rodeos.id, id), eq(rodeos.userId, userId)));
}

export async function getUpcomingRodeosWithDeadlines(daysAhead: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(rodeos)
    .where(
      and(
        gte(rodeos.entryDeadline, now),
        lte(rodeos.entryDeadline, future),
        eq(rodeos.notificationSent, false)
      )
    );
}

// ─── Performances ─────────────────────────────────────────────────────────────

export async function getPerformancesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(performances)
    .where(eq(performances.userId, userId))
    .orderBy(desc(performances.runDate));
}

export async function getPerformancesByRodeo(rodeoId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(performances)
    .where(and(eq(performances.rodeoId, rodeoId), eq(performances.userId, userId)))
    .orderBy(desc(performances.runDate));
}

export async function getPerformanceById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(performances)
    .where(and(eq(performances.id, id), eq(performances.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createPerformance(data: InsertPerformance) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(performances).values(data);
  return result;
}

export async function updatePerformance(id: number, userId: number, data: Partial<InsertPerformance>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(performances)
    .set(data)
    .where(and(eq(performances.id, id), eq(performances.userId, userId)));
}

export async function deletePerformance(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(performances).where(and(eq(performances.id, id), eq(performances.userId, userId)));
}

// ─── Videos ───────────────────────────────────────────────────────────────────

export async function getVideosByPerformance(performanceId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(videos)
    .where(and(eq(videos.performanceId, performanceId), eq(videos.userId, userId)));
}

export async function createVideo(data: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(videos).values(data);
  return result;
}

export async function deleteVideo(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(videos).where(and(eq(videos.id, id), eq(videos.userId, userId)));
}

// ─── Notification Prefs ───────────────────────────────────────────────────────

export async function getNotificationPrefs(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);
  return result[0];
}

export async function upsertNotificationPrefs(data: InsertNotificationPref) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .insert(notificationPrefs)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        enableEntryDeadline: data.enableEntryDeadline,
        defaultDaysBefore: data.defaultDaysBefore,
        enableEmail: data.enableEmail,
      },
    });
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getExpensesByRodeo(rodeoId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(expenses)
    .where(and(eq(expenses.rodeoId, rodeoId), eq(expenses.userId, userId)))
    .orderBy(desc(expenses.date));
}

export async function getExpensesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(expenses)
    .where(eq(expenses.userId, userId))
    .orderBy(desc(expenses.date));
}

export async function createExpense(data: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(expenses).values(data);
}

export async function updateExpense(id: number, userId: number, data: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(expenses).set(data).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

export async function deleteExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}
