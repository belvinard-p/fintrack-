import { useMutation } from "@tanstack/react-query";
import { deleteAccount } from "../services/auth-api";

export function useDeleteAccount() {
  return useMutation({
    mutationFn: deleteAccount,
  });
}
