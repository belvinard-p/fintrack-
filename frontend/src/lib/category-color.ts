const CATEGORY_COLORS = [
  "#2563eb", // blue
  "#9333ea", // purple
  "#d97706", // amber
  "#0891b2", // cyan
  "#db2777", // pink
  "#4f46e5", // indigo
  "#ea580c", // orange
  "#0d9488", // teal
] as const;

const UNCATEGORIZED_COLOR = "#64748b"; // slate

export function getCategoryColor(categoryId: number | null | undefined): string {
  if (categoryId === null || categoryId === undefined) return UNCATEGORIZED_COLOR;
  return CATEGORY_COLORS[categoryId % CATEGORY_COLORS.length];
}
