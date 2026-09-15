import { api } from "@/services/http-client";
import { Budget, BudgetCreate, BudgetStatus, BudgetUpdate } from "../types";

export async function createBudget(payload: BudgetCreate): Promise<Budget> {
  const response = await api.post<Budget>("/budgets/", payload);
  return response.data;
}

export async function updateBudget(id: number, payload: BudgetUpdate): Promise<Budget> {
  const response = await api.patch<Budget>(`/budgets/${id}`, payload);
  return response.data;
}

export async function deleteBudget(id: number): Promise<void> {
  await api.delete(`/budgets/${id}`);
}

export async function fetchBudgetStatus(month: string): Promise<BudgetStatus[]> {
  const response = await api.get<BudgetStatus[]>("/budgets/status", {
    params: { month },
  });
  return response.data;
}