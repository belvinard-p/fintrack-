import { api } from "@/services/http-client";
import { MonthlySpending, MonthlySummary } from "../types";

export async function fetchMonthlySpending(): Promise<MonthlySpending[]> {
  const response = await api.get<MonthlySpending[]>(
    "/transactions/dashboard/by-month"
  );
  return response.data;
}


export async function fetchMonthlySummary(month: string): Promise<MonthlySummary> {
  const response = await api.get<MonthlySummary>(
    "/transactions/dashboard/monthly-summary",
    { params: { month } }
  );
  return response.data;
}
