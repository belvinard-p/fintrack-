import { api } from "@/services/http-client";
import { Account, AccountCreate, AccountUpdate } from "../types";

export async function fetchAccounts(): Promise<Account[]> {
  const response = await api.get<Account[]>("/accounts/");
  return response.data;
}

export async function createAccount(payload: AccountCreate): Promise<Account> {
  const response = await api.post<Account>("/accounts/", payload);
  return response.data;
}

export async function updateAccount(id: number, payload: AccountUpdate): Promise<Account> {
  const response = await api.patch<Account>(`/accounts/${id}`, payload);
  return response.data;
}

export async function deleteAccount(id: number): Promise<void> {
  await api.delete(`/accounts/${id}`);
}
