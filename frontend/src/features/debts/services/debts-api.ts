import { api } from "@/services/http-client";
import { Debt, DebtCreate, DebtUpdate, DebtPayment, DebtPaymentCreate } from "../types";

export async function fetchDebts(): Promise<Debt[]> {
  const response = await api.get<Debt[]>("/debts/");
  return response.data;
}

export async function createDebt(payload: DebtCreate): Promise<Debt> {
  const response = await api.post<Debt>("/debts/", payload);
  return response.data;
}

export async function updateDebt(id: number, payload: DebtUpdate): Promise<Debt> {
  const response = await api.patch<Debt>(`/debts/${id}`, payload);
  return response.data;
}

export async function deleteDebt(id: number): Promise<void> {
  await api.delete(`/debts/${id}`);
}

export async function fetchDebtPayments(debtId: number): Promise<DebtPayment[]> {
  const response = await api.get<DebtPayment[]>(`/debts/${debtId}/payments`);
  return response.data;
}

export async function createDebtPayment(
  debtId: number,
  payload: DebtPaymentCreate
): Promise<DebtPayment> {
  const response = await api.post<DebtPayment>(`/debts/${debtId}/payments`, payload);
  return response.data;
}
