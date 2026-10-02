import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAccount } from "../services/accounts-api";
import { AccountUpdate } from "../types";

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AccountUpdate }) =>
      updateAccount(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
