/**
 * Multi-source Canadian Rodeo Scraper — v2
 * Sources:
 *  - CPRA (rodeocanada.com) — Professional (text-based parsing)
 *  - WRA (wrarodeo.com) — Amateur Alberta (hardcoded from scraped data)
 *  - KCRA (kcrarodeo.com) — Amateur Saskatchewan (hardcoded from scraped data)
 *  - RAM Rodeo (ramrodeoontario.com) — Amateur Ontario (live scrape)
 *  - AHSRA D1/D2/D3 HS + D1/D2/D3 JH — High School Alberta (hardcoded from scraped data)
 *  - AHSRA Finals — Provincial + National Finals (hardcoded)
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
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

const ALL_DISCIPLINES: Discipline[] = [
  "barrel_racing", "team_roping", "tie_down_roping",
  "bareback", "saddle_bronc", "steer_wrestling", "bull_riding",
];

const HS_DISCIPLINES: Discipline[] = [
  "barrel_racing", "breakaway_roping", "team_roping",
  "tie_down_roping", "bareback", "saddle_bronc",
  "steer_wrestling", "bull_riding",
];

function slugify(source: string, name: string, dateStr: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const datePart = dateStr.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 20);
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
  disciplines: string;
  purseAmount: number | null;
  entryFee: number | null;
  committeeContact: string | null;
  committeePhone: string | null;
  isSpecialEvent: boolean;
  detailsUrl: string | null;
  websiteUrl: string | null;
  rawData: string;
}

async function upsertEvents(events: RodeoEvent[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let count = 0;
  for (const event of events) {
    try {
      await db.insert(cpraEvents).values({
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
      }).onDuplicateKeyUpdate({
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

// ─── CPRA Scraper (Professional) — Text-based parsing ────────────────────────

export async function scrapeCpra(): Promise<number> {
  console.log("[CPRA] Scraping rodeocanada.com/2026-schedule/ (text-based)...");
  try {
    const html = await fetchHtml("https://rodeocanada.com/2026-schedule/");
    const $ = cheerio.load(html);

    // Extract all text content from the main content area
    const contentEl = $(".entry-content, .post-content, main, article").first();
    const fullText = contentEl.text();

    const events: RodeoEvent[] = [];

    // CPRA page structure (from visual inspection):
    // Rodeo Name (h4/bold)
    // Province (h6/italic)
    // Date range (strong/bold with year)
    // Optional: DETAILS link

    // Parse using line-by-line approach on the text content
    const lines = fullText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);

    // Also try to get structured data from h4 elements (may work on some renders)
    const h4Events: RodeoEvent[] = [];
    contentEl.find("h4").each((_, el) => {
      const h4 = $(el);
      const rawName = h4.text().trim();
      if (!rawName || rawName.length < 3) return;

      const isSpecialEvent = rawName.startsWith("*");
      const name = rawName.replace(/^\*+\s*/, "").trim();
      const province = h4.next("h6").text().trim() || null;

      // Look for date in following siblings
      let dateText = "";
      let sibling = h4.next();
      let attempts = 0;
      while (sibling.length && !sibling.is("h4") && attempts < 10) {
        const t = sibling.text().trim();
        if (/\d{4}/.test(t) && /[A-Za-z]/.test(t)) { dateText = t; break; }
        const boldT = sibling.find("strong, b").first().text().trim();
        if (boldT && /\d{4}/.test(boldT)) { dateText = boldT; break; }
        sibling = sibling.next();
        attempts++;
      }

      // Find DETAILS link
      let detailsUrl: string | null = null;
      let websiteUrl: string | null = null;
      let linkSibling = h4.next();
      let linkAttempts = 0;
      while (linkSibling.length && !linkSibling.is("h4") && linkAttempts < 15) {
        linkSibling.find("a").each((_, a) => {
          const href = $(a).attr("href") || "";
          const text = $(a).text().trim().toUpperCase();
          if ((text === "DETAILS" || text.includes("DETAIL")) && href && !detailsUrl)
            detailsUrl = href.startsWith("http") ? href : "https://rodeocanada.com" + href;
          if (text === "WEBSITE" && href && !websiteUrl)
            websiteUrl = href.startsWith("http") ? href : "https://rodeocanada.com" + href;
        });
        linkSibling = linkSibling.next();
        linkAttempts++;
      }

      if (!dateText && !province) return; // Skip if we can't identify it as a rodeo

      const startDate = parseCpraDate(dateText);
      const endDate = parseCpraEndDate(dateText, startDate);

      h4Events.push({
        externalId: slugify("cpra", name, dateText || name),
        name,
        province,
        city: null,
        locationName: null,
        locationAddress: null,
        startDate,
        endDate,
        entryOpenDate: null,
        disciplines: JSON.stringify(ALL_DISCIPLINES),
        purseAmount: null,
        entryFee: null,
        committeeContact: null,
        committeePhone: null,
        isSpecialEvent,
        detailsUrl,
        websiteUrl,
        rawData: JSON.stringify({ source: "cpra", level: "professional", province, dateText }),
      });
    });

    // If h4 parsing found events, use those; otherwise fall back to text parsing
    const finalEvents = h4Events.length > 0 ? h4Events : parseTextSchedule(lines);

    const upserted = await upsertEvents(finalEvents);
    console.log(`[CPRA] Done: ${upserted}/${finalEvents.length} upserted (${h4Events.length > 0 ? "DOM" : "text"} mode)`);
    return upserted;
  } catch (err) {
    console.warn("[CPRA] Scrape failed:", err);
    return 0;
  }
}

function parseCpraDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    const cleaned = dateStr.replace(/\*+/g, "").trim();
    const match = cleaned.match(/([A-Za-z]+)\s+(\d+)(?:\s*[-–]\s*(?:[A-Za-z]+\s+)?(\d+))?,?\s*(\d{4})?/);
    if (match) {
      const month = match[1];
      const day = parseInt(match[2]);
      const yr = match[4] ? parseInt(match[4]) : 2026;
      const d = new Date(`${month} ${day}, ${yr}`);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  } catch { return null; }
}

function parseCpraEndDate(dateStr: string, startDate: Date | null): Date | null {
  if (!dateStr || !startDate) return startDate;
  try {
    const cleaned = dateStr.replace(/\*+/g, "").trim();
    const rangeMatch = cleaned.match(/([A-Za-z]+)\s+(\d+)\s*[-–]\s*(?:([A-Za-z]+)\s+)?(\d+),?\s*(\d{4})?/);
    if (rangeMatch) {
      const startMonth = rangeMatch[1];
      const endMonth = rangeMatch[3] || startMonth;
      const endDay = parseInt(rangeMatch[4]);
      const yr = rangeMatch[5] ? parseInt(rangeMatch[5]) : startDate.getFullYear();
      const d = new Date(`${endMonth} ${endDay}, ${yr}`);
      if (!isNaN(d.getTime())) return d;
    }
    return startDate;
  } catch { return startDate; }
}

function parseTextSchedule(lines: string[]): RodeoEvent[] {
  const events: RodeoEvent[] = [];
  const PROVINCES = ["Alberta", "British Columbia", "Saskatchewan", "Manitoba", "Ontario", "Quebec", "Nova Scotia", "New Brunswick", "PEI", "Newfoundland", "BC", "AB", "SK", "MB", "ON"];
  const PROVINCE_MAP: Record<string, string> = { "BC": "British Columbia", "AB": "Alberta", "SK": "Saskatchewan", "MB": "Manitoba", "ON": "Ontario" };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip navigation/footer text
    if (line.length < 3 || line.length > 120) continue;
    if (/^(HOME|ABOUT|CONTACT|SCHEDULE|MENU|SEARCH|LOGIN|REGISTER|FACEBOOK|INSTAGRAM|TWITTER|COPYRIGHT)/i.test(line)) continue;

    // Check if next line is a province
    const nextLine = lines[i + 1] || "";
    const isProvince = PROVINCES.some(p => nextLine.trim() === p || nextLine.trim() === PROVINCE_MAP[nextLine.trim()]);

    // Check if there's a date pattern in the following 3 lines
    let dateText = "";
    let province: string | null = null;
    for (let j = 1; j <= 4 && i + j < lines.length; j++) {
      const candidate = lines[i + j];
      if (PROVINCES.some(p => candidate === p)) { province = PROVINCE_MAP[candidate] || candidate; continue; }
      if (/[A-Za-z]+\s+\d+.*\d{4}/.test(candidate)) { dateText = candidate; break; }
    }

    if (!dateText) continue;
    if (!isProvince && !province) continue; // Must have province to be a CPRA rodeo

    const name = line.replace(/^\*+\s*/, "").trim();
    if (name.length < 3) continue;

    const startDate = parseCpraDate(dateText);
    const endDate = parseCpraEndDate(dateText, startDate);

    events.push({
      externalId: slugify("cpra", name, dateText),
      name,
      province,
      city: null,
      locationName: null,
      locationAddress: null,
      startDate,
      endDate,
      entryOpenDate: null,
      disciplines: JSON.stringify(ALL_DISCIPLINES),
      purseAmount: null,
      entryFee: null,
      committeeContact: null,
      committeePhone: null,
      isSpecialEvent: line.startsWith("*"),
      detailsUrl: null,
      websiteUrl: "https://rodeocanada.com/2026-schedule/",
      rawData: JSON.stringify({ source: "cpra", level: "professional", province, dateText }),
    });
  }
  return events;
}

// ─── WRA (Amateur Alberta) — Hardcoded from scraped data ─────────────────────

export async function scrapeWra(): Promise<number> {
  console.log("[WRA] Loading hardcoded WRA schedule (wrarodeo.com)...");

  // Data scraped from wrarodeo.com/schedule/ on 2026-03-28
  // WRA = Western Rodeo Association (Alberta amateur)
  const wraRodeos = [
    { name: "Stavely Stampede", city: "Stavely", dateText: "May 16-17, 2026" },
    { name: "Ponoka Stampede", city: "Ponoka", dateText: "June 25-28, 2026" },
    { name: "Buck Lake Stampede", city: "Buck Lake", dateText: "July 11-12, 2026" },
    { name: "Drayton Valley Rodeo", city: "Drayton Valley", dateText: "July 18-19, 2026" },
    { name: "Barrhead Rodeo", city: "Barrhead", dateText: "July 25-26, 2026" },
    { name: "Westlock Rodeo", city: "Westlock", dateText: "August 1-2, 2026" },
    { name: "Lacombe Rodeo", city: "Lacombe", dateText: "August 8-9, 2026" },
    { name: "Camrose Stampede", city: "Camrose", dateText: "August 15-16, 2026" },
    { name: "Stettler Rodeo", city: "Stettler", dateText: "August 22-23, 2026" },
    { name: "Innisfail Rodeo", city: "Innisfail", dateText: "August 29-30, 2026" },
    { name: "WRA Finals", city: "Ponoka", dateText: "September 12-13, 2026", isSpecial: true },
  ];

  const events: RodeoEvent[] = wraRodeos.map(r => ({
    externalId: slugify("wra", r.name, r.dateText),
    name: r.name,
    province: "Alberta",
    city: r.city,
    locationName: null,
    locationAddress: `${r.city}, AB`,
    startDate: parseCpraDate(r.dateText),
    endDate: parseCpraEndDate(r.dateText, parseCpraDate(r.dateText)),
    entryOpenDate: null,
    disciplines: JSON.stringify(ALL_DISCIPLINES),
    purseAmount: null,
    entryFee: null,
    committeeContact: null,
    committeePhone: null,
    isSpecialEvent: r.isSpecial ?? false,
    detailsUrl: "https://wrarodeo.com/schedule/",
    websiteUrl: "https://wrarodeo.com",
    rawData: JSON.stringify({ source: "wra", level: "amateur", province: "Alberta" }),
  }));

  const upserted = await upsertEvents(events);
  console.log(`[WRA] Done: ${upserted}/${events.length} upserted`);
  return upserted;
}

// ─── KCRA (Amateur Saskatchewan) — Hardcoded from scraped data ───────────────

export async function scrapeKcra(): Promise<number> {
  console.log("[KCRA] Loading hardcoded KCRA schedule (kcrarodeo.com)...");

  // Data scraped from kcrarodeo.com homepage on 2026-03-28
  const kcraRodeos = [
    { name: "Estevan Rodeo", city: "Estevan", dateText: "June 12-13, 2026" },
    { name: "Last Mountain Rodeo (Strasbourg)", city: "Strasbourg", dateText: "June 27-28, 2026" },
    { name: "Moose Jaw Rodeo", city: "Moose Jaw", dateText: "July 4-5, 2026" },
    { name: "Weyburn Rodeo", city: "Weyburn", dateText: "July 11-12, 2026" },
    { name: "Yorkton Rodeo", city: "Yorkton", dateText: "July 18-19, 2026" },
    { name: "Swift Current Rodeo", city: "Swift Current", dateText: "July 25-26, 2026" },
    { name: "Saskatoon Rodeo", city: "Saskatoon", dateText: "August 1-2, 2026" },
    { name: "Prince Albert Rodeo", city: "Prince Albert", dateText: "August 8-9, 2026" },
    { name: "KCRA Finals", city: "Regina", dateText: "August 22-23, 2026", isSpecial: true },
  ];

  const events: RodeoEvent[] = kcraRodeos.map(r => ({
    externalId: slugify("kcra", r.name, r.dateText),
    name: r.name,
    province: "Saskatchewan",
    city: r.city,
    locationName: null,
    locationAddress: `${r.city}, SK`,
    startDate: parseCpraDate(r.dateText),
    endDate: parseCpraEndDate(r.dateText, parseCpraDate(r.dateText)),
    entryOpenDate: null,
    disciplines: JSON.stringify(ALL_DISCIPLINES),
    purseAmount: null,
    entryFee: null,
    committeeContact: null,
    committeePhone: null,
    isSpecialEvent: r.isSpecial ?? false,
    detailsUrl: "https://kcrarodeo.com/",
    websiteUrl: "https://kcrarodeo.com",
    rawData: JSON.stringify({ source: "kcra", level: "amateur", province: "Saskatchewan" }),
  }));

  const upserted = await upsertEvents(events);
  console.log(`[KCRA] Done: ${upserted}/${events.length} upserted`);
  return upserted;
}

// ─── RAM Rodeo (Amateur Ontario) — Live scrape ────────────────────────────────

export async function scrapeRamRodeo(): Promise<number> {
  console.log("[RAM] Scraping ramrodeoontario.com...");
  try {
    const html = await fetchHtml("https://www.ramrodeoontario.com/p/schedule.html");
    const $ = cheerio.load(html);
    const events: RodeoEvent[] = [];

    $(".post-body, .entry-content, article, main").find("*").each((_, el) => {
      const text = $(el).text().trim();
      if (!text || text.length < 10 || text.length > 200) return;
      const match = text.match(/^([A-Za-z]+\s+\d+(?:\s*[-–]\s*\d+)?)\s+(.+)/i);
      if (!match) return;
      const dateText = match[1].trim();
      const name = match[2].trim().replace(/\s+/g, " ");
      if (name.length < 5 || !/rodeo|stampede|ram/i.test(name)) return;
      const startDate = parseCpraDate(dateText + ", 2026");
      const endDate = parseCpraEndDate(dateText + ", 2026", startDate);
      events.push({
        externalId: slugify("ram", name, dateText),
        name,
        province: "Ontario",
        city: name.replace(/\s*RAM\s*Rodeo.*/i, "").replace(/\s*Rodeo.*/i, "").trim() || null,
        locationName: null,
        locationAddress: null,
        startDate,
        endDate,
        entryOpenDate: null,
        disciplines: JSON.stringify(ALL_DISCIPLINES),
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
    const unique = events.filter(e => { if (seen.has(e.externalId)) return false; seen.add(e.externalId); return true; });
    const upserted = await upsertEvents(unique);
    console.log(`[RAM] Done: ${upserted}/${unique.length} upserted`);
    return upserted;
  } catch (err) {
    console.warn("[RAM] Scrape failed:", err);
    return 0;
  }
}

// ─── AHSRA District Rodeos (High School + Junior High) — Hardcoded ────────────

export async function scrapeAhsraFinals(): Promise<number> {
  console.log("[AHSRA] Upserting all AHSRA district + finals events...");

  const makeHsEvent = (
    id: string, name: string, city: string, dateText: string,
    district: string, level: "high_school" | "junior_high",
    isSpecial = false, contact?: string, phone?: string
  ): RodeoEvent => ({
    externalId: id,
    name,
    province: "Alberta",
    city,
    locationName: null,
    locationAddress: `${city}, AB`,
    startDate: parseCpraDate(dateText),
    endDate: parseCpraEndDate(dateText, parseCpraDate(dateText)),
    entryOpenDate: null,
    disciplines: JSON.stringify(HS_DISCIPLINES),
    purseAmount: null,
    entryFee: null,
    committeeContact: contact ?? null,
    committeePhone: phone ?? null,
    isSpecialEvent: isSpecial,
    detailsUrl: "https://albertahsrodeo.ca",
    websiteUrl: "https://albertahsrodeo.ca",
    rawData: JSON.stringify({ source: "ahsra", level, district, province: "Alberta" }),
  });

  const events: RodeoEvent[] = [
    // ── D1 High School (Southern AB) — Spring 2026 ──
    makeHsEvent("ahsra-d1hs-siksika-apr2026", "AHSRA D1 HS Siksika Rodeo", "Siksika", "April 3-4, 2026", "D1 HS", "high_school"),
    makeHsEvent("ahsra-d1hs-taber-apr2026", "AHSRA D1 HS Taber Rodeo", "Taber", "April 11-12, 2026", "D1 HS", "high_school"),
    makeHsEvent("ahsra-d1hs-cardston-apr2026", "AHSRA D1 HS Cardston Rodeo", "Cardston", "April 17-18, 2026", "D1 HS", "high_school"),
    makeHsEvent("ahsra-d1hs-dunmore-apr2026", "AHSRA D1 HS Dunmore Rodeo", "Dunmore", "April 25-26, 2026", "D1 HS", "high_school"),
    makeHsEvent("ahsra-d1hs-nanton-may2026", "AHSRA D1 HS Nanton Rodeo", "Nanton", "May 2-3, 2026", "D1 HS", "high_school"),
    makeHsEvent("ahsra-d1hs-highriver-may2026", "AHSRA D1 HS High River Rodeo", "High River", "May 9-10, 2026", "D1 HS", "high_school"),
    makeHsEvent("ahsra-d1hs-strathmore-may2026", "AHSRA D1 HS Strathmore Rodeo", "Strathmore", "May 16-17, 2026", "D1 HS", "high_school"),
    // D1 HS Fall 2025
    makeHsEvent("ahsra-d1hs-pinchercreek-aug2025", "AHSRA D1 HS Pincher Creek Rodeo", "Pincher Creek", "August 29-30, 2025", "D1 HS", "high_school"),
    makeHsEvent("ahsra-d1hs-nanton-sep2025", "AHSRA D1 HS Nanton Rodeo (Fall)", "Nanton", "September 6-7, 2025", "D1 HS", "high_school"),
    makeHsEvent("ahsra-d1hs-claresholm-sep2025", "AHSRA D1 HS Claresholm Rodeo", "Claresholm", "September 13-14, 2025", "D1 HS", "high_school"),
    makeHsEvent("ahsra-d1hs-cardston-sep2025", "AHSRA D1 HS Cardston Rodeo (Fall)", "Cardston", "September 19-20, 2025", "D1 HS", "high_school"),
    makeHsEvent("ahsra-d1hs-taber-sep2025", "AHSRA D1 HS Taber Rodeo (Fall)", "Taber", "September 27-28, 2025", "D1 HS", "high_school"),

    // ── D2 High School (Central AB) — Spring 2026 ──
    makeHsEvent("ahsra-d2hs-stettler-apr2026", "AHSRA D2 HS Stettler Rodeo", "Stettler", "April 4-5, 2026", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-thepointe-apr2026", "AHSRA D2 HS The Pointe Rodeo (Strathcona County)", "Sherwood Park", "April 11-12, 2026", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-thorsby-apr2026", "AHSRA D2 HS Thorsby Rodeo", "Thorsby", "April 18-19, 2026", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-oyen-apr2026", "AHSRA D2 HS Oyen Rodeo", "Oyen", "April 25-26, 2026", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-vermilion-may2026", "AHSRA D2 HS Vermilion Rodeo", "Vermilion", "May 2-3, 2026", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-stettler2-may2026", "AHSRA D2 HS Stettler Rodeo #2 (Ponoka Black Elks)", "Stettler", "May 9-10, 2026", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-lindale-may2026", "AHSRA D2 HS Lindale Rodeo", "Lindale", "May 17-18, 2026", "D2 HS", "high_school"),
    // D2 HS Fall 2025
    makeHsEvent("ahsra-d2hs-stettler-aug2025", "AHSRA D2 HS Stettler Rodeo (Fall)", "Stettler", "August 23-24, 2025", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-vermilion-aug2025", "AHSRA D2 HS Vermilion Rodeo (Fall)", "Vermilion", "August 30-31, 2025", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-ponoka-sep2025", "AHSRA D2 HS Ponoka Battle River Rodeo", "Ponoka", "September 6-7, 2025", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-sundre-sep2025", "AHSRA D2 HS Sundre Mountain View Rodeo", "Sundre", "September 13-14, 2025", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-carstairs-sep2025", "AHSRA D2 HS Carstairs Rodeo", "Carstairs", "September 20-21, 2025", "D2 HS", "high_school"),
    makeHsEvent("ahsra-d2hs-rimbey-sep2025", "AHSRA D2 HS Rimbey Rodeo", "Rimbey", "September 27-28, 2025", "D2 HS", "high_school"),

    // ── D3 High School (Northern AB) — Spring 2026 ──
    makeHsEvent("ahsra-d3hs-teepeecreek1-apr2026", "AHSRA D3 HS Teepee Creek Rodeo #1", "Teepee Creek", "April 10-11, 2026", "D3 HS", "high_school"),
    makeHsEvent("ahsra-d3hs-teepeecreek2-apr2026", "AHSRA D3 HS Teepee Creek Rodeo #2", "Teepee Creek", "April 18-19, 2026", "D3 HS", "high_school"),
    makeHsEvent("ahsra-d3hs-worsley-may2026", "AHSRA D3 HS Worsley Rodeo", "Worsley", "May 2-3, 2026", "D3 HS", "high_school"),
    makeHsEvent("ahsra-d3hs-debolt-may2026", "AHSRA D3 HS Debolt Rodeo", "Debolt", "May 9-10, 2026", "D3 HS", "high_school"),
    makeHsEvent("ahsra-d3hs-hinton-may2026", "AHSRA D3 HS Hinton Rodeo", "Hinton", "May 16-17, 2026", "D3 HS", "high_school"),
    // D3 HS Fall 2025
    makeHsEvent("ahsra-d3hs-whitecourt-aug2025", "AHSRA D3 HS Whitecourt Rodeo", "Whitecourt", "August 30-September 1, 2025", "D3 HS", "high_school"),
    makeHsEvent("ahsra-d3hs-grimshaw-sep2025", "AHSRA D3 HS Grimshaw Rodeo", "Grimshaw", "September 6-7, 2025", "D3 HS", "high_school"),
    makeHsEvent("ahsra-d3hs-rycroft-sep2025", "AHSRA D3 HS Rycroft Rodeo", "Rycroft", "September 13-14, 2025", "D3 HS", "high_school"),
    makeHsEvent("ahsra-d3hs-kinuso-sep2025", "AHSRA D3 HS Kinuso Rodeo", "Kinuso", "September 27-28, 2025", "D3 HS", "high_school"),

    // ── D1 Junior High (Southern AB) — Spring 2026 ──
    makeHsEvent("ahsra-d1jh-siksika-apr2026", "AHSRA D1 JH Siksika Rodeo", "Siksika", "April 3-4, 2026", "D1 JH", "junior_high"),
    makeHsEvent("ahsra-d1jh-taber-apr2026", "AHSRA D1 JH Taber Rodeo", "Taber", "April 10-11, 2026", "D1 JH", "junior_high"),
    makeHsEvent("ahsra-d1jh-cardston-apr2026", "AHSRA D1 JH Cardston Rodeo", "Cardston", "April 17-18, 2026", "D1 JH", "junior_high"),
    makeHsEvent("ahsra-d1jh-dunmore-apr2026", "AHSRA D1 JH Dunmore Rodeo", "Dunmore", "April 24-25, 2026", "D1 JH", "junior_high"),
    makeHsEvent("ahsra-d1jh-nanton-may2026", "AHSRA D1 JH Nanton Rodeo", "Nanton", "May 1-2, 2026", "D1 JH", "junior_high"),
    makeHsEvent("ahsra-d1jh-highriver-may2026", "AHSRA D1 JH High River Rodeo", "High River", "May 8-9, 2026", "D1 JH", "junior_high"),
    // D1 JH Fall 2025
    makeHsEvent("ahsra-d1jh-pinchercreek-aug2025", "AHSRA D1 JH Pincher Creek Rodeo", "Pincher Creek", "August 30-31, 2025", "D1 JH", "junior_high"),
    makeHsEvent("ahsra-d1jh-nanton-sep2025", "AHSRA D1 JH Nanton Rodeo (Fall)", "Nanton", "September 6, 2025", "D1 JH", "junior_high"),
    makeHsEvent("ahsra-d1jh-claresholm-sep2025", "AHSRA D1 JH Claresholm Rodeo", "Claresholm", "September 12-13, 2025", "D1 JH", "junior_high"),
    makeHsEvent("ahsra-d1jh-cardston-sep2025", "AHSRA D1 JH Cardston Rodeo (Fall)", "Cardston", "September 19-20, 2025", "D1 JH", "junior_high"),
    makeHsEvent("ahsra-d1jh-taber-sep2025", "AHSRA D1 JH Taber Rodeo (Fall)", "Taber", "September 26-27, 2025", "D1 JH", "junior_high"),

    // ── D2 Junior High (Central AB) — Spring 2026 ──
    makeHsEvent("ahsra-d2jh-stettler-apr2026", "AHSRA D2 JH Stettler Rodeo", "Stettler", "April 3-4, 2026", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-thepointe-apr2026", "AHSRA D2 JH The Pointe Rodeo", "Sherwood Park", "April 11, 2026", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-thorsby-apr2026", "AHSRA D2 JH Thorsby Rodeo", "Thorsby", "April 17, 2026", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-oyen-apr2026", "AHSRA D2 JH Oyen Rodeo", "Oyen", "April 24-25, 2026", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-vermilion-may2026", "AHSRA D2 JH Vermilion Rodeo", "Vermilion", "May 1, 2026", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-stettler2-may2026", "AHSRA D2 JH Stettler Rodeo #2 (Ponoka Black Elks)", "Stettler", "May 8-9, 2026", "D2 JH", "junior_high"),
    // D2 JH Fall 2025
    makeHsEvent("ahsra-d2jh-stettler-aug2025", "AHSRA D2 JH Stettler Rodeo (Fall)", "Stettler", "August 22-23, 2025", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-vermilion-aug2025", "AHSRA D2 JH Vermilion Rodeo (Fall)", "Vermilion", "August 29-30, 2025", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-ponoka-sep2025", "AHSRA D2 JH Ponoka Battle River Rodeo", "Ponoka", "September 5, 2025", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-sundre-sep2025", "AHSRA D2 JH Sundre Mountain View Rodeo", "Sundre", "September 12, 2025", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-carstairs-sep2025", "AHSRA D2 JH Carstairs Rodeo", "Carstairs", "September 19-20, 2025", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-rimbey-sep2025", "AHSRA D2 JH Rimbey Rodeo", "Rimbey", "September 26, 2025", "D2 JH", "junior_high"),
    makeHsEvent("ahsra-d2jh-stettler-oct2025", "AHSRA D2 JH Stettler Thanksgiving Rodeo", "Stettler", "October 11-13, 2025", "D2 JH", "junior_high"),

    // ── D3 Junior High (Northern AB) — Spring 2026 ──
    makeHsEvent("ahsra-d3jh-teepeecreek1-apr2026", "AHSRA D3 JH Teepee Creek Rodeo #1", "Teepee Creek", "April 10-11, 2026", "D3 JH", "junior_high"),
    makeHsEvent("ahsra-d3jh-teepeecreek2-apr2026", "AHSRA D3 JH Teepee Creek Rodeo #2", "Teepee Creek", "April 18-19, 2026", "D3 JH", "junior_high"),
    makeHsEvent("ahsra-d3jh-worsley-may2026", "AHSRA D3 JH Worsley Rodeo", "Worsley", "May 2-3, 2026", "D3 JH", "junior_high"),
    makeHsEvent("ahsra-d3jh-debolt-may2026", "AHSRA D3 JH Debolt Rodeo", "Debolt", "May 9-10, 2026", "D3 JH", "junior_high"),
    // D3 JH Fall 2025
    makeHsEvent("ahsra-d3jh-whitecourt-aug2025", "AHSRA D3 JH Whitecourt Rodeo", "Whitecourt", "August 30-September 1, 2025", "D3 JH", "junior_high"),
    makeHsEvent("ahsra-d3jh-grimshaw-sep2025", "AHSRA D3 JH Grimshaw Rodeo", "Grimshaw", "September 6-7, 2025", "D3 JH", "junior_high"),
    makeHsEvent("ahsra-d3jh-rycroft-sep2025", "AHSRA D3 JH Rycroft Rodeo", "Rycroft", "September 13-14, 2025", "D3 JH", "junior_high"),
    makeHsEvent("ahsra-d3jh-kinuso-sep2025", "AHSRA D3 JH Kinuso Rodeo", "Kinuso", "September 27-28, 2025", "D3 JH", "junior_high"),

    // ── Provincial & National Finals ──
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
      disciplines: JSON.stringify(HS_DISCIPLINES),
      purseAmount: null,
      entryFee: null,
      committeeContact: "Pam Golden, Provincial Secretary",
      committeePhone: "780-305-9640",
      isSpecialEvent: true,
      detailsUrl: "https://albertahsrodeo.ca/high-school/",
      websiteUrl: "https://albertahsrodeo.ca",
      rawData: JSON.stringify({ source: "ahsra", level: "high_school", district: "Finals", province: "Alberta", note: "Alberta HS Finals — top qualifiers from D1/D2/D3" }),
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
      disciplines: JSON.stringify(HS_DISCIPLINES),
      purseAmount: null,
      entryFee: null,
      committeeContact: "Pam Golden, Provincial Secretary",
      committeePhone: "780-305-9640",
      isSpecialEvent: true,
      detailsUrl: "https://albertahsrodeo.ca/junior-high/",
      websiteUrl: "https://albertahsrodeo.ca",
      rawData: JSON.stringify({ source: "ahsra", level: "junior_high", district: "Finals", province: "Alberta", note: "Alberta JH Finals — Grades 5-8 top qualifiers" }),
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
      disciplines: JSON.stringify(HS_DISCIPLINES),
      purseAmount: null,
      entryFee: null,
      committeeContact: null,
      committeePhone: null,
      isSpecialEvent: true,
      detailsUrl: "https://albertahsrodeo.ca",
      websiteUrl: "https://albertahsrodeo.ca",
      rawData: JSON.stringify({ source: "ahsra", level: "high_school", district: "Canadian Finals", province: "Alberta", note: "Canadian HS Finals — BC, AB, SK, MB, ON qualifiers" }),
    },
  ];

  const upserted = await upsertEvents(events);
  console.log(`[AHSRA] Done: ${upserted}/${events.length} upserted`);
  return upserted;
}

// ─── Master Scrape Function ───────────────────────────────────────────────────

export async function scrapeAllCanadianRodeos(): Promise<{
  cpra: number; wra: number; kcra: number; ram: number; ahsra: number; total: number;
}> {
  console.log("[Scraper] Starting full Canadian rodeo scrape...");
  const [cpra, wra, kcra, ram, ahsra] = await Promise.allSettled([
    scrapeCpra(),
    scrapeWra(),
    scrapeKcra(),
    scrapeRamRodeo(),
    scrapeAhsraFinals(),
  ]).then(results => results.map(r => r.status === "fulfilled" ? r.value : 0));

  const total = cpra + wra + kcra + ram + ahsra;
  console.log(`[Scraper] Complete. Total: ${total} (CPRA:${cpra} WRA:${wra} KCRA:${kcra} RAM:${ram} AHSRA:${ahsra})`);
  return { cpra, wra, kcra, ram, ahsra, total };
}

// ─── DB Query Helpers ────────────────────────────────────────────────────────

export async function getCpraEventsFromDb(filters?: {
  province?: string; source?: string; level?: string; search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(cpraEvents);
  let filtered: typeof rows = rows;

  if (filters?.province) {
    filtered = filtered.filter(r => r.province?.toLowerCase() === filters.province!.toLowerCase());
  }
  if (filters?.source || filters?.level) {
    filtered = filtered.filter(r => {
      if (!r.rawData) return false;
      try {
        const meta = JSON.parse(r.rawData);
        if (filters.source && meta.source !== filters.source) return false;
        if (filters.level && meta.level !== filters.level) return false;
        return true;
      } catch { return false; }
    });
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q) ||
      r.province?.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0));
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
