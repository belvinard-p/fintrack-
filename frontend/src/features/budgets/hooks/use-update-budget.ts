import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBudget } from "../services/budgets-api";
import { BudgetUpdate } from "../types";

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BudgetUpdate }) =>
      updateBudget(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
