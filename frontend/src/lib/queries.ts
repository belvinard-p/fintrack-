import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CategorySpending, MonthlySpending } from "@/lib/types";

export function useCategorySpending() {
  return useQuery({
    queryKey: ["dashboard", "by-category"],
    queryFn: async () => {
      const response = await api.get<CategorySpending[]>(
        "/transactions/dashboard/by-category"
      );
      return response.data;
    },
  });
}

export function useMonthlySpending() {
  return useQuery({
    queryKey: ["dashboard", "by-month"],
    queryFn: async () => {
      const response = await api.get<MonthlySpending[]>(
        "/transactions/dashboard/by-month"
      );
      return response.data;
    },
  });
}