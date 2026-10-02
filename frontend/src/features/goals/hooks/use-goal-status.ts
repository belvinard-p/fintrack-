import { useQuery } from "@tanstack/react-query";
import { fetchGoalStatus } from "../services/goals-api";

export function useGoalStatus(month: string) {
  return useQuery({
    queryKey: ["goals", "status", month],
    queryFn: () => fetchGoalStatus(month),
    enabled: Boolean(month),
  });
}
