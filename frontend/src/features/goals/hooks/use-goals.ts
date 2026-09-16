import { useQuery } from "@tanstack/react-query";
import { fetchGoals } from "../services/goals-api";

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });
}
