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

export const DISCIPLINE_ICONS: Record<Discipline, string> = {
  barrel_racing: "🐎",
  breakaway_roping: "🪢",
  team_roping: "🤠",
  tie_down_roping: "🐂",
  bareback: "🤠",
  saddle_bronc: "🐴",
  steer_wrestling: "💪",
};

// Timed events use seconds; rough stock events use scores
export const TIMED_DISCIPLINES: Discipline[] = [
  "barrel_racing",
  "breakaway_roping",
  "team_roping",
  "tie_down_roping",
  "steer_wrestling",
];

export const SCORED_DISCIPLINES: Discipline[] = ["bareback", "saddle_bronc"];

export function isTimedDiscipline(d: Discipline): boolean {
  return TIMED_DISCIPLINES.includes(d);
}

export const DISCIPLINE_COLORS: Record<Discipline, { bg: string; text: string }> = {
  barrel_racing:    { bg: "bg-orange-100", text: "text-orange-800" },
  breakaway_roping: { bg: "bg-teal-100",   text: "text-teal-800" },
  team_roping:      { bg: "bg-yellow-100", text: "text-yellow-800" },
  tie_down_roping:  { bg: "bg-green-100",  text: "text-green-800" },
  bareback:         { bg: "bg-red-100",    text: "text-red-800" },
  saddle_bronc:     { bg: "bg-purple-100", text: "text-purple-800" },
  steer_wrestling:  { bg: "bg-blue-100",   text: "text-blue-800" },
};

export const RODEO_TYPES = ["jackpot", "amateur", "professional"] as const;
export type RodeoType = (typeof RODEO_TYPES)[number];
export const RODEO_TYPE_LABELS: Record<RodeoType, string> = {
  jackpot: "Jackpot",
  amateur: "Amateur",
  professional: "Professional",
};

export function formatTime(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  return `${seconds.toFixed(2)}s`;
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return `${score.toFixed(1)} pts`;
}
