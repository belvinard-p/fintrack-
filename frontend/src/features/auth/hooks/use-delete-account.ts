import { useMutation } from "@tanstack/react-query";
import { deleteAccount } from "../services/auth-api";
import { AccountDeletePayload } from "../types";

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (payload: AccountDeletePayload) => deleteAccount(payload),
  });
}
