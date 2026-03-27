import {
  boolean,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

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

// Supported rodeo disciplines
export const DISCIPLINES = [
  "barrel_racing",
  "breakaway_roping",
  "team_roping",
  "tie_down_roping",
  "bareback",
  "saddle_bronc",
  "steer_wrestling",
] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  barrel_racing: "Barrel Racing",
  breakaway_roping: "Breakaway Roping",
  team_roping: "Team Roping",
  tie_down_roping: "Tie Down Roping",
  bareback: "Bareback",
  saddle_bronc: "Saddle Bronc",
  steer_wrestling: "Steer Wrestling",
};

// Rodeo events / scheduled rodeos
export const rodeos = mysqlTable("rodeos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  discipline: mysqlEnum("discipline", DISCIPLINES).notNull(),
  rodeotype: mysqlEnum("rodeotype", ["jackpot", "amateur", "professional"]).default("jackpot").notNull(),
  rodeoDate: timestamp("rodeoDate").notNull(),
  entryDeadline: timestamp("entryDeadline").notNull(),
  locationName: varchar("locationName", { length: 255 }),
  locationAddress: varchar("locationAddress", { length: 512 }),
  locationLat: float("locationLat"),
  locationLng: float("locationLng"),
  notes: text("notes"),
  isEntered: boolean("isEntered").default(false).notNull(),
  notifyDaysBefore: int("notifyDaysBefore").default(14).notNull(),
  notificationSent: boolean("notificationSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rodeo = typeof rodeos.$inferSelect;
export type InsertRodeo = typeof rodeos.$inferInsert;

// Performance runs logged per rodeo
export const performances = mysqlTable("performances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rodeoId: int("rodeoId").notNull(),
  discipline: mysqlEnum("discipline", DISCIPLINES).notNull(),
  timeSeconds: float("timeSeconds"), // null for rough stock (scored differently)
  score: float("score"),             // for rough stock events
  penaltySeconds: float("penaltySeconds").default(0),
  notes: text("notes"),
  runDate: timestamp("runDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Performance = typeof performances.$inferSelect;
export type InsertPerformance = typeof performances.$inferInsert;

// Videos attached to performance runs
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  performanceId: int("performanceId").notNull(),
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 1024 }),
  filename: varchar("filename", { length: 255 }),
  mimeType: varchar("mimeType", { length: 64 }),
  sizeBytes: int("sizeBytes"),
  durationSeconds: float("durationSeconds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

// Notification preferences per user
export const notificationPrefs = mysqlTable("notification_prefs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  enableEntryDeadline: boolean("enableEntryDeadline").default(true).notNull(),
  defaultDaysBefore: int("defaultDaysBefore").default(14).notNull(),
  enableEmail: boolean("enableEmail").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPref = typeof notificationPrefs.$inferSelect;
export type InsertNotificationPref = typeof notificationPrefs.$inferInsert;

// Expense categories
export const EXPENSE_CATEGORIES = [
  "entry_fee",
  "fuel",
  "lodging",
  "food",
  "equipment",
  "vet",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  entry_fee: "Entry Fee",
  fuel: "Fuel",
  lodging: "Lodging",
  food: "Food & Drink",
  equipment: "Equipment",
  vet: "Vet / Horse Care",
  other: "Other",
};

// Per-rodeo expenses
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rodeoId: int("rodeoId").notNull(),
  category: mysqlEnum("category", EXPENSE_CATEGORIES).notNull(),
  description: varchar("description", { length: 255 }),
  amountCents: int("amountCents").notNull(), // store as cents to avoid float issues
  date: timestamp("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
