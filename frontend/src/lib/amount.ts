export type TransactionType = "expense" | "income";

export function getTransactionType(amount: string | number): TransactionType {
  return Number(amount) < 0 ? "expense" : "income";
}

export function toSignedAmount(absoluteAmount: string, type: TransactionType): string {
  const value = Math.abs(Number(absoluteAmount) || 0);
  return String(type === "expense" ? -value : value);
}

export function toAbsoluteAmount(amount: string | number): string {
  if (amount === "" || amount === null || amount === undefined) return "";
  const value = Math.abs(Number(amount));
  return Number.isNaN(value) ? "" : String(value);
}

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
