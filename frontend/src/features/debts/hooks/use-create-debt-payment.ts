import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDebtPayment } from "../services/debts-api";
import { DebtPaymentCreate } from "../types";

export function useCreateDebtPayment(debtId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DebtPaymentCreate) => createDebtPayment(debtId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debts", debtId, "payments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
