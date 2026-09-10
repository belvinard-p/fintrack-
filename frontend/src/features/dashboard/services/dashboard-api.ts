import { api } from "@/services/http-client";
import { CategorySpending, MonthlySpending } from "../types";

export async function fetchCategorySpending(): Promise<CategorySpending[]> {
  const response = await api.get<CategorySpending[]>(
    "/transactions/dashboard/by-category"
  );
  return response.data;
}

export async function fetchMonthlySpending(): Promise<MonthlySpending[]> {
  const response = await api.get<MonthlySpending[]>(
    "/transactions/dashboard/by-month"
  );
  return response.data;
}
