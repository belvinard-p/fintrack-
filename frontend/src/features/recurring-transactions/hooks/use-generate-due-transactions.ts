import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateDueTransactions } from "../services/recurring-transactions-api";

export function useGenerateDueTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateDueTransactions,
    onSuccess: (result) => {
      if (result.created > 0) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
      }
    },
  });
}
