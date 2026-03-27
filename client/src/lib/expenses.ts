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

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  entry_fee: "🏆",
  fuel: "⛽",
  lodging: "🏨",
  food: "🍔",
  equipment: "🪢",
  vet: "🐴",
  other: "💰",
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string }> = {
  entry_fee: { bg: "bg-yellow-100", text: "text-yellow-800" },
  fuel:      { bg: "bg-orange-100", text: "text-orange-800" },
  lodging:   { bg: "bg-blue-100",   text: "text-blue-800" },
  food:      { bg: "bg-green-100",  text: "text-green-800" },
  equipment: { bg: "bg-purple-100", text: "text-purple-800" },
  vet:       { bg: "bg-teal-100",   text: "text-teal-800" },
  other:     { bg: "bg-gray-100",   text: "text-gray-800" },
};

export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
