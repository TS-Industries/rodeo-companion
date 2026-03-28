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
};

// Emoji fallback icons (used in compact/chip contexts)
export const DISCIPLINE_ICONS: Record<Discipline, string> = {
  barrel_racing:    "🛢️",
  breakaway_roping: "🪢",
  team_roping:      "🤝",
  tie_down_roping:  "🔗",
  bareback:         "🐎",
  saddle_bronc:     "🐴",
  steer_wrestling:  "🐂",
  bull_riding:      "🐃",
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

// ─── Drill video links per discipline ────────────────────────────────────────

export interface DrillVideo {
  title: string;
  url: string;
  description: string;
}

export const DISCIPLINE_DRILL_VIDEOS: Record<Discipline, DrillVideo[]> = {
  barrel_racing: [
    { title: "Barrel Pattern Fundamentals", url: "https://www.youtube.com/results?search_query=barrel+racing+pattern+fundamentals+drill", description: "Core pattern work and rate training" },
    { title: "Speed & Collection Drills", url: "https://www.youtube.com/results?search_query=barrel+racing+speed+collection+drills", description: "Building speed without sacrificing form" },
    { title: "Pocket Work at the Barrel", url: "https://www.youtube.com/results?search_query=barrel+racing+pocket+turn+drill", description: "Tightening your turns around each barrel" },
  ],
  breakaway_roping: [
    { title: "Breakaway Loop Delivery", url: "https://www.youtube.com/results?search_query=breakaway+roping+loop+delivery+drill", description: "Consistent loop placement and release" },
    { title: "Rate & Position Drills", url: "https://www.youtube.com/results?search_query=breakaway+roping+horse+rate+training", description: "Getting your horse to rate the calf perfectly" },
    { title: "Dummy Roping Practice", url: "https://www.youtube.com/results?search_query=breakaway+roping+dummy+practice", description: "Building muscle memory on the ground" },
  ],
  team_roping: [
    { title: "Header Loop Delivery", url: "https://www.youtube.com/results?search_query=team+roping+header+loop+delivery+drill", description: "Consistent head catches and horn wraps" },
    { title: "Heeler Timing Drills", url: "https://www.youtube.com/results?search_query=team+roping+heeler+timing+drills", description: "Reading the steer and timing your swing" },
    { title: "Dummy Steer Practice", url: "https://www.youtube.com/results?search_query=team+roping+dummy+practice+drills", description: "Perfecting your delivery on the practice dummy" },
  ],
  tie_down_roping: [
    { title: "Tie-Down Roping Fundamentals", url: "https://www.youtube.com/results?search_query=tie+down+calf+roping+fundamentals+drill", description: "Catch, flank, and tie sequence" },
    { title: "Flank & Tie Speed Drills", url: "https://www.youtube.com/results?search_query=calf+roping+flank+tie+speed+drill", description: "Building speed in the flank and tie" },
    { title: "Horse Stop & Position", url: "https://www.youtube.com/results?search_query=calf+roping+horse+stop+position+training", description: "Getting your horse to stop and hold position" },
  ],
  bareback: [
    { title: "Bareback Spurring Technique", url: "https://www.youtube.com/results?search_query=bareback+bronc+spurring+technique+drill", description: "Correct spurring motion and timing" },
    { title: "Mark Out & Balance", url: "https://www.youtube.com/results?search_query=bareback+riding+mark+out+balance+training", description: "Marking out and maintaining balance" },
    { title: "Rigging Grip & Strength", url: "https://www.youtube.com/results?search_query=bareback+riding+rigging+grip+strength", description: "Building grip strength and rigging technique" },
  ],
  saddle_bronc: [
    { title: "Saddle Bronc Spurring Rhythm", url: "https://www.youtube.com/results?search_query=saddle+bronc+spurring+rhythm+drill", description: "Developing a consistent spurring rhythm" },
    { title: "Rein Length & Position", url: "https://www.youtube.com/results?search_query=saddle+bronc+rein+length+position+training", description: "Finding the right rein length and body position" },
    { title: "Mark Out Fundamentals", url: "https://www.youtube.com/results?search_query=saddle+bronc+mark+out+fundamentals", description: "Proper mark out technique from the chute" },
  ],
  steer_wrestling: [
    { title: "Drop & Catch Technique", url: "https://www.youtube.com/results?search_query=steer+wrestling+bulldogging+drop+catch+technique", description: "The drop off the horse and horn catch" },
    { title: "Hazer & Timing Drills", url: "https://www.youtube.com/results?search_query=steer+wrestling+hazer+timing+drill", description: "Working with your hazer for perfect timing" },
    { title: "Steer Throw Mechanics", url: "https://www.youtube.com/results?search_query=steer+wrestling+throw+mechanics+training", description: "Efficient steer throwing technique" },
  ],
  bull_riding: [
    { title: "Bull Riding Fundamentals", url: "https://www.youtube.com/results?search_query=bull+riding+fundamentals+training+drill", description: "Core body position and rope grip" },
    { title: "Spurring & Free Arm", url: "https://www.youtube.com/results?search_query=bull+riding+spurring+free+arm+technique", description: "Using your free arm and spurring for points" },
    { title: "Mental Preparation", url: "https://www.youtube.com/results?search_query=bull+riding+mental+preparation+training", description: "Mental game and visualization techniques" },
  ],
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
