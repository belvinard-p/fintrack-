import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeEmail } from "../services/auth-api";
import { setToken } from "@/lib/session";

export function useChangeEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeEmail,
    onSuccess: (data) => {
      setToken(data.access_token);
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
}
