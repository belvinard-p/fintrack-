export function amountColorClass(amount: string | number): string {
  const value = Number(amount);
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "";
}

export function formatSignedAmount(amount: string | number): string {
  const value = Number(amount);
  const str = String(amount);
  if (value > 0 && !str.startsWith("+")) return `+${str}`;
  return str;
}
