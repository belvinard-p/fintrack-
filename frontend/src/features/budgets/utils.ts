import { BudgetStatus } from "./types";

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export interface BudgetProjection {
  exceeds: boolean;
  projected: number;
  limit: number;
}

/**
 * Would adding `newAmount` to this category push it over its monthly limit?
 * `alreadyCountedAmount` excludes a transaction's own prior contribution when
 * editing it in place, so it isn't counted twice.
 */
export function projectBudgetImpact(
  status: BudgetStatus | undefined,
  newAmount: number,
  alreadyCountedAmount = 0
): BudgetProjection | null {
  if (!status || !Number.isFinite(newAmount)) return null;
  const limit = Number(status.monthly_limit);
  const projected = Number(status.actual_spending) - alreadyCountedAmount + newAmount;
  return { exceeds: projected > limit, projected, limit };
}
