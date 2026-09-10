import { api } from "@/services/http-client";
import { TransactionCreate } from "../types";

export async function createTransaction(payload: TransactionCreate) {
  const response = await api.post("/transactions/", payload);
  return response.data;
}
