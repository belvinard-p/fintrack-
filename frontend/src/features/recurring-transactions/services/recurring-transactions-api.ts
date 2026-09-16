import { api } from "@/services/http-client";
import {
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate,
  GenerateResult,
} from "../types";

export async function fetchRecurringTransactions(): Promise<RecurringTransaction[]> {
  const response = await api.get<RecurringTransaction[]>("/recurring-transactions/");
  return response.data;
}

export async function createRecurringTransaction(
  payload: RecurringTransactionCreate
): Promise<RecurringTransaction> {
  const response = await api.post<RecurringTransaction>("/recurring-transactions/", payload);
  return response.data;
}

export async function updateRecurringTransaction(
  id: number,
  payload: RecurringTransactionUpdate
): Promise<RecurringTransaction> {
  const response = await api.patch<RecurringTransaction>(`/recurring-transactions/${id}`, payload);
  return response.data;
}

export async function deleteRecurringTransaction(id: number): Promise<void> {
  await api.delete(`/recurring-transactions/${id}`);
}

export async function generateDueTransactions(): Promise<GenerateResult> {
  const response = await api.post<GenerateResult>("/recurring-transactions/generate");
  return response.data;
}
