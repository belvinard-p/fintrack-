import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDebt } from "../services/debts-api";

export function useDeleteDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}
