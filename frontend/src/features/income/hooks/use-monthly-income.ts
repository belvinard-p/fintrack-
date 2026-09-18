import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyIncome } from "../services/income-api";

export function useMonthlyIncome(month: string) {
  return useQuery({
    queryKey: ["budgets", "income", month],
    queryFn: () => fetchMonthlyIncome(month),
    enabled: Boolean(month),
  });
}
