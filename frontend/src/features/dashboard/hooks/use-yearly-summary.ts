import { useQuery } from "@tanstack/react-query";
import { fetchYearlySummary } from "../services/dashboard-api";

export function useYearlySummary(year: string) {
  return useQuery({
    queryKey: ["dashboard", "yearly-summary", year],
    queryFn: () => fetchYearlySummary(year),
    placeholderData: (previousData) => previousData,
  });
}
