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

export function isLockedMonthStr(monthIso: string): boolean {
  return isLockedMonth(`${monthIso}-01`);
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthDateRange(month: string): { date_from: string; date_to: string } {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  return { date_from: `${month}-01`, date_to: `${month}-${String(lastDay).padStart(2, "0")}` };
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
