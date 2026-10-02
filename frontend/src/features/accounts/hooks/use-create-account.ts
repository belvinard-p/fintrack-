import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAccount } from "../services/accounts-api";

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
