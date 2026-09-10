import { useQuery } from "@tanstack/react-query";
import { fetchMonthlySpending } from "../services/dashboard-api";

export function useMonthlySpending() {
  return useQuery({
    queryKey: ["dashboard", "by-month"],
    queryFn: fetchMonthlySpending,
  });
}
