import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRecurringTransaction } from "../services/recurring-transactions-api";
import { RecurringTransactionUpdate } from "../types";

export function useUpdateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RecurringTransactionUpdate }) =>
      updateRecurringTransaction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
    },
  });
}
