import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecurringTransaction } from "../services/recurring-transactions-api";

export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecurringTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
    },
  });
}
