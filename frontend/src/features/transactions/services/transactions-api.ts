import { api } from "@/services/http-client";
import {
  TransactionCreate,
  ImportResult,
  TransactionListParams,
  TransactionListResponse,
} from "../types";

export async function fetchTransactions(
  params: TransactionListParams = {}
): Promise<TransactionListResponse> {
  const response = await api.get<TransactionListResponse>("/transactions/", { params });
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

export async function exportTransactionsCsv(): Promise<Blob> {
  const response = await api.get("/transactions/export", { responseType: "blob" });
  return response.data;
}

export async function exportTransactionsPdf(): Promise<Blob> {
  const response = await api.get("/transactions/export/pdf", { responseType: "blob" });
  return response.data;
}