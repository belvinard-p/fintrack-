import { api } from "@/services/http-client";
import { Budget, BudgetCreate, BudgetStatus } from "../types";

export async function createBudget(payload: BudgetCreate): Promise<Budget> {
  const response = await api.post<Budget>("/budgets/", payload);
  return response.data;
}

export async function fetchBudgetStatus(month: string): Promise<BudgetStatus[]> {
  const response = await api.get<BudgetStatus[]>("/budgets/status", {
    params: { month },
  });
  return response.data;
}