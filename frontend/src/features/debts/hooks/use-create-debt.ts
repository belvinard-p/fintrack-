import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDebt } from "../services/debts-api";

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}
