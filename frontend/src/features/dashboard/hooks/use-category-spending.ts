import { useQuery } from "@tanstack/react-query";
import { fetchCategorySpending } from "../services/dashboard-api";

export function useCategorySpending() {
  return useQuery({
    queryKey: ["dashboard", "by-category"],
    queryFn: fetchCategorySpending,
  });
}
