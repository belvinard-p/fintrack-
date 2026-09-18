import { useQuery } from "@tanstack/react-query";
import { fetchMonthlySummary } from "../services/dashboard-api";

export function useMonthlySummary(month: string) {
  return useQuery({
    queryKey: ["dashboard", "monthly-summary", month],
    queryFn: () => fetchMonthlySummary(month),
    placeholderData: (previousData) => previousData,
  });
}
