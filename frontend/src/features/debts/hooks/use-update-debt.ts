import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDebt } from "../services/debts-api";
import { DebtUpdate } from "../types";

export function useUpdateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DebtUpdate }) => updateDebt(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}
