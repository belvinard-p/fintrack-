import { api } from "@/services/http-client";
import { MonthlyIncome } from "../types";

export async function fetchMonthlyIncome(month: string): Promise<MonthlyIncome> {
  const response = await api.get<MonthlyIncome>(`/income/${month}`);
  return response.data;
}

export async function setMonthlyIncome(month: string, amount: string): Promise<MonthlyIncome> {
  const response = await api.put<MonthlyIncome>(`/income/${month}`, { amount });
  return response.data;
}
