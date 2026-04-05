// ─── Disciplines ─────────────────────────────────────────────────────────────

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
  barrel_racing:    "Barrel Racing",
  breakaway_roping: "Breakaway Roping",
  team_roping:      "Team Roping",
  tie_down_roping:  "Tie Down Roping",
  bareback:         "Bareback",
  saddle_bronc:     "Saddle Bronc",
  steer_wrestling:  "Steer Wrestling",
  bull_riding:      "Bull Riding",
  goat_tying:       "Goat Tying",
  pole_bending:     "Pole Bending",
  ribbon_roping:    "Ribbon Roping",
  chute_dogging:    "Chute Dogging",
  cutting:          "Cutting",
  working_cow_horse:"Working Cow Horse",
};

// AI-generated illustrated icons (CDN URLs tied to webdev project lifecycle)
export const DISCIPLINE_IMAGES: Record<Discipline, string> = {
  barrel_racing:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-barrel-racing_01327fb9.png",
  breakaway_roping: "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-breakaway_7299876b.png",
  team_roping:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-team-roping_74113a63.png",
  tie_down_roping:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-tie-down_9872522c.png",
  bareback:         "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-bareback_62bc5090.png",
  saddle_bronc:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-saddle-bronc_469f844e.png",
  steer_wrestling:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-steer-wrestling_88da019b.png",
  bull_riding:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-bull-riding_9358527d.png",
  goat_tying:       "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-goat-tying-6uZNHHXW27H2duWr7NATph.webp",
  pole_bending:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-pole-bending-GZL85qWQDocT83nvhtdNrj.webp",
  ribbon_roping:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-ribbon-roping-RfHQDGnCoejUVPb7aUtUU9.webp",
  chute_dogging:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-chute-dogging-W3Q6K2NRnpt5yA2gffHVVj.webp",
  cutting:          "https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-cutting-hfJw4xrQfoD4GijgqP7a5K.webp",
  working_cow_horse:"https://d2xsxph8kpxj0f.cloudfront.net/310519663427083327/C9GZTdmmkAQAM2QeyCH5WD/discipline-working-cow-horse-Ltcdsg8JYRoykpJzyTFmcP.webp",
};

// SVG/text icons for compact chip contexts
// Icons are now the discipline images; this map is kept for legacy compatibility but should not be rendered directly
export const DISCIPLINE_ICONS: Record<Discipline, string> = {
  barrel_racing:    "",
  breakaway_roping: "",
  team_roping:      "",
  tie_down_roping:  "",
  bareback:         "",
  saddle_bronc:     "",
  steer_wrestling:  "",
  bull_riding:      "",
  goat_tying:       "",
  pole_bending:     "",
  ribbon_roping:    "",
  chute_dogging:    "",
  cutting:          "",
  working_cow_horse:"",
};

// Timed events use seconds; rough stock events use scores 0-100; some use both
export const TIMED_DISCIPLINES: Discipline[] = [
  "barrel_racing",
  "breakaway_roping",
  "team_roping",
  "tie_down_roping",
  "steer_wrestling",
  "goat_tying",
  "pole_bending",
  "ribbon_roping",
  "chute_dogging",
];

export const SCORED_DISCIPLINES: Discipline[] = [
  "bareback",
  "saddle_bronc",
  "bull_riding",
  "cutting",
  "working_cow_horse",
];

export function isTimedDiscipline(d: Discipline): boolean {
  return TIMED_DISCIPLINES.includes(d);
}

export function isScoredDiscipline(d: Discipline): boolean {
  return SCORED_DISCIPLINES.includes(d);
}

export const DISCIPLINE_COLORS: Record<Discipline, { bg: string; text: string; accent: string }> = {
  barrel_racing:    { bg: "bg-amber-900/40",   text: "text-amber-300",   accent: "#d97706" },
  breakaway_roping: { bg: "bg-teal-900/40",    text: "text-teal-300",    accent: "#0d9488" },
  team_roping:      { bg: "bg-blue-900/40",    text: "text-blue-300",    accent: "#2563eb" },
  tie_down_roping:  { bg: "bg-orange-900/40",  text: "text-orange-300",  accent: "#ea580c" },
  bareback:         { bg: "bg-purple-900/40",  text: "text-purple-300",  accent: "#7c3aed" },
  saddle_bronc:     { bg: "bg-green-900/40",   text: "text-green-300",   accent: "#16a34a" },
  steer_wrestling:  { bg: "bg-red-900/40",     text: "text-red-300",     accent: "#dc2626" },
  bull_riding:      { bg: "bg-rose-900/40",    text: "text-rose-300",    accent: "#e11d48" },
  goat_tying:       { bg: "bg-lime-900/40",    text: "text-lime-300",    accent: "#65a30d" },
  pole_bending:     { bg: "bg-cyan-900/40",    text: "text-cyan-300",    accent: "#0891b2" },
  ribbon_roping:    { bg: "bg-pink-900/40",    text: "text-pink-300",    accent: "#db2777" },
  chute_dogging:    { bg: "bg-yellow-900/40",  text: "text-yellow-300",  accent: "#ca8a04" },
  cutting:          { bg: "bg-indigo-900/40",  text: "text-indigo-300",  accent: "#4338ca" },
  working_cow_horse:{ bg: "bg-emerald-900/40", text: "text-emerald-300", accent: "#059669" },
};

// ─── Rodeo Types ──────────────────────────────────────────────────────────────

export const RODEO_TYPES = ["jackpot", "amateur", "professional"] as const;
export type RodeoType = (typeof RODEO_TYPES)[number];

export const RODEO_TYPE_LABELS: Record<RodeoType, string> = {
  jackpot:      "Jackpot",
  amateur:      "Amateur Rodeo",
  professional: "Professional Rodeo",
};

// ─── Format helpers ───────────────────────────────────────────────────────────

/** Format a time in seconds to display string (e.g. 13.456s) */
export function formatTime(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  return `${seconds.toFixed(3)}s`;
}

/** Format a roughstock score */
export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return `${score.toFixed(1)} pts`;
}

// ─── Unit system (Canada = metric, US = imperial) ─────────────────────────────

export type UnitSystem = "metric" | "imperial";

export function detectUnitSystem(countryCode?: string | null): UnitSystem {
  if (countryCode === "CA") return "metric";
  return "imperial";
}

export function formatDistance(meters: number, system: UnitSystem): string {
  if (system === "metric") {
    const km = meters / 1000;
    return km >= 10 ? `${km.toFixed(0)} km` : `${km.toFixed(1)} km`;
  }
  const miles = meters / 1609.34;
  return miles >= 10 ? `${miles.toFixed(0)} mi` : `${miles.toFixed(1)} mi`;
}

export function formatFuelEfficiencyLabel(system: UnitSystem): string {
  return system === "metric" ? "L/100km" : "MPG";
}

export function formatFuelPriceLabel(system: UnitSystem): string {
  return system === "metric" ? "$/litre" : "$/gallon";
}

/** Calculate fuel cost for a trip
 * @param distanceMeters - distance in meters
 * @param efficiency - MPG (imperial) or L/100km (metric)
 * @param pricePerUnit - $/gallon (imperial) or $/litre (metric)
 */
export function calculateFuelCost(
  distanceMeters: number,
  efficiency: number,
  pricePerUnit: number,
  system: UnitSystem
): number {
  if (efficiency <= 0) return 0;
  if (system === "metric") {
    const km = distanceMeters / 1000;
    const liters = (km / 100) * efficiency;
    return liters * pricePerUnit;
  } else {
    const miles = distanceMeters / 1609.34;
    const gallons = miles / efficiency;
    return gallons * pricePerUnit;
  }
}

export function defaultEfficiency(system: UnitSystem): number {
  return system === "metric" ? 25 : 10; // 25 L/100km or 10 MPG (truck + trailer)
}

export function defaultFuelPrice(system: UnitSystem): number {
  return system === "metric" ? 1.65 : 3.75; // CAD/L or USD/gal
}
