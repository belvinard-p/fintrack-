import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setMonthlyIncome } from "../services/income-api";

export function useSetMonthlyIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ month, amount }: { month: string; amount: string }) =>
      setMonthlyIncome(month, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
