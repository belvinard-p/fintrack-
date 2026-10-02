import { useQuery } from "@tanstack/react-query";
import { fetchDebtPayments } from "../services/debts-api";

export function useDebtPayments(debtId: number) {
  return useQuery({
    queryKey: ["debts", debtId, "payments"],
    queryFn: () => fetchDebtPayments(debtId),
  });
}
