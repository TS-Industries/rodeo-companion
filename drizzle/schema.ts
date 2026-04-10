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
  passwordHash: varchar("password_hash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  plan: mysqlEnum("plan", ["free", "pro"]).default("free").notNull(),
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
  "bull_riding",
  "goat_tying",
  "pole_bending",
  "ribbon_roping",
  "chute_dogging",
  "cutting",
  "working_cow_horse",
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
  bull_riding: "Bull Riding",
  goat_tying: "Goat Tying",
  pole_bending: "Pole Bending",
  ribbon_roping: "Ribbon Roping",
  chute_dogging: "Chute Dogging",
  cutting: "Cutting",
  working_cow_horse: "Working Cow Horse",
};

// Rodeo events / scheduled rodeos
export const rodeos = mysqlTable("rodeos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  discipline: mysqlEnum("discipline", DISCIPLINES).notNull(),
  disciplines: text("disciplines"),
  rodeotype: mysqlEnum("rodeotype", ["jackpot", "amateur", "professional"]).default("jackpot").notNull(),
  rodeoDate: timestamp("rodeoDate").notNull(),
  entryDeadline: timestamp("entryDeadline").notNull(),
  locationName: varchar("locationName", { length: 255 }),
  locationAddress: varchar("locationAddress", { length: 512 }),
  locationLat: float("locationLat"),
  locationLng: float("locationLng"),
  locationPlaceId: varchar("locationPlaceId", { length: 512 }),
  parkingNotes: text("parkingNotes"),
  countryCode: varchar("countryCode", { length: 4 }),
  notes: text("notes"),
  isEntered: boolean("isEntered").default(false).notNull(),
  notifyDaysBefore: int("notifyDaysBefore").default(14).notNull(),
  notificationSent: boolean("notificationSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rodeo = typeof rodeos.$inferSelect;
export type InsertRodeo = typeof rodeos.$inferInsert;

export const ROUND_TYPES = ["regular", "short_go", "final"] as const;
export type RoundType = (typeof ROUND_TYPES)[number];
export const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  regular: "Regular Round",
  short_go: "Short Go",
  final: "Final",
};

export const performances = mysqlTable("performances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rodeoId: int("rodeoId").notNull(),
  discipline: mysqlEnum("discipline", DISCIPLINES).notNull(),
  round: varchar("round", { length: 64 }).default("Round 1").notNull(),
  timeSeconds: float("timeSeconds"),
  score: float("score"),
  penaltySeconds: float("penaltySeconds").default(0),
  prizeMoneyCents: int("prizeMoneyCents").default(0),
  partnerName: varchar("partnerName", { length: 128 }),
  notes: text("notes"),
  runDate: timestamp("runDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Performance = typeof performances.$inferSelect;
export type InsertPerformance = typeof performances.$inferInsert;

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

export const EXPENSE_CATEGORIES = [
  "entry_fee",
  "fuel",
  "lodging",
  "food",
  "equipment",
  "repairs",
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
  repairs: "Repairs",
  vet: "Vet / Horse Care",
  other: "Other",
};

export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rodeoId: int("rodeoId").notNull(),
  category: mysqlEnum("category", EXPENSE_CATEGORIES).notNull(),
  description: varchar("description", { length: 255 }),
  amountCents: int("amountCents").notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

export const horses = mysqlTable("horses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  disciplines: text("disciplines"),
  breed: varchar("breed", { length: 128 }),
  color: varchar("color", { length: 64 }),
  age: int("age"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Horse = typeof horses.$inferSelect;
export type InsertHorse = typeof horses.$inferInsert;

export const CARE_REMINDER_TYPES = ["vet", "dentist", "farrier", "deworming", "vaccination", "other"] as const;
export type CareReminderType = (typeof CARE_REMINDER_TYPES)[number];
export const CARE_REMINDER_LABELS: Record<CareReminderType, string> = {
  vet: "Vet Visit",
  dentist: "Dentist / Teeth Float",
  farrier: "Farrier / Shoeing",
  deworming: "Deworming",
  vaccination: "Vaccination",
  other: "Other",
};

export const horseHealthLogs = mysqlTable("horse_health_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  horseId: int("horseId").notNull(),
  type: mysqlEnum("type", CARE_REMINDER_TYPES).default("vet").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  notes: text("notes"),
  cost: int("cost").default(0),
  provider: varchar("provider", { length: 255 }),
  logDate: timestamp("logDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HorseHealthLog = typeof horseHealthLogs.$inferSelect;
export type InsertHorseHealthLog = typeof horseHealthLogs.$inferInsert;

export const horseCareReminders = mysqlTable("horse_care_reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  horseId: int("horseId").notNull(),
  type: mysqlEnum("type", CARE_REMINDER_TYPES).default("vet").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  notes: text("notes"),
  reminderDate: timestamp("reminderDate").notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HorseCareReminder = typeof horseCareReminders.$inferSelect;
export type InsertHorseCareReminder = typeof horseCareReminders.$inferInsert;

export const horseFeeding = mysqlTable("horse_feeding", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  horseId: int("horseId").notNull(),
  feedName: varchar("feedName", { length: 255 }).notNull(),
  feedType: mysqlEnum("feedType", ["hay", "grain", "supplement", "mineral", "other"]).default("hay").notNull(),
  amount: varchar("amount", { length: 128 }),
  frequency: varchar("frequency", { length: 128 }),
  notes: text("notes"),
  monthlyCostCents: int("monthlyCostCents").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HorseFeeding = typeof horseFeeding.$inferSelect;
export type InsertHorseFeeding = typeof horseFeeding.$inferInsert;

export const horseReceipts = mysqlTable("horse_receipts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  horseId: int("horseId").notNull(),
  healthLogId: int("healthLogId"),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", CARE_REMINDER_TYPES).default("vet").notNull(),
  amountCents: int("amountCents").default(0).notNull(),
  s3Key: varchar("s3Key", { length: 512 }),
  url: varchar("url", { length: 1024 }),
  filename: varchar("filename", { length: 255 }),
  mimeType: varchar("mimeType", { length: 64 }),
  receiptDate: timestamp("receiptDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HorseReceipt = typeof horseReceipts.$inferSelect;
export type InsertHorseReceipt = typeof horseReceipts.$inferInsert;

export const seasonGoals = mysqlTable("season_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  year: int("year").notNull(),
  targetCents: int("targetCents").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeasonGoal = typeof seasonGoals.$inferSelect;
export type InsertSeasonGoal = typeof seasonGoals.$inferInsert;

export const cpraEvents = mysqlTable("cpra_events", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 256 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  province: varchar("province", { length: 64 }),
  city: varchar("city", { length: 128 }),
  locationName: varchar("locationName", { length: 255 }),
  locationAddress: varchar("locationAddress", { length: 512 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  entryOpenDate: timestamp("entryOpenDate"),
  disciplines: text("disciplines"),
  purseAmount: int("purseAmount"),
  entryFee: int("entryFee"),
  committeeContact: varchar("committeeContact", { length: 255 }),
  committeePhone: varchar("committeePhone", { length: 64 }),
  isSpecialEvent: boolean("isSpecialEvent").default(false).notNull(),
  detailsUrl: varchar("detailsUrl", { length: 512 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  rawData: text("rawData"),
  scrapedAt: timestamp("scrapedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CpraEvent = typeof cpraEvents.$inferSelect;
export type InsertCpraEvent = typeof cpraEvents.$inferInsert;
