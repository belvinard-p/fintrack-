import { useQuery } from "@tanstack/react-query";
import { fetchGoalContributions } from "../services/goals-api";

export function useGoalContributions(goalId: number) {
  return useQuery({
    queryKey: ["goals", goalId, "contributions"],
    queryFn: () => fetchGoalContributions(goalId),
  });
}
