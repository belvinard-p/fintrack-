import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRecurringTransaction } from "../services/recurring-transactions-api";

export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecurringTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
    },
  });
}
