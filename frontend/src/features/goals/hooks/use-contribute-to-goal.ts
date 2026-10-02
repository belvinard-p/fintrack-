import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contributeToGoal } from "../services/goals-api";
import { GoalContributionCreate } from "../types";

export function useContributeToGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: GoalContributionCreate }) =>
      contributeToGoal(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goals", variables.id, "contributions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
