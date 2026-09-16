import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "../services/auth-api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });
}
