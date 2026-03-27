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
};

// Unique emoji icons — distinct per event
export const DISCIPLINE_ICONS: Record<Discipline, string> = {
  barrel_racing:    "🛢️",   // barrels
  breakaway_roping: "🪢",   // rope
  team_roping:      "🤝",   // partners
  tie_down_roping:  "🔗",   // tie/chain
  bareback:         "🐎",   // horse no saddle
  saddle_bronc:     "🐴",   // horse with saddle implied
  steer_wrestling:  "🐂",   // steer
  bull_riding:      "🐃",   // bull
};

// Timed events use seconds; rough stock events use scores 0-100
export const TIMED_DISCIPLINES: Discipline[] = [
  "barrel_racing",
  "breakaway_roping",
  "team_roping",
  "tie_down_roping",
  "steer_wrestling",
];

export const SCORED_DISCIPLINES: Discipline[] = ["bareback", "saddle_bronc", "bull_riding"];

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
  return system === "metric" ? "$/liter" : "$/gallon";
}

/** Calculate fuel cost for a trip
 * @param distanceMeters - distance in meters
 * @param efficiency - MPG (imperial) or L/100km (metric)
 * @param pricePerUnit - $/gallon (imperial) or $/liter (metric)
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
