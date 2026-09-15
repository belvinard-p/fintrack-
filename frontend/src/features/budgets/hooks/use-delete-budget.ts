import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBudget } from "../services/budgets-api";

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
