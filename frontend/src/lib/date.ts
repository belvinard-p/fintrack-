export function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getFirstDayOfCurrentMonthIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-01`;
}

export function isLockedMonth(dateIso: string): boolean {
  const [year, month] = dateIso.split("-").map(Number);
  const now = new Date();
  const currentKey = now.getFullYear() * 12 + now.getMonth();
  const valueKey = year * 12 + (month - 1);
  return valueKey < currentKey;
}

export function formatCreatedTime(iso: string | null | undefined, language: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(language === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
