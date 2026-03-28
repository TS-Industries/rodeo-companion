/**
 * Multi-source Canadian Rodeo Scraper
 * Covers:
 *  - CPRA (rodeocanada.com) — Professional
 *  - WRA (wrarodeo.com) — Amateur Alberta
 *  - KCRA (kcrarodeo.com) — Amateur Saskatchewan
 *  - RAM Rodeo (ramrodeoontario.com) — Amateur Ontario
 *  - AHSRA Finals (hardcoded) — High School / Junior High Alberta
 *
 * All events are upserted into the cpra_events table with a `source` field
 * stored in rawData so the UI can filter by level.
 */

import * as cheerio from "cheerio";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { cpraEvents } from "../drizzle/schema";
import type { Discipline } from "../drizzle/schema";

// ─── Shared Utilities ────────────────────────────────────────────────────────

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; RodeoCompanion/1.0; +https://rodeocomp.manus.space)",
  Accept: "text/html,application/xhtml+xml",
};

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

const DISCIPLINE_MAP: Record<string, Discipline> = {
  BB: "bareback",
  SW: "steer_wrestling",
  TR: "team_roping",
  SB: "saddle_bronc",
  LBR: "barrel_racing",
  BR: "barrel_racing",
  TDR: "tie_down_roping",
  BAW: "bull_riding",
  BU: "bull_riding",
  "BULL RIDING": "bull_riding",
  "BARREL RACING": "barrel_racing",
  "TEAM ROPING": "team_roping",
  "TIE DOWN": "tie_down_roping",
  "TIE-DOWN": "tie_down_roping",
  BAREBACK: "bareback",
  "SADDLE BRONC": "saddle_bronc",
  "STEER WRESTLING": "steer_wrestling",
  BREAKAWAY: "breakaway_roping",
  "POLE BENDING": "barrel_racing", // map to barrel racing as closest
  "GOAT TYING": "tie_down_roping",
};

function parseDisciplines(text: string): Discipline[] {
  const found = new Set<Discipline>();
  const abbrevs = text.split(/[,\s\/]+/).map((s) => s.trim().toUpperCase());
  for (const abbrev of abbrevs) {
    if (DISCIPLINE_MAP[abbrev]) found.add(DISCIPLINE_MAP[abbrev]);
  }
  for (const [key, val] of Object.entries(DISCIPLINE_MAP)) {
    if (text.toUpperCase().includes(key)) found.add(val);
  }
  return Array.from(found);
}

function parseDate(dateStr: string, year = 2026): Date | null {
  if (!dateStr) return null;
  try {
    const cleaned = dateStr.replace(/\*+/g, "").trim();
    const match = cleaned.match(
      /([A-Za-z]+)\s+(\d+)(?:\s*[-–]\s*(?:[A-Za-z]+\s+)?(\d+))?,?\s*(\d{4})?/
    );
    if (match) {
      const month = match[1];
      const day = parseInt(match[2]);
      const yr = match[4] ? parseInt(match[4]) : year;
      const d = new Date(`${month} ${day}, ${yr}`);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;
    return null;
  } catch {
    return null;
  }
}

function parseEndDate(dateStr: string, startDate: Date | null): Date | null {
  if (!dateStr || !startDate) return startDate;
  try {
    const cleaned = dateStr.replace(/\*+/g, "").trim();
    const rangeMatch = cleaned.match(
      /([A-Za-z]+)\s+(\d+)\s*[-–]\s*(?:([A-Za-z]+)\s+)?(\d+),?\s*(\d{4})?/
    );
    if (rangeMatch) {
      const startMonth = rangeMatch[1];
      const endMonth = rangeMatch[3] || startMonth;
      const endDay = parseInt(rangeMatch[4]);
      const yr = rangeMatch[5] ? parseInt(rangeMatch[5]) : startDate.getFullYear();
      const d = new Date(`${endMonth} ${endDay}, ${yr}`);
      if (!isNaN(d.getTime())) return d;
    }
    return startDate;
  } catch {
    return startDate;
  }
}

function slugify(source: string, name: string, dateStr: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const datePart = dateStr
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 20);
  return `${source}-${base}-${datePart}`;
}

interface RodeoEvent {
  externalId: string;
  name: string;
  province: string | null;
  city: string | null;
  locationName: string | null;
  locationAddress: string | null;
  startDate: Date | null;
  endDate: Date | null;
  entryOpenDate: Date | null;
  disciplines: string; // JSON array
  purseAmount: number | null;
  entryFee: number | null;
  committeeContact: string | null;
  committeePhone: string | null;
  isSpecialEvent: boolean;
  detailsUrl: string | null;
  websiteUrl: string | null;
  rawData: string; // includes { source, level, ... }
}

async function upsertEvents(events: RodeoEvent[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let count = 0;
  for (const event of events) {
    try {
      await db
        .insert(cpraEvents)
        .values({
          externalId: event.externalId,
          name: event.name,
          province: event.province ?? undefined,
          city: event.city ?? undefined,
          locationName: event.locationName ?? undefined,
          locationAddress: event.locationAddress ?? undefined,
          startDate: event.startDate ?? undefined,
          endDate: event.endDate ?? undefined,
          entryOpenDate: event.entryOpenDate ?? undefined,
          disciplines: event.disciplines,
          purseAmount: event.purseAmount ?? undefined,
          entryFee: event.entryFee ?? undefined,
          committeeContact: event.committeeContact ?? undefined,
          committeePhone: event.committeePhone ?? undefined,
          isSpecialEvent: event.isSpecialEvent,
          detailsUrl: event.detailsUrl ?? undefined,
          websiteUrl: event.websiteUrl ?? undefined,
          rawData: event.rawData,
          scrapedAt: new Date(),
        })
        .onDuplicateKeyUpdate({
          set: {
            name: event.name,
            province: event.province ?? undefined,
            city: event.city ?? undefined,
            locationName: event.locationName ?? undefined,
            locationAddress: event.locationAddress ?? undefined,
            startDate: event.startDate ?? undefined,
            endDate: event.endDate ?? undefined,
            entryOpenDate: event.entryOpenDate ?? undefined,
            disciplines: event.disciplines,
            purseAmount: event.purseAmount ?? undefined,
            entryFee: event.entryFee ?? undefined,
            committeeContact: event.committeeContact ?? undefined,
            committeePhone: event.committeePhone ?? undefined,
            isSpecialEvent: event.isSpecialEvent,
            detailsUrl: event.detailsUrl ?? undefined,
            websiteUrl: event.websiteUrl ?? undefined,
            rawData: event.rawData,
            scrapedAt: new Date(),
          },
        });
      count++;
    } catch (err) {
      console.warn(`[Scraper] Failed to upsert ${event.name}:`, err);
    }
  }
  return count;
}

// ─── CPRA Scraper (Professional) ─────────────────────────────────────────────

async function scrapeCpraDetailsPage(url: string): Promise<Partial<RodeoEvent>> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const content = $(".entry-content, .post-content, article").first().text();
    const result: Partial<RodeoEvent> = {};

    const addressMatch = content.match(/Rodeo Grounds:\s*([^\n\r]+)/i);
    if (addressMatch) result.locationAddress = addressMatch[1].trim();

    const venueMatch = content.match(/(?:Arena|Venue|Location):\s*([^\n\r]+)/i);
    if (venueMatch) result.locationName = venueMatch[1].trim();

    const contactMatch = content.match(/Committee Contact:\s*([^\n\r]+)/i);
    if (contactMatch) result.committeeContact = contactMatch[1].trim();

    const phoneMatch = content.match(/(?:Rodeo Office|Phone):\s*([\d\-\(\)\s\.]+)/i);
    if (phoneMatch) result.committeePhone = phoneMatch[1].trim();

    const purseMatch = content.match(/Purse[^:]*:\s*\$([0-9,]+)/i);
    if (purseMatch) result.purseAmount = parseInt(purseMatch[1].replace(/,/g, ""));

    const feeMatch = content.match(/Entry Fee[s]?[^:]*:\s*\$(\d+)/i);
    if (feeMatch) result.entryFee = parseInt(feeMatch[1]);

    const cresMatch = content.match(
      /(?:CRES Entries|Office will call|Entries open)[:\s]*([A-Za-z]+\s+\d+)/i
    );
    if (cresMatch) {
      const d = parseDate(cresMatch[1] + ", 2026");
      if (d) result.entryOpenDate = d;
    }

    const perfOrderMatch = content.match(/Performance Order:\s*([^\n\r]+)/i);
    if (perfOrderMatch) {
      const discs = parseDisciplines(perfOrderMatch[1]);
      if (discs.length > 0) result.disciplines = JSON.stringify(discs);
    }

    return result;
  } catch {
    return {};
  }
}

export async function scrapeCpra(): Promise<number> {
  console.log("[CPRA] Scraping rodeocanada.com/2026-schedule/...");
  const html = await fetchHtml("https://rodeocanada.com/2026-schedule/");
  const $ = cheerio.load(html);
  const events: RodeoEvent[] = [];
  const content = $(".entry-content, .post-content, article").first();

  content.find("h4").each((_, el) => {
    const h4 = $(el);
    const rawName = h4.text().trim();
    if (!rawName || rawName.length < 2) return;

    const isSpecialEvent = rawName.startsWith("*") && !rawName.startsWith("**");
    const name = rawName.replace(/^\*+\s*/, "").trim();
    const province = h4.next("h6").text().trim() || null;

    let dateText = "";
    let next = h4.next();
    while (next.length && !next.is("h4")) {
      const boldText = next.find("strong, b").first().text().trim();
      if (boldText && /\d{4}/.test(boldText)) { dateText = boldText; break; }
      if (next.is("strong, b") && /\d{4}/.test(next.text())) { dateText = next.text().trim(); break; }
      next = next.next();
    }

    let detailsUrl: string | null = null;
    let websiteUrl: string | null = null;
    let sibling = h4.next();
    while (sibling.length && !sibling.is("h4")) {
      sibling.find("a").each((_, a) => {
        const href = $(a).attr("href") || "";
        const text = $(a).text().trim().toUpperCase();
        if (text === "DETAILS" && href && !detailsUrl)
          detailsUrl = href.startsWith("http") ? href : "https://rodeocanada.com" + href;
        if (text === "WEBSITE" && href && !websiteUrl)
          websiteUrl = href.startsWith("http") ? href : "https://rodeocanada.com" + href;
      });
      sibling = sibling.next();
    }

    const startDate = parseDate(dateText);
    const endDate = parseEndDate(dateText, startDate);

    events.push({
      externalId: slugify("cpra", name, dateText || name),
      name,
      province,
      city: null,
      locationName: null,
      locationAddress: null,
      startDate,
      endDate,
      entryOpenDate: null,
      disciplines: JSON.stringify([]),
      purseAmount: null,
      entryFee: null,
      committeeContact: null,
      committeePhone: null,
      isSpecialEvent,
      detailsUrl,
      websiteUrl,
      rawData: JSON.stringify({ source: "cpra", level: "professional", rawName, dateText, province }),
    });
  });

  // Fetch details pages in batches
  const withDetails = events.filter((e) => e.detailsUrl);
  for (let i = 0; i < withDetails.length; i += 5) {
    const batch = withDetails.slice(i, i + 5);
    await Promise.all(batch.map(async (event) => {
      if (!event.detailsUrl) return;
      const details = await scrapeCpraDetailsPage(event.detailsUrl);
      Object.assign(event, details);
      // Re-apply source in rawData after merge
      const raw = JSON.parse(event.rawData);
      event.rawData = JSON.stringify({ ...raw, ...details });
    }));
    if (i + 5 < withDetails.length) await new Promise((r) => setTimeout(r, 800));
  }

  const upserted = await upsertEvents(events);
  console.log(`[CPRA] Done: ${upserted}/${events.length} upserted`);
  return upserted;
}

// ─── WRA Scraper (Amateur Alberta) ───────────────────────────────────────────

export async function scrapeWra(): Promise<number> {
  console.log("[WRA] Scraping wrarodeo.com/schedule/...");
  try {
    const html = await fetchHtml("https://wrarodeo.com/schedule/");
    const $ = cheerio.load(html);
    const events: RodeoEvent[] = [];

    // WRA schedule page has a table or list of rodeos
    $("table tr, .rodeo-item, article, .entry-content li").each((_, el) => {
      const text = $(el).text().trim();
      if (!text || text.length < 5) return;

      // Look for date patterns like "July 11" or "Aug 22 & 23"
      const dateMatch = text.match(/([A-Za-z]+)\s+(\d+)(?:\s*[&\-–]\s*(\d+))?(?:,?\s*(2026))?/);
      if (!dateMatch) return;

      const name = text.split(/[,\n]/)[0].trim().replace(/\s+/g, " ").slice(0, 100);
      if (name.length < 3) return;

      const dateText = dateMatch[0];
      const startDate = parseDate(dateText + (dateMatch[4] ? "" : ", 2026"));
      const endDate = parseEndDate(dateText + ", 2026", startDate);

      // Extract city from name (usually "City Rodeo Name")
      const city = name.split(/\s+/)[0] || null;

      events.push({
        externalId: slugify("wra", name, dateText),
        name,
        province: "Alberta",
        city,
        locationName: null,
        locationAddress: null,
        startDate,
        endDate,
        entryOpenDate: null,
        disciplines: JSON.stringify(["barrel_racing", "team_roping", "tie_down_roping", "bareback", "saddle_bronc", "steer_wrestling", "bull_riding"]),
        purseAmount: null,
        entryFee: null,
        committeeContact: null,
        committeePhone: null,
        isSpecialEvent: false,
        detailsUrl: "https://wrarodeo.com/schedule/",
        websiteUrl: "https://wrarodeo.com",
        rawData: JSON.stringify({ source: "wra", level: "amateur", province: "Alberta" }),
      });
    });

    // Deduplicate by externalId
    const seen = new Set<string>();
    const unique = events.filter((e) => {
      if (seen.has(e.externalId)) return false;
      seen.add(e.externalId);
      return true;
    });

    const upserted = await upsertEvents(unique);
    console.log(`[WRA] Done: ${upserted}/${unique.length} upserted`);
    return upserted;
  } catch (err) {
    console.warn("[WRA] Scrape failed:", err);
    return 0;
  }
}

// ─── KCRA Scraper (Amateur Saskatchewan) ─────────────────────────────────────

export async function scrapeKcra(): Promise<number> {
  console.log("[KCRA] Scraping kcrarodeo.com...");
  try {
    const html = await fetchHtml("https://kcrarodeo.com/");
    const $ = cheerio.load(html);
    const events: RodeoEvent[] = [];

    // KCRA lists rodeos in the page content
    const bodyText = $("body").text();
    // Match patterns like "CITY RODEO NAME MONTH DAY & DAY, YEAR"
    const rodeoPattern = /([A-Z][A-Z\s]+RODEO[A-Z\s]*)\s+([A-Za-z]+\s+\d+(?:\s*[&\-–]\s*\d+)?(?:,\s*2026)?)/gi;
    let match;
    while ((match = rodeoPattern.exec(bodyText)) !== null) {
      const name = match[1].trim().replace(/\s+/g, " ");
      const dateText = match[2].trim();
      if (name.length < 3 || name.length > 100) continue;

      const startDate = parseDate(dateText.includes("2026") ? dateText : dateText + ", 2026");
      const endDate = parseEndDate(dateText + ", 2026", startDate);

      events.push({
        externalId: slugify("kcra", name, dateText),
        name,
        province: "Saskatchewan",
        city: name.split(/\s+/)[0] || null,
        locationName: null,
        locationAddress: null,
        startDate,
        endDate,
        entryOpenDate: null,
        disciplines: JSON.stringify(["barrel_racing", "team_roping", "tie_down_roping", "bareback", "saddle_bronc", "steer_wrestling", "bull_riding"]),
        purseAmount: null,
        entryFee: null,
        committeeContact: null,
        committeePhone: null,
        isSpecialEvent: false,
        detailsUrl: "https://kcrarodeo.com/",
        websiteUrl: "https://kcrarodeo.com",
        rawData: JSON.stringify({ source: "kcra", level: "amateur", province: "Saskatchewan" }),
      });
    }

    const seen = new Set<string>();
    const unique = events.filter((e) => {
      if (seen.has(e.externalId)) return false;
      seen.add(e.externalId);
      return true;
    });

    const upserted = await upsertEvents(unique);
    console.log(`[KCRA] Done: ${upserted}/${unique.length} upserted`);
    return upserted;
  } catch (err) {
    console.warn("[KCRA] Scrape failed:", err);
    return 0;
  }
}

// ─── RAM Rodeo Scraper (Amateur Ontario) ─────────────────────────────────────

export async function scrapeRamRodeo(): Promise<number> {
  console.log("[RAM] Scraping ramrodeoontario.com/p/schedule.html...");
  try {
    const html = await fetchHtml("https://www.ramrodeoontario.com/p/schedule.html");
    const $ = cheerio.load(html);
    const events: RodeoEvent[] = [];

    // RAM Rodeo schedule page has entries like "May 23-24 Grey Highlands RAM Rodeo"
    $(".post-body, .entry-content, article, main").find("*").each((_, el) => {
      const text = $(el).text().trim();
      if (!text || text.length < 10 || text.length > 200) return;

      const match = text.match(/^([A-Za-z]+\s+\d+(?:\s*[-–]\s*\d+)?)\s+(.+RAM.+)/i);
      if (!match) return;

      const dateText = match[1].trim();
      const name = match[2].trim().replace(/\s+/g, " ");
      if (name.length < 5) return;

      const startDate = parseDate(dateText + ", 2026");
      const endDate = parseEndDate(dateText + ", 2026", startDate);

      events.push({
        externalId: slugify("ram", name, dateText),
        name,
        province: "Ontario",
        city: name.replace(/\s*RAM\s*Rodeo.*/i, "").trim() || null,
        locationName: null,
        locationAddress: null,
        startDate,
        endDate,
        entryOpenDate: null,
        disciplines: JSON.stringify(["barrel_racing", "team_roping", "tie_down_roping", "bareback", "saddle_bronc", "steer_wrestling", "bull_riding"]),
        purseAmount: null,
        entryFee: null,
        committeeContact: null,
        committeePhone: null,
        isSpecialEvent: false,
        detailsUrl: "https://www.ramrodeoontario.com/p/schedule.html",
        websiteUrl: "https://www.ramrodeoontario.com",
        rawData: JSON.stringify({ source: "ram", level: "amateur", province: "Ontario" }),
      });
    });

    const seen = new Set<string>();
    const unique = events.filter((e) => {
      if (seen.has(e.externalId)) return false;
      seen.add(e.externalId);
      return true;
    });

    const upserted = await upsertEvents(unique);
    console.log(`[RAM] Done: ${upserted}/${unique.length} upserted`);
    return upserted;
  } catch (err) {
    console.warn("[RAM] Scrape failed:", err);
    return 0;
  }
}

// ─── AHSRA Finals (High School / Junior High — Hardcoded) ────────────────────

export async function scrapeAhsraFinals(): Promise<number> {
  console.log("[AHSRA] Upserting hardcoded high school finals...");

  // These dates are published on albertahsrodeo.ca and change yearly
  // Update this list each season when the new schedule is announced
  const finals: RodeoEvent[] = [
    {
      externalId: "ahsra-hs-finals-2026",
      name: "Alberta High School Finals Rodeo 2026",
      province: "Alberta",
      city: "Claresholm",
      locationName: "Willow Creek Agriplex",
      locationAddress: "Claresholm, AB",
      startDate: new Date("2026-06-03"),
      endDate: new Date("2026-06-07"),
      entryOpenDate: null,
      disciplines: JSON.stringify([
        "barrel_racing", "breakaway_roping", "team_roping",
        "tie_down_roping", "bareback", "saddle_bronc",
        "steer_wrestling", "bull_riding",
      ]),
      purseAmount: null,
      entryFee: null,
      committeeContact: "Pam Golden, Provincial Secretary",
      committeePhone: "780-305-9640",
      isSpecialEvent: true,
      detailsUrl: "https://albertahsrodeo.ca/high-school/alberta-hs-finals/",
      websiteUrl: "https://albertahsrodeo.ca",
      rawData: JSON.stringify({
        source: "ahsra",
        level: "high_school",
        province: "Alberta",
        note: "Alberta High School Finals — top qualifiers from 3 districts",
      }),
    },
    {
      externalId: "ahsra-jh-finals-2026",
      name: "Alberta Junior High Finals Rodeo 2026",
      province: "Alberta",
      city: "Rimbey",
      locationName: "Rimbey Ag Grounds",
      locationAddress: "Rimbey, AB",
      startDate: new Date("2026-05-22"),
      endDate: new Date("2026-05-24"),
      entryOpenDate: null,
      disciplines: JSON.stringify([
        "barrel_racing", "breakaway_roping", "team_roping",
        "tie_down_roping", "bareback", "saddle_bronc",
        "steer_wrestling", "bull_riding",
      ]),
      purseAmount: null,
      entryFee: null,
      committeeContact: "Pam Golden, Provincial Secretary",
      committeePhone: "780-305-9640",
      isSpecialEvent: true,
      detailsUrl: "https://albertahsrodeo.ca/junior-high/",
      websiteUrl: "https://albertahsrodeo.ca",
      rawData: JSON.stringify({
        source: "ahsra",
        level: "high_school",
        province: "Alberta",
        note: "Alberta Junior High Finals — Grades 5-8 top qualifiers",
      }),
    },
    {
      externalId: "canadian-hs-finals-2026",
      name: "Canadian High School Finals Rodeo 2026",
      province: "Alberta",
      city: "Vermilion",
      locationName: "Vermilion Agricultural Society",
      locationAddress: "Vermilion, AB",
      startDate: new Date("2026-07-20"),
      endDate: new Date("2026-07-25"),
      entryOpenDate: null,
      disciplines: JSON.stringify([
        "barrel_racing", "breakaway_roping", "team_roping",
        "tie_down_roping", "bareback", "saddle_bronc",
        "steer_wrestling", "bull_riding",
      ]),
      purseAmount: null,
      entryFee: null,
      committeeContact: null,
      committeePhone: null,
      isSpecialEvent: true,
      detailsUrl: "https://albertahsrodeo.com/junior-high/canadian-high-school-finals/",
      websiteUrl: "https://albertahsrodeo.com",
      rawData: JSON.stringify({
        source: "ahsra",
        level: "high_school",
        province: "Alberta",
        note: "Canadian High School Finals — BC, AB, SK, MB, ON qualifiers",
      }),
    },
  ];

  const upserted = await upsertEvents(finals);
  console.log(`[AHSRA] Done: ${upserted}/${finals.length} upserted`);
  return upserted;
}

// ─── Master Scrape Function ───────────────────────────────────────────────────

export async function scrapeAllCanadianRodeos(): Promise<{
  cpra: number;
  wra: number;
  kcra: number;
  ram: number;
  ahsra: number;
  total: number;
}> {
  console.log("[Scraper] Starting full Canadian rodeo scrape...");

  const [cpra, wra, kcra, ram, ahsra] = await Promise.allSettled([
    scrapeCpra(),
    scrapeWra(),
    scrapeKcra(),
    scrapeRamRodeo(),
    scrapeAhsraFinals(),
  ]).then((results) =>
    results.map((r) => (r.status === "fulfilled" ? r.value : 0))
  );

  const total = cpra + wra + kcra + ram + ahsra;
  console.log(
    `[Scraper] Complete. Total upserted: ${total} (CPRA:${cpra} WRA:${wra} KCRA:${kcra} RAM:${ram} AHSRA:${ahsra})`
  );
  return { cpra, wra, kcra, ram, ahsra, total };
}

// ─── DB Query Helpers (re-exported for use in routers) ───────────────────────

export async function getCpraEventsFromDb(filters?: {
  province?: string;
  source?: string;
  level?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(cpraEvents);
  let filtered: typeof rows = rows;

  if (filters?.province) {
    filtered = filtered.filter(
      (r: typeof rows[0]) => r.province?.toLowerCase() === filters.province!.toLowerCase()
    );
  }
  if (filters?.source || filters?.level) {
    filtered = filtered.filter((r: typeof rows[0]) => {
      if (!r.rawData) return false;
      try {
        const meta = JSON.parse(r.rawData);
        if (filters.source && meta.source !== filters.source) return false;
        if (filters.level && meta.level !== filters.level) return false;
        return true;
      } catch {
        return false;
      }
    });
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (r: typeof rows[0]) =>
        r.name.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.province?.toLowerCase().includes(q)
    );
  }

  filtered.sort((a: typeof rows[0], b: typeof rows[0]) => {
    const aTime = a.startDate?.getTime() ?? 0;
    const bTime = b.startDate?.getTime() ?? 0;
    return aTime - bTime;
  });

  return filtered;
}

export async function getCpraEventById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(cpraEvents).where(eq(cpraEvents.id, id));
  return rows[0] ?? null;
}

export async function getCpraEventCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(cpraEvents);
  return rows.length;
}
