import { api } from "@/services/http-client";
import { TransactionCreate, Transaction, ImportResult } from "../types";

export async function fetchTransactions(): Promise<Transaction[]> {
  const response = await api.get<Transaction[]>("/transactions/");
  return response.data;
}

export async function createTransaction(payload: TransactionCreate) {
  const response = await api.post("/transactions/", payload);
  return response.data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await api.delete(`/transactions/${id}`);
}

export async function importCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ImportResult>("/transactions/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}