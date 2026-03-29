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
  disciplines: text("disciplines"), // JSON array of Discipline[] for multi-discipline entries
  rodeotype: mysqlEnum("rodeotype", ["jackpot", "amateur", "professional"]).default("jackpot").notNull(),
  rodeoDate: timestamp("rodeoDate").notNull(),
  entryDeadline: timestamp("entryDeadline").notNull(),
  locationName: varchar("locationName", { length: 255 }),
  locationAddress: varchar("locationAddress", { length: 512 }),
  locationLat: float("locationLat"),
  locationLng: float("locationLng"),
  locationPlaceId: varchar("locationPlaceId", { length: 512 }),
  parkingNotes: text("parkingNotes"),
  countryCode: varchar("countryCode", { length: 4 }), // 'US' or 'CA' for unit system
  notes: text("notes"),
  isEntered: boolean("isEntered").default(false).notNull(),
  notifyDaysBefore: int("notifyDaysBefore").default(14).notNull(),
  notificationSent: boolean("notificationSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rodeo = typeof rodeos.$inferSelect;
export type InsertRodeo = typeof rodeos.$inferInsert;

// Round types for performances - kept for legacy reference
export const ROUND_TYPES = ["regular", "short_go", "final"] as const;
export type RoundType = (typeof ROUND_TYPES)[number];
export const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  regular: "Regular Round",
  short_go: "Short Go",
  final: "Final",
};

// Performance runs logged per rodeo
export const performances = mysqlTable("performances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rodeoId: int("rodeoId").notNull(),
  discipline: mysqlEnum("discipline", DISCIPLINES).notNull(),
  round: varchar("round", { length: 64 }).default("Round 1").notNull(), // free-text round label (e.g. "Day 1", "Round 2", "Short Go", "Final")
  timeSeconds: float("timeSeconds"), // null for rough stock (scored differently)
  score: float("score"),             // for rough stock events
  penaltySeconds: float("penaltySeconds").default(0),
  prizeMoneyCents: int("prizeMoneyCents").default(0), // prize money won in cents (0 = no winnings)
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

// Horses owned by a user, associated with disciplines
export const horses = mysqlTable("horses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  disciplines: text("disciplines"), // JSON array of Discipline[] this horse competes in
  breed: varchar("breed", { length: 128 }),
  color: varchar("color", { length: 64 }),
  age: int("age"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Horse = typeof horses.$inferSelect;
export type InsertHorse = typeof horses.$inferInsert;

// Care reminder types for horses
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

// Health log entries (vet visits, treatments, observations)
export const horseHealthLogs = mysqlTable("horse_health_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  horseId: int("horseId").notNull(),
  type: mysqlEnum("type", CARE_REMINDER_TYPES).default("vet").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  notes: text("notes"),
  cost: int("cost").default(0), // cost in cents
  provider: varchar("provider", { length: 255 }), // vet name, farrier name, etc.
  logDate: timestamp("logDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HorseHealthLog = typeof horseHealthLogs.$inferSelect;
export type InsertHorseHealthLog = typeof horseHealthLogs.$inferInsert;

// Upcoming care reminders (linked to phone calendar)
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

// Feeding & supplement records per horse
export const horseFeeding = mysqlTable("horse_feeding", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  horseId: int("horseId").notNull(),
  feedName: varchar("feedName", { length: 255 }).notNull(), // e.g. "Hay", "Oats", "Supplement X"
  feedType: mysqlEnum("feedType", ["hay", "grain", "supplement", "mineral", "other"]).default("hay").notNull(),
  amount: varchar("amount", { length: 128 }), // e.g. "2 flakes", "3 lbs", "1 scoop"
  frequency: varchar("frequency", { length: 128 }), // e.g. "Twice daily", "Morning only"
  notes: text("notes"),
  monthlyCostCents: int("monthlyCostCents").default(0), // estimated monthly cost
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HorseFeeding = typeof horseFeeding.$inferSelect;
export type InsertHorseFeeding = typeof horseFeeding.$inferInsert;

// Receipts attached to horses (vet, farrier, feed, etc.) — also linked to expenses
export const horseReceipts = mysqlTable("horse_receipts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  horseId: int("horseId").notNull(),
  healthLogId: int("healthLogId"), // optional link to a health log entry
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", CARE_REMINDER_TYPES).default("vet").notNull(),
  amountCents: int("amountCents").default(0).notNull(), // amount in cents
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

// Season prize money goal (one row per user per year)
export const seasonGoals = mysqlTable("season_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  year: int("year").notNull(), // e.g. 2026
  targetCents: int("targetCents").notNull().default(0), // target prize money in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeasonGoal = typeof seasonGoals.$inferSelect;
export type InsertSeasonGoal = typeof seasonGoals.$inferInsert;

// Partner contact roles
export const PARTNER_ROLES = ["header", "heeler", "partner", "coach", "other"] as const;
export type PartnerRole = (typeof PARTNER_ROLES)[number];

export const PARTNER_ROLE_LABELS: Record<PartnerRole, string> = {
  header: "Header",
  heeler: "Heeler",
  partner: "Partner",
  coach: "Coach",
  other: "Other",
};

// Contacts (team roping partners, coaches, etc.)
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  role: mysqlEnum("role", PARTNER_ROLES).default("partner").notNull(),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// Rodeo ↔ Contact link (which partner is riding with you at each rodeo)
export const rodeoContacts = mysqlTable("rodeo_contacts", {
  id: int("id").autoincrement().primaryKey(),
  rodeoId: int("rodeoId").notNull(),
  contactId: int("contactId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RodeoContact = typeof rodeoContacts.$inferSelect;
export type InsertRodeoContact = typeof rodeoContacts.$inferInsert;

// Cached CPRA (Canadian Pro Rodeo Association) events scraped from rodeocanada.com
export const cpraEvents = mysqlTable("cpra_events", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 256 }).notNull().unique(), // slug from CPRA URL or generated key
  name: varchar("name", { length: 255 }).notNull(),
  province: varchar("province", { length: 64 }),  // e.g. "Alberta", "British Columbia"
  city: varchar("city", { length: 128 }),
  locationName: varchar("locationName", { length: 255 }), // arena/venue name
  locationAddress: varchar("locationAddress", { length: 512 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  entryOpenDate: timestamp("entryOpenDate"),  // CRES entry opening date
  disciplines: text("disciplines"),  // JSON array of Discipline[] codes
  purseAmount: int("purseAmount"),   // prize purse in dollars
  entryFee: int("entryFee"),         // entry fee in dollars
  committeeContact: varchar("committeeContact", { length: 255 }),
  committeePhone: varchar("committeePhone", { length: 64 }),
  isSpecialEvent: boolean("isSpecialEvent").default(false).notNull(),
  detailsUrl: varchar("detailsUrl", { length: 512 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  rawData: text("rawData"),  // JSON blob of full scraped data
  scrapedAt: timestamp("scrapedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CpraEvent = typeof cpraEvents.$inferSelect;
export type InsertCpraEvent = typeof cpraEvents.$inferInsert;
