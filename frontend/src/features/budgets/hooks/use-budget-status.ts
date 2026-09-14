import { useQuery } from "@tanstack/react-query";
import { fetchBudgetStatus } from "../services/budgets-api";

export function useBudgetStatus(month: string) {
  return useQuery({
    queryKey: ["budgets", "status", month],
    queryFn: () => fetchBudgetStatus(month),
  });
}
