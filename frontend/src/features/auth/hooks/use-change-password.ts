import { useMutation } from "@tanstack/react-query";
import { changePassword } from "../services/auth-api";

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
