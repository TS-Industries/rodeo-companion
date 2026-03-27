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
  fuel:      "Fuel",
  lodging:   "Lodging",
  food:      "Food & Drink",
  equipment: "Equipment",
  repairs:   "Repairs",
  vet:       "Vet / Horse Care",
  other:     "Other",
};

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  entry_fee: "🏆",
  fuel:      "⛽",
  lodging:   "🏨",
  food:      "🍔",
  equipment: "🪢",
  repairs:   "🔧",
  vet:       "🐴",
  other:     "💰",
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string; accent: string }> = {
  entry_fee: { bg: "bg-amber-900/40",  text: "text-amber-300",  accent: "#d97706" },
  fuel:      { bg: "bg-orange-900/40", text: "text-orange-300", accent: "#ea580c" },
  lodging:   { bg: "bg-blue-900/40",   text: "text-blue-300",   accent: "#2563eb" },
  food:      { bg: "bg-green-900/40",  text: "text-green-300",  accent: "#16a34a" },
  equipment: { bg: "bg-purple-900/40", text: "text-purple-300", accent: "#7c3aed" },
  repairs:   { bg: "bg-red-900/40",    text: "text-red-300",    accent: "#dc2626" },
  vet:       { bg: "bg-teal-900/40",   text: "text-teal-300",   accent: "#0d9488" },
  other:     { bg: "bg-zinc-900/40",   text: "text-zinc-300",   accent: "#71717a" },
};

export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
