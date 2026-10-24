import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/lib/session";
import { fetchCurrentUser } from "../services/auth-api";

export function useCurrentUser() {
  return useQuery({
    // Tied to the token: signing in as someone else (or leaving the demo) never shows the previous account.
    queryKey: ["current-user", getToken()],
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });
}
